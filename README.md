# WattWise SD

**Understand your SDG&E bill, find the expensive hours, and keep more of your money.**
Built at Hack for Humanity @ AI Collective UC San Diego (Nov 7, 2026).

## The problem
San Diegans pay some of the highest electricity rates in the US. The SDG&E bill splits charges between SDG&E and
San Diego Community Power, uses jargon (PCIA, Base Services Charge, Wildfire Fund), and charges far more from 4–9 PM.
Most people can't tell what drives their bill, when power is most expensive, or that they may qualify for CARE (~30–35% off).

## What it does
| Tab | What it does |
| --- | --- |
| **Bill Analyzer** | Upload a bill PDF or photo → every charge explained in plain English → translate into Spanish, Vietnamese, Tagalog, Chinese, Arabic |
| **When to Use Power** | Public data on a typical San Diego home + SDG&E time-of-use rates → cost-by-hour charts → Gemini tips grounded in our numbers |
| **Ask WattWise** | Describe your home and habits → personal savings plan + CARE/FERA hint |

## How we used the Gemini API
1. **Reads documents directly** — bill PDFs and phone photos go straight to Gemini (`app/api/analyze-bill`).
2. **Structured output** — `responseJsonSchema` forces typed JSON the UI renders reliably (`lib/schemas.ts`).
3. **Plain language + translation** — jargon → simple English → 5 languages, numbers unchanged (`app/api/translate`).
4. **Grounded tips** — Gemini only explains numbers our code calculated from public data (`lib/analysis.ts` → `app/api/recommend`).
5. **Personal plans from free text** — `app/api/ask`.

**Making it trustworthy:**
- Translation sends only text to Gemini; our server copies every number back from the original, so a dollar amount can never change.
- After reading a bill, our code checks that the line items add up to the total (`checks.matchesTotal`) and rejects non-bills.
- Model `gemini-3.5-flash` with a 25 s cutoff, automatic retry, and fallback to other Flash models when Gemini is busy.
- Safety rule in prompts: never tell older adults or at-risk people to turn off cooling in hot weather.

Prompts are in [`docs/GEMINI_USAGE.md`](docs/GEMINI_USAGE.md); endpoint contracts are in [`docs/API.md`](docs/API.md).

## How we used GitHub Copilot
- **Custom instructions** ([`.github/copilot-instructions.md`](.github/copilot-instructions.md)) teach Copilot our stack,
  file owners and rules, so all four of us got answers that matched the codebase.
- **Reusable prompt files** ([`.github/prompts/`](.github/prompts/)): `/new-api-route`, `/test-endpoint`, `/log-copilot`.
- **Agent mode, inline chat and inline suggestions** for features, tests and fixes — every real example, who did it
  and time saved is in [`docs/COPILOT_LOG.md`](docs/COPILOT_LOG.md). How we worked: [`docs/COPILOT_PLAYBOOK.md`](docs/COPILOT_PLAYBOOK.md).
<!-- TODO(P4): add the 3-5 best Copilot moments from the log here, with screenshots. -->

**Other AI tools:** the initial project scaffold and backend hardening were done with Claude Code.

## Data sources
- SDG&E TOU-DR1 Total Rates Table (sdge.com regulatory documents)
- OpenEI — Commercial and Residential Hourly Load Profiles for all TMY3 Locations (San Diego Lindbergh Field, residential)
- CAISO Today's Outlook (grid demand and supply mix)
- SDG&E CARE and FERA program pages

> Files in `data/` currently hold **sample placeholder values** — replace before the demo.

## Run it locally
```bash
npm install
cp .env.example .env.local   # then paste your Gemini API key
npm run dev                  # http://localhost:3000
```

## Team
| Person | Role |
| --- | --- |
| P1 — ____ | Lead, Bill Analyzer backend, deploys |
| P2 — ____ | Frontend, Bill Analyzer UI |
| P3 — ____ | Data, analysis, charts |
| P4 — ____ | Ask WattWise, README, demo |
