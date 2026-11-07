# WattWise SD — 3-Hour Hackathon Plan (4 people)

## Context
Hack for Humanity @ AIC UCSD (submissions close **4:00 PM today**). Prizes: Best Overall, Best Use of Gemini API, Best Use of GitHub Copilot (judged on *how* Copilot was used during development).

**Problem:** San Diegans pay some of the highest electricity rates in the US. The SDG&E bill splits charges between SDG&E and San Diego Community Power, uses jargon (PCIA, Base Services Charge, Wildfire Fund), and charges far more from 4–9 PM. People can't tell what drives their bill, when power is most expensive, or that they may qualify for CARE (~30–35% off).

**Product:** a Vercel-hosted website with 3 tabs:
1. **Bill Analyzer (MAIN feature)** — upload a bill PDF/photo → Gemini extracts every charge → plain-English explanation → translate into Spanish / Vietnamese / Tagalog / Chinese / Arabic.
2. **When to Use Power** — public datasets (SDG&E TOU rates + San Diego hourly load profile + CAISO grid mix) → charts of the worst/best hours → Gemini recommendations grounded in numbers our code computed.
3. **Ask WattWise** — user describes their home and habits in plain text ("3 roommates, AC on 6–10 PM, gaming PC") → Gemini returns personalized savings plan + CARE/FERA eligibility hint.

## Stack (decided — don't debate it)
- **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui**, deployed on **Vercel** (GitHub repo → auto-deploys on push).
- **Gemini API** via official `@google/genai` SDK, current **Gemini Flash** model (check AI Studio for the exact model ID). Key in `GEMINI_API_KEY` (Vercel env var + `.env.local`, never committed).
- **Charts: shadcn/ui Charts (built on Recharts)** — looks polished out of the box, fastest in Next.js.
- **Data:** static JSON/CSV in `/public/data` and `/data` — no database.
- **GitHub Copilot** in VS Code (agent mode + chat + inline) for all coding — everyone logs usage.

## Datasets (Person 3 gets these first, 20 min max)
| Data | Source | Use |
|---|---|---|
| SDG&E TOU-DR1 rates (summer/winter, on/off/super-off-peak, + CARE) | sdge.com "TOU-DR1 Total Rates Table" PDF (effective 6/1/26) | Hand-copy into `data/rates.json` |
| Typical San Diego residential hourly load (8760 hrs) | OpenEI "Commercial and Residential Hourly Load Profiles for all TMY3 Locations" → San Diego Lindbergh Field, residential BASE | Average-day usage curve, cost by hour |
| CAISO hourly demand + renewables share | caiso.com "Today's Outlook" CSV download (demand & supply) | "Dirtiest / most strained hours" overlay |
| CARE/FERA income limits | sdge.com CARE & FERA pages | `data/assistance.json` for eligibility hint |
| Sample bill PDF | Make a realistic **fake** bill (Gemini/Docs) in SDG&E format — never demo a real account | Demo + testing |

Fallback if a download is slow: Gemini/Copilot generates a realistic synthetic CSV in the same shape; label it "sample" in the UI.

## File structure & API contracts (agree in first 15 min so everyone works in parallel)
```
app/
  page.tsx                  # Tabs shell (Bill | When to Use Power | Ask WattWise)
  api/analyze-bill/route.ts # POST multipart file -> BillAnalysis JSON
  api/translate/route.ts    # POST {analysis, language} -> BillAnalysis JSON (translated text fields)
  api/recommend/route.ts    # POST {stats} -> {recommendations[]}   (Tab 2)
  api/ask/route.ts          # POST {description} -> {plan, savingsEstimate, careHint}  (Tab 3)
components/ BillUpload.tsx, ChargeCard.tsx, LanguageSelect.tsx, HourlyCostChart.tsx, GridMixChart.tsx, AskForm.tsx
lib/ gemini.ts (client + helper), schemas.ts (shared TS types), analysis.ts (cost-by-hour math)
data/ rates.json, sd_load_profile.csv, caiso_today.csv, assistance.json
docs/ COPILOT_LOG.md, GEMINI_USAGE.md
README.md
```
`BillAnalysis` (in `lib/schemas.ts`, also passed to Gemini as `responseSchema`):
`{ billingPeriod, ratePlan, provider: "SDCP"|"SDG&E", totalDue, kwhByPeriod:{onPeak,offPeak,superOffPeak}, lineItems:[{name, amount, category, plainEnglish}], summary, topSavingTip }`

**Rule:** Gemini explains, our code does math. All $ figures in Tab 2 come from `lib/analysis.ts`.

---

## Roles

### Person 1 — Lead + Bill Analyzer backend (MAIN feature)
- 0:00–0:15: Create GitHub repo, `npx create-next-app`, add shadcn, push; link to Vercel; add `GEMINI_API_KEY`. Share repo + `.env.local` key privately.
- Write `lib/schemas.ts` + `lib/gemini.ts` first and push (others depend on it).
- `api/analyze-bill`: accept PDF/JPG/PNG, send as inline base64 to Gemini with `responseMimeType: "application/json"` + `responseSchema`. Prompt includes an SDG&E glossary (PCIA, Base Services Charge, generation credit, Climate Credit, baseline credit, Wildfire Fund) so explanations are accurate.
- `api/translate`: send BillAnalysis + target language, return same schema with translated text fields (numbers untouched).
- Owns merges to `main` and the Vercel production deploy.

