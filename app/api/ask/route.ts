// POST { description } -> AskResult. OWNER: Person 4.
import { NextResponse } from "next/server";
import { friendlyError, generateJson, SDGE_GLOSSARY } from "@/lib/gemini";
import { askJsonSchema, type AskResult } from "@/lib/schemas";
import assistance from "@/data/assistance.json";

export async function POST(req: Request) {
  try {
    const { description } = (await req.json()) as { description: string };
    if (!description?.trim()) return NextResponse.json({ error: "Please describe your home" }, { status: 400 });
    const result = await generateJson<AskResult>({
      system: `You help San Diego residents lower their SDG&E electric bill. From the user's description, list the 3-5 habits
most likely costing them money (focus on 4-9 PM peak use), why, and a concrete fix. Give a realistic monthly savings RANGE.
In "careHint", say whether they might qualify for CARE or FERA using these program details and link to apply; if income is
unknown, explain what to check. These are estimates, not financial advice.
Program details: ${JSON.stringify(assistance)}
Glossary:${SDGE_GLOSSARY}`,
      parts: [{ text: description.slice(0, 4000) }],
      schema: askJsonSchema,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}

export const maxDuration = 120;
