import { archetypeMeta } from '../lib/alignments.js';

// "It has been reading me." A one-shot, full-screen reveal that fires the first
// time the mirror reads an archetype in you (or it shifts). Dismissable.
export default function AlignmentReveal({ reveal, onDismiss }) {
  if (!reveal) return null;

  const meta = archetypeMeta(reveal.archetype);
  const rarityPct = reveal.rarity != null ? Math.round(reveal.rarity * 100) : null;

  return (
    <div className="reveal" onClick={onDismiss}>
      <div className="reveal__card" style={{ '--ac': meta.color }} onClick={(e) => e.stopPropagation()}>
        <p className="reveal__eyebrow">THE MIRROR HAS BEEN READING YOU</p>
        <h2 className="reveal__title">{reveal.archetype}</h2>
        <p className="reveal__blurb">{meta.blurb}</p>

        <div className="reveal__stats">
          <div className="reveal__stat">
            <span className="reveal__num">{reveal.votesCast ?? 0}</span>
            <span className="reveal__lbl">answers it read to know you</span>
          </div>
          {rarityPct != null && (
            <div className="reveal__stat">
              <span className="reveal__num">{rarityPct}%</span>
              <span className="reveal__lbl">of souls share your archetype</span>
            </div>
          )}
        </div>

        <button className="reveal__dismiss" onClick={onDismiss}>
          STEP BACK
        </button>
      </div>
    </div>
  );
}
