import mongoose from 'mongoose';

// The single persistent reflection of the collective — exactly one document,
// _id 'global'. Every answered round shifts who "humanity" is becoming, and the
// next round inherits it. This is the face in the mirror.
const worldStateSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' },

  // The crowd's mood meter (optimism), 0–100. Bleak answers lower it; hopeful
  // ones lift it. Drives the ambient color of the whole UI.
  hope: { type: Number, default: 50 },

  // The chapter of humanity's story (derived from how many questions answered).
  chapter: { type: String, default: 'Innocence' },
  // The round the current chapter began at, so a "begin again" truly restarts it.
  ageBase: { type: Number, default: 0 },

  // The four dimensions of the collective heart (0–100, neutral 50). Every
  // verdict nudges these toward the winning answer's values — over time they
  // settle into a measurable character.
  heart: {
    warmth: { type: Number, default: 50 }, // compassion ↔ detachment
    honesty: { type: Number, default: 50 }, // truth ↔ comfort
    daring: { type: Number, default: 50 }, // risk/freedom ↔ safety
    idealism: { type: Number, default: 50 }, // meaning/love ↔ pragmatism
  },

  // Truths the crowd has revealed about itself at milestones (collected relics).
  truths: {
    type: [{ text: String, icon: String, roundNumber: Number, ts: { type: Date, default: Date.now } }],
    default: [],
  },

  // A confession the last crowd left for whoever arrives next (a truth, or a
  // comforting lie — the arriving soul is never told which).
  confession: { type: mongoose.Schema.Types.Mixed, default: null },

  // All-time tribe standings, e.g. { Romantic: { wins: 12 }, ... }. Stored
  // loosely so archetypes can evolve without a migration.
  tribes: { type: mongoose.Schema.Types.Mixed, default: {} },

  history: {
    type: [
      {
        roundNumber: Number,
        result: { type: String, enum: ['A', 'B'] },
        ts: { type: Date, default: Date.now },
      },
    ],
    default: [],
  },
});

export const WorldState = mongoose.model('WorldState', worldStateSchema);
