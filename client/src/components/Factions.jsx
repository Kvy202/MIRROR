import { tribeMeta } from '../lib/alignments.js';

// The tribes, locked in a live tug-of-war. Each row shows how a tribe is
// splitting its answer toward A vs B *this round*, plus its all-time wins.
const TRIBE_ORDER = ['Hearts', 'Seekers', 'Rebels', 'Dreamers'];

function TribeRow({ name, lean, wins, mine }) {
  const meta = tribeMeta(name);
  const a = lean?.A ?? 0;
  const b = lean?.B ?? 0;
  const total = a + b;
  const aPct = total === 0 ? 50 : (a / total) * 100;

  return (
    <div className={`faction${mine ? ' faction--mine' : ''}`} style={{ '--ac': meta.color }}>
      <div className="faction__head">
        <span className="faction__name">{name}{mine ? ' ·you' : ''}</span>
        <span className="faction__wins">{wins}w</span>
      </div>
      <div className="faction__bar">
        <div className="faction__fill faction__fill--a" style={{ width: `${aPct}%` }} />
        <div className="faction__fill faction__fill--b" style={{ width: `${100 - aPct}%` }} />
      </div>
      <div className="faction__counts">
        <span>{a}</span>
        <span className="faction__total">{total === 0 ? 'silent' : `${total} answering`}</span>
        <span>{b}</span>
      </div>
    </div>
  );
}

export default function Factions({ tribes, standings, myTribe }) {
  return (
    <section className="factions">
      <div className="factions__title">THE TRIBES · live tug-of-war &nbsp;<span>A ◄ ► B</span></div>
      <div className="factions__grid">
        {TRIBE_ORDER.map((name) => (
          <TribeRow
            key={name}
            name={name}
            lean={tribes?.[name]}
            wins={standings?.[name]?.wins ?? 0}
            mine={myTribe === name}
          />
        ))}
      </div>
    </section>
  );
}
