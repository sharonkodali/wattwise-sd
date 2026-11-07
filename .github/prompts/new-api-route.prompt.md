---
mode: agent
description: Add a new Gemini-backed API route following WattWise conventions
---
Create a new Next.js route handler in `app/api/${input:routeName}/route.ts` that:

1. Validates the JSON body and returns `{ error }` with status 400 on bad input.
2. Calls Gemini only through `generateJson()` from `lib/gemini.ts`, with a JSON schema added to `lib/schemas.ts`
   and a matching TypeScript type.
3. Returns `{ error: friendlyError(err) }` with status 500 on failure and exports `maxDuration = 120`.
4. Adds the route's request/response contract to `docs/API.md`.

Purpose of the route: ${input:purpose}
