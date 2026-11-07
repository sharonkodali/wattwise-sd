# How we use Gemini

| Endpoint | Input | Gemini feature | Output |
| --- | --- | --- | --- |
| `POST /api/analyze-bill` | Bill PDF / photo | Multimodal document input + `responseJsonSchema` | `BillAnalysis` JSON |
| `POST /api/translate` | `BillAnalysis` + language | Translation, schema-locked so numbers can't change | `BillAnalysis` JSON |
| `POST /api/recommend` | Stats from `lib/analysis.ts` | Grounded generation (only uses our numbers) | 3–5 recommendations |
| `POST /api/ask` | Free-text household description | Personalization + program rules in context | Savings plan + CARE/FERA hint |

Model: set in `lib/gemini.ts` (`GEMINI_MODEL` env var overrides it).

The system prompts live in each route file. Paste the final versions here before submitting.
