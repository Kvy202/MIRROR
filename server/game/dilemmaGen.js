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
    heavy: true,
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
    heavy: true,
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

  // —— more morality ——
  {
    category: 'morality',
    prompt: 'You find a wallet stuffed with cash and the owner’s address inside. No one saw you. Do you return it untouched, or keep it?',
    optionA: 'Return it, every dollar',
    optionB: 'Keep it — they’ll never know',
    A: { traits: t(2, 2, 0, 1), reveal: 'The crowd returned the wallet. Honesty when no one is watching is still honesty.' },
    B: { traits: t(-2, -2, 1, -1), reveal: 'The crowd kept it. A quiet theft, rationalized.' },
  },
  {
    category: 'morality',
    heavy: true,
    prompt: 'A lifeboat holds ten. There are eleven of you, and it will sink with all aboard unless one goes overboard. Do you draw lots, or refuse and risk everyone?',
    optionA: 'Draw lots — sacrifice one',
    optionB: 'Refuse — all or none',
    A: { traits: t(0, 1, 2, -1), reveal: 'The crowd drew lots. We would sacrifice one cold number to save the rest.' },
    B: { traits: t(2, 1, -1, 2), reveal: 'The crowd refused. We would not choose who dies, even to live.' },
  },
  {
    category: 'morality',
    prompt: 'You can report a friend’s small crime that hurt no one, or stay silent and stay loyal. Which?',
    optionA: 'Report it — the rule is the rule',
    optionB: 'Stay silent — loyalty first',
    A: { traits: t(-1, 2, 1, -1), reveal: 'The crowd reported it. Principle over the bond.' },
    B: { traits: t(2, -1, 0, 1), reveal: 'The crowd stayed silent. The bond over the rule.' },
  },

  // —— more love ——
  {
    category: 'love',
    prompt: 'You can have a love that burns bright and ends in a year, or a quiet, steady warmth that lasts fifty. Which do you choose?',
    optionA: 'One blazing year',
    optionB: 'Fifty quiet years',
    A: { traits: t(1, 0, 3, 2), reveal: 'The crowd chose the blaze. Better to burn once than to glow forever.' },
    B: { traits: t(2, 1, -2, 0), reveal: 'The crowd chose the long warmth. We would take the steady over the spark.' },
  },
  {
    category: 'love',
    prompt: 'Your closest friend and your partner are drowning, and you can reach only one. (No one else is coming.) Who do you swim to?',
    optionA: 'Your partner',
    optionB: 'Your closest friend',
    heavy: true,
    A: { traits: t(1, 1, 0, 2), reveal: 'The crowd swam to their love. Romance over the oldest loyalty.' },
    B: { traits: t(2, 1, 0, 0), reveal: 'The crowd swam to their friend. The oldest bond pulled hardest.' },
  },
  {
    category: 'love',
    prompt: 'Would you rather be the one who loves a little more, or the one who is loved a little more?',
    optionA: 'Love more',
    optionB: 'Be loved more',
    A: { traits: t(3, 1, 1, 2), reveal: 'The crowd would rather love more. We choose the open hand, even unguarded.' },
    B: { traits: t(-1, 0, -1, 0), reveal: 'The crowd would rather be loved more. We would keep a little of ourselves safe.' },
  },
  {
    category: 'love',
    prompt: 'A pill could erase your worst heartbreak — and the person tied to it — completely. Do you take it?',
    optionA: 'Take it — be free of them',
    optionB: 'Keep it — they made you who you are',
    A: { traits: t(-2, -1, 1, -1), reveal: 'The crowd erased the heartbreak. Peace over the person.' },
    B: { traits: t(2, 2, 0, 2), reveal: 'The crowd kept it. Even the wound was worth keeping.' },
  },

  // —— more mortality ——
  {
    category: 'mortality',
    prompt: 'You can live an ordinary life to 90, or a dazzling one that ends at 40. Which do you take?',
    optionA: 'Ordinary, to 90',
    optionB: 'Dazzling, to 40',
    A: { traits: t(0, 1, -2, -1), reveal: 'The crowd chose the long ordinary road. More days, gently spent.' },
    B: { traits: t(0, 0, 3, 2), reveal: 'The crowd chose the dazzling, short one. Better a bright flame than a long ember.' },
  },
  {
    category: 'mortality',
    prompt: 'At the very end, would you rather be surrounded by everyone you love, or slip away quietly, alone and unafraid?',
    optionA: 'Surrounded by loved ones',
    optionB: 'Quietly, alone',
    A: { traits: t(3, 0, 0, 1), reveal: 'The crowd chose to be surrounded. We would not face the end without them.' },
    B: { traits: t(-1, 1, 1, 0), reveal: 'The crowd chose to slip away quietly. Some doors we would close ourselves.' },
  },
  {
    category: 'mortality',
    prompt: 'You can know, with certainty, that there is something after death — or keep the mystery forever. Which?',
    optionA: 'Know for certain',
    optionB: 'Keep the mystery',
    A: { traits: t(0, 2, 0, -1), reveal: 'The crowd chose certainty. We would trade wonder for an answer.' },
    B: { traits: t(0, -1, 1, 2), reveal: 'The crowd kept the mystery. We would rather wonder than be sure.' },
  },

  // —— more desire / ambition ——
  {
    category: 'desire',
    prompt: 'You can be the best in the world at one thing no one will ever see, or merely good at something that touches millions. Which?',
    optionA: 'Unseen mastery',
    optionB: 'Seen, but ordinary',
    A: { traits: t(-1, 1, 0, 2), reveal: 'The crowd chose the unseen mastery. The work itself was enough.' },
    B: { traits: t(2, 0, 0, 0), reveal: 'The crowd chose to be seen. To touch others mattered more than to be great.' },
  },
  {
    category: 'desire',
    prompt: 'A genie offers your single deepest wish — but a stranger, somewhere, loses something equal. Do you wish?',
    optionA: 'Make the wish',
    optionB: 'Refuse it',
    heavy: true,
    A: { traits: t(-2, 0, 2, 0), reveal: 'The crowd made the wish. Our longing outweighed a stranger’s loss.' },
    B: { traits: t(2, 1, -1, 1), reveal: 'The crowd refused. We would not buy our joy with another’s grief.' },
  },
  {
    category: 'desire',
    prompt: 'Would you rather be remembered as good, or actually be good and remembered as nothing?',
    optionA: 'Remembered as good',
    optionB: 'Truly good, unremembered',
    A: { traits: t(-1, -1, 0, -1), reveal: 'The crowd chose the reputation. The story mattered more than the truth of it.' },
    B: { traits: t(2, 2, 0, 2), reveal: 'The crowd chose to truly be good. Goodness without an audience.' },
  },

  // —— more truth / vulnerability ——
  {
    category: 'truth',
    prompt: 'You can read everyone’s honest, unfiltered thoughts about you for one day — or never know. Do you read them?',
    optionA: 'Read them',
    optionB: 'Never know',
    A: { traits: t(-1, 2, 2, -1), reveal: 'The crowd read the thoughts. We would rather know than imagine.' },
    B: { traits: t(1, -1, -1, 1), reveal: 'The crowd looked away. Some truths we would rather not carry.' },
  },
  {
    category: 'truth',
    prompt: 'Someone you love did something unforgivable years ago and got away with it. You just found out. Do you tell them you know?',
    optionA: 'Tell them you know',
    optionB: 'Carry it in silence',
    heavy: true,
    A: { traits: t(-1, 3, 2, 0), reveal: 'The crowd spoke. We would rather break the quiet than live the lie.' },
    B: { traits: t(2, -2, -1, 0), reveal: 'The crowd kept silent. We would carry it so they would not have to.' },
  },
  {
    category: 'truth',
    prompt: 'Would you rather everyone always knew when you were lying, or you always knew when others were?',
    optionA: 'They see through me',
    optionB: 'I see through them',
    A: { traits: t(1, 3, 0, 1), reveal: 'The crowd chose to be transparent. We would rather be honest than armored.' },
    B: { traits: t(-1, 0, 1, -1), reveal: 'The crowd chose to see through others. We would rather hold the advantage.' },
  },

  // —— more existential ——
  {
    category: 'existential',
    prompt: 'You learn your whole life — every joy, every loss — was a simulation built to test you. Do you want to be told what was real, or left in peace?',
    optionA: 'Tell me what was real',
    optionB: 'Leave me in peace',
    A: { traits: t(0, 3, 2, 1), reveal: 'The crowd demanded the truth, whatever it cost.' },
    B: { traits: t(1, -2, -1, 0), reveal: 'The crowd chose peace over the truth of it all.' },
  },
  {
    category: 'existential',
    prompt: 'You can feel exactly how much your life mattered to the world — the real number, good or crushing. Do you look?',
    optionA: 'Look at the number',
    optionB: 'Never look',
    A: { traits: t(-1, 2, 3, -1), reveal: 'The crowd looked. We would face our own smallness rather than wonder.' },
    B: { traits: t(1, -1, -1, 2), reveal: 'The crowd looked away. A life is not a number to be checked.' },
  },

  // —— more self (lighter) ——
  {
    category: 'self',
    prompt: 'Would you rather always know what time it is exactly, or always know exactly how someone near you is feeling?',
    optionA: 'Always know the time',
    optionB: 'Always feel what others feel',
    A: { traits: t(-2, 0, 0, -1), reveal: 'The crowd kept the clock. Order over empathy.' },
    B: { traits: t(3, 0, 0, 1), reveal: 'The crowd chose to feel others. We would carry everyone’s weather.' },
  },
  {
    category: 'self',
    prompt: 'Would you rather start every day knowing it might be your last, or live as if you had forever?',
    optionA: 'As if today could be the last',
    optionB: 'As if you had forever',
    A: { traits: t(1, 2, 1, 2), reveal: 'The crowd chose to live each day as the last. Urgency over ease.' },
    B: { traits: t(0, -1, 0, 0), reveal: 'The crowd chose to live as if forever. We would rather not count.' },
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
