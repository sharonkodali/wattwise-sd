// POST { analysis: BillAnalysis, language: string } -> BillAnalysis (text translated, numbers unchanged). OWNER: Person 1.
import { NextResponse } from "next/server";
import { friendlyError, generateJson } from "@/lib/gemini";
import { billAnalysisJsonSchema, type BillAnalysis } from "@/lib/schemas";

export async function POST(req: Request) {
  try {
    const { analysis, language } = (await req.json()) as { analysis: BillAnalysis; language: string };
    if (!analysis || !language) return NextResponse.json({ error: "analysis and language are required" }, { status: 400 });
    const translated = await generateJson<BillAnalysis>({
      system: `Translate the text fields (name, plainEnglish, summary, topSavingTip, billingPeriod) of this JSON into ${language}.
Keep it simple and friendly. Do NOT change any numbers, enum values, "provider" or "ratePlan". Return the same JSON shape.`,
      parts: [{ text: JSON.stringify(analysis) }],
      schema: billAnalysisJsonSchema,
    });
    return NextResponse.json(translated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
