import { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';
import { getSessionId } from '../lib/session.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';
const REVEALED_KEY = 'mirror.revealedArchetype';

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

  const votedRound = useRef(null);
  const roundNumberRef = useRef(null);
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
      if (votedRound.current !== payload.roundNumber) setHasVoted(false);
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
    setHasVoted(true);
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
