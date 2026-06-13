// ── MIRROR gameplay tuning ───────────────────────────────────────────────────
// Every "magic number" that shapes how the experiment feels lives here, in one
// place, so it can be tuned against a real crowd without hunting through logic.

export const TUNING = {
  // How many answers a soul must give before the mirror reveals its archetype.
  revealAt: 5,

  // How fast the collective heart drifts. Each verdict nudges the four heart
  // dimensions toward the winning answer's values, scaled by this and by how
  // decisive the answer was. `magnitude` is the master dial.
  heart: {
    magnitude: 1,
    scaleMin: 0.5, // even a coin-flip answer shapes the heart this much
    scaleRange: 0.6, // ...up to (scaleMin + scaleRange) for a near-unanimous answer
  },

  // The chapters of humanity's story, by round number (first match wins).
  chapters: [
    { until: 12, name: 'Innocence' },
    { until: 40, name: 'Awakening' },
    { until: 90, name: 'Reckoning' },
    { until: Infinity, name: 'Wisdom' },
  ],

  // Unlock a collective "truth" about the crowd this often (rounds).
  truthEvery: 20,

  // Bounded recent history kept inline on the WorldState doc; the Round
  // collection is the authoritative full record.
  historyBuffer: 50,
};
