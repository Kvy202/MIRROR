import { useEffect, useRef, useState } from 'react';
import { useSocket } from './hooks/useSocket.js';
import Presence from './components/Presence.jsx';
import Dilemma from './components/Dilemma.jsx';
import WorldBrain from './components/WorldBrain.jsx';
import Verdict from './components/Verdict.jsx';
import AlignmentReveal from './components/AlignmentReveal.jsx';
import Factions from './components/Factions.jsx';
import MetaReveal from './components/MetaReveal.jsx';
import MessageBanner from './components/MessageBanner.jsx';
import AbsenceReveal from './components/AbsenceReveal.jsx';

const META_SEEN_KEY = 'mirror.metaSeen';
const META_AUTO_AT = 8; // resolved rounds before the portrait unveils itself

// Which tribe a soul belongs to, from its dominant trait (mirrors the server).
function myTribeFrom(soul) {
  const tr = soul?.traits;
  if (!tr) return null;
  const dims = [
    ['warmth', 'Hearts'],
    ['honesty', 'Seekers'],
    ['daring', 'Rebels'],
    ['idealism', 'Dreamers'],
  ];
  let best = null;
  let mag = 0;
  for (const [k, tribe] of dims) {
    if (Math.abs(tr[k] ?? 0) > mag) {
      mag = Math.abs(tr[k] ?? 0);
      best = tribe;
    }
  }
  return mag === 0 ? null : best;
}

export default function App() {
  const {
    connected,
    round,
    verdict,
    world,
    presence,
    hasVoted,
    answer,
    soul,
    archetype,
    archetypeReveal,
    dismissReveal,
    tribes,
    standings,
    missed,
    dismissMissed,
  } = useSocket();

  const [metaOpen, setMetaOpen] = useState(false);

  useEffect(() => {
    const len = world?.history?.length ?? 0;
    if (len >= META_AUTO_AT && !localStorage.getItem(META_SEEN_KEY)) {
      localStorage.setItem(META_SEEN_KEY, '1');
      setMetaOpen(true);
    }
  }, [world]);

  // Keyboard answering: tap A or B.
  const answerRef = useRef(answer);
  answerRef.current = answer;
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'a' || e.key === 'A') answerRef.current('A');
      else if (e.key === 'b' || e.key === 'B') answerRef.current('B');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The whole room takes on the mood of the crowd's hope — warm when hopeful,
  // cool and dim when bleak.
  const hope = world?.hope ?? 50;
  const moodStyle = {
    '--mood': `hsl(${200 + (hope - 50) * 1.2}, 70%, 8%)`,
  };

  const myTribe = myTribeFrom(soul);

  return (
    <div className="app" style={moodStyle}>
      <Presence
        count={presence}
        connected={connected}
        world={world}
        archetype={archetype}
        onOpenCodex={() => setMetaOpen(true)}
      />

      <MessageBanner message={world?.confession} />

      <main className="stage">
        {/* The mirror is the surface everyone stares into. The current question
            (or the reflection) floats over it. */}
        <div className="brain-wrap">
          <WorldBrain />
          <div className="brain-overlay">
            {verdict ? (
              <Verdict verdict={verdict} round={round} />
            ) : (
              <Dilemma round={round} hasVoted={hasVoted} onVote={answer} locked={!!verdict} />
            )}
          </div>
        </div>

        <Factions tribes={tribes} standings={standings} myTribe={myTribe} />
      </main>

      <footer className="footer">
        <button className="footer__codex" onClick={() => setMetaOpen(true)}>
          ◆ SEE THE FACE IN THE MIRROR
        </button>
        <div>You think you are answering a question. You are being read.</div>
      </footer>

      <AbsenceReveal missed={missed} onDismiss={dismissMissed} />
      <AlignmentReveal reveal={archetypeReveal} onDismiss={dismissReveal} />
      <MetaReveal open={metaOpen} onClose={() => setMetaOpen(false)} />
    </div>
  );
}
