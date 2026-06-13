import { Round } from '../models/Round.js';
import { Vote } from '../models/Vote.js';
import { WorldState } from '../models/WorldState.js';
import { Soul } from '../models/Soul.js';
import { generateQuestion } from './dilemmaGen.js';
import { config } from '../config.js';
import {
  archetypeOf,
  tribeOf,
  TRIBES,
  ALL_TRIBES,
  emptyTribeTally,
  DIMS,
} from './alignment.js';
import { chapterFor } from './personality.js';
import { applyAnswer, insightFromHeart } from './consequences.js';
import { TUNING } from './tuning.js';
import * as bots from './bots.js';

// The heartbeat. A single in-process loop is the authoritative clock: it owns
// the active round, the live tally, and when the verdict falls. Clients only
// render what this broadcasts. The live tally is kept in memory for fast
// broadcast AND persisted to Mongo so a restart resumes the round + world.

let io = null;

const MAX_TRIBE_CACHE = 50_000; // bound the in-memory tug-of-war roster

const state = {
  round: null,
  tally: { A: 0, B: 0 },
  votedSessions: new Set(),
  timer: null,
  tribeTally: emptyTribeTally(), // how each tribe is splitting THIS round
  tribeOf: new Map(), // sessionId -> tribe (the live tug-of-war roster)
  pending: { A: 0, B: 0 },
  flushTimer: null,
  phase: 'voting', // 'voting' | 'reveal'
  lastReveal: null,
  votesByIp: new Map(),
  metrics: { votesAllTime: 0, roundsAllTime: 0 },
  realPresence: 0,
  botPresence: 0,
};

function broadcastPresence() {
  io?.emit('presence', { count: state.realPresence + state.botPresence });
}

export function incPresence(delta) {
  state.realPresence = Math.max(0, state.realPresence + delta);
  broadcastPresence();
}

function rememberTribe(sessionId, tribe) {
  if (state.tribeOf.size >= MAX_TRIBE_CACHE && !state.tribeOf.has(sessionId)) {
    state.tribeOf.delete(state.tribeOf.keys().next().value);
  }
  state.tribeOf.set(sessionId, tribe);
}

// Self-healing: any phase failure logs and reschedules a fresh round.
function scheduleNextPhase(fn, ms) {
  clearTimeout(state.timer);
  state.timer = setTimeout(() => {
    fn().catch((err) => {
      console.error('[loop] phase failed — recovering in 2s', err);
      scheduleNextPhase(startRound, 2000);
    });
  }, ms);
}

// Coalesce live answer broadcasts; dA/dB drive the mirror's synapses.
function markVote(choice) {
  state.pending[choice] += 1;
  if (!state.flushTimer) state.flushTimer = setTimeout(flushBroadcast, config.broadcastMs);
}
function flushBroadcast() {
  state.flushTimer = null;
  const { A: dA, B: dB } = state.pending;
  if (dA === 0 && dB === 0) return;
  state.pending = { A: 0, B: 0 };
  io?.emit('tally:update', { A: state.tally.A, B: state.tally.B, dA, dB });
  io?.emit('tribe:update', getTribePayload());
}
function resetBroadcast() {
  clearTimeout(state.flushTimer);
  state.flushTimer = null;
  state.pending = { A: 0, B: 0 };
}

export function getActiveRoundPayload() {
  if (!state.round) return null;
  return {
    roundNumber: state.round.roundNumber,
    question: state.round.question,
    endsAt: state.round.endsAt.getTime(),
    tally: { ...state.tally },
  };
}

export function getTribePayload() {
  return { tribes: state.tribeTally };
}

export function getRevealPayload() {
  return state.phase === 'reveal' ? state.lastReveal : null;
}

export function getMetrics() {
  return {
    ...state.metrics,
    currentRound: state.round?.roundNumber ?? 0,
    answersThisRound: state.tally.A + state.tally.B,
    presence: state.realPresence + state.botPresence,
    humans: state.realPresence,
    bots: state.botPresence,
  };
}

// Handshake when a soul connects: load/create its record, cache its tribe, and
// hand back its profile (so the badge shows at once) plus any verdict it missed.
export async function helloSoul(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.length === 0 || sessionId.length > 100) return null;
  let soul = await Soul.findOne({ sessionId }).lean();
  if (!soul) {
    try {
      soul = (await Soul.create({ sessionId })).toObject();
    } catch (err) {
      if (err?.code === 11000) soul = await Soul.findOne({ sessionId }).lean();
      else throw err;
    }
  }
  const archetype = archetypeOf(soul);
  rememberTribe(sessionId, tribeOf(soul) ?? 'Unaligned');

  const currentRound = state.round?.roundNumber ?? 0;
  let missed = null;
  if (soul.lastSeenRound > 0 && currentRound - soul.lastSeenRound > 1 && state.lastReveal) {
    missed = {
      roundNumber: state.lastReveal.roundNumber,
      result: state.lastReveal.result,
      reveal: state.lastReveal.reflection?.reveal ?? 'The mirror changed while you were gone.',
      sinceRound: soul.lastSeenRound,
    };
  }
  if (currentRound) await Soul.updateOne({ sessionId }, { $set: { lastSeenRound: currentRound } });

  return { sessionId, votesCast: soul.votesCast, traits: soul.traits, streak: soul.streak, archetype, missed };
}

