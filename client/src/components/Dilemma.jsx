import { useEffect, useState } from 'react';

// The question + a countdown derived from the server's endsAt timestamp, so
// every client's clock agrees regardless of when they joined.
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

export default function Dilemma({ round, hasVoted, onVote, locked }) {
  const remaining = useCountdown(round?.endsAt);

  if (!round) {
    return <div className="dilemma dilemma--waiting">The mirror is choosing its next question…</div>;
  }

  const q = round.question;
  const seconds = (remaining / 1000).toFixed(1);
  const closed = remaining <= 0 || locked;
  const urgent = remaining > 0 && remaining <= 5000;

  return (
    <div className="dilemma">
      <div className="dilemma__meta">
        <span>QUESTION #{round.roundNumber}</span>
        {q.category && <span className="dilemma__theme">{q.category}</span>}
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

      {hasVoted && <p className="dilemma__status">Your answer is in. The mirror saw it.</p>}
    </div>
  );
}
