# Backend API (owner: Person 1)

All routes live in `app/api/*`, call Gemini on the server, and return JSON. On failure they return
`{ "error": "<message safe to show the user>" }` with a 4xx/5xx status, so the UI can show `data.error` directly.
Types are in `lib/schemas.ts`.

Gemini setup (`lib/gemini.ts`): default model `gemini-3.5-flash`, 25 s cutoff per call, automatic retry, then fallback
to `gemini-3.1-flash-lite` and `gemini-3.6-flash` if Gemini is busy. Override with the `GEMINI_MODEL` env var.

## `POST /api/analyze-bill` — read a bill
- **Body:** `multipart/form-data` with field `file` (PDF, JPG, PNG, WEBP, HEIC). **Max 4.4 MB** (Vercel limit) —
  shrink large phone photos in the browser before uploading.
- **200:** `BillAnalysis`:
```json
{
  "billingPeriod": "09/12/2026 - 10/11/2026",
  "ratePlan": "TOU-DR1",
  "provider": "SDCP",
  "totalDue": 171.1,
  "kwhByPeriod": { "onPeak": 62, "offPeak": 180, "superOffPeak": 148 },
  "lineItems": [{ "name": "Power Charge Indifference Adjustment (PCIA)", "amount": 9.8, "category": "fees_taxes", "plainEnglish": "..." }],
  "summary": "...",
  "topSavingTip": "...",
  "checks": { "lineItemsSum": 171.1, "matchesTotal": true, "totalKwh": 390, "peakSharePct": 15.9 }
}
```
- `checks` is calculated by our code, not Gemini. Show a small warning if `matchesTotal` is false.
- **400** bad/missing file · **413** too large · **422** not a utility bill · **500** Gemini error.
- Typical time: ~10 s.

## `POST /api/translate` — translate a bill analysis
- **Body:** `{ "analysis": BillAnalysis, "language": "Spanish" }` — language must be one of `SUPPORTED_LANGUAGES`
  (English, Spanish, Vietnamese, Tagalog, Chinese (Simplified), Arabic).
- **200:** the same `BillAnalysis` with `name`, `plainEnglish`, `summary`, `topSavingTip`, `billingPeriod` translated.
  Numbers are copied from the original on the server, so they can never change. Always send the **English original**,
  not an already-translated version. Repeat requests are cached (instant).

## `POST /api/recommend` — tips for Tab 2 (Person 3)
- **Body:** `{ "season": "summer" | "winter", "plan": "standard" | "care", "dailyKwh"?: number }`
  (`dailyKwh` = the user's bill kWh ÷ days, to scale the typical-home curve).
- **200:** `{ "recommendations": [{ "scenarioId", "title", "detail", "monthlySavings": number | null }], "source": "gemini" | "fallback" }`
- The server computes every scenario with `lib/analysis.ts`; Gemini writes `{{savings}}` placeholders and our code fills
  in the dollar amounts. If Gemini fails, it returns template tips (`source: "fallback"`) instead of an error.

## `POST /api/ask` — household savings plan for Tab 3 (Person 4)
- **Body:** `{ "description": "free text, max 4000 chars" }`
- **200:** `{ "plan": [{ "habit", "why", "fix" }], "savingsEstimate", "careHint" }`

## Test from the terminal
```bash
curl -F "file=@public/sample-bill.pdf;type=application/pdf" https://wattwise-sd.vercel.app/api/analyze-bill
```
