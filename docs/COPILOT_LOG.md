# GitHub Copilot Log

Every row is a real moment where Copilot helped build WattWise SD. Add one each time (or type `/log-copilot` in
Copilot Chat). Screenshots go in `docs/screenshots/`. Setup and task ideas: [`COPILOT_PLAYBOOK.md`](COPILOT_PLAYBOOK.md).

## Team-wide Copilot setup
- **Custom instructions** — `.github/copilot-instructions.md` gives Copilot our stack, file owners and rules
  (Gemini explains / our code does the math, server-only API key, heat-safety rule, 4.4 MB upload limit), so every
  teammate gets consistent answers.
- **Reusable prompt files** — `.github/prompts/`: `/new-api-route` (route + schema + docs in our conventions),
  `/test-endpoint` (Vitest tests with Gemini mocked), `/log-copilot` (writes entries for this log).

## Log

| Time | Who | Copilot feature | What we asked | What it produced | What we changed | Time saved |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |

<!-- Example row format (delete once you have real entries):
| 2:10 PM | P3 | Agent mode | Average the OpenEI 8760-hour CSV into kWh per hour of day | Node script + JSON output | Fixed the column name | ~15 min |
-->
