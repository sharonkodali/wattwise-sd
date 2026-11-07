---
mode: agent
description: Write tests for an API route or lib function
---
Write tests for `${input:file}`.

- Set up Vitest if it isn't installed yet (`npm i -D vitest`, add `"test": "vitest run"` to package.json).
- Mock `generateJson` from `lib/gemini.ts` so tests never call the real Gemini API.
- Cover: valid input, missing/invalid input (400), Gemini failure (500 with a friendly message).
- For `app/api/translate`, assert that every number in the output equals the input (translation must never change amounts).
- For `lib/analysis.ts`, assert that 4–9 PM hours are "onPeak" and that the hourly costs add up to the daily total.
Run the tests and fix any failures.
