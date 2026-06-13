import dotenv from 'dotenv';

dotenv.config();

// MIRROR — strangers answer real human dilemmas and are read by the crowd.
// The server is the clock. Distinct port/DB from any sibling project so both
// can run at once.
export const config = {
  port: Number(process.env.PORT) || 4001,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mirror',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5174',

  // Secret used to sign session cookies so clients can't forge identities.
  // MUST be overridden in production via env.
  sessionSecret: process.env.SESSION_SECRET || 'mirror-dev-secret-change-me',

  // Anti-stuffing: how many answers one IP may cast per round. Shared NAT means
  // several real people can share an IP, so this is a ceiling, not 1.
  maxVotesPerIpPerRound: Number(process.env.MAX_VOTES_PER_IP) || 5,

  // Ambient reflections (bots) keep the mirror alive when few/no humans are
  // around. They answer through the same path as real souls, so they populate
  // the surface, the tribes, and the archetypes. "Souls reflecting" breathes
  // randomly between min and max.
  botsEnabled: process.env.BOTS_ENABLED !== 'false',
  botPoolSize: Number(process.env.BOT_POOL) || 60,
  botPresenceMin: Number(process.env.BOTS_MIN) || 4,
  botPresenceMax: Number(process.env.BOTS_MAX) || 22,
  botChurn: Number(process.env.BOTS_CHURN) || 3,
  botVoteProb: 0.75,

  // Round cadence: time to answer, then to reveal what the mirror chose. These
  // are real, weighty human questions — give people room to actually think.
  voteMs: 30_000,
  revealMs: 7_000,

  // Live answer broadcasts are coalesced and flushed at most this often.
  broadcastMs: 100,
};
