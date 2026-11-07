# Copilot Playbook

The Copilot prize is judged on **how** we used Copilot during development, so use it on purpose and log every useful
moment in [`COPILOT_LOG.md`](COPILOT_LOG.md).

## 1. Set up (5 min, everyone)
1. VS Code → Extensions → install **GitHub Copilot Chat** (it includes inline suggestions). Or run
   `code --install-extension GitHub.copilot-chat`.
2. Sign in with GitHub when prompted. Free tier works; students get Copilot Pro free through the GitHub Student
   Developer Pack (education.github.com).
3. Open the chat panel (**Ctrl+Cmd+I** on Mac / **Ctrl+Alt+I** on Windows) and switch the mode dropdown to **Agent**.
4. Run `git pull` so you have `.github/copilot-instructions.md` — Copilot reads it automatically, so it already knows
   our stack, file owners and rules.

## 2. Copilot features to use (and log)
| Feature | How | Good for |
| --- | --- | --- |
| **Agent mode** | Chat panel → Agent → describe the task | Multi-file features, running tests, fixing build errors |
| **Inline suggestions** | Just type; Tab to accept | Repetitive code, mappings, JSX |
| **Inline chat** | Select code → **Cmd+I** | "Make this mobile-friendly", "add error handling" |
| **Custom instructions** | `.github/copilot-instructions.md` (already set up) | Keeps every answer consistent with our rules |
| **Prompt files** | In chat type `/new-api-route`, `/test-endpoint`, `/log-copilot` (from `.github/prompts/`) | Reusable team workflows |
| **`#` context** | Type `#file` / `#codebase` in chat to attach files | Accurate answers about our code |
| **Commit messages** | Source Control panel → sparkle icon | Clean commit history |
| **Fix errors** | Hover a red squiggle → "Fix with Copilot" | TypeScript/lint errors |
| **Copilot code review** | On a GitHub PR → Reviewers → Copilot | Second pair of eyes before merging |

## 3. Tasks to do with Copilot right now (from the TODOs in the code)

**P1 — Backend (`app/api/*`, `lib/`)**
- `/test-endpoint` on `app/api/translate/route.ts` → Vitest tests proving numbers never change. *(Great demo of agent mode running tests.)*
- Inline chat on `lib/gemini.ts`: "add a simple per-IP rate limit so the demo can't burn our Gemini quota."
- Agent: "Add an optional `bill` field to `/api/ask` so the savings plan can use the uploaded bill's numbers."
- Ask Copilot code review to review your PR before merging to `main`.

**P2 — Bill Analyzer UI (`components/BillAnalyzer.tsx`)**
- Agent: "Add drag-and-drop upload and shrink images over 4 MB in the browser before sending (see docs/API.md)."
- Agent: "Add a donut chart of `kwhByPeriod` using shadcn Charts, on-peak in red."
- Inline chat on the ChargeCard grid: "group cards by category with a colored header; make it work at 375px."
- Show a warning when `checks.matchesTotal` is false.

**P3 — Data + charts (`lib/analysis.ts`, `data/`, `components/WhenToUsePower.tsx`)**
- Copilot Chat with the OpenEI CSV attached: "write a script that averages this 8760-hour file into kWh per hour of day."
- Inline suggestions to finish `periodForHour` for weekends/holidays and March–April midday super off-peak.
- Agent: "add a CAISO demand vs. renewables line chart from `data/caiso_today.csv`."
- `/test-endpoint` on `lib/analysis.ts`.

**P4 — Ask tab + docs (`components/AskWattWise.tsx`, README)**
- Agent: "turn URLs in `careHint` into clickable links and add a loading skeleton."
- Copilot Chat: "explain `app/api/ask/route.ts` in 3 sentences for the README."
- Use the sparkle button for commit messages, and `/log-copilot` after each Copilot session.

## 4. How to log (2 min per entry)
After Copilot helps: type `/log-copilot` in chat, or add a row to `COPILOT_LOG.md` by hand.
Take a screenshot of the best moments (chat + result) into `docs/screenshots/`. Aim for ~3 real entries per person.
Only log what actually happened.
