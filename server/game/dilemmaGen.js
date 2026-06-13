// The questions MIRROR asks — real human dilemmas, drawn from well-known moral
// philosophy, the psychology of intimacy (Aron's 36 Questions), and the deep
// "would you rather" tradition. Every option is tagged with the VALUES it
// expresses on four heart dimensions, so answering quietly reveals who you are
// and who the crowd is becoming. Binary by design (A/B), to match the heartbeat.
//
// Trait convention (per option, small signed ints):
//   warmth   +compassion/connection   −detachment/self-protection
//   honesty  +truth/facing it         −comfort/illusion
//   daring   +risk/freedom/leap       −safety/caution
//   idealism +meaning/love/dreams     −pragmatism/material
//
// ── LLM seam ───────────────────────────────────────────────────────────────
// To later let a language model author questions, gate an async generator on an
// API key (process.env.LLM_API_KEY) and pass the world state into the prompt.
// Until then this curated + combinatorial engine is the only code path.
// ─────────────────────────────────────────────────────────────────────────────

import { fallbackQuestion } from './dilemmas.js';

const t = (warmth = 0, honesty = 0, daring = 0, idealism = 0) => ({ warmth, honesty, daring, idealism });

// ── curated real-life dilemmas ───────────────────────────────────────────────
const CURATED = [
  // —— morality ——
  {
    category: 'morality',
    prompt: 'A runaway trolley will kill five strangers. You can pull a lever to divert it — killing one person instead. Do you pull it?',
    optionA: 'Pull it — save the five',
    optionB: "Don't — refuse to cause a death",
    A: { traits: t(2, 0, 2, 0), reveal: 'The crowd pulled the lever. We will carry the weight of a choice to save the many.' },
    B: { traits: t(0, 2, -1, 1), reveal: 'The crowd stayed its hand. We will not trade one life for arithmetic.' },
  },
  {
    category: 'morality',
    prompt: 'Your love is dying. The one drug that saves them costs more than you will ever have, and the maker won’t lower the price. Do you steal it?',
    optionA: 'Steal it — save them',
    optionB: 'Obey the law — let fate decide',
    A: { traits: t(3, -1, 2, 2), reveal: 'The crowd would break the law for love. We choose the person over the rule.' },
    B: { traits: t(-1, 2, -1, -1), reveal: 'The crowd kept the law. We would not become thieves, even for love.' },
  },
  {
    category: 'morality',
    prompt: 'The cashier hands you $20 too much in change and doesn’t notice. Do you keep it?',
    optionA: 'Keep it',
    optionB: 'Give it back',
    A: { traits: t(-1, -2, 1, 0), reveal: 'The crowd kept the money. A small dishonesty, quietly chosen.' },
    B: { traits: t(1, 2, 0, 0), reveal: 'The crowd gave it back. Honesty, even when no one was watching.' },
  },
  {
    category: 'morality',
    prompt: 'You could press a button to end all suffering on Earth — but it would also end all of humanity, instantly and painlessly. Do you press it?',
    optionA: 'Press it — no more pain',
    optionB: 'Never — pain is the price of life',
    A: { traits: t(1, 1, 3, -2), reveal: 'The crowd would choose the end of pain over the continuation of life.' },
    B: { traits: t(1, 0, -1, 3), reveal: 'The crowd chose life with all its suffering. We would rather hurt than not exist.' },
  },

  // —— love ——
  {
    category: 'love',
    prompt: 'Would you rather lose every memory of someone you loved, or keep them all even though they break your heart?',
    optionA: 'Forget — and finally have peace',
    optionB: 'Keep them — even the pain',
    A: { traits: t(-2, -1, 1, -1), reveal: 'The crowd would let the memory go. We would rather heal than ache.' },
    B: { traits: t(2, 1, 0, 2), reveal: 'The crowd kept the ache. We would rather feel it than forget them.' },
  },
  {
    category: 'love',
    prompt: 'A partner who is utterly loyal but emotionally distant, or warm and present but unfaithful once?',
    optionA: 'Loyal, but distant',
    optionB: 'Warm and present, but unfaithful once',
    A: { traits: t(-1, 1, -1, 0), reveal: 'The crowd chose loyalty over warmth. We would rather be safe than swept up.' },
    B: { traits: t(2, -1, 2, 1), reveal: 'The crowd chose presence over fidelity. We would rather be felt than kept.' },
  },
  {
    category: 'love',
    prompt: 'Would you rather be deeply loved by one person, or admired by millions?',
    optionA: 'Loved by one',
    optionB: 'Admired by millions',
    A: { traits: t(2, 0, 0, 2), reveal: 'The crowd chose the one over the many. We would rather be known than seen.' },
    B: { traits: t(-1, 0, 1, -2), reveal: 'The crowd chose the crowd. We would rather be admired than held.' },
  },
  {
    category: 'love',
    prompt: 'Would you rather love and lose, or never love at all?',
    optionA: 'Love and lose',
    optionB: 'Never love at all',
    A: { traits: t(2, 1, 2, 2), reveal: 'The crowd would rather love and lose. We choose the risk every time.' },
    B: { traits: t(-2, 0, -2, -1), reveal: 'The crowd would rather not love at all. We would spare ourselves the wound.' },
  },

  // —— mortality ——
  {
    category: 'mortality',
    prompt: 'Would you rather know the exact day you will die, or how you will die?',
    optionA: 'Know the day',
    optionB: 'Know the way',
    A: { traits: t(0, 2, 2, 0), reveal: 'The crowd chose to know the day. We would rather count the time than fear the manner.' },
    B: { traits: t(0, 1, 1, 0), reveal: 'The crowd chose to know the way. We would rather see it coming than watch the clock.' },
  },
  {
    category: 'mortality',
    prompt: 'Would you rather be remembered forever for your work but never know love, or be loved deeply and forgotten by history?',
    optionA: 'Remembered, but unloved',
    optionB: 'Loved, but forgotten',
    A: { traits: t(-2, 0, 1, -1), reveal: 'The crowd chose to be remembered. We would trade warmth for a name that outlives us.' },
    B: { traits: t(2, 0, 0, 2), reveal: 'The crowd chose to be loved and forgotten. A full heart over a long shadow.' },
  },
  {
    category: 'mortality',
    prompt: 'If you could live to 90 keeping the MIND of a 30-year-old, or the BODY of a 30-year-old, which would you choose?',
    optionA: 'A young mind',
    optionB: 'A young body',
    A: { traits: t(0, 1, 0, 2), reveal: 'The crowd kept the young mind. We would rather stay sharp than stay strong.' },
    B: { traits: t(0, 0, 1, -1), reveal: 'The crowd kept the young body. We would rather feel alive than think clearly.' },
  },

  // —— desire ——
  {
    category: 'desire',
    prompt: 'Do work you love for just enough to get by, or work you hate for more money than you could spend?',
    optionA: 'Love it, stay poor',
    optionB: 'Hate it, get rich',
    A: { traits: t(1, 1, 1, 3), reveal: 'The crowd chose meaning over money. We would rather be poor and lit up.' },
    B: { traits: t(-1, 0, -1, -3), reveal: 'The crowd chose the money. We would trade our days for security.' },
  },
  {
    category: 'desire',
    prompt: 'Would you rather win the lottery but lose all your friends, or lose all your money but meet your soulmate?',
    optionA: 'Riches, alone',
    optionB: 'Broke, but found',
    A: { traits: t(-2, 0, 0, -2), reveal: 'The crowd took the riches. We would weather loneliness for freedom.' },
    B: { traits: t(2, 0, 1, 3), reveal: 'The crowd chose the soulmate. We would give up everything to be found.' },
  },
  {
    category: 'desire',
    prompt: 'Would you rather have unlimited money, or unlimited time?',
    optionA: 'Unlimited money',
    optionB: 'Unlimited time',
    A: { traits: t(-1, 0, 0, -2), reveal: 'The crowd chose money. We would buy the world.' },
    B: { traits: t(1, 1, 0, 2), reveal: 'The crowd chose time. We would rather have the hours than the means.' },
  },

  // —— truth / vulnerability ——
  {
    category: 'truth',
    prompt: 'A friend asks if you like the gift they were so proud to give. You don’t. Do you tell the truth, or the kind lie?',
    optionA: 'The truth',
    optionB: 'The kind lie',
    A: { traits: t(-1, 3, 1, 0), reveal: 'The crowd told the truth. We would rather wound than deceive.' },
    B: { traits: t(2, -2, -1, 0), reveal: 'The crowd told the kind lie. We would rather protect a heart than be right.', confession: 'lie' },
  },
  {
    category: 'truth',
    prompt: 'You could admit a vulnerability to someone you love — or protect your pride and stay guarded. Which do you do?',
    optionA: 'Admit it — be seen',
    optionB: 'Protect your pride',
    A: { traits: t(2, 3, 2, 1), reveal: 'The crowd chose to be seen. We would rather be known than safe.', confession: 'truth' },
    B: { traits: t(-1, -2, -2, 0), reveal: 'The crowd protected its pride. We kept the armor on.' },
  },
  {
    category: 'truth',
    prompt: 'You suspect a betrayal. Their phone is unlocked in front of you. Do you read it, or trust and walk away?',
    optionA: 'Read it — I need to know',
    optionB: 'Trust — and walk away',
    A: { traits: t(-1, 1, 2, -1), reveal: 'The crowd looked. We would rather know than wonder.' },
    B: { traits: t(2, -1, 0, 2), reveal: 'The crowd walked away. We would rather trust than be certain.' },
  },

  // —— existential ——
  {
    category: 'existential',
    prompt: 'A machine offers a perfect, blissful life — every desire met — but it is all simulated, and you can never come back. Do you plug in?',
    optionA: 'Plug in — choose bliss',
    optionB: 'Stay in messy reality',
    A: { traits: t(-1, -2, 0, -2), reveal: 'The crowd plugged in. We would choose a beautiful illusion over a hard truth.' },
    B: { traits: t(1, 3, 2, 2), reveal: 'The crowd stayed real. We would rather suffer truly than be happy falsely.' },
  },
  {
    category: 'existential',
    prompt: 'You design society’s rules knowing you could be born as anyone in it — the richest or the most wretched. Do you build for the strong, or the weak?',
    optionA: 'For the strong',
    optionB: 'For the weakest',
    A: { traits: t(-2, 0, 2, -1), reveal: 'The crowd built for the strong. We would gamble on landing high.' },
    B: { traits: t(3, 1, 0, 2), reveal: 'The crowd built for the weakest. We would protect whoever we might become.' },
  },
  {
    category: 'existential',
    prompt: 'You may relive your life exactly as it was — every joy and every wound, forever, with nothing changed. Would you?',
    optionA: 'Yes — live it all again',
    optionB: 'No — once was enough',
    A: { traits: t(1, 1, 1, 3), reveal: 'The crowd would live it all again. We would say yes to everything, even the pain.' },
    B: { traits: t(0, 2, 0, -1), reveal: 'The crowd would not repeat it. Once, we decided, was enough.' },
  },

  // —— the rare "begin again" ——
  {
    category: 'existential',
    prompt: 'The collective has carried every choice ever made. Keep that whole history — or wipe the slate and begin as innocents again?',
    optionA: 'Keep our history',
    optionB: 'Begin again, innocent',
    A: { traits: t(0, 2, 0, 1), reveal: 'The crowd kept its history. We would rather remember than be clean.' },
    B: { reset: true, reveal: 'The crowd chose to begin again. Humanity wipes the slate clean and wakes as innocents.' },
  },
];

