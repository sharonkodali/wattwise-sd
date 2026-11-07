// POST multipart form-data { file } -> BillAnalysis. OWNER: Person 1.
import { NextResponse } from "next/server";
import { generateJson, SDGE_GLOSSARY } from "@/lib/gemini";
import { billAnalysisJsonSchema, type BillAnalysis } from "@/lib/schemas";

export const maxDuration = 60;

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 400 });

    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const analysis = await generateJson<BillAnalysis>({
      system: `You read San Diego Gas & Electric (SDG&E) residential bills and explain them to people with no energy background.
Extract every charge exactly as printed. Never invent numbers; if a value is missing use 0.
For each line item, write "plainEnglish" in 1-2 short sentences at a 6th-grade reading level.
"summary": 2-3 sentences on what drove this bill. "topSavingTip": one specific action tied to this bill.
Glossary:${SDGE_GLOSSARY}`,
      parts: [{ inlineData: { mimeType: file.type, data } }, { text: "Analyze this bill." }],
      schema: billAnalysisJsonSchema,
    });
    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Analysis failed" }, { status: 500 });
  }
}
