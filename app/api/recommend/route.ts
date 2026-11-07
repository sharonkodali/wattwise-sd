// POST { stats } (computed by lib/analysis.ts) -> { recommendations[] }. OWNER: Person 3.
import { NextResponse } from "next/server";
import { friendlyError, generateJson } from "@/lib/gemini";
import { recommendationsJsonSchema, type Recommendation } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { stats } = await req.json().catch(() => ({}));
    if (!stats || typeof stats !== "object" || Object.keys(stats).length === 0) {
      return NextResponse.json({ error: "stats are required (use usageStats() from lib/analysis.ts)" }, { status: 400 });
    }
    const result = await generateJson<{ recommendations: Recommendation[] }>({
      system: `You are an energy coach for San Diego households on SDG&E time-of-use pricing (on-peak is 4-9 PM).
Give 3-4 specific, practical recommendations based ONLY on the numbers provided.
- Dollar amounts: use ONLY figures from the input, and attach each figure to ONE recommendation (never repeat the same
  figure on two tips). Leave "monthlySavings" empty for tips without a matching input figure.
- Be realistic: suggest "after 9 PM", "before 4 PM", or using appliance delay-start timers. Never tell people to wake up
  at night to run appliances.
- Name specific appliances (dryer, dishwasher, EV charger, AC) and times.
- Never suggest turning off cooling for older adults or anyone at health risk during hot weather; suggest pre-cooling instead.
- If "careMonthlySavings" is present, one tip should be checking CARE eligibility at https://www.sdge.com/care.`,
      parts: [{ text: JSON.stringify(stats) }],
      schema: recommendationsJsonSchema,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

export const maxDuration = 120;
