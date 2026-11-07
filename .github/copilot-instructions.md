# Copilot instructions for WattWise SD

GitHub Copilot reads this file automatically for every chat and agent request in this repo.

## Project
WattWise SD helps San Diego residents understand their SDG&E electric bill. Next.js 16 (App Router) + TypeScript +
Tailwind v4 + shadcn/ui (Base UI primitives, `cn` from the `cn` package). Charts use shadcn Charts (Recharts 3).
Deployed on Vercel. Gemini API via `@google/genai`.

## Rules
- **Gemini explains, our code does math.** Never let Gemini produce dollar figures that `lib/analysis.ts` or the bill
  itself didn't provide.
- All Gemini calls go through `generateJson()` in `lib/gemini.ts` and only run in `app/api/*` route handlers.
  Never import `lib/gemini.ts` into a `"use client"` component, and never expose `GEMINI_API_KEY`.
- Shared types live in `lib/schemas.ts`. Reuse `BillAnalysis`, `Recommendation`, `AskResult`, `SUPPORTED_LANGUAGES`.
- API routes return `{ error: string }` with a 4xx/5xx status on failure; use `friendlyError(err)` for 500s.
  Contracts are documented in `docs/API.md` — update it if you change a route.
- Upload limit is 4.4 MB (Vercel body limit). Shrink large images in the browser before sending.
- SDG&E time-of-use: on-peak is 4–9 PM every day. See `SDGE_GLOSSARY` in `lib/gemini.ts` for bill terms.
- Never advise older adults or at-risk people to turn off cooling in hot weather.
- Keep UI text plain and short (6th-grade reading level). Components must work on a phone (375px wide).
- Files in `data/` are sample placeholders until replaced with real SDG&E / OpenEI data; label sample data in the UI.

## Ownership
P1 backend (`app/api/*`, `lib/gemini.ts`, `lib/schemas.ts`) · P2 `components/BillAnalyzer.tsx` + layout ·
P3 `lib/analysis.ts`, `data/`, `components/WhenToUsePower.tsx` · P4 `components/AskWattWise.tsx`, README, docs.
