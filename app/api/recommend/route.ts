// POST { stats } (computed by lib/analysis.ts) -> { recommendations[] }. OWNER: Person 3.
import { NextResponse } from "next/server";
import { friendlyError, generateJson } from "@/lib/gemini";
import { recommendationsJsonSchema, type Recommendation } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { stats } = await req.json();
    const result = await generateJson<{ recommendations: Recommendation[] }>({
      system: `You are an energy coach for San Diego households on SDG&E time-of-use pricing.
Give 3-5 specific, practical recommendations based ONLY on the numbers provided. Use the provided dollar figures;
never invent new numbers. Mention specific appliances and times (e.g. "run the dishwasher after 9 PM").`,
      parts: [{ text: JSON.stringify(stats) }],
      schema: recommendationsJsonSchema,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
