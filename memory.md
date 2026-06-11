# Project Memory & System Architecture

## 🏗️ Core Architecture & System Flow

### System Design
**Dual-Agent Microservice + Next.js Dashboard** — The system consists of two independent Python voice agents (inbound & outbound) that communicate via LiveKit's real-time infrastructure, orchestrated by a Next.js 16 dashboard. Configuration is bridged through a shared JSON file (`data/agent_config.json`).

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Voice Agents** | Python 3.x, LiveKit Agents SDK (≥0.8.0), LiveKit API (≥0.6.0) |
| **STT (Speech-to-Text)** | Deepgram Nova-2 |
| **TTS (Text-to-Speech)** | Sarvam AI (Bulbul v2 — Indian voices), Cartesia (Sonic-2), Deepgram Aura, OpenAI TTS-1 |
| **LLM** | Groq (Llama 3.3 70B Versatile) via OpenAI-compatible API |
| **VAD (Voice Activity Detection)** | Silero VAD (pre-loaded at startup) |
| **Telephony / SIP** | Vobiz SIP Trunking (outbound + inbound) |
| **Dashboard** | Next.js 16, React 19, TypeScript, TailwindCSS 4, Framer Motion |
| **UI Components** | React Aria, Lucide Icons, Recharts, react-globe.gl |
| **AI Copilot** | Groq SDK + Vercel AI SDK (in-dashboard chat) |
| **Auth** | Google OAuth (Gmail integration for contacts) |
| **Data Storage** | JSON files (`data/agent_config.json`, `data/call_logs.json`, `data/workflows.json`), CSV (`data/leads.csv`) |
| **Noise Cancellation** | LiveKit BVC Telephony plugin |

### Data Flow
```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Dashboard (Next.js)                                                    │
│    ├─ User configures agent → POST /api/agent-config                   │
│    │   └─ Writes to data/agent_config.json                             │
│    ├─ User initiates call → POST /api/dispatch                         │
│    │   └─ LiveKit API → creates room + dispatches agent                │
│    ├─ User views logs → GET /api/leads, /api/recordings                │
│    │   └─ Reads from data/call_logs.json, data/leads.csv               │
│    └─ Copilot chat → POST /api/copilot                                 │
│        └─ Groq LLM for in-app AI assistant                             │
│                                                                         │
│  Python Voice Agents                                                    │
│    ├─ On each call: reload data/agent_config.json                      │
│    ├─ LiveKit room ←→ SIP trunk (Vobiz) ←→ PSTN phone                │
│    ├─ STT (Deepgram) → LLM (Groq) → TTS (Sarvam/Cartesia)           │
│    └─ On disconnect: analytics.py → data/call_logs.json + leads.csv   │
│                                                                         │
│  Config Bridge                                                          │
│    data/agent_config.json is the shared state between                   │
│    dashboard (writes) and Python agents (reads on each call)           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Modules

| File / Directory | Description |
|-----------------|-------------|
| `run.py` | Entry point — spawns both `agent_outbound.py` and `agent_inbound.py` as subprocesses with auto-restart |
| `agent_outbound.py` | Outbound voice agent (Priya @ Spinny) — dials out via SIP, handles sales conversations |
| `agent_inbound.py` | Inbound voice agent (Doctor's Receptionist) — answers calls, captures leads, qualifies intent |
| `config_outbound.py` | Outbound agent configuration — system prompt, TTS/STT/LLM settings, loads dashboard overrides |
| `config_inbound.py` | Inbound agent configuration — same pattern as outbound, different persona |
| `analytics.py` | Post-call analytics — saves leads to CSV, analyzes transcripts via Groq, writes to `call_logs.json` |
| `sync_configs.py` | Syncs configuration between dashboard and agent config files |
| `dashboard/` | Next.js 16 dashboard with Sidebar, CRM, Dialer, Workflow Builder, Wallet, and AI Copilot |
| `dashboard/app/api/` | API routes: agent-config, auth, copilot, dispatch, generate-workflow, leads, queue, recordings, send-email |
| `dashboard/components/` | React components: Sidebar, LeadsCRM, AgentConfigForm, BulkDialer, CallDispatcher, WalletDashboard, etc. |
| `dashboard/lib/` | Server utilities: actions.ts, workflow engine, expression engine, Groq analyzer |
| `data/` | Runtime data store — agent_config.json, call_logs.json, leads.csv, workflows.json |
| `logs/` | Runtime log files — timestamped backend/frontend logs with auto-generated error summaries |
| `tester_agent.py` | Self-testing agent — verifies backend imports, env vars, frontend build, and scans logs for errors |
| `log_runner.py` | Log-capturing wrapper — runs backend/frontend with full stdout/stderr logging and summary generation |

---

## 🔧 Environment Configuration

| File | Scope | Contains |
|------|-------|----------|
| `.env` (root) | **Backend Python only** | LiveKit, Deepgram, Groq, Sarvam, Vobiz/SIP credentials |
| `dashboard/.env.local` | **Frontend Next.js only** | NEXT_PUBLIC_* vars, LiveKit (for API routes), Groq (for copilot), Google OAuth |

> **Rule:** Never put `NEXT_PUBLIC_*` vars in root `.env`. Never put Vobiz/SIP credentials in `dashboard/.env.local`.

---

## 🪵 Immutable Change Log

### [2026-06-11] - Premium UI Standardization & Dashboard Overhaul
* **Context:** Overhauled the global design system to use a high-end "Premium Solid" aesthetic (clean typography, crisp borders, dark solid backgrounds) based on user design specs.
* **Scope:**
  - Upgraded global `glass-card` CSS classes in `dashboard/styles/globals.css` from blurry/transparent to premium solid (`#1A1A1A`) with border radius and subtle glowing borders.
  - Rebuilt Dashboard layout (`app/page.tsx`) to implement the premium typography and layout grid while restoring the original `getOverviewStats` data components.
  - Implemented responsive React AreaCharts (`CostGraph.tsx`) with stunning `linearGradient` fills instead of flat transparent colors.
  - Redesigned `Sidebar.tsx` and `TopHeader.tsx` to match the solid dark theme, adding Framer Motion sliding pill indicators.
  - Fixed Recharts `<Brush>` console errors (NaN `x`/`width`) on first render.
* **Impact:** Global design language unified across all pages (Dialer, Workflows, Leads). All functional AI components retained.

### [2026-06-11] - Project Infrastructure Upgrade
* **Context:** Added project documentation, env segregation, automated testing, and logging infrastructure to improve developer experience and debugging.
* **Scope:**
  - Created `memory.md` (this file) — project architecture documentation
  - Segregated `.env` (backend) and `dashboard/.env.local` (frontend) with `.env.example` templates
  - Created `tester_agent.py` — automated health checks for UI and backend
  - Created `log_runner.py` + `logs/` — timestamped log capture with error summaries
  - Updated `GEMINI.md` global rules to reference log summaries for error fixing
  - Updated `.gitignore` to exclude `logs/` directory
* **Impact:** No breaking changes. All existing functionality preserved. New tooling is additive.
* **Verification:** Manual testing of `tester_agent.py` and `log_runner.py` on both backend and frontend.
