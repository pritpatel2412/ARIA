# ARIA — Autonomous Real-time Intelligence Agent (SaaS)

A full-stack SaaS product where users sign in, choose an AI agent mode, speak or type a goal, autonomous agents research/act in parallel with live streaming, and the result is spoken aloud. Sessions are persisted to PostgreSQL.

## Architecture

### Frontend (`artifacts/aria/`)
- React + Vite + TypeScript
- Dark terminal aesthetic: colors `#0A0A0F` / `#00FF88` / `#F59E0B`
- Inter + JetBrains Mono fonts
- Pages:
  - `/` — Landing page (hero, features, how-it-works, pricing preview, CTA)
  - `/app` — Auth-protected dashboard with 6 agent modes
  - `/pricing` — Pricing page (Free/Pro/Team)
  - `/about` — About page
  - `/privacy` — Privacy policy
  - `/terms` — Terms of service
- Key components:
  - `VoiceInput` — mic button with waveform + text mode
  - `AgentTerminal` — live SSE log with typewriter effect
  - `TaskTimeline` — 5-step pipeline stepper
  - `ResultCard` — slide-up answer with Play/Copy
  - `Navbar` — global nav with auth state
  - `useARIA` hook — full SSE client state machine
  - `useUser` hook — auth state + login/logout
- Key components (new):
  - `ContentPublisher` — preview + 1-click publish to LinkedIn/Twitter with AI image generation
  - `ContentConnect` — social account OAuth connection panel
  - `AssistantConnect` — Google Calendar + Gmail integration panel
- 7 Agent modes in dashboard:
  1. Research Analyst — web research & synthesis
  2. Career Copilot — job search & auto-apply
  3. Money Agent — financial data & sentiment
  4. Form Executor — form filling automation
  5. Executive Assistant — scheduling & drafting
  6. Content Creator — content writing & publishing
  7. **Job Autopilot** — 3-step wizard (role/location/resume) → 6 parallel TinyFish agents apply to Indeed, LinkedIn external, Greenhouse ATS, Lever ATS, Naukri, Wellfound simultaneously → Application Campaign Report
  8. **Competitor Watch** — persistent dashboard to monitor competitor URLs (pricing/features/announcements/all); TinyFish extracts structured JSON, Groq detects semantic changes, stores diffs in `watchlist_changes` DB table; hourly scheduler auto-checks due items

### Backend (`artifacts/api-server/`)
- Express 5 + TypeScript, served at `/api`, port 8080
- Session management: express-session + connect-pg-simple (PostgreSQL store)
- Auth: Replit OIDC (openid-client v6)
- Key routes:
  - `GET /api/auth/login` — initiate OIDC login
  - `GET /api/auth/callback` — OIDC callback, creates/updates user in DB
  - `POST /api/auth/logout` — destroy session
  - `GET /api/auth/me` — current user info
  - `POST /api/orchestrate` — SSE stream of ARIA agent events
  - `GET /api/user/sessions` — user's agent session history
  - `POST /api/user/sessions` — save agent session to DB
  - `GET /api/healthz` — health check
- Library modules:
  - `groq.ts` — intent parsing via Groq LLaMA 3.3 70B (native fetch)
  - `tinyfish.ts` — web browsing via TinyFish API (with Groq simulation fallback)
  - `gemini.ts` — result synthesis via Gemini 2.0 Flash (with Groq fallback)
  - `orchestrator.ts` — parallel Promise.allSettled pipeline
  - `auth.ts` — OIDC client + user upsert + requireAuth middleware
  - `db.ts` — Drizzle ORM + pg pool

### Database (`lib/db/`)
- PostgreSQL via Drizzle ORM
- Tables:
  - `users` — id (Replit sub), email, name, username, profile_image, plan, query_count
  - `auth_sessions` — express-session store (connect-pg-simple)
  - `agent_sessions` — saved ARIA runs (goal, mode, answer, task/success counts)
  - `resumes` — uploaded resume files + parsed data
  - `job_applications` — auto-apply job records

## Pipeline Flow

```
User goal
  → Groq LLaMA 3.3 70B (intent parsing → 1-5 tasks)
  → TinyFish agents in parallel (web browsing)
      ↓ (if TinyFish unavailable, falls back to Groq simulation)
  → Gemini 2.0 Flash (synthesis)
      ↓ (if Gemini quota exceeded, falls back to Groq)
  → SSE stream → React UI → Web Speech TTS
  → Session saved to PostgreSQL (if user is authenticated)
```

## SSE Event Types
- `THINKING` — initial analysis / retry messages
- `PLAN_READY` — task list from Groq intent parser
- `NAVIGATING` — agent visiting a URL
- `EXTRACTING` — extracting data from page
- `COMPLETE` — individual task completed with result
- `TASK_DONE` — task finalized
- `ANSWER_READY` — final synthesized answer
- `ERROR` — error event
- `DONE` — stream closed

## API Keys Required
- `GROQ_API_KEY` — Groq LLaMA 3.3 70B
- `TINY_FISH_API_KEY` — TinyFish web browsing agents
- `GEMINI_API_KEY` — Google Gemini synthesis

## Important Notes
- **AI clients use native fetch** (no SDKs) to avoid esbuild bundling issues
- **openid-client v6** API: use `discovery()`, `buildAuthorizationUrl()`, `authorizationCodeGrant()`, `randomState()`, `randomNonce()`
- **TinyFish DNS blocked** in Replit dev — always falls back to Groq simulation
- **Gemini free tier** has rate limits — falls back to Groq for synthesis
- **Express 5** async routes: use `void promise.catch().finally()` pattern
- **pg, openid-client** are externalized in build.mjs
- **build.mjs** must have pg and openid-client in externals list

## Build System
- pnpm monorepo with workspace packages
- API server uses esbuild (build.mjs) to bundle to `dist/index.mjs`
- Database uses Drizzle Kit for schema push (`pnpm --filter @workspace/db run push-force`)

## Development
```bash
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/aria run dev
pnpm --filter @workspace/db run push-force
```
