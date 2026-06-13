import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
import { getSessionId } from '../lib/session.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';
const REVEALED_KEY = 'mirror.revealedArchetype';
const DAY_KEY = 'mirror.dayStreak';

// Consecutive days the soul has returned (a gentle habit loop, client-side).
function computeDayStreak() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const saved = JSON.parse(localStorage.getItem(DAY_KEY) || '{}');
    if (saved.last === today) return saved.streak || 1;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = saved.last === yesterday ? (saved.streak || 1) + 1 : 1;
    localStorage.setItem(DAY_KEY, JSON.stringify({ last: today, streak }));
    return streak;
  } catch {
    return 1;
  }
}

// Subscribes to MIRROR's heartbeat and exposes the synced view of the collective
// plus an answer() action. The server is the source of truth — this hook only
// mirrors what it broadcasts.
export function useSocket() {
  const [connected, setConnected] = useState(socket.connected);
  const [round, setRound] = useState(null);
  const [tally, setTally] = useState({ A: 0, B: 0 });
  const [verdict, setVerdict] = useState(null); // the resolved reflection
  const [world, setWorld] = useState(null);
  const [presence, setPresence] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  const [soul, setSoul] = useState(null); // the reflection of YOU
  const [archetypeReveal, setArchetypeReveal] = useState(null); // one-shot reveal
  const [tribes, setTribes] = useState(null); // live tribe tug-of-war
  const [missed, setMissed] = useState(null); // "you weren't here"

  const [hasPredicted, setHasPredicted] = useState(false);
  const [standing, setStanding] = useState(null); // you-vs-crowd, this round's verdict
  const [session, setSession] = useState({ answered: 0, withCrowd: 0, predicted: 0, predictedRight: 0 });
  const [dayStreak] = useState(() => computeDayStreak()); // consecutive days returning

  const votedRound = useRef(null);
  const roundNumberRef = useRef(null);
  const myChoice = useRef(null); // { round, choice }
  const myPredict = useRef(null); // { round, choice }
  const lastRevealed = useRef(localStorage.getItem(REVEALED_KEY));

  useEffect(() => {
    const sayHello = () => socket.emit('soul:hello'); // identity = signed cookie

    const onConnect = () => {
      setConnected(true);
      sayHello();
    };
    const onDisconnect = () => setConnected(false);

    const onRoundStart = (payload) => {
      roundNumberRef.current = payload.roundNumber;
      setRound(payload);
      setTally(payload.tally ?? { A: 0, B: 0 });
      setVerdict(null);
      setStanding(null);
      if (votedRound.current !== payload.roundNumber) {
        setHasVoted(false);
        setHasPredicted(false);
      }
    };

    const onTally = ({ A, B }) => setTally({ A, B });

    const onResolve = async (payload) => {
      setVerdict(payload);
      // Late joiners get a reveal that carries its question context.
      if (payload.question && roundNumberRef.current !== payload.roundNumber) {
        roundNumberRef.current = payload.roundNumber;
        setRound({
          roundNumber: payload.roundNumber,
          question: payload.question,
          endsAt: payload.endsAt,
          tally: payload.tally,
        });
      }

      // "You vs. the crowd": where did I stand, and did I read the room right?
      const r = payload.roundNumber;
      const std = {};
      if (myChoice.current?.round === r) {
        const side = myChoice.current.choice;
        const total = payload.tally.A + payload.tally.B;
        std.side = side;
        std.pct = total ? Math.round((payload.tally[side] / total) * 100) : 0;
        std.majority = payload.result === side;
      }
      if (myPredict.current?.round === r) {
        std.prediction = { guess: myPredict.current.choice, correct: myPredict.current.choice === payload.result };
      }
      if (std.side || std.prediction) {
        setStanding(std);
        setSession((s) => ({
          answered: s.answered + (std.side ? 1 : 0),
          withCrowd: s.withCrowd + (std.majority ? 1 : 0),
          predicted: s.predicted + (std.prediction ? 1 : 0),
          predictedRight: s.predictedRight + (std.prediction?.correct ? 1 : 0),
        }));
      }

      if (votedRound.current !== roundNumberRef.current) return;
      const sid = getSessionId();
      if (!sid) return;
      try {
        const res = await fetch(`${SERVER_URL}/api/soul/${sid}`, { credentials: 'include' });
        const data = await res.json();
        if (!data) return;
        setSoul(data);
        // The first time the mirror reads an archetype (or it shifts) → reveal once.
        if (data.archetype && data.archetype !== lastRevealed.current) {
          lastRevealed.current = data.archetype;
          localStorage.setItem(REVEALED_KEY, data.archetype);
          setArchetypeReveal(data);
        }
      } catch {
        /* network hiccup — the reveal can wait for a later round */
      }
    };

    const onWorld = ({ worldState }) => setWorld(worldState);
    const onPresence = ({ count }) => setPresence(count);
    const onTribes = ({ tribes: t }) => setTribes(t);
    const onSoulState = (profile) => setSoul(profile); // silent badge sync
    const onAbsence = (info) => setMissed(info);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('round:start', onRoundStart);
    socket.on('tally:update', onTally);
    socket.on('round:resolve', onResolve);
    socket.on('world:update', onWorld);
    socket.on('presence', onPresence);
    socket.on('tribe:update', onTribes);
    socket.on('soul:state', onSoulState);
    socket.on('absence', onAbsence);

    if (socket.connected) sayHello();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('round:start', onRoundStart);
      socket.off('tally:update', onTally);
      socket.off('round:resolve', onResolve);
      socket.off('world:update', onWorld);
      socket.off('presence', onPresence);
      socket.off('tribe:update', onTribes);
      socket.off('soul:state', onSoulState);
      socket.off('absence', onAbsence);
    };
  }, []);

  const answer = (choice) => {
    if (hasVoted || !round || verdict) return;
    socket.emit('vote:cast', { choice }); // identity is the signed cookie
    votedRound.current = round.roundNumber;
    myChoice.current = { round: round.roundNumber, choice };
    setHasVoted(true);
  };

  const predictCrowd = (choice) => {
    if (hasPredicted || !round || verdict) return;
    socket.emit('predict:cast', { choice });
    myPredict.current = { round: round.roundNumber, choice };
    setHasPredicted(true);
  };

  // Badge shows the live archetype, falling back to the last stored so a
  // returning soul sees its reflection immediately on load.
  const archetype = soul?.archetype ?? lastRevealed.current;

  return {
    connected,
    round,
    tally,
    verdict,
    world,
    presence,
    hasVoted,
    answer,
    hasPredicted,
    predictCrowd,
    standing,
    session,
    dayStreak,
    soul,
    archetype,
    archetypeReveal,
    dismissReveal: () => setArchetypeReveal(null),
    tribes,
    standings: world?.tribes ?? null,
    missed,
    dismissMissed: () => setMissed(null),
  };
}
