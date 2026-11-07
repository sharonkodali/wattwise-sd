# GitHub Copilot Log

Every row is a real moment where Copilot helped build WattWise SD. Add one each time (or type `/log-copilot` in Copilot Chat). Screenshots go in `docs/screenshots/`. Setup and task ideas: [`COPILOT_PLAYBOOK.md`](COPILOT_PLAYBOOK.md).

## Team-wide Copilot setup

- **Custom instructions** — `.github/copilot-instructions.md` gives Copilot our stack, file owners and rules (Gemini explains / our code does the math, server-only API key, heat-safety rule, 4.4 MB upload limit), so every teammate gets consistent answers.
- **Reusable prompt files** — `.github/prompts/`: `/new-api-route` (route + schema + docs in our conventions), `/test-endpoint` (Vitest tests with Gemini mocked), `/log-copilot` (writes entries for this log).

## Log

| Time | Who | Copilot feature | What we asked | What it produced | What we changed | Time saved |
| --- | --- | --- | --- | --- | --- | --- |
|  | P2 | Agent mode | Scaffold a 3-tab layout with shadcn | Working tab shell | Renamed tabs, styling | ~20 min |
|  | P4 - Pashyanthi | Chat | Review AskWattWise.tsx for demo improvements | Suggested clearer savings estimate, numbered habit cards, CARE/FERA section, application links, and improved loading/error states | Used suggestions to guide the updated UI while preserving API integration and TypeScript types | Not measured |
|  | P4 - Pashyanthi | Chat | Review README.md for clarity and accuracy | Identified checks for feature accuracy, setup instructions, Gemini claims, sample bill disclaimer, and data sources | Used feedback to revise README documentation | Not measured |
|  | P4 - Pashyanthi | Chat | Review WattWise SD for potential demo issues | Recommended three priorities: successful API response, loading/error behavior, and TypeScript/runtime compatibility | Created a manual testing checklist for the demo | Not measured |