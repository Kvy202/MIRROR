// The reveal overlay. Shows the winning answer, the reflection it cast — and
// where YOU stood: with the crowd or against it, and whether you read the room.
export default function Verdict({ verdict, round, standing }) {
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

      {standing?.side && (
        <p className={`verdict__you${standing.majority ? '' : ' verdict__you--minority'}`}>
          {standing.majority
            ? `You were with the ${standing.pct}%.`
            : `You stood with the ${standing.pct}% — the minority.`}
        </p>
      )}
      {standing?.prediction && (
        <p className="verdict__predict">
          {standing.prediction.correct ? '✓ You read the crowd right.' : '✗ The crowd surprised you.'}
        </p>
      )}
    </div>
  );
}
