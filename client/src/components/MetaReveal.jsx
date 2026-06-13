import { useEffect, useState } from 'react';
import { collectiveCharacter, HEART_DIMS } from '../lib/collective.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4001';
const A_COLOR = '#18e0ff';
const B_COLOR = '#ff6b9d';

// The branching record of how humanity has answered. Each resolved round is a
// node that veers left (A) or right (B) off a central spine; the more lopsided
// the answer, the further it swings. A river of every choice ever made.
function Timeline({ rounds }) {
  if (!rounds?.length) return <p className="meta__empty">The record is still being written…</p>;
  const width = 300;
  const rowH = 22;
  const padY = 16;
  const cx = width / 2;
  const maxSwing = cx - 34;
  const height = padY * 2 + (rounds.length - 1) * rowH;

  const nodes = rounds.map((r, i) => {
    const total = (r.tally?.A ?? 0) + (r.tally?.B ?? 0);
    const margin = total ? Math.abs(r.tally.A - r.tally.B) / total : 0;
    const swing = 14 + margin * (maxSwing - 14);
    const x = r.result === 'A' ? cx - swing : cx + swing;
    const y = padY + i * rowH;
    return { ...r, x, y, margin };
  });

  return (
    <div className="meta__timeline">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMin meet">
        <line x1={cx} y1={padY} x2={cx} y2={height - padY} stroke="rgba(120,140,200,0.18)" strokeWidth="1" />
        {nodes.map((n, i) => {
          const prev = i === 0 ? { x: cx, y: padY } : nodes[i - 1];
          const color = n.result === 'A' ? A_COLOR : B_COLOR;
          const opt = n.result === 'A' ? n.question?.optionA : n.question?.optionB;
          return (
            <g key={n.roundNumber}>
              <line x1={prev.x} y1={prev.y} x2={n.x} y2={n.y} stroke={color} strokeOpacity="0.35" strokeWidth="1.2" />
              <circle cx={n.x} cy={n.y} r={2.5 + n.margin * 4} fill={color}>
                <title>{`#${n.roundNumber} · ${n.question?.prompt}\n→ ${opt}  (A ${n.tally.A} / B ${n.tally.B})`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function MetaReveal({ open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    fetch(`${SERVER_URL}/api/timeline`)
      .then((r) => r.json())
      .then((d) => alive && setData(d))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  const character = collectiveCharacter(data?.heart);
  const truths = data?.truths ?? [];

  return (
    <div className="meta" onClick={onClose}>
      <div className="meta__card" onClick={(e) => e.stopPropagation()}>
        <button className="meta__close" onClick={onClose} aria-label="Close">✕</button>
        <p className="meta__eyebrow">THE FACE IN THE MIRROR</p>
        <h2 className="meta__name">{character.name}</h2>
        <p className="meta__descriptor">{character.descriptor}</p>

        <div className="meta__meters">
          {HEART_DIMS.map(({ key, label, color }) => {
            const v = Math.round(data?.heart?.[key] ?? 50);
            return (
              <div className="meta__meter" key={key}>
                <div className="meta__meterhead">
                  <span style={{ color }}>{label}</span>
                  <span>{v}</span>
                </div>
                <div className="meta__metertrack">
                  <div className="meta__meterfill" style={{ width: `${v}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="meta__sub">
          {data?.chapter ?? '—'} &nbsp;·&nbsp; HOPE {data?.hope != null ? Math.round(data.hope) : '—'}
        </div>

        {truths.length > 0 && (
          <div className="meta__artifacts">
            <div className="meta__artifactstitle">TRUTHS THE CROWD HAS REVEALED</div>
            <div className="meta__truthlist">
              {truths.map((tr, i) => (
                <p className="truth" key={`${tr.text}-${i}`}>
                  <i className="truth__icon">{tr.icon || '✦'}</i> {tr.text}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="meta__legend">
          <span><i style={{ background: A_COLOR }} /> chose A</span>
          <span><i style={{ background: B_COLOR }} /> chose B</span>
          <span>swing = how lopsided</span>
        </div>

        {loading ? <p className="meta__empty">Reading the record…</p> : <Timeline rounds={data?.rounds} />}
      </div>
    </div>
  );
}