// ── combinatorial "would you rather" (the playful → deep tier) ────────────────
const PRECIOUS = [
  'music', 'the ocean', 'your memories', 'the stars', 'the sense of touch', 'the smell of rain',
  'books', 'the taste of food', 'laughter', 'the night sky', 'your favorite song', 'color',
  'dreams while you sleep', 'the sound of a loved one’s voice', 'the feeling of sunlight', 'silence',
];
const SUPERPOWER = [
  ['read any mind', t(-1, 1, 2, 0)],
  ['become invisible', t(-1, -1, 2, 0)],
  ['fly anywhere', t(0, 0, 2, 1)],
  ['undo one moment of your past', t(1, 0, 0, 1)],
  ['feel no fear', t(0, 0, 3, 0)],
  ['never feel pain again', t(-1, -1, 0, -1)],
  ['live a hundred years longer', t(0, 0, 0, 1)],
  ['speak with anyone who has ever lived', t(1, 0, 0, 2)],
];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
function pickTwo(arr) {
  const a = rand(arr);
  let b = rand(arr);
  let g = 0;
  while (b === a && g++ < 12) b = rand(arr);
  return [a, b];
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const TEMPLATES = [
  () => {
    const [a, b] = pickTwo(PRECIOUS);
    return {
      category: 'self',
      prompt: `If one had to vanish from the world forever, which could you bear to lose — ${a}, or ${b}?`,
      optionA: cap(a),
      optionB: cap(b),
      A: { traits: t(0, 0, 0, 1), reveal: `The crowd let go of ${a}, and held on to ${b}.` },
      B: { traits: t(0, 0, 0, 1), reveal: `The crowd let go of ${b}, and held on to ${a}.` },
    };
  },
  () => {
    const [a, b] = pickTwo(SUPERPOWER);
    return {
      category: 'self',
      prompt: 'If you could only ever have one, would you rather —',
      optionA: cap(a[0]),
      optionB: cap(b[0]),
      A: { traits: a[1], reveal: `The crowd chose to ${a[0]}.` },
      B: { traits: b[1], reveal: `The crowd chose to ${b[0]}.` },
    };
  },
  () => {
    const [a, b] = pickTwo(PRECIOUS);
    return {
      category: 'self',
      prompt: `You may keep only one for the rest of your life: ${a}, or ${b}. Choose.`,
      optionA: cap(a),
      optionB: cap(b),
      A: { traits: t(0, 0, 0, 1), reveal: `The crowd kept ${a}.` },
      B: { traits: t(0, 0, 0, 1), reveal: `The crowd kept ${b}.` },
    };
  },
];

const POOL = [...CURATED, ...TEMPLATES];

// Recent-repeat guard so the same question doesn't recur for a long stretch.
const RECENT_MAX = 40;
const recent = [];

function buildOne(world) {
  const entry = POOL[Math.floor(Math.random() * POOL.length)];
  return typeof entry === 'function' ? entry(world || {}) : entry;
}

export function generateQuestion(world) {
  try {
    let q = buildOne(world);
    for (let i = 0; i < 8 && recent.includes(q.prompt); i++) q = buildOne(world);
    recent.push(q.prompt);
    if (recent.length > RECENT_MAX) recent.shift();
    return q;
  } catch (err) {
    console.error('[gen] question generation failed, falling back', err);
    return fallbackQuestion();
  }
}

// Rough count of distinct questions the engine can pose (for docs/tests).
export function approxVariety() {
  const wyr = PRECIOUS.length * (PRECIOUS.length - 1); // "vanish forever"
  const keep = PRECIOUS.length * (PRECIOUS.length - 1); // "keep only one"
  const powers = SUPERPOWER.length * (SUPERPOWER.length - 1);
  return CURATED.length + wyr + keep + powers;
}
