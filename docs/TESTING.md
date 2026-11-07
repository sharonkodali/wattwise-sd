# Testing WattWise SD

Tests are written with **GitHub Copilot agent mode** and run with **Vitest**. Gemini is always **mocked** in unit
tests, so tests are fast, free and don't depend on Gemini being up. Every Copilot session that writes or fixes tests
gets a row in [`COPILOT_LOG.md`](COPILOT_LOG.md).

Run: `npm test`

## What we test and why

| # | Area | File(s) under test | What must be true | Why it matters |
| --- | --- | --- | --- | --- |
| 1 | Translation locks numbers | `app/api/translate/route.ts` | Every `amount`, `totalDue`, `kwhByPeriod` value is identical before and after translation; unsupported language → 400 | A translated bill must never show a wrong dollar amount |
| 2 | Bill upload validation | `app/api/analyze-bill/route.ts` | No file → 400; wrong type → 400; >4.4 MB → 413; `isUtilityBill: false` → 422; `checks.matchesTotal` correct | Clear errors instead of crashes; catches Gemini misreads |
| 3 | TOU periods | `lib/analysis.ts` | 4–9 PM is on-peak on every day type; super off-peak hours match `data/rates.json` | Every chart and tip depends on this |
| 4 | Cost math | `lib/analysis.ts` | Hourly costs add up to the daily total; CARE is cheaper than standard; savings are never negative | Judges will check our numbers |
| 5 | Tips use our numbers | `app/api/recommend/route.ts` | `{{savings}}` is replaced with the computed amount; made-up `$` amounts are dropped; no garbled amounts like `.411.41`; Gemini failure → fallback tips | Gemini must never invent dollar figures |
| 6 | Gemini fallback | `lib/gemini.ts` | A 503 retries, then moves to the next model; non-retryable errors throw; `friendlyError` hides raw JSON | The demo survives Gemini outages |
| 7 | Ask safety | `app/api/ask/route.ts` | Empty description → 400; prompt contains the heat-safety rule | Never tell at-risk people to turn off cooling |

## Results (fill in as tests land)

| Date/time | # | Test file | Tests | Passing | Bugs found | Written with |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

## Bugs found by testing
Already found during manual testing on the live site (before automated tests):
- Tips showed garbled amounts ("save .411.41") — `String.replace` read `"$11.41"` as regex group `$1`. Fixed with function replacers.
- `gemini-2.5-flash` retired for new keys; `gemini-3.8-flash` took 100+ s when overloaded. Fixed with a 25 s per-call timeout and model fallback.
- Empty request bodies leaked raw Gemini errors. Fixed with input validation and `friendlyError`.
- Prompt advised an El Cajon retiree to turn the AC off at peak. Fixed with a heat-safety rule.

Add new ones below with the Copilot log row that found them:

## End-to-end check before the demo (manual)
- [ ] Upload `public/sample-bill.pdf` on the live site → all charges, total matches
- [ ] Upload a real phone photo of a bill
- [ ] Switch languages → text changes, $ unchanged
- [ ] Tab 2 charts render on a phone; tips load
- [ ] Tab 3: run the 3 example households
