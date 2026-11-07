# Testing WattWise SD

Tests are written with **GitHub Copilot agent mode** and run with **Vitest**. Gemini is always **mocked** in unit
tests, so tests are fast, free and don't depend on Gemini being up. Every Copilot session that writes or fixes tests
gets a row in [`COPILOT_LOG.md`](COPILOT_LOG.md).

Run: `npm test`

## What we test and why

| #   | Area                      | File(s) under test              | What must be true                                                                                                                                      | Why it matters                                           |
| --- | ------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 1   | Translation locks numbers | `app/api/translate/route.ts`    | Every `amount`, `totalDue`, `kwhByPeriod` value is identical before and after translation; unsupported language → 400                                  | A translated bill must never show a wrong dollar amount  |
| 2   | Bill upload validation    | `app/api/analyze-bill/route.ts` | No file → 400; wrong type → 400; >4.4 MB → 413; `isUtilityBill: false` → 422; `checks.matchesTotal` correct                                            | Clear errors instead of crashes; catches Gemini misreads |
| 3   | TOU periods               | `lib/analysis.ts`               | 4–9 PM is on-peak on every day type; super off-peak hours match `data/rates.json`                                                                      | Every chart and tip depends on this                      |
| 4   | Cost math                 | `lib/analysis.ts`               | Hourly costs add up to the daily total; CARE is cheaper than standard; savings are never negative                                                      | Judges will check our numbers                            |
| 5   | Tips use our numbers      | `app/api/recommend/route.ts`    | `{{savings}}` is replaced with the computed amount; made-up `$` amounts are dropped; no garbled amounts like `.411.41`; Gemini failure → fallback tips | Gemini must never invent dollar figures                  |
| 6   | Gemini fallback           | `lib/gemini.ts`                 | A 503 retries, then moves to the next model; non-retryable errors throw; `friendlyError` hides raw JSON                                                | The demo survives Gemini outages                         |
| 7   | Ask safety                | `app/api/ask/route.ts`          | Empty description → 400; prompt contains the heat-safety rule                                                                                          | Never tell at-risk people to turn off cooling            |

## Results (fill in as tests land)

| Date/time        | #   | Test file                                                                                              | Tests              | Passing | Bugs found        | Written with        |
| ---------------- | --- | ------------------------------------------------------------------------------------------------------ | ------------------ | ------- | ----------------- | ------------------- |
| 2026-11-07 14:29 | 1-5 | `translate.spec.ts`, `recommend.spec.ts`, `analysis.spec.ts`, `analyze-bill.spec.ts`, `gemini.spec.ts` | 10 targeted checks | 10/10   | None in this pass | Agent mode + Vitest |

## Bugs found by testing

Already found during manual testing on the live site (before automated tests):

- Tips showed garbled amounts ("save .411.41") — `String.replace` read `"$11.41"` as regex group `$1`. Fixed with function replacers.
- `gemini-2.5-flash` retired for new keys; `gemini-3.8-flash` took 100+ s when overloaded. Fixed with a 25 s per-call timeout and model fallback.
- Empty request bodies leaked raw Gemini errors. Fixed with input validation and `friendlyError`.
- Prompt advised an El Cajon retiree to turn the AC off at peak. Fixed with a heat-safety rule.

End-to-end demo walkthrough on the live site (Nov 7, with SDG&E's public sample bill + our sample):
- The total due rendered at 11px: the amount was both `p:nth-child(2)` and `p:last-child`, and the 11px footer rule won. Fixed with explicit classes.
- Bills with an unpaid previous balance falsely showed "charges don't add up" ($168.42 charges + $18.00 carried over = $186.42 due). Fixed: Gemini now extracts `previousBalance` and the check subtracts it.
- Gemini returned "busy" on every model once during testing. Fixed: the page retries once, and the two demo bills fall back to their last good result (`data/demo-cache.json`, response has `cached: true`).
- Upload box said "Up to 15 MB" but Vercel's limit is 4.5 MB. Fixed: 4 MB copy, large photos are shrunk in the browser, and plain-text 413/504 errors show a clear message.
- Only Gemini's text was translated; labels stayed English. Fixed: `lib/ui-labels.ts` (6 languages).
- SDG&E public sample (gas + electric, 3 pages): 14 charges, kWh split 179/322/256 exact, $228.91 of $229.52 found (the $0.61 "Other" line is on page 4, not in the file).

Add new ones below with the Copilot log row that found them:

## End-to-end check before the demo (manual)

- [x] Upload `public/sample-bill.pdf` on the live site → all charges, total matches (Nov 7)
- [x] Upload SDG&E's public sample bill PDF → 14 charges, total matches (Nov 7)
- [ ] Upload a real phone photo of a bill
- [x] Switch languages → text and labels change, $ unchanged (Spanish, Nov 7)
- [ ] Tab 2 charts render on a phone; tips load
- [ ] Tab 3: run the 3 example households
