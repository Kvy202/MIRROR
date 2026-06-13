import { useEffect, useRef, useState } from 'react';
import { archetypeMeta, oppositeArchetype } from '../lib/alignments.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';

const DIMS = [
  { key: 'warmth', hi: 'warm', lo: 'guarded', color: '#ff6b9d' },
  { key: 'honesty', hi: 'honest', lo: 'sparing', color: '#18e0ff' },
  { key: 'daring', hi: 'daring', lo: 'careful', color: '#ff5d3c' },
  { key: 'idealism', hi: 'idealist', lo: 'realist', color: '#b061ff' },
];

const leanPct = (v) => Math.round(50 + Math.max(-25, Math.min(25, v ?? 0)) * 2);
const pct = (x) => Math.round((x ?? 0) * 100);

// A soul's reflection — its archetype, personal lean on each heart dimension,
// empathy, streaks, journey, and mirror-opposite. Used both for your own
// reflection and as a public, shareable view (?soul=ID).
export default function SoulPortrait({ sessionId, dayStreak, onClose, isPublic }) {
  const [soul, setSoul] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch(`${SERVER_URL}/api/soul/${sessionId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => alive && setSoul(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const meta = soul?.archetype ? archetypeMeta(soul.archetype) : null;
  const opposite = soul?.archetype ? oppositeArchetype(soul.archetype) : null;

  const downloadCard = () => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 360;
    const x = c.getContext('2d');
    x.fillStyle = '#06080e';
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#6b7894';
    x.font = '13px "Courier New", monospace';
    x.fillText('MIRROR · the crowd is reading you', 28, 40);
    x.fillStyle = meta?.color || '#e8f0ff';
    x.font = '700 40px "Courier New", monospace';
    x.fillText((soul?.archetype || 'UNREAD').toUpperCase(), 28, 92);
    // dimension bars
    let y = 140;
    for (const d of DIMS) {
      const p = leanPct(soul?.traits?.[d.key]);
      x.fillStyle = '#9aa';
      x.font = '12px "Courier New", monospace';
      x.fillText(d.key.toUpperCase(), 28, y - 6);
      x.fillStyle = '#11161f';
      x.fillRect(28, y, 360, 10);
      x.fillStyle = d.color;
      x.fillRect(28, y, 360 * (p / 100), 10);
      y += 38;
    }
    x.fillStyle = '#e8f0ff';
    x.font = '14px "Courier New", monospace';
    const rar = soul?.rarity != null ? `${pct(soul.rarity)}% share it` : '';
    const emp = soul?.empathyRate != null ? `empathy ${pct(soul.empathyRate)}%` : '';
    x.fillText([rar, emp].filter(Boolean).join('   ·   '), 420, 150);
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = `mirror-${soul?.archetype || 'soul'}.png`.replace(/\s+/g, '-').toLowerCase();
    a.click();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/?soul=${sessionId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <div className="meta" onClick={onClose}>
      <div className="meta__card" onClick={(e) => e.stopPropagation()} style={{ '--ac': meta?.color || '#9aa' }}>
        <button className="meta__close" onClick={onClose} aria-label="Close">✕</button>
        <p className="meta__eyebrow">{isPublic ? 'A SOUL, AS THE MIRROR SAW IT' : 'YOUR REFLECTION'}</p>

        {loading ? (
          <p className="meta__empty">Reading the reflection…</p>
        ) : !soul ? (
          <p className="meta__empty">No reflection yet — answer a few questions first.</p>
        ) : !soul.archetype ? (
          <>
            <h2 className="meta__name">STILL UNREAD</h2>
            <p className="meta__descriptor">
              The mirror needs {soul.revealAt} answers to read you. You’ve given {soul.votesCast}.
            </p>
          </>
        ) : (
          <>
            <h2 className="meta__name" style={{ color: meta.color }}>{soul.archetype}</h2>
            <p className="meta__descriptor">{meta.blurb}</p>

            <div className="meta__meters">
              {DIMS.map((d) => {
                const p = leanPct(soul.traits?.[d.key]);
                return (
                  <div className="meta__meter" key={d.key}>
                    <div className="meta__meterhead">
                      <span style={{ color: d.color }}>{p >= 50 ? d.hi : d.lo}</span>
                      <span>{p}</span>
                    </div>
                    <div className="meta__metertrack">
                      <div className="meta__meterfill" style={{ width: `${p}%`, background: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="portrait__stats">
              {soul.rarity != null && <span><b>{pct(soul.rarity)}%</b> share your archetype</span>}
              {soul.empathyRate != null && <span><b>{pct(soul.empathyRate)}%</b> empathy (you read the crowd)</span>}
              <span><b>{soul.streak ?? 0}</b> streak · best {soul.bestStreak ?? 0}</span>
              {!isPublic && dayStreak != null && <span><b>day {dayStreak}</b> returning</span>}
              {opposite && <span>your opposite: <b>{opposite}</b></span>}
            </div>

            {soul.journey?.length > 1 && (
              <div className="portrait__journey">
                <div className="meta__artifactstitle">HOW YOU’VE DRIFTED</div>
                <div className="portrait__journeyrow">
                  {dedupeJourney(soul.journey).map((j, i) => (
                    <span className="portrait__step" key={i} title={`around answer #${j.roundNumber}`}>
                      {j.archetype.replace(/^The /, '')}
                      {i < dedupeJourney(soul.journey).length - 1 && <i className="portrait__arrow"> → </i>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="portrait__actions">
              <button className="reveal__dismiss" onClick={downloadCard}>DOWNLOAD CARD</button>
              <button className="footer__codex" onClick={copyLink}>{copied ? 'LINK COPIED ✓' : 'COPY SHARE LINK'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Collapse consecutive identical archetypes so the journey shows only changes.
function dedupeJourney(journey) {
  const out = [];
  for (const j of journey) {
    if (!out.length || out[out.length - 1].archetype !== j.archetype) out.push(j);
  }
  return out.slice(-6);
}
