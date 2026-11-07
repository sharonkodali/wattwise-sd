// app/api/recommend/route.ts
// POST { season, plan, dailyKwh? } -> { recommendations: Recommendation[], source: "gemini" | "fallback" }
// The server computes every number with lib/analysis.ts, sends only those numbers to Gemini,
// then overwrites any dollar amount in Gemini's answer with the computed value.

import { NextResponse } from "next/server";
import { generateJson } from "@/lib/gemini";
import { buildRecommendationInput, money, type Plan, type RecommendationInput, type Season } from "@/lib/analysis";

// Note: no `runtime` export — it isn't allowed with `cacheComponents` in next.config.ts (Node.js is the default).
export const maxDuration = 120;

export interface Recommendation {
  /** Scenario id from lib/analysis, "general_shift", "care", or null for a no-dollar tip. */
  scenarioId: string | null;
  title: string;
  detail: string;
  /** Always set by our code, never by Gemini. */
  monthlySavings: number | null;
}

// Model, timeouts, retries and fallback models come from generateJson() in lib/gemini.ts.
const responseSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      description: "3 to 5 tips",
      items: {
        type: "object",
        properties: {
          scenarioId: { type: ["string", "null"], description: "id from the input, 'general_shift', 'care', or null" },
          title: { type: "string", description: "Short imperative, max 8 words, no dollar amounts" },
          detail: { type: "string", description: "1-2 friendly sentences. Use {{savings}} where the monthly dollar amount goes." },
        },
        required: ["scenarioId", "title", "detail"],
      },
    },
  },
  required: ["recommendations"],
} as const;

function buildPrompt(input: RecommendationInput): string {
  return `You are WattWise SD, a friendly energy coach for San Diego households on SDG&E's TOU-DR1 time-of-use plan.

Write 3 to 5 specific, practical tips using ONLY the numbers in the JSON below. These numbers were calculated by our code from SDG&E's official rates. Rules:
- Each tip must be tied to one item: a scenario "id", "general_shift", "care" (only if careMonthlySavings is not null), or null for a tip with no dollar amount (e.g. using power during the cleanest grid hours). At most one null tip.
- Never write a dollar amount yourself. Put the placeholder {{savings}} in "detail" where the monthly amount belongs; our code fills it in.
- Prefer the scenarios with the biggest savings. Don't repeat the same appliance twice.
- Mention the time window to move to (e.g. "after 9 PM", "Saturday morning").
- Plain language a student or a non-expert can follow. No jargon.
- Never tell people to wake up at night to run appliances; suggest delay-start timers instead.
- Never suggest turning off cooling for older adults or anyone at health risk in hot weather; suggest pre-cooling.

Data:
${JSON.stringify(input, null, 2)}`;
}

/** Replace placeholders/any $ figures with the computed amount, so Gemini can't invent numbers. */
function attachNumbers(raw: { scenarioId: string | null; title: string; detail: string }[], input: RecommendationInput): Recommendation[] {
  const amounts = new Map<string, number>(input.scenarios.map((s) => [s.id, s.monthlySavings]));
  amounts.set("general_shift", input.generalShift.monthlySavings);
  if (input.careMonthlySavings != null) amounts.set("care", input.careMonthlySavings);

  const out: Recommendation[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const id = r.scenarioId && r.scenarioId !== "null" ? r.scenarioId : null;
    if (id && (!amounts.has(id) || seen.has(id))) continue; // unknown or duplicate id: drop
    if (id) seen.add(id);
    const amount = id ? amounts.get(id)! : null;
    const fill = (s: string) =>
      amount != null ? s.replaceAll("{{savings}}", money(amount)).replace(/\$\d[\d,]*(\.\d+)?/g, money(amount)) : s.replaceAll("{{savings}}", "");
    if (amount == null && /\$\d/.test(r.detail + r.title)) continue; // no-dollar tip that made up a number: drop
    out.push({ scenarioId: id, title: fill(r.title).trim(), detail: fill(r.detail).trim(), monthlySavings: amount });
  }
  return out.slice(0, 5);
}

/** Template tips if Gemini is down or rate-limited, so the demo never shows an empty card. */
function fallback(input: RecommendationInput): Recommendation[] {
  const tips: Recommendation[] = input.scenarios.slice(0, 3).map((s) => ({
    scenarioId: s.id,
    title: s.action,
    detail: `Saves about ${money(s.monthlySavings)} a month (${money(s.yearlySavings)} a year). Assumes ${s.assumption}.`,
    monthlySavings: s.monthlySavings,
  }));
  if (input.careMonthlySavings != null) {
    tips.push({
      scenarioId: "care",
      title: "Check if you qualify for CARE",
      detail: `If your household income is under the limit, CARE would cut this bill by about ${money(input.careMonthlySavings)} a month.`,
      monthlySavings: input.careMonthlySavings,
    });
  }
  return tips;
}

export async function POST(req: Request) {
  let body: { season?: Season; plan?: Plan; dailyKwh?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const season: Season = body.season === "summer" ? "summer" : "winter";
  const plan: Plan = body.plan === "care" ? "care" : "standard";
  const dailyKwh = typeof body.dailyKwh === "number" && body.dailyKwh > 0 && body.dailyKwh < 500 ? body.dailyKwh : undefined;

  const input = buildRecommendationInput(season, plan, dailyKwh);

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ recommendations: fallback(input), source: "fallback" });
  }

  try {
    const parsed = await generateJson<{ recommendations?: { scenarioId: string | null; title: string; detail: string }[] }>({
      system: buildPrompt(input),
      parts: [{ text: "Write the tips." }],
      schema: responseSchema,
    });
    const recs = attachNumbers(parsed.recommendations ?? [], input);
    if (recs.length < 3) throw new Error(`Only ${recs.length} usable tips`);
    return NextResponse.json({ recommendations: recs, source: "gemini" });
  } catch (err) {
    console.error("[recommend] Gemini failed, using fallback:", err);
    return NextResponse.json({ recommendations: fallback(input), source: "fallback" });
  }
}
