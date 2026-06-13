import { Router } from 'express';
import { Round } from '../models/Round.js';
import { WorldState } from '../models/WorldState.js';
import { Soul } from '../models/Soul.js';
import { archetypeOf, tribeOf, REVEAL_AT } from '../game/alignment.js';
import { getMetrics } from '../game/loop.js';

// Read-only endpoints — analytics, the soul's reflection, and the meta portrait.
export const statsRouter = Router();

// Live analytics for the running experiment: loop counters + DB rollups
// (who the crowd is becoming, how the tribes stand).
statsRouter.get('/metrics', async (_req, res) => {
  const [world, totalSouls, roundsResolved, byArchetype] = await Promise.all([
    WorldState.findById('global').lean(),
    Soul.countDocuments(),
    Round.countDocuments({ status: 'resolved', result: { $ne: null } }),
    Soul.aggregate([
      { $match: { archetype: { $ne: null } } },
      { $group: { _id: '$archetype', count: { $sum: 1 } } },
    ]),
  ]);

  const archetypeDistribution = Object.fromEntries(byArchetype.map((a) => [a._id, a.count]));

  res.json({
    ...getMetrics(),
    roundsResolved,
    totalSouls,
    archetypeDistribution,
    tribeStandings: world?.tribes ?? {},
    heart: world?.heart ?? null,
    hope: world?.hope ?? null,
    chapter: world?.chapter ?? null,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

statsRouter.get('/world', async (_req, res) => {
  const world = await WorldState.findById('global').lean();
  res.json(world ?? null);
});

// A soul's reflection — the archetype the mirror reads in it, plus a real
// rarity figure (what share of profiled souls share that archetype).
statsRouter.get('/soul/:sessionId', async (req, res) => {
  const soul = await Soul.findOne({ sessionId: req.params.sessionId }).lean();
  if (!soul) return res.json(null);

  const archetype = archetypeOf(soul);

  let rarity = null;
  if (archetype) {
    const peers = await Soul.find({ votesCast: { $gte: REVEAL_AT } }).select('votesCast traits').lean();
    const same = peers.filter((p) => archetypeOf(p) === archetype).length;
    rarity = peers.length ? same / peers.length : 1;
  }

  res.json({
    sessionId: soul.sessionId,
    votesCast: soul.votesCast,
    traits: soul.traits,
    archetype,
    tribe: tribeOf(soul),
    rarity,
    revealAt: REVEAL_AT,
    streak: soul.streak,
    firstSeen: soul.firstSeen,
  });
});

// The meta-reveal: the collective heart + the branching record of how humanity
// has answered, oldest→newest so the client can draw the timeline top-to-bottom.
statsRouter.get('/timeline', async (_req, res) => {
  const world = await WorldState.findById('global').lean();
  const recent = await Round.find({ status: 'resolved', result: { $ne: null } })
    .sort({ roundNumber: -1 })
    .limit(120)
    .select('roundNumber question result tally')
    .lean();
  res.json({
    heart: world?.heart ?? null,
    hope: world?.hope ?? null,
    chapter: world?.chapter ?? null,
    truths: world?.truths ?? [],
    rounds: recent.reverse(),
  });
});

statsRouter.get('/history', async (_req, res) => {
  const rounds = await Round.find({ status: 'resolved', result: { $ne: null } })
    .sort({ roundNumber: -1 })
    .limit(50)
    .select('roundNumber question result tally reflection startedAt')
    .lean();
  res.json(rounds);
});
