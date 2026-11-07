---
mode: agent
description: Write Vitest tests for a WattWise file, run them, and record results
---
Write tests for `${input:file}` following `docs/TESTING.md` (find the matching row in "What we test and why").

Setup (only if not done yet):
- `npm i -D vitest`, add `"test": "vitest run"` to package.json, and create `vitest.config.ts` that resolves the
  `@/` alias to the project root.

Rules:
- Put tests next to the code as `*.test.ts`.
- Never call the real Gemini API: `vi.mock("@/lib/gemini", ...)` and mock `generateJson`, keeping `friendlyError`
  and `SDGE_GLOSSARY` real (use `vi.importActual`).
- Call route handlers directly: `await POST(new Request("http://x", { method: "POST", body: ... }))`.
- Cover the "What must be true" column for that row: happy path, bad input, and Gemini failure.

Then run `npm test`, fix failures (fix the test if the test is wrong; fix the code if the code is wrong and explain the
bug), and add a row to the Results table in `docs/TESTING.md`. If a test found a real bug, add it under
"Bugs found by testing".