### Person 2 — Frontend + Bill Analyzer UI
- Tab shell in `app/page.tsx` (shadcn Tabs), header, San Diego-themed styling.
- `BillUpload` (drag-drop, loading state), results view: total-due hero, kWh-by-period donut (shadcn chart), `ChargeCard` grid (name, $, plain English), summary + top tip.
- `LanguageSelect` → calls `/api/translate`, swaps text in place.
- Build against a **mock BillAnalysis JSON** until P1's endpoint is live (~1:00).
- Mobile-friendly check at the end.

### Person 3 — Data + Analysis + Visualizations (Tab 2)
- 0:00–0:25: Get datasets above into `/data`; copy rates into `rates.json`.
- `lib/analysis.ts`: average kWh per hour of day from load profile; map each hour to TOU period; cost per hour = kWh × rate; % of cost in 4–9 PM; savings if X% of peak usage shifts to after 9 PM; join CAISO demand/renewables by hour.
- Charts: (1) 24-hour bar chart of cost by hour, peak window shaded red; (2) line chart of grid demand vs renewables %; (3) summer vs winter or CARE vs standard comparison.
- `api/recommend`: send computed stats (not raw CSV) to Gemini → 3–5 specific recommendations ("Run dishwasher after 9 PM: ~$X/mo").
- Show dataset source + date under each chart (credibility with judges).

### Person 4 — Ask WattWise tab + README + Demo/Pitch
- `api/ask` + `AskForm`: textarea + example prompts (student apartment, family in Chula Vista, retiree in El Cajon). Gemini returns structured plan: top habits costing money, estimated monthly savings range, CARE/FERA hint using `assistance.json`, links to apply. Include "estimates, not financial advice" note.
- Make the fake sample bill PDF (0:00–0:30) and hand to P1/P2.
- **Owns `docs/COPILOT_LOG.md`** — collects everyone's Copilot examples (template below) every 45 min in group chat.
- Writes `README.md`, records 2-min backup demo video, submits to Devpost/MLH **by 3:45**.

---

## Timeline (3 hours)
| Time | Milestone |
|---|---|
| 0:00–0:15 | Repo + Vercel live (P1). Agree on schemas/routes above. Everyone opens Copilot. |
| 0:15–1:15 | Parallel build on mocks. P3 data loaded by 0:25. |
| **1:15 checkpoint** | Bill upload → real Gemini JSON on screen. Tab 2 chart renders. Tab 3 returns an answer. |
| 1:15–2:00 | Translation, recommendations, polish charts, error/loading states. |
| **2:00 checkpoint** | Feature freeze. Merge everything, deploy to Vercel production. |
| 2:00–2:30 | Bug fixes on the deployed URL only; test with sample bill + phone. |
| 2:30–3:00 | README final, screenshots, demo video, submit. Rehearse 2-min pitch twice. |

Cut list if behind (in order): Tab 2 CAISO chart → Tab 3 CARE hint → extra languages (keep Spanish).

## How we use Gemini (for README `## How we used Gemini`)
1. **Multimodal document understanding** — reads messy bill PDFs/photos directly.
2. **Structured output** — `responseSchema` forces typed JSON the UI renders reliably.
3. **Plain-language + translation** — jargon → 6th-grade English → 5 languages, numbers preserved.
4. **Grounded recommendations** — receives stats our code computed from public data, so advice cites real $ amounts.
5. **Free-text personalization** — Tab 3 turns a household description into a savings plan.
Include the actual prompts in `docs/GEMINI_USAGE.md`.

## How we use GitHub Copilot (for README `## How we used GitHub Copilot`)
**Start here: [`COPILOT_PLAYBOOK.md`](COPILOT_PLAYBOOK.md)** — setup, features, and Copilot tasks for each person.

Log template per entry in `docs/COPILOT_LOG.md`:
`Who | Copilot mode (agent / chat / inline / tests) | What we asked | What it produced | What we changed | Time saved est.`
Aim for ~3 entries per person, e.g.: agent mode scaffolded the tab layout; chat wrote the CSV parser for the OpenEI file; inline completed TOU hour-mapping; chat debugged Gemini JSON parse error; Copilot generated unit tests for `analysis.ts`; Copilot explained Recharts props. Screenshot 2–3 of these for a pitch slide.

## Verification (2:00–2:30)
- `npm run build` passes locally, then Vercel production URL works.
- Upload sample bill PDF and a phone photo → all line items appear with explanations; switch to Spanish → text changes, $ unchanged.
- Tab 2: hourly chart shows highest cost in 4–9 PM; recommendation $ match `analysis.ts` output.
- Tab 3: run all 3 example prompts, check for sensible output.
- Test on a phone; confirm no API key in client bundle (all Gemini calls in `app/api/*`).

## Pitch (2 min)
Hook ("Who here knows what PCIA means?") → upload bill live → translate to Spanish → peak-hour chart → Ask tab → Copilot slide → "$X/month back for a San Diego student."
