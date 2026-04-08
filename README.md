<p align="center">
  <h1 align="center">🕵️ ARIA v2.0</h1>
  <p align="center"><strong>Autonomous Vision-Enabled Agentic Platform for Web Research & Competitive Intelligence</strong></p>
  <p align="center">Decompose complex queries into parallel browser agents. Get real answers, not hallucinations.</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/Gemini-1.5_Pro-blue?style=flat-square&logo=google" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" />
</p>

---

## What is ARIA?

ARIA is not a chatbot. It's an **autonomous multi-agent system** that browses the real web in parallel to answer complex research and competitive intelligence queries.

When you give ARIA a goal, it:
1. **Decomposes** your query into 1–6 parallel sub-tasks using Groq LLaMA 3.3
2. **Spawns real browser agents** — each navigating live websites simultaneously
3. **Extracts structured data** from pricing pages, job boards, news sites, financial dashboards
4. **Synthesises** all results via Gemini 1.5 Pro into a coherent report
5. **Saves everything** to PostgreSQL — full session history, resume profiles, watchlists

The key differentiator: **real browsers, real pages, real-time data** — no hallucination, no stale training data.

---

## 8 Agent Modes

| Mode | What It Does |
|------|-------------|
| 🔍 **Research Analyst** | Multi-source deep research with source citations |
| 💼 **Career Copilot** | Resume parsing + live job search + cover letter generation |
| 💰 **Money Agent** | Real-time stock prices, analyst ratings, ETF comparisons |
| ⚡ **Form Executor** | Autonomously fills and submits real web forms |
| 🤖 **Assistant** | General-purpose browser-powered AI assistant |
| 📝 **Content Agent** | Research-backed content generation with live sources |
| 🎯 **Job Autopilot** | Discovers and applies to jobs automatically |
| 👁️ **Competitor Watch** | Monitors competitor pricing and product changes |

---

## Key Technical Highlights

### 🦾 Swarm Architecture
- Decentralized multi-agent design — agents run in parallel, not sequence
- Each agent has its own browser session, task scope, and result stream
- SSE-based real-time streaming — watch agents work live

### 👁️ Visual Delta Analysis
- Multimodal AI detects semantic changes in websites via screenshot comparison
- Bounding box localization of changed elements
- Used for competitor monitoring and content change detection

### 👤 Ghost Executive
- Autonomous career agent that parses resumes into structured profiles
- Performs intelligent job discovery and form automation
- Supports 11 Indian languages via Sarvam AI (voice input + TTS output)

### 🌐 Stealth Browser Automation
- Real-time browser automation with stealth profiles
- Reliable navigation across dynamic and JS-heavy sites
- Handles anti-bot protection via profile rotation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| LLM (Planning) | Groq LLaMA 3.3 70B (ultra-fast inference) |
| LLM (Vision/OCR) | Gemini 1.5 Pro |
| Browser Automation | TinyFish real browser agents + SSE streaming |
| Voice | Sarvam AI (11 Indian languages, TTS + STT) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |

---

## Architecture

```
User Goal (text or voice)
        │
        ▼
  Groq LLaMA 3.3 (Intent Parsing + Task Decomposition)
        │
        ▼
  ┌─────────────────────────────────┐
  │      Agent Swarm (parallel)      │
  │  Agent 1 │ Agent 2 │ Agent 3    │
  │  Browser │ Browser │ Browser    │
  └─────────────────────────────────┘
        │
        ▼
  Gemini 1.5 Pro (Synthesis + Vision)
        │
        ▼
  Structured Report + Voice Output (Sarvam AI)
        │
        ▼
  Supabase PostgreSQL (Session History)
```

---

## Getting Started

```bash
git clone https://github.com/pritpatel2412/ARIA
cd ARIA
pnpm install
cp .env.example .env  # Add your API keys
pnpm dev
```

**Required env vars:** `GROQ_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SARVAM_API_KEY`

---

## Built By

**Prit Patel** — B.Tech CSE @ CHARUSAT University
[GitHub](https://github.com/pritpatel2412) · [LinkedIn](https://linkedin.com/in/pritpatel2412)
