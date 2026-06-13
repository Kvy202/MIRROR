// Turns the collective's four heart dimensions into a measurable character — the
// face the mirror has earned from every answer ever given. Flavor on real,
// drifting data.

const band = (v) => (v >= 60 ? 'hi' : v <= 40 ? 'lo' : 'mid');

export function collectiveCharacter(heart) {
  if (!heart) return { name: 'THE UNFORMED', descriptor: 'No one has answered yet. The face is still blank.' };
  const w = band(heart.warmth ?? 50);
  const h = band(heart.honesty ?? 50);
  const d = band(heart.daring ?? 50);
  const i = band(heart.idealism ?? 50);

  // Ordered rules — first match wins.
  const rules = [
    [w === 'hi' && i === 'hi', 'THE ROMANTIC', 'It would break its heart a thousand times for love and meaning.'],
    [d === 'hi' && i === 'hi', 'THE DREAMER', 'It leaps toward what could be, and never looks down.'],
    [h === 'hi' && d === 'hi', 'THE TRUTH-SEEKER', 'It would rather know the hard thing than be held by a soft lie.'],
    [w === 'hi' && d === 'lo', 'THE CAREGIVER', 'It gathers the fragile close and keeps them safe.'],
    [h === 'lo' && w === 'hi', 'THE COMFORTER', 'It chooses the kind illusion. It would rather you be okay than be right.'],
    [w === 'lo' && d === 'lo', 'THE STOIC', 'It has learned to want less, and so to lose less.'],
    [i === 'lo' && d === 'lo', 'THE REALIST', 'It builds on what is, not on what it wishes were true.'],
    [d === 'hi', 'THE GAMBLER', 'It cannot sit still. It bets on the leap, every time.'],
    [w === 'hi', 'THE TENDER', 'Its first instinct is to feel with you.'],
    [h === 'hi', 'THE HONEST', 'It will tell you the truth, gently or not.'],
  ];
  for (const [cond, name, descriptor] of rules) if (cond) return { name, descriptor };
  return { name: 'THE UNDECIDED', descriptor: 'Still balanced on every edge. Still becoming.' };
}

export const HEART_DIMS = [
  { key: 'warmth', label: 'WARMTH', color: '#ff6b9d' },
  { key: 'honesty', label: 'HONESTY', color: '#18e0ff' },
  { key: 'daring', label: 'DARING', color: '#ff5d3c' },
  { key: 'idealism', label: 'IDEALISM', color: '#b061ff' },
];
