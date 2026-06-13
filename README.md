# 🪞 MIRROR

### *You think you are answering a question. You are being read.*

A MERN-stack real-time social experiment where strangers around the world answer
one real human dilemma at the same instant — moral, emotional, existential — and
watch the crowd's answer reshape a shared, evolving portrait of who humanity is.

> You think you are answering about a hypothetical. You are not. The crowd is
> reading you — and it is becoming someone.

Every visitor, anywhere, sees the **same question at the same moment**. The server
owns the clock and the truth; clients only render what they're told. Answer, watch
the mirror's surface convulse as strangers pull it toward A or B, then watch the
verdict shift the collective heart — and the next question inherits it.

*(MIRROR shares its architecture with its sibling project PULSE, but its
fundamentals are different: real-life questions, a values-based profile, and an
emergent human character instead of a sci-fi world-state.)*

---

## ✨ What's inside

**The heartbeat** — a server-authoritative loop (one global clock), a synced
**20s answer → 5s reveal** cycle, live tally over Socket.io, and a reflective reveal.

**The mirror's surface** — a glowing canvas mind where every real answer fires a
synapse toward A or B; it convulses at 50/50 and blooms on a landslide.

**Real human questions** — drawn from moral philosophy (the trolley problem,
Heinz's dilemma), the psychology of intimacy (Aron's *36 Questions*), classic
thought experiments (Nozick's Experience Machine, Rawls' Veil of Ignorance), and
the deep "would you rather" tradition — spanning playful, deeply emotional, and
heavy/existential. Every option is **tagged with the values it expresses**, so
answering quietly reveals you.

**The mirror reads you** — after a few answers it names your **archetype**
(*The Romantic, The Stoic, The Rebel, The Caregiver, …*) from the values you keep
choosing, with a real rarity figure.

**The tribes** — souls cluster into **Hearts · Seekers · Rebels · Dreamers**,
locked in a live tug-of-war, with all-time standings.

**The face in the mirror** — the collective's four heart dimensions
(*warmth · honesty · daring · idealism*) drift with every verdict into a
measurable character, shown beside a branching record of how humanity answered.

