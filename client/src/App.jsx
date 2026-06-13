import { useEffect, useRef, useState } from 'react';
import { useSocket } from './hooks/useSocket.js';
import { getSessionId } from './lib/session.js';
import Presence from './components/Presence.jsx';
import Dilemma from './components/Dilemma.jsx';
import WorldBrain from './components/WorldBrain.jsx';
import Verdict from './components/Verdict.jsx';
import AlignmentReveal from './components/AlignmentReveal.jsx';
import Factions from './components/Factions.jsx';
import MetaReveal from './components/MetaReveal.jsx';
import MessageBanner from './components/MessageBanner.jsx';
import AbsenceReveal from './components/AbsenceReveal.jsx';
import SoulPortrait from './components/SoulPortrait.jsx';

const META_SEEN_KEY = 'mirror.metaSeen';
const META_AUTO_AT = 8;

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

// A shared ?soul=ID link opens that soul's public reflection.
const publicSoulId = new URLSearchParams(location.search).get('soul');

export default function App() {
  const {
    connected,
    round,
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
    dismissReveal,
    tribes,
    standings,
    missed,
    dismissMissed,
  } = useSocket();

  const [metaOpen, setMetaOpen] = useState(false);
  const [portraitOpen, setPortraitOpen] = useState(false);
  const [publicOpen, setPublicOpen] = useState(Boolean(publicSoulId));

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

  const hope = world?.hope ?? 50;
  const moodStyle = { '--mood': `hsl(${200 + (hope - 50) * 1.2}, 70%, 8%)` };
  const myTribe = myTribeFrom(soul);

  // Session "kindred" line: how often you've stood with the crowd this session.
  const kindred =
    session.answered >= 3
      ? `You've sided with humanity ${session.withCrowd}/${session.answered} this session`
      : null;

  return (
    <div className="app" style={moodStyle}>
      <Presence
        count={presence}
        connected={connected}
        world={world}
        archetype={archetype}
        onOpenCodex={() => setMetaOpen(true)}
        onOpenPortrait={() => setPortraitOpen(true)}
      />

      <MessageBanner message={world?.confession} />

      <main className="stage">
        <div className="brain-wrap">
          <WorldBrain world={world} />
          <div className="brain-overlay">
            {verdict ? (
              <Verdict verdict={verdict} round={round} standing={standing} />
            ) : (
              <Dilemma
                round={round}
                hasVoted={hasVoted}
                onVote={answer}
                locked={!!verdict}
                hasPredicted={hasPredicted}
                onPredict={predictCrowd}
              />
            )}
          </div>
        </div>

        {kindred && <p className="kindred">{kindred}</p>}

        <Factions tribes={tribes} standings={standings} myTribe={myTribe} />
      </main>

      <footer className="footer">
        <div className="footer__row">
          <button className="footer__codex" onClick={() => setPortraitOpen(true)}>◆ YOUR REFLECTION</button>
          <button className="footer__codex" onClick={() => setMetaOpen(true)}>◆ THE FACE IN THE MIRROR</button>
        </div>
        <div>You think you are answering a question. You are being read.</div>
      </footer>

      <AbsenceReveal missed={missed} onDismiss={dismissMissed} />
      <AlignmentReveal reveal={archetypeReveal} onDismiss={dismissReveal} />
      <MetaReveal open={metaOpen} onClose={() => setMetaOpen(false)} />
      {portraitOpen && (
        <SoulPortrait sessionId={getSessionId()} dayStreak={dayStreak} onClose={() => setPortraitOpen(false)} />
      )}
      {publicOpen && (
        <SoulPortrait sessionId={publicSoulId} isPublic onClose={() => setPublicOpen(false)} />
      )}
    </div>
  );
}
