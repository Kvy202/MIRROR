import mongoose from 'mongoose';

// A returning visitor's reflection, keyed by their server-signed session id.
// As they answer, the values of the options they pick accumulate here — and the
// dominant dimension becomes their archetype. The mirror is reading them.
const soulSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  archetype: { type: String, default: null }, // The Romantic, The Stoic, …
  votesCast: { type: Number, default: 0 },
  // Cumulative pull on each heart dimension, summed from the answers they chose.
  traits: {
    warmth: { type: Number, default: 0 },
    honesty: { type: Number, default: 0 },
    daring: { type: Number, default: 0 },
    idealism: { type: Number, default: 0 },
  },
  streak: { type: Number, default: 0 }, // consecutive rounds answered
  bestStreak: { type: Number, default: 0 }, // longest streak ever reached
  lastVotedRound: { type: Number, default: 0 }, // for computing the streak
  lastSeenRound: { type: Number, default: 0 }, // for the "you weren't here" twist
  // Empathy: how often this soul predicted which way the crowd would lean.
  empathyHits: { type: Number, default: 0 },
  empathyRounds: { type: Number, default: 0 },
  // A bounded trail of how this soul's archetype has drifted over time.
  journey: {
    type: [{ roundNumber: Number, archetype: String }],
    default: [],
  },
  firstSeen: { type: Date, default: Date.now },
});

export const Soul = mongoose.model('Soul', soulSchema);