export async function getWorldState() {
  return WorldState.findById('global').lean();
}

export function init(socketServer) {
  io = socketServer;
}

// Seed the singleton reflection, then begin the eternal loop.
export async function bootstrap() {
  await WorldState.findByIdAndUpdate(
    'global',
    { $setOnInsert: { hope: 50, chapter: 'Innocence', ageBase: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  await Round.updateMany({ status: 'active' }, { $set: { status: 'resolved' } });
  await WorldState.updateOne(
    { _id: 'global' },
    { $push: { history: { $each: [], $slice: -TUNING.historyBuffer } } }
  );
  bots.initBots();
  await startRound();
}

async function startRound() {
  const last = await Round.findOne().sort({ roundNumber: -1 }).select('roundNumber').lean();
  const roundNumber = (last?.roundNumber ?? 0) + 1;

  const startedAt = new Date();
  const endsAt = new Date(startedAt.getTime() + config.voteMs);

  const world = await WorldState.findById('global').lean();
  const q = generateQuestion(world);
  // The client sees only the prompt + options; the value tags stay server-side.
  const question = { category: q.category, prompt: q.prompt, optionA: q.optionA, optionB: q.optionB };
  const traitSpec = { A: q.A, B: q.B };

  state.round = await Round.create({
    roundNumber,
    question,
    traitSpec,
    startedAt,
    endsAt,
    status: 'active',
    tally: { A: 0, B: 0 },
  });
  state.tally = { A: 0, B: 0 };
  state.votedSessions = new Set();
  state.tribeTally = emptyTribeTally();
  state.votesByIp = new Map();
  state.phase = 'voting';
  state.metrics.roundsAllTime += 1;
  resetBroadcast();

  console.log(`[loop] round ${roundNumber} — "${question.prompt}"`);

  io?.emit('round:start', getActiveRoundPayload());
  io?.emit('tribe:update', getTribePayload());

  // Ambient reflections (bots) keep the mirror alive, staggered across the window.
  state.botPresence = bots.scheduleRound({
    voteMs: config.voteMs,
    getTally: () => ({ ...state.tally }),
    castVote: (id, choice) => castVote(id, choice, null).catch(() => {}),
  });
  broadcastPresence();

  scheduleNextPhase(resolveRound, config.voteMs);
}

// Record one soul's answer. Rejects silently if the round is closed, the choice
// is invalid, the session already answered, or the IP is over its per-round cap.
export async function castVote(sessionId, choice, ip) {
  if (!state.round || state.round.status !== 'active') return;
  if (choice !== 'A' && choice !== 'B') return;
  if (typeof sessionId !== 'string' || sessionId.length === 0 || sessionId.length > 100) return;
  if (state.votedSessions.has(sessionId)) return;
  if (ip && (state.votesByIp.get(ip) || 0) >= config.maxVotesPerIpPerRound) return;

  state.votedSessions.add(sessionId);
  if (ip) state.votesByIp.set(ip, (state.votesByIp.get(ip) || 0) + 1);
  state.tally[choice] += 1;

  try {
    await Vote.create({ roundId: state.round._id, sessionId, choice });
    await Round.updateOne({ _id: state.round._id }, { $inc: { [`tally.${choice}`]: 1 } });
  } catch (err) {
    if (err?.code === 11000) {
      state.tally[choice] -= 1;
      return;
    }
    throw err;
  }

  state.metrics.votesAllTime += 1;

  let tribe = state.tribeOf.get(sessionId) || 'Unaligned';
  if (!ALL_TRIBES.includes(tribe)) tribe = 'Unaligned';
  state.tribeTally[tribe][choice] += 1;

  markVote(choice);
}

async function resolveRound() {
  if (!state.round) return;
  bots.cancelRound();

  const { A, B } = state.tally;
  const result = A >= B ? 'A' : 'B'; // ties resolve to A
  const total = A + B;
  const marginFraction = total ? Math.abs(A - B) / total : 0;

  const worldBefore = await WorldState.findById('global').lean();
  const spec = state.round.traitSpec?.[result];
  const outcome = applyAnswer(spec, { result, marginFraction, world: worldBefore, roundNumber: state.round.roundNumber });

  state.round.status = 'resolved';
  state.round.result = result;
  state.round.reflection = outcome.record;
  await state.round.save();

  // $inc: the winning answer's pull on the heart + hope, and tribe war wins.
  const incs = { ...(outcome.inc || {}) };
  for (const tr of TRIBES) {
    const tt = state.tribeTally[tr];
    if (!tt || tt.A + tt.B === 0) continue;
    const tribeChoice = tt.A >= tt.B ? 'A' : 'B';
    if (tribeChoice === result) incs[`tribes.${tr}.wins`] = (incs[`tribes.${tr}.wins`] || 0) + 1;
  }

  const pushOps = {
    history: {
      $each: [{ roundNumber: state.round.roundNumber, result, ts: new Date() }],
      $slice: -TUNING.historyBuffer,
    },
  };

  const incUpdate = { $push: pushOps };
  if (Object.keys(incs).length) incUpdate.$inc = incs;
  let world = await WorldState.findByIdAndUpdate('global', incUpdate, { new: true }).lean();

  // Clamp meters to [0,100], age the chapter; the outcome's own $set wins for any
  // keys it owns (a "begin again" reset overrides hope/heart/ageBase directly).
  const clampSets = {};
  const hopeC = Math.max(0, Math.min(100, Math.round(world.hope)));
  if (hopeC !== world.hope) clampSets.hope = hopeC;
  for (const dim of DIMS) {
    const raw = world.heart?.[dim] ?? 50;
    const fixed = Math.max(0, Math.min(100, Math.round(raw)));
    if (fixed !== raw) clampSets[`heart.${dim}`] = fixed;
  }
  const ageBase = outcome.set?.ageBase ?? world.ageBase ?? 0;
  const chapter = chapterFor(state.round.roundNumber - ageBase);
  if (chapter !== world.chapter) clampSets.chapter = chapter;

  const sets = { ...clampSets, ...(outcome.set || {}) };
  if (Object.keys(sets).length) {
    world = await WorldState.findByIdAndUpdate('global', { $set: sets }, { new: true }).lean();
  }

  // Milestone: the crowd reveals a truth about who it is becoming.
  if (state.round.roundNumber % TUNING.truthEvery === 0) {
    const truth = insightFromHeart(world.heart, state.round.roundNumber);
    if (!(world.truths || []).some((x) => x.text === truth.text)) {
      world = await WorldState.findByIdAndUpdate('global', { $push: { truths: truth } }, { new: true }).lean();
    }
  }

  // Profile every soul: accumulate the values of the option THEY chose, then
  // recompute their archetype + tribe and refresh the live roster.
  try {
    const votes = await Vote.find({ roundId: state.round._id }).select('sessionId choice').lean();
    if (votes.length) {
      const roundNumber = state.round.roundNumber;
      await Soul.bulkWrite(
        votes.map((v) => {
          const tr = state.round.traitSpec?.[v.choice]?.traits || {};
          const inc = { votesCast: 1 };
          for (const dim of DIMS) if (tr[dim]) inc[`traits.${dim}`] = tr[dim];
          return {
            updateOne: {
              filter: { sessionId: v.sessionId },
              update: { $inc: inc, $setOnInsert: { firstSeen: new Date() } },
              upsert: true,
            },
          };
        })
      );

      const sids = [...new Set(votes.map((v) => v.sessionId))];
      const profiled = await Soul.find({ sessionId: { $in: sids } })
        .select('sessionId votesCast traits streak lastVotedRound')
        .lean();
      const ops = [];
      for (const p of profiled) {
        rememberTribe(p.sessionId, tribeOf(p) ?? 'Unaligned');
        const streak = p.lastVotedRound === roundNumber - 1 ? (p.streak || 0) + 1 : 1;
        ops.push({
          updateOne: {
            filter: { sessionId: p.sessionId },
            update: { $set: { archetype: archetypeOf(p), streak, lastVotedRound: roundNumber } },
          },
        });
      }
      if (ops.length) await Soul.bulkWrite(ops);
    }
  } catch (err) {
    console.error('[loop] soul profiling failed', err);
  }

  console.log(`[loop] round ${state.round.roundNumber} resolved — ${result} (A:${A} B:${B})`);

  const revealPayload = { result, tally: { A, B }, reflection: outcome.record, roundNumber: state.round.roundNumber };
  state.phase = 'reveal';
  state.lastReveal = { ...revealPayload, question: state.round.question, endsAt: state.round.endsAt.getTime() };

  io?.emit('round:resolve', revealPayload);
  io?.emit('world:update', { worldState: world });

  scheduleNextPhase(startRound, config.revealMs);
}
