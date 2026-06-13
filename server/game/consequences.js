// What an answer does to the collective. The winning option carries tagged
// values; this turns them into (a) a "reflection" line shown in the verdict and
// (b) Mongo update fragments that shift the collective heart, hope, and — for
// some questions — a confession sealed for the next soul. Pure and testable.
//
// applyAnswer(spec, ctx) -> { record, inc, set }
//   record : { reveal, confession?, reset? }   broadcast + stored on the Round
//   inc    : $inc fragment for heart.* and hope
//   set    : $set fragment (confession, or a full "begin again" reset)

import { heartScale } from './personality.js';
import { DIMS } from './alignment.js';

export function applyAnswer(spec, ctx) {
  const { marginFraction = 0, world = {}, roundNumber = 0 } = ctx;
  const scale = heartScale(marginFraction);

  try {
    // Rare "begin again" — the crowd wipes humanity's slate clean.
    if (spec?.reset) {
      return {
        record: { reveal: spec.reveal || 'The crowd chose to begin again. The slate is wiped clean.', reset: true },
        set: {
          hope: 50,
          ageBase: roundNumber, // restart the chapter from Innocence
          'heart.warmth': 50,
          'heart.honesty': 50,
          'heart.daring': 50,
          'heart.idealism': 50,
          confession: null,
        },
      };
    }

    const t = spec?.traits || {};
    const inc = {};
    for (const dim of DIMS) if (t[dim]) inc[`heart.${dim}`] = t[dim] * scale;
    // Hope drifts with warmth + idealism unless the option states it explicitly.
    const hope = spec?.hope ?? ((t.warmth || 0) + (t.idealism || 0)) * 0.5;
    if (hope) inc.hope = hope * scale;

    const record = { reveal: spec?.reveal || 'The mirror has chosen.' };
    const out = { inc, record };

    // Some answers seal a message for the next soul — the truth, or a kind lie.
    if (spec?.confession) {
      out.set = {
        confession: {
          kind: spec.confession,
          text: spec.confession === 'lie' ? comfortingLie() : truthAbout(world),
          roundNumber,
        },
      };
      record.confession = spec.confession;
    }
    return out;
  } catch {
    return { record: { reveal: 'The mirror has chosen.' }, inc: {} };
  }
}

// A milestone "truth" about who the crowd is becoming, from its strongest lean.
const INSIGHT = {
  warmth: { hi: ['We would rather break our hearts than close them.', '✿'], lo: ['We have learned to feel less, and so hurt less.', '❄'] },
  honesty: { hi: ['We would rather know the truth than be comforted.', '◉'], lo: ['We would rather be soothed than be told.', '☼'] },
  daring: { hi: ['We would rather risk everything than stay safe.', '🔥'], lo: ['We would rather be safe than be sorry.', '⚓'] },
  idealism: { hi: ['We would rather chase meaning than comfort.', '★'], lo: ['We have made our peace with what is.', '⊙'] },
};

export function insightFromHeart(heart, roundNumber) {
  let dim = 'warmth';
  let dev = 0;
  for (const d of DIMS) {
    const delta = (heart?.[d] ?? 50) - 50;
    if (Math.abs(delta) > Math.abs(dev)) {
      dev = delta;
      dim = d;
    }
  }
  const [text, icon] = INSIGHT[dim][dev >= 0 ? 'hi' : 'lo'];
  return { text, icon, roundNumber, ts: new Date() };
}

const LIES = [
  'You made the right choice. You always do.',
  'Everyone you love is safe, and they always will be.',
  'It gets easier from here. It really does.',
  'You are exactly where you were meant to be.',
];
function comfortingLie() {
  return LIES[Math.floor(Math.random() * LIES.length)];
}

function truthAbout(world) {
  const h = world?.heart ?? {};
  let dim = 'warmth';
  let dev = 0;
  for (const d of DIMS) {
    const delta = (h[d] ?? 50) - 50;
    if (Math.abs(delta) > Math.abs(dev)) {
      dev = delta;
      dim = d;
    }
  }
  const word = { warmth: 'toward the heart', honesty: 'toward the truth', daring: 'toward the leap', idealism: 'toward the dream' }[dim];
  return `So far, humanity leans ${dev >= 0 ? word : 'away from it'}.`;
}
