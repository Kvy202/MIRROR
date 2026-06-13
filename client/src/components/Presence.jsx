import { archetypeMeta } from '../lib/alignments.js';

// You are never the only one reflecting. Once the mirror has read you, your
// archetype rides here as a permanent badge; the chapter opens the portrait.
export default function Presence({ count, connected, world, archetype, onOpenCodex }) {
  const meta = archetype ? archetypeMeta(archetype) : null;

  return (
    <header className="presence">
      <div className="presence__brand">
        <span className="presence__dot" data-on={connected} />
        MIRROR · the crowd is reading you
      </div>
      <div className="presence__stats">
        {meta && (
          <span className="presence__badge" style={{ '--ac': meta.color }} title="What the mirror reads in you">
            {archetype}
          </span>
        )}
        {world && (
          <button className="presence__era" onClick={onOpenCodex} title="Open the portrait of the crowd">
            {world.chapter}
          </button>
        )}
        {world && <span className="presence__survival">HOPE {Math.round(world.hope ?? 50)}</span>}
        <span className="presence__souls">{count} souls reflecting</span>
      </div>
    </header>
  );
}
