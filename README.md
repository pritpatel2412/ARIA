# ARIA — Autonomous Real-time Intelligence Agent

> **Built for the TinyFish Hackathon.** ARIA is a full-stack AI agent SaaS platform where users sign in, choose one of 8 autonomous agent modes, speak or type a goal in any of 11 Indian languages, and watch real browser agents work in parallel — then receive a synthesised, spoken-aloud answer. All powered by TinyFish real web browsing, Groq LLaMA, and Gemini 2.0.

---

<div align="center">

| 🌐 Real Web Browsing | 🎙️ Multilingual Voice | 🤖 8 Agent Modes | 💡 Dual Theme | ⚡ Parallel Agents |
|:---:|:---:|:---:|:---:|:---:|
| TinyFish browser agents | 11 Indian languages via Sarvam AI | Research · Career · Money · Forms · Assistant · Content · Job Autopilot · Competitor Watch | Dark/Green ↔ Purple | Up to 6 concurrent TinyFish sessions |

</div>

---

## Table of Contents

1. [What ARIA Does](#what-aria-does)
2. [8 Agent Modes](#8-agent-modes)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Project Structure](#project-structure)
6. [Environment Variables](#environment-variables)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [End-to-End Flow](#end-to-end-flow)
10. [Voice & Multilingual System](#voice--multilingual-system)
11. [TinyFish Dual-Key Fallback Strategy](#tinyfish-dual-key-fallback-strategy)
12. [Dual-Theme System](#dual-theme-system)
13. [Development](#development)
14. [Deployment](#deployment)

---

## What ARIA Does

ARIA is an agentic AI platform — not a chatbot. When you give it a goal, it:

1. **Parses your intent** with Groq LLaMA 3.3 70B into 1–6 parallel sub-tasks
2. **Spins up real browser agents** via TinyFish — each navigating a live website simultaneously
3. **Extracts structured data** from pricing pages, job boards, news sites, financial dashboards
4. **Synthesises** all results into a coherent answer via Gemini 2.0 Flash
5. **Reads the answer aloud** in your chosen language using Sarvam AI TTS
6. **Saves everything** to PostgreSQL — full session history, resumes, watchlist changes

The key differentiator: **real browsers, real pages, real data** — no hallucination, no stale training data.

---

## 8 Agent Modes

### 1. Research Analyst 🔍
Multi-source deep research with mandatory source citations. Spawns 3–5 TinyFish agents in parallel to browse different sources, then synthesises a markdown report with clickable links.

> *"Compare the free plans of Notion, Trello, and Asana"*
> *"What are analysts saying about AI agent stocks today?"*
> *"Find the top 3 GitHub repos for AI agents and summarise each"*

### 2. Career Copilot 💼
Upload your resume (PDF/DOCX), and ARIA parses it with Gemini. Then search for jobs, get match scores, draft cover letters, and track applications — all with live job board data.

> *"Find Senior React Developer jobs in Bangalore posted this week"*
> *"Write a cover letter for a Product Manager role at Stripe"*
> *"Compare salary ranges for Staff Engineer at Google vs Meta"*

### 3. Money Agent 💰
Real-time financial intelligence. Pulls live stock prices, analyst ratings, ETF comparisons, and savings account rates from live financial sites via TinyFish.

> *"Should I invest in Bitcoin this week? Give me a buy/hold/sell signal"*
> *"Compare ETF fees and returns for VOO, VTI, and VXUS"*
> *"What are analysts saying about NVIDIA stock today?"*

### 4. Form Executor ⚡
Fills and submits real web forms autonomously using your saved profile (name, email, phone, social links). Register for hackathons, apply to programs, sign up for waitlists.

> *"Register me for the next major AI hackathon"*
> *"Apply to Y Combinator's next batch with my details"*
> *"Find 3 open AI research internships and apply to each"*

### 5. Executive Assistant 📅
Google Calendar + Gmail integrated. Drafts emails, schedules meetings, summarises your inbox, and manages your workday. Connects to live Google data via OAuth.

> *"Draft a follow-up email to a client I met at a conference"*
> *"Schedule a 30-minute team sync next Tuesday at 2pm"*
> *"Summarise my inbox and flag the 3 most urgent emails"*

### 6. Content Creator ✍️
Research trends, draft posts, and publish directly to LinkedIn and Twitter/X. Generates images with Gemini. Full social media workflow end-to-end.

> *"Write a LinkedIn post about the future of AI agents"*
> *"Create a Twitter/X thread about productivity with AI tools"*
> *"Draft 5 Instagram captions for a tech startup launch"*

### 7. Job Autopilot 🚀
**The crown jewel.** A 3-step wizard collects your job preferences, then simultaneously deploys 6 TinyFish browser agents across major job platforms — all applying in parallel.

**Platforms targeted simultaneously:**
- Indeed (direct apply)
- LinkedIn (Easy Apply)
- Greenhouse ATS
- Lever ATS
- Naukri.com
- Wellfound (AngelList)

Returns a colour-coded **Application Campaign Report** with per-platform status, applied job URLs, and success/failure badges.

### 8. Competitor Watch 👁️
Persistent intelligence dashboard. Monitor any competitor's pricing page, features page, or blog. TinyFish extracts structured JSON, Groq detects semantic changes, and you get instant alerts with severity ratings.

**Watch types:**
- 💰 **Pricing** — detect price increases, plan additions/removals, new tiers
- ⚡ **Features** — track new capabilities, integrations, beta releases
- 📢 **Announcements** — monitor blog posts, changelogs, press releases
- 🔍 **Full Intelligence** — all of the above in one sweep

**Change severity:** Critical (price hike) → High (major new feature) → Medium (new tier) → Low (copy edit)

**Scheduling:** Hourly / Daily / Weekly — automatic TinyFish checks run on a server-side scheduler.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, TypeScript | App shell, routing, state |
| **Styling** | TailwindCSS 4, Framer Motion | UI, animations, transitions |
| **Backend** | Express 5, TypeScript, esbuild | API server, session management |
| **Database** | PostgreSQL, Drizzle ORM | Persistent storage, migrations |
| **Auth** | Replit OIDC (openid-client v6) | Passwordless sign-in |
| **AI — Browsing** | TinyFish web agents | Real browser, real pages |
| **AI — Parsing** | Groq LLaMA 3.3 70B | Intent parsing, change detection |
| **AI — Synthesis** | Google Gemini 2.0 Flash | Answer synthesis, resume parsing |
| **AI — Voice I/O** | Sarvam AI (`bulbul:v2`) | Multilingual TTS (11 Indian languages) |
| **Voice Input** | Web Speech API | Microphone → transcript |
| **Monorepo** | pnpm workspaces | Shared packages, build tooling |

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════════════╗
║                          ARIA ARCHITECTURE                                ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────┐
│                        Browser  (React + Vite)                           │
│                                                                           │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Landing  │  │  Pricing  │  │    About     │  │   /app (authed)  │   │
│  └──────────┘  └───────────┘  └──────────────┘  └────────┬─────────┘   │
│                                                            │             │
│         8 Agent Modes (sidebar)                            │             │
│  ┌─────────────────────────────────────┐          ┌───────▼────────┐    │
│  │ Research · Career · Money · Forms   │──select──▶│ AppDashboard   │    │
│  │ Assistant · Content · Job Autopilot │          │  useARIA hook  │    │
│  │ Competitor Watch                    │          └───────┬────────┘    │
│  └─────────────────────────────────────┘                  │             │
│                                                            │             │
│  ┌─────────────────────────────────────────────────────────┤             │
│  │ VoiceInput ─► Web Speech API    Sarvam TTS ◄─ answer   │             │
│  │ (11 langs)    transcript         (spoken aloud)          │             │
│  └──────────────────────────────────────────────────────────┘             │
│                                                            │             │
│  UI Components:  AgentTerminal  TaskTimeline  BrowserPreview ResultCard  │
│                  WatchlistPanel  JobApplyForm  ContentPublisher           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    POST /api/orchestrate  { goal, mode }
                    GET  /api/orchestrate/poll/:id?after=N
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Express API Server  (port 8080)                     │
│                                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  /api/auth  │  │ /api/        │  │ /api/user  │  │ /api/watchlist│  │
│  │ OIDC login  │  │ orchestrate  │  │  sessions  │  │  CRUD + check │  │
│  │ callback    │  │ poll events  │  │  resumes   │  │  scheduled    │  │
│  │ logout / me │  │              │  │  job apps  │  │  checks       │  │
│  └─────────────┘  └──────┬───────┘  └────────────┘  └───────────────┘  │
│                           │                                               │
│              ┌────────────▼────────────────────────────────┐            │
│              │           orchestrator.ts                    │            │
│              │                                              │            │
│              │  1. Groq LLaMA 3.3 70B ──► parseIntent()    │            │
│              │     Returns: 1–6 tasks with URLs + sub-goals │            │
│              │     Emits: THINKING → PLAN_READY             │            │
│              │                                              │            │
│              │  2. TinyFish × N tasks (Promise.allSettled)  │            │
│              │     ┌────────────────────────────────────┐   │            │
│              │     │  Primary key (TINY_FISH_API_KEY)   │   │            │
│              │     │    ↓ if 402/429/credit error        │   │            │
│              │     │  Fallback key (TINYFISH_API_KEY)   │   │            │
│              │     │    ↓ if both exhausted              │   │            │
│              │     │  Groq 7-step simulation             │   │            │
│              │     └────────────────────────────────────┘   │            │
│              │     Each task emits: NAVIGATING → EXTRACTING │            │
│              │     → COMPLETE (with result JSON + screenshot)│            │
│              │                                              │            │
│              │  3. Gemini 2.0 Flash ──► synthesiseResults() │            │
│              │     Mode-specific prompts, 4000 token limit   │            │
│              │     Mandatory 5–10 source links in output     │            │
│              │     ↓ if quota exceeded: Groq synthesis       │            │
│              │     Emits: ANSWER_READY → DONE               │            │
│              └──────────────────────────────────────────────┘            │
│                                                                           │
│  Special flows:                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Job Autopilot: JOB_APPLY_V1:: goal → createJobApplyTaskPlan()   │   │
│  │   6 parallel TinyFish agents → Indeed/LinkedIn/Greenhouse/Lever/ │   │
│  │   Naukri/Wellfound → Application Campaign Report                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Competitor Watch: TinyFish JSON extraction → Groq diff analysis  │   │
│  │   → watchlist_changes table → hourly scheduler                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────┬──────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PostgreSQL  (Drizzle ORM)                           │
│                                                                           │
│  users · auth_sessions · agent_sessions · resumes · job_applications    │
│  social_accounts · content_posts · watchlist_items · watchlist_changes  │
└─────────────────────────────────────────────────────────────────────────┘
                                            │
                        ┌───────────────────┼────────────────────┐
                        ▼                   ▼                    ▼
              ┌─────────────┐    ┌──────────────────┐  ┌────────────────┐
              │  Groq API   │    │  TinyFish API    │  │  Gemini API    │
              │  LLaMA 3.3  │    │  Real browser    │  │  2.0 Flash     │
              │  70B        │    │  automation      │  │                │
              └─────────────┘    └──────────────────┘  └────────────────┘
                                            │
                              ┌─────────────┘
                              ▼
                   ┌──────────────────┐
                   │   Sarvam AI      │
                   │   bulbul:v2 TTS  │
                   │   11 languages   │
                   └──────────────────┘
```

---

## Project Structure

```
aria/
├── artifacts/
│   ├── api-server/                  # Express 5 backend
│   │   └── src/
│   │       ├── app.ts               # Express setup, CORS, sessions
│   │       ├── index.ts             # Server entry + hourly scheduler
│   │       ├── routes/
│   │       │   ├── auth.ts          # OIDC login / callback / logout / me
│   │       │   ├── orchestrate.ts   # POST start + GET poll (event store)
│   │       │   ├── tts.ts           # Sarvam AI TTS proxy
│   │       │   ├── user.ts          # Session history, profile
│   │       │   ├── resume.ts        # Upload + Gemini parse
│   │       │   ├── sessions.ts      # Agent session CRUD
│   │       │   ├── assistant.ts     # Google Calendar/Gmail integration
│   │       │   ├── content.ts       # Social OAuth + publish
│   │       │   └── watchlist.ts     # Competitor Watch CRUD + async check
│   │       └── lib/
│   │           ├── aria/
│   │           │   ├── orchestrator.ts      # Parallel task runner
│   │           │   ├── tinyfish.ts          # TinyFish client, dual-key fallback
│   │           │   ├── groq.ts              # Intent parsing, mode prompts
│   │           │   ├── gemini.ts            # Synthesis + resume parsing
│   │           │   ├── watchlistChecker.ts  # TinyFish extraction + Groq diff
│   │           │   ├── jobApply.ts          # 6-platform job apply task plan
│   │           │   └── resumeParser.ts      # PDF/DOCX → structured JSON
│   │           ├── auth.ts          # OIDC client + requireAuth middleware
│   │           ├── db.ts            # Drizzle db instance
│   │           ├── googleCalendar.ts
│   │           └── googleGmail.ts
│   │
│   └── aria/                        # React 19 frontend
│       └── src/
│           ├── pages/
│           │   ├── Landing.tsx      # Hero with Lightning WebGL animation
│           │   ├── AppDashboard.tsx # Main /app — 8 modes, sidebar, voice
│           │   ├── Pricing.tsx
│           │   ├── About.tsx
│           │   ├── Privacy.tsx
│           │   └── Terms.tsx
│           ├── components/
│           │   ├── Navbar.tsx
│           │   ├── VoiceInput.tsx         # Web Speech API mic input
│           │   ├── AgentTerminal.tsx      # Typewriter event stream
│           │   ├── TaskTimeline.tsx       # 5-step pipeline visualiser
│           │   ├── BrowserPreview.tsx     # Live TinyFish screenshot viewer
│           │   ├── ResultCard.tsx         # react-markdown answer renderer
│           │   ├── WatchlistPanel.tsx     # Competitor Watch dashboard
│           │   ├── JobApplyForm.tsx       # 3-step Job Autopilot wizard
│           │   ├── ContentPublisher.tsx   # Social post publish UI
│           │   ├── AssistantConnect.tsx   # Google OAuth connect
│           │   ├── ContentConnect.tsx     # LinkedIn/Twitter connect
│           │   ├── FormProfile.tsx        # Saved form-fill profile
│           │   └── ResumeUpload.tsx       # PDF/DOCX upload
│           ├── context/
│           │   └── ThemeContext.tsx       # Dark/Green ↔ Purple theme
│           ├── hooks/
│           │   ├── useARIA.ts             # Main polling state machine
│           │   └── useUser.ts             # Auth state
│           └── lib/
│               └── api.ts                 # Full typed API client
│
├── lib/
│   └── db/                          # Drizzle ORM
│       ├── src/
│       │   ├── index.ts             # db export + pool
│       │   └── schema/
│       │       ├── index.ts         # Re-exports all tables
│       │       ├── users.ts         # users, auth_sessions, agent_sessions,
│       │       │                    # resumes, job_applications,
│       │       │                    # social_accounts, content_posts
│       │       └── watchlist.ts     # watchlist_items, watchlist_changes
│       └── drizzle.config.ts
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Auto | PostgreSQL connection string (Replit sets this) |
| `SESSION_SECRET` | Yes | Random 64-char string for cookie signing |
| `GROQ_API_KEY` | Yes | [console.groq.com](https://console.groq.com) — parsing + change detection |
| `TINY_FISH_API_KEY` | Yes | **Primary** TinyFish key — real web browsing |
| `TINYFISH_API_KEY` | Yes | **Fallback** TinyFish key — activates when primary is exhausted |
| `GEMINI_API_KEY` | Yes | [aistudio.google.com](https://aistudio.google.com) — synthesis + resume parsing |
| `SARVAM_API_KEY` | Yes | [sarvam.ai](https://sarvam.ai) — multilingual TTS |
| `LINKEDIN_CLIENT_ID` | Optional | LinkedIn OAuth (Content Creator publishing) |
| `LINKEDIN_CLIENT_SECRET` | Optional | LinkedIn OAuth secret |
| `TWITTER_CLIENT_ID` | Optional | Twitter/X OAuth |
| `TWITTER_CLIENT_SECRET` | Optional | Twitter/X OAuth secret |
| `PORT` | Auto | Server port (Replit assigns automatically) |
| `NODE_ENV` | Auto | `development` \| `production` |

---

## Database Schema

```sql
-- Core identity
users (
  id TEXT PRIMARY KEY,           -- Replit sub claim
  email TEXT UNIQUE,
  name TEXT,
  username TEXT UNIQUE,
  profile_image TEXT,
  plan TEXT DEFAULT 'free',      -- free | pro | team
  query_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Express session store (connect-pg-simple)
auth_sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire TIMESTAMP NOT NULL
)

-- Every ARIA agent run
agent_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT → users.id,
  goal TEXT NOT NULL,
  mode TEXT NOT NULL,            -- research | career | money | forms |
                                 -- assistant | content | job-apply | competitor-watch
  answer TEXT,
  task_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  metadata TEXT,                 -- JSON: screenshots, sources
  created_at TIMESTAMP
)

-- Career Copilot — uploaded resumes
resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT → users.id,
  filename TEXT NOT NULL,
  parsed_data TEXT,              -- Gemini-extracted JSON
  uploaded_at TIMESTAMP,
  active BOOLEAN DEFAULT true
)

-- Career Copilot — tracked applications
job_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT → users.id,
  resume_id TEXT → resumes.id,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT,
  status TEXT DEFAULT 'pending', -- pending | applied | rejected | interview
  match_score INTEGER,
  cover_letter TEXT,
  applied_at TIMESTAMP,
  created_at TIMESTAMP
)

-- Content Creator — social accounts
social_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT → users.id,
  platform TEXT NOT NULL,        -- linkedin | twitter
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  platform_user_id TEXT,
  platform_username TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Content Creator — published posts
content_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT → users.id,
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  platform_post_id TEXT,
  status TEXT DEFAULT 'draft',   -- draft | published
  published_at TIMESTAMP
)

-- Competitor Watch — monitored URLs
watchlist_items (
  id TEXT PRIMARY KEY,
  user_id TEXT → users.id,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  watch_type TEXT DEFAULT 'all', -- pricing | features | announcements | all
  check_frequency TEXT DEFAULT 'daily', -- hourly | daily | weekly
  last_checked_at TIMESTAMP,
  next_check_at TIMESTAMP,
  last_content TEXT,             -- JSON snapshot from last TinyFish extraction
  last_screenshot TEXT,          -- Base64 screenshot
  change_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending | checking | active | error
  created_at TIMESTAMP
)

-- Competitor Watch — detected changes
watchlist_changes (
  id TEXT PRIMARY KEY,
  watchlist_item_id TEXT → watchlist_items.id,
  user_id TEXT → users.id,
  detected_at TIMESTAMP,
  change_type TEXT,              -- price_change | plan_added | plan_removed |
                                 -- feature_added | feature_removed |
                                 -- announcement | content_change
  change_title TEXT NOT NULL,
  change_description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  severity TEXT DEFAULT 'medium',-- critical | high | medium | low
  screenshot TEXT
)
```

---

## API Reference

### Auth

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/login` | Initiates Replit OIDC login flow |
| `GET` | `/api/auth/callback` | OIDC callback — sets session cookie, upserts user |
| `POST` | `/api/auth/logout` | Destroys session |
| `GET` | `/api/auth/me` | Returns current user object or `401` |

### Orchestration (Polling Architecture)

> ARIA uses polling, not SSE — Replit's proxy buffers SSE streams, so events are stored server-side and the client polls every 400ms.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/orchestrate` | Required | Starts an agent run; returns `{ sessionId }` immediately |
| `GET` | `/api/orchestrate/poll/:id?after=N` | Required | Returns events after index N; `done: true` when finished |

**Request** (`POST /api/orchestrate`):
```json
{
  "goal": "Compare the free plans of Notion, Trello, and Asana",
  "mode": "research",
  "language": "en-IN"
}
```

**Poll response** (`GET /api/orchestrate/poll/:id?after=0`):
```json
{
  "events": [
    { "type": "THINKING",    "message": "Analyzing your goal...",       "taskId": null },
    { "type": "PLAN_READY",  "message": "Plan ready: 3 tasks",          "taskId": null },
    { "type": "NAVIGATING",  "message": "Navigating to notion.so",      "taskId": "t1" },
    { "type": "EXTRACTING",  "message": "Extracting pricing data...",   "taskId": "t1" },
    { "type": "COMPLETE",    "message": "Notion free: 5MB storage...",  "taskId": "t1", "resultJson": {...} },
    { "type": "ANSWER_READY","message": "## Pricing Comparison\n...",    "taskId": null },
    { "type": "DONE",        "message": "",                             "taskId": null }
  ],
  "total": 7,
  "done": true
}
```

### Text-to-Speech

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/tts` | Required | Sarvam AI synthesis → returns `{ audioBase64, mimeType }` |

```json
{ "text": "Here is what I found...", "language": "hi-IN" }
```

### Session History

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/user/sessions` | Required | Last 20 ARIA runs for current user |
| `POST` | `/api/user/sessions` | Required | Save completed run |
| `GET` | `/api/resume` | Required | List uploaded resumes |
| `POST` | `/api/resume/parse` | Required | Upload + Gemini-parse a resume |

### Competitor Watch

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/watchlist` | Required | List all monitored competitors with recent changes |
| `POST` | `/api/watchlist` | Required | Add a new competitor to monitor |
| `DELETE` | `/api/watchlist/:id` | Required | Remove a competitor |
| `POST` | `/api/watchlist/:id/check` | Required | Trigger immediate TinyFish check (async) |
| `GET` | `/api/watchlist/:id/changes` | Required | Full change history for a competitor |

### Social Publishing

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/content/publish` | Required | Publish post to LinkedIn or Twitter/X |
| `GET` | `/api/content/analytics` | Required | Published post stats |
| `POST` | `/api/content/generate-image` | Required | Gemini image generation |

### Utilities

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/healthz` | `{ ok: true }` |

---

## End-to-End Flow

```
1. USER ARRIVES AT /app
   └─ useUser() → GET /api/auth/me
      ├─ 401 → Sign-in gate (Replit OIDC)
      └─ 200 → AppDashboard loads

2. USER PICKS A MODE + SUBMITS A GOAL
   ├─ VoiceInput: Web Speech API → transcript
   │   ├─ Language selector: 11 options (Hindi, Tamil, Bengali, etc.)
   │   └─ Sarvam `bulbul:v2` reads answer aloud when done
   └─ useARIA.submit(goal, mode, language)
      └─ POST /api/orchestrate → { sessionId } (immediate)

3. SERVER RUNS ORCHESTRATION (orchestrator.ts)
   │
   ├── STEP 1: Intent Parsing
   │   Groq LLaMA 3.3 70B → parseIntent(goal, mode)
   │   Returns: Task[] — each with { taskId, url, goal, expectedOutputType }
   │   Emits: THINKING → PLAN_READY
   │   Special cases:
   │   • Job Autopilot: JOB_APPLY_V1:: prefix → createJobApplyTaskPlan()
   │   • Competitor Watch: bypasses this — handled by watchlist routes
   │
   ├── STEP 2: Parallel TinyFish Execution
   │   Promise.allSettled(tasks.map(runAgentTask))
   │   Each task:
   │     getActiveKey()   ← primary or fallback (auto-switched on 402/429)
   │     fetch(TINYFISH_ENDPOINT, { goal, url })
   │       ├─ 200 → SSE stream parsed → NAVIGATING → EXTRACTING → COMPLETE
   │       ├─ 402/429/credit error → switchToFallback() → retry with key 2
   │       └─ both exhausted → Groq 7-step simulation
   │
   └── STEP 3: Synthesis
       Gemini 2.0 Flash → synthesiseResults(taskResults, mode)
       Mode-specific prompts:
         research  → markdown report + 5–10 clickable source links
         career    → job listings with apply buttons
         money     → buy/hold/sell signals with data citations
         forms     → confirmation + next steps
         assistant → email draft / calendar event in markdown
         content   → structured JSON { post, hashtags, imagePrompt }
         job-apply → Application Campaign Report with per-platform badges
       Emits: ANSWER_READY → DONE
       Fallback: Groq synthesis if Gemini quota exceeded

4. CLIENT POLLS + RENDERS
   useARIA.ts: every 400ms → GET /api/orchestrate/poll/:id?after=N
   New events replayed one-by-one (120ms delay for typewriter effect):
     AgentTerminal  — live event stream
     TaskTimeline   — 5-step pipeline indicator
     BrowserPreview — TinyFish screenshot + URL
     ResultCard     — react-markdown with remark-gfm

5. ANSWER DELIVERED
   ├─ ResultCard renders markdown (headings, links, tables, code)
   ├─ Sarvam AI reads answer aloud (POST /api/tts)
   └─ POST /api/user/sessions → saved to PostgreSQL

6. COMPETITOR WATCH (separate async flow)
   User adds URL → POST /api/watchlist
   User clicks "Check Now" → POST /api/watchlist/:id/check
     └─ Server responds immediately (202-style)
     └─ setImmediate: TinyFish extracts JSON → Groq diffs vs. lastContent
        └─ changes detected → INSERT watchlist_changes
        └─ UPDATE watchlist_items { lastContent, lastCheckedAt, nextCheckAt }
   Hourly scheduler: setInterval(60min) → runScheduledChecks()
     → checks all items where nextCheckAt <= NOW()
```

---

## Voice & Multilingual System

ARIA supports two-way voice interaction with 11 Indian languages:

### Input — Web Speech API
```
Browser mic → SpeechRecognition API → transcript → submitted as goal
Language: set via selector → passed as `lang` attribute to SpeechRecognition
```

### Output — Sarvam AI TTS (`bulbul:v2`)
```
Answer text → POST /api/tts → Sarvam API (bulbul:v2 model)
→ Base64 audio → decoded → Web Audio API → spoken aloud
```

### Supported Languages

| Code | Language | Speaker |
|---|---|---|
| `en-IN` | English (India) | `anushka` |
| `hi-IN` | Hindi | `abhilash` |
| `ta-IN` | Tamil | `manisha` |
| `te-IN` | Telugu | `vidya` |
| `bn-IN` | Bengali | `anushka` |
| `mr-IN` | Marathi | `arya` |
| `gu-IN` | Gujarati | `karun` |
| `kn-IN` | Kannada | `hitesh` |
| `ml-IN` | Malayalam | `manisha` |
| `pa-IN` | Punjabi | `abhilash` |
| `or-IN` | Odia | `anushka` |

---

## TinyFish Dual-Key Fallback Strategy

ARIA uses two TinyFish API keys in sequence, with automatic fallback:

```
Every TinyFish request:
  ┌─────────────────────────────────────────────────────────────┐
  │  getActiveKey()                                             │
  │    ├─ Initially: TINY_FISH_API_KEY (primary)                │
  │    └─ After switchToFallback(): TINYFISH_API_KEY (backup)   │
  └─────────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │  attemptWithKey(apiKey) │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   HTTP 200?             │
              │   ├─ YES → SSE stream  │
              │   └─ NO  → isCreditError(status, body)?
              │              ├─ YES (402/429/credit/quota/limit)
              │              │    └─ switchToFallback()
              │              │         ├─ backup key available?
              │              │         │    └─ YES → retry once
              │              │         └─ both exhausted?
              │              │              └─ Groq 7-step simulation
              │              └─ NO (network/500/timeout)
              │                   └─ Groq 7-step simulation
              └─────────────────────────┘

Groq simulation emits the same event types as TinyFish:
  NAVIGATING → EXTRACTING → COMPLETE
  The UI cannot distinguish real from simulated.

Once primary key is detected as exhausted, _activeKey switches
to the fallback permanently for the remainder of the server process.
```

---

## Dual-Theme System

Toggle between themes using the button in the top-right navbar:

| Theme | Primary | Background | Secondary |
|---|---|---|---|
| **Dark / Green** (default) | `#00FF88` (hue 151°) | `#0A0A0F` | `#A855F7` |
| **Purple** | `#A855F7` (hue 280°) | `#080010` | `#00FF88` |

All components consume theme values from `ThemeContext` — zero hardcoded colours in UI files:

```tsx
import { useTheme } from "@/context/ThemeContext";
const { colors } = useTheme();

// Solid
style={{ color: colors.primary }}

// Translucent
style={{ background: `rgba(${colors.primaryRgb}, 0.12)` }}

// Border
style={{ borderColor: `rgba(${colors.primaryRgb}, 0.3)` }}
```

---

## Development

**Prerequisites:** Node 20+, pnpm 9+, PostgreSQL

```bash
# 1. Install all workspace dependencies
pnpm install

# 2. Push DB schema (creates all 9 tables)
pnpm --filter @workspace/db run push-force

# 3. Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# 4. Start React frontend (port from $PORT)
pnpm --filter @workspace/aria run dev
```

**Required secrets** (add to `.env` or Replit Secrets):
```
DATABASE_URL=postgresql://...
SESSION_SECRET=<64 random chars>
GROQ_API_KEY=gsk_...
TINY_FISH_API_KEY=sk-tinyfish-...      # Primary browsing key
TINYFISH_API_KEY=sk-tinyfish-...       # Fallback browsing key
GEMINI_API_KEY=AIza...
SARVAM_API_KEY=...
```

---

## Deployment

ARIA is designed for **Replit Deployments** — one-click, zero config:

1. Click **Deploy** in the Replit workspace
2. Replit provisions PostgreSQL, sets `DATABASE_URL`, assigns a `.replit.app` domain
3. Set `SESSION_SECRET`, `GROQ_API_KEY`, `TINY_FISH_API_KEY`, `TINYFISH_API_KEY`, `GEMINI_API_KEY`, and `SARVAM_API_KEY` in **Secrets**
4. The app is live — auth, database, voice, and all 8 AI modes work immediately

### Custom Domain
Add a custom domain in Replit Deployment settings → DNS panel.

### Production Notes
- Session store is PostgreSQL (`auth_sessions` table) — survives restarts
- TinyFish dual-key fallback works in production identically to development
- Competitor Watch hourly scheduler starts automatically with the server process
- All secrets are environment variables — rotate by updating Replit Secrets and restarting

---

<div align="center">

**Built with TinyFish real browser automation · Groq LLaMA 3.3 70B · Google Gemini 2.0 · Sarvam AI multilingual voice**

*ARIA — Because your AI should actually browse the web.*

</div>
