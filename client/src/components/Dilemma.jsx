import { useEffect, useState } from 'react';

function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => setRemaining(Math.max(0, endsAt - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endsAt]);
  return remaining;
}

const SKIP_HEAVY_KEY = 'mirror.skipHeavy';

export default function Dilemma({ round, hasVoted, onVote, locked, hasPredicted, onPredict }) {
  const remaining = useCountdown(round?.endsAt);
  const [skipped, setSkipped] = useState(false);
  const [shownAnyway, setShownAnyway] = useState(false);
  const [skipHeavy, setSkipHeavy] = useState(() => localStorage.getItem(SKIP_HEAVY_KEY) === '1');

  // Reset the per-round skip state whenever a new question arrives.
  useEffect(() => {
    setSkipped(false);
    setShownAnyway(false);
  }, [round?.roundNumber]);

  if (!round) {
    return <div className="dilemma dilemma--waiting">The mirror is choosing its next question…</div>;
  }

  const q = round.question;
  const seconds = (remaining / 1000).toFixed(1);
  const closed = remaining <= 0 || locked;
  const urgent = remaining > 0 && remaining <= 5000;
  const heavy = q.heavy;

  const toggleSkipHeavy = () => {
    const next = !skipHeavy;
    setSkipHeavy(next);
    localStorage.setItem(SKIP_HEAVY_KEY, next ? '1' : '0');
  };

  // A heavy question is held back if you've asked to skip heavy ones — unless you
  // choose to see it, or you sit this one out entirely.
  const autoHeld = heavy && skipHeavy && !shownAnyway;
  if (skipped || autoHeld) {
    return (
      <div className="dilemma dilemma--skipped">
        <div className="dilemma__meta">
          <span>QUESTION #{round.roundNumber}</span>
          <span className={`dilemma__clock${urgent ? ' dilemma__clock--urgent' : ''}`}>{seconds}s</span>
        </div>
        <p className="dilemma__sat">
          {autoHeld ? 'A heavy one. Held back, as you asked.' : 'You sat this one out. That’s okay.'}
        </p>
        {autoHeld && (
          <button className="dilemma__showanyway" onClick={() => setShownAnyway(true)}>
            Show it anyway
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="dilemma">
      <div className="dilemma__meta">
        <span>QUESTION #{round.roundNumber}</span>
        <span className="dilemma__tags">
          {heavy && <span className="dilemma__heavy" title="A heavy one">heavy</span>}
          {q.category && <span className="dilemma__theme">{q.category}</span>}
        </span>
        <span className={`dilemma__clock${urgent ? ' dilemma__clock--urgent' : ''}`}>{seconds}s</span>
      </div>

      <h1 className="dilemma__prompt">{q.prompt}</h1>

      <div className="dilemma__choices">
        <button className="choice choice--a" disabled={hasVoted || closed} onClick={() => onVote('A')}>
          <span className="choice__key">A</span>
          {q.optionA}
        </button>
        <button className="choice choice--b" disabled={hasVoted || closed} onClick={() => onVote('B')}>
          <span className="choice__key">B</span>
          {q.optionB}
        </button>
      </div>

      {/* The empathy game: once you've answered honestly, guess the crowd. */}
      {hasVoted && !closed && !hasPredicted && (
        <div className="predict">
          <span className="predict__label">Now — which way will the crowd lean?</span>
          <div className="predict__btns">
            <button className="predict__btn" onClick={() => onPredict('A')}>A</button>
            <button className="predict__btn" onClick={() => onPredict('B')}>B</button>
          </div>
        </div>
      )}
      {hasVoted && hasPredicted && <p className="dilemma__status">Answer in. Guess locked. Watching the swarm…</p>}
      {hasVoted && !hasPredicted && closed && <p className="dilemma__status">Your answer is in.</p>}

      {!hasVoted && (
        <div className="dilemma__skiprow">
          <button className="dilemma__skip" onClick={() => setSkipped(true)}>sit this one out</button>
          {heavy && (
            <label className="dilemma__skiptoggle">
              <input type="checkbox" checked={skipHeavy} onChange={toggleSkipHeavy} /> skip heavy ones
            </label>
          )}
        </div>
      )}
    </div>
  );
}
