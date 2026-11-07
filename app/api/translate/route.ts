// POST { analysis: BillAnalysis, language: string } -> BillAnalysis (text translated, numbers unchanged). OWNER: Person 1.
// Only the text fields are sent to Gemini. Numbers are copied back from the original on the server,
// so a translation can never change a dollar amount.
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { friendlyError, generateJson } from "@/lib/gemini";
import { SUPPORTED_LANGUAGES, type BillAnalysis } from "@/lib/schemas";

export const maxDuration = 120;

type TextFields = {
  billingPeriod: string;
  summary: string;
  topSavingTip: string;
  lineItems: { name: string; plainEnglish: string }[];
};

const textSchema = {
  type: "object",
  properties: {
    billingPeriod: { type: "string" },
    summary: { type: "string" },
    topSavingTip: { type: "string" },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, plainEnglish: { type: "string" } },
        required: ["name", "plainEnglish"],
      },
    },
  },
  required: ["billingPeriod", "summary", "topSavingTip", "lineItems"],
} as const;

// Warm-instance cache so switching languages back and forth during the demo is instant.
const cache = new Map<string, BillAnalysis>();

export async function POST(req: Request) {
  try {
    const { analysis, language } = (await req.json()) as { analysis: BillAnalysis; language: string };
    if (!analysis?.lineItems || !language) {
      return NextResponse.json({ error: "analysis and language are required" }, { status: 400 });
    }
    if (!(SUPPORTED_LANGUAGES as readonly string[]).includes(language)) {
      return NextResponse.json({ error: `Unsupported language. Use one of: ${SUPPORTED_LANGUAGES.join(", ")}` }, { status: 400 });
    }
    if (language === "English") return NextResponse.json(analysis);

    const text: TextFields = {
      billingPeriod: analysis.billingPeriod,
      summary: analysis.summary,
      topSavingTip: analysis.topSavingTip,
      lineItems: analysis.lineItems.map(({ name, plainEnglish }) => ({ name, plainEnglish })),
    };
    const key = createHash("sha256").update(language + JSON.stringify(text)).digest("hex");
    const hit = cache.get(key);
    if (hit) return NextResponse.json(hit);

    const out = await generateJson<TextFields>({
      system: `Translate every string value in this JSON into ${language}. Use simple, friendly words a family would use at home.
Keep the same order and the same number of lineItems. Keep acronyms like SDG&E, PCIA, kWh and TOU as they are.
Keep any numbers, dates and dollar amounts inside the text exactly as written.`,
      parts: [{ text: JSON.stringify(text) }],
      schema: textSchema,
    });
    if (out.lineItems?.length !== analysis.lineItems.length) {
      throw new Error("Translation returned a different number of line items");
    }

    const translated: BillAnalysis = {
      ...analysis, // numbers, provider, ratePlan, kwhByPeriod, categories all come from the original
      billingPeriod: out.billingPeriod,
      summary: out.summary,
      topSavingTip: out.topSavingTip,
      lineItems: analysis.lineItems.map((item, i) => ({
        ...item,
        name: out.lineItems[i].name,
        plainEnglish: out.lineItems[i].plainEnglish,
      })),
    };
    if (cache.size > 200) cache.clear();
    cache.set(key, translated);
    return NextResponse.json(translated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