**Inherited confessions** — some answers seal a message for the next soul: the
truth, or a comforting lie (you're never told which).

**"You weren't here"** — return after missing rounds and the mirror shows you an
answer strangers gave in your absence.

**Never an empty room** — ambient **bots** keep the mirror alive, answering among
themselves when no humans are around and blending in when they arrive.

**Hardened** — signed-session integrity, per-IP caps, a self-healing loop,
bounded memory, batched broadcasts, unit tests, CI, a Docker stack, and metrics.

---

## Architecture

```
React (Vite, :5174) ──HTTP / WebSocket──► Node + Express + Socket.io (:4001) ──► MongoDB
        ▲                                              │
        └───────────────── socket events ─────────────┘
```

| Layer        | Tool                                   |
|--------------|----------------------------------------|
| DB           | MongoDB (Mongoose)                     |
| Server       | Node + Express                         |
| Real-time    | Socket.io                              |
| Client       | React + Vite, Canvas/SVG mirror surface|
| Round timing | a single server-side game loop (the clock) |

### Socket events

| Event           | Dir | Payload                                          |
|-----------------|-----|--------------------------------------------------|
| `round:start`   | s→c | `{ roundNumber, question, endsAt, tally }`       |
| `vote:cast`     | c→s | `{ choice: 'A' \| 'B' }` — identity from cookie   |
| `tally:update`  | s→c | `{ A, B, dA, dB }` (batched; deltas drive synapses) |
| `round:resolve` | s→c | `{ result, tally, reflection, roundNumber }`     |
| `world:update`  | s→c | `{ worldState }` (heart, hope, chapter, tribes…) |
| `presence`      | s→c | `{ count }` (humans + ambient bots)              |
| `tribe:update`  | s→c | `{ tribes }` — live per-tribe A/B split          |
| `soul:hello`    | c→s | *(no payload)* — handshake; identity from cookie |
| `soul:state`    | s→c | the soul's profile (archetype, traits, streak)   |
| `absence`       | s→c | `{ roundNumber, result, reveal, sinceRound }`    |

### HTTP API

| Endpoint            | Purpose                                          |
|---------------------|--------------------------------------------------|
| `GET /api/session`  | Mint/refresh the signed, httpOnly session cookie |
| `GET /api/world`    | Current global reflection (heart, hope, chapter) |
| `GET /api/history`  | Recent answered questions                        |
| `GET /api/timeline` | Heart + chapter + the branching answer-record    |
| `GET /api/soul/:id` | A soul's archetype + traits + rarity             |
| `GET /api/metrics`  | Live analytics for the running experiment        |

---

## Getting started

**Prerequisites:** Node 18+ and a reachable MongoDB (local `mongod` or Atlas).

```bash
npm run install:all                 # root + server + client
cp server/.env.example server/.env  # edit MONGO_URI / SESSION_SECRET if needed
npm run dev
```

- Client → http://localhost:5174
- Server/API → http://localhost:4001

Open **two browser tabs**, answer in each (click or press **A** / **B**), and
watch the surface move, the reflection fall, and the collective heart shift.

> Distinct port (4001) and database (`mirror`) so MIRROR can run alongside its
> sibling PULSE without colliding. (Cookies are per-host, so the session cookie
> is named `mirror_sid`.)

## The questions

Curated real-life dilemmas + combinatorial "would you rather" templates live in
[server/game/dilemmaGen.js](server/game/dilemmaGen.js). Each option is tagged with
its pull on four heart dimensions — **warmth, honesty, daring, idealism** — which
both shapes the collective heart (the winning answer) and profiles each soul (the
answer it personally chose). An `LLM_API_KEY` seam is ready if you ever want a
model to author new questions; until then the curated engine is the only path.

## Profiling & integrity

A soul's archetype is the dominant dimension (and direction) of the values it has
chosen; its tribe is that dimension. Identity is **server-issued** (`GET
/api/session` → a signed, httpOnly cookie), and answers are attributed to the
cookie — never to client-sent data — with per-IP caps and rate limits.

## Tuning, tests, deploy

- Gameplay knobs (archetype reveal threshold, heart drift, chapters, milestones)
  live in [server/game/tuning.js](server/game/tuning.js).
- Tests: `npm --prefix server test` (Node's built-in runner). CI runs them on push.
- Deploy: `SESSION_SECRET=$(openssl rand -base64 48) docker compose up --build`
  (client → :8081, server → :4001). Run the server as a single instance (one
  authoritative loop); fan out sockets with the Redis adapter behind a leader.

## Project structure

```
mirror/
├── server/
│   ├── game/
│   │   ├── loop.js          # the heartbeat: ask / answer / resolve
│   │   ├── dilemmaGen.js     # the real-life question engine (value-tagged)
│   │   ├── consequences.js   # how an answer shifts the collective heart
│   │   ├── alignment.js      # archetypes + tribes from a soul's values
│   │   ├── personality.js    # heart-drift scale + chapters
│   │   ├── bots.js           # ambient reflections
│   │   └── tuning.js
│   ├── models/   Round, Vote, WorldState, Soul
│   ├── routes/stats.js, sockets/, auth.js, config.js, index.js
└── client/src/
    ├── App.jsx, hooks/useSocket.js, lib/ (session, alignments, collective)
    └── components/
        ├── WorldBrain.jsx       # the mirror's surface
        ├── Dilemma.jsx          # the question + countdown
        ├── Verdict.jsx          # the reflection reveal
        ├── Factions.jsx         # the tribe tug-of-war
        ├── MetaReveal.jsx       # the face in the mirror (heart + record)
        ├── AlignmentReveal.jsx  # "it has been reading me"
        ├── AbsenceReveal.jsx    # "you weren't here"
        └── MessageBanner.jsx    # the inherited confession
```
