// The reveal overlay. When the timer hits zero the server sends round:resolve
// and this takes over for the reveal window — showing the winning answer and the
// reflection the crowd's choice cast back at it.
export default function Verdict({ verdict, round }) {
  if (!verdict || !round) return null;

  const winner = verdict.result;
  const label = winner === 'A' ? round.question.optionA : round.question.optionB;
  const reveal = verdict.reflection?.reveal ?? 'The mirror has chosen.';

  return (
    <div className="verdict">
      <p className="verdict__tagline">THE MIRROR HAS CHOSEN</p>
      <h2 className={`verdict__winner verdict__winner--${winner.toLowerCase()}`}>{label}</h2>
      <p className="verdict__counts">
        {verdict.tally.A} &nbsp;·&nbsp; {verdict.tally.B}
      </p>
      <p className="verdict__consequence">{reveal}</p>
    </div>
  );
}
