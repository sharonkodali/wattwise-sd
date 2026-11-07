# WattWise SD

**Understand your SDG&E bill, find the expensive hours, and keep more of your money.**

Built at Hack for Humanity @ AI Collective UC San Diego (Nov 7, 2026).

## The Problem

San Diegans face high electricity costs and complicated utility bills. SDG&E bills can include charges from both SDG&E and San Diego Community Power, along with confusing terms like PCIA, Base Services Charge, and Wildfire Fund.

Electricity is also more expensive during peak hours (4–9 PM), but many residents don't know which habits contribute most to their bills or whether they qualify for assistance programs.

## What It Does

| Tab | What it does |
| --- | --- |
| **Bill Analyzer** | Upload a bill PDF or photo, understand charges in plain English, and translate explanations into Spanish, Vietnamese, Tagalog, Chinese, and Arabic. |
| **When to Use Power** | Explore typical San Diego electricity usage, time-of-use rates, cost-by-hour charts, and energy-saving tips. |
| **Ask WattWise** | Describe your household and energy habits to receive a personalized savings plan and information about CARE/FERA assistance programs. |

## How We Used the Gemini API

1. **Document analysis** — Bill PDFs and phone photos are sent to Gemini for analysis (`app/api/analyze-bill`).
2. **Structured output** — `responseJsonSchema` produces structured JSON that the frontend can render reliably (`lib/schemas.ts`).
3. **Plain language and translation** — Explains electricity terminology in simple language and supports multiple languages (`app/api/translate`).
4. **Grounded recommendations** — Gemini explains calculations based on data processed by our application (`lib/analysis.ts` → `app/api/recommend`).
5. **Personalized plans** — Uses household descriptions to generate energy-saving suggestions and CARE/FERA assistance information (`app/api/ask`).

Our prompts and Gemini API usage examples are documented in [`docs/GEMINI_USAGE.md`](docs/GEMINI_USAGE.md).

## How We Used GitHub Copilot

We used GitHub Copilot to support development, review frontend components, and improve the demo experience.

See [`docs/COPILOT_LOG.md`](docs/COPILOT_LOG.md) for examples of our Copilot interactions, changes made, and estimated time saved.

Screenshots of selected Copilot interactions are stored in `docs/screenshots/`.

## Data Sources

- SDG&E Time