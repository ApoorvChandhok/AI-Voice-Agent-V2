# Project Memory & System Architecture

## 🏗️ Core Architecture & System Flow
* **System Design:** Dual-Agent Microservice + Next.js Dashboard. Two Python voice agents (inbound & outbound) communicate via LiveKit, orchestrated by a Next.js 16 dashboard. Config bridged through `data/agent_config.json`.
* **Tech Stack:** Python (LiveKit Agents, Groq LLM, Deepgram STT, Sarvam TTS) + Next.js 16 (React 19, TailwindCSS 4, Framer Motion). Telephony via Vobiz SIP.
* **Data Flow:** Dashboard → API Routes → `data/agent_config.json` → Python agents read on each call → LiveKit SIP ↔ PSTN → Analytics → `data/call_logs.json`
* **Core Modules:**
  - `run.py` — Entry point, spawns inbound + outbound agents with auto-restart
  - `agent_outbound.py` / `agent_inbound.py` — Voice agent implementations
  - `config_outbound.py` / `config_inbound.py` — Agent configuration with dashboard overrides
  - `analytics.py` — Post-call analytics and lead capture
  - `dashboard/` — Next.js frontend (Sidebar, CRM, Dialer, Workflows, Copilot)
  - `logs/` — Runtime log files with auto-generated error summaries
  - `tester_agent.py` — Self-testing health check agent
  - `log_runner.py` — Log-capturing wrapper for backend/frontend

## 🔧 Environment Configuration
* **Backend (Python):** Root `.env` — LiveKit, Deepgram, Groq, Sarvam, Vobiz/SIP credentials
* **Frontend (Next.js):** `dashboard/.env.local` — NEXT_PUBLIC_* vars, LiveKit (API routes), Groq (copilot), Google OAuth
* **Rule:** Never mix frontend and backend env vars across files

## 📊 Log Summary Reference
**CRITICAL: Before making ANY code changes or debugging, ALWAYS check the latest log summaries for context.**

* **Log location:** `logs/` directory at project root
* **Backend logs:** `logs/backend_YYYY-MM-DD_HH-MM-SS.log` — Python agent runtime logs
* **Frontend logs:** `logs/frontend_YYYY-MM-DD_HH-MM-SS.log` — Next.js dev server logs
* **Tester reports:** `logs/tester_report_YYYY-MM-DD_HH-MM-SS.md` — Health check results

### How to use log summaries:
1. **Find the latest log file** in `logs/` (most recent timestamp)
2. **Read the SUMMARY section** at the bottom of the log file (after the `═══` separator)
3. **The summary contains:**
   - Total error count and categories (Timeout, Connection, Import, etc.)
   - Line numbers of each error with context
   - Warning count and details
   - An overall VERDICT (clean / minor issues / needs attention)
4. **Cross-reference errors** with the code you're about to change
5. **After significant changes**, run `python tester_agent.py` to verify nothing is broken

### When fixing errors:
- Match error patterns from log summaries to specific files
- Fix root causes, not symptoms
- After fixing, run the tester to confirm the fix: `python tester_agent.py`
- For frontend-specific issues: `python tester_agent.py --frontend`
- For backend-specific issues: `python tester_agent.py --backend`

## 🪵 Immutable Change Log
[A chronological record of every modification made to the codebase. Never overwrite previous logs; append new entries to the top.]

### [2026-06-11] - Project Infrastructure Upgrade
* **Context:** Added project documentation, env segregation, automated testing, and logging infrastructure.
* **Scope:** Created memory.md, tester_agent.py, log_runner.py, logs/ directory. Segregated .env files. Updated GEMINI.md.
* **Impact:** No breaking changes. All existing functionality preserved. New tooling is additive.
* **Verification:** Manual testing of tester_agent.py and log_runner.py.
