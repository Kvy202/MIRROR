import mongoose from 'mongoose';

// The question everyone is answering right now. One active Round at a time;
// resolved Rounds become the permanent record of how humanity answered.
const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true, unique: true, index: true },
  question: {
    category: { type: String, default: 'self' },
    heavy: { type: Boolean, default: false },
    prompt: { type: String, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
  },
  startedAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
  tally: {
    A: { type: Number, default: 0 },
    B: { type: Number, default: 0 },
  },
  result: { type: String, enum: ['A', 'B', null], default: null },
  // The per-option value tags (what each answer says about the chooser and the
  // crowd). Kept OUT of the client payload so the mirror's read stays unspoken.
  traitSpec: { type: mongoose.Schema.Types.Mixed, default: null },
  // The reflection shown at the verdict — what the crowd's choice revealed.
  reflection: { type: mongoose.Schema.Types.Mixed, default: null },
});

export const Round = mongoose.model('Round', roundSchema);
