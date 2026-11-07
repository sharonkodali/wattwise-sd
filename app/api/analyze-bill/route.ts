// POST multipart form-data { file } -> BillAnalysis. OWNER: Person 1.
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { friendlyError, generateJson, SDGE_GLOSSARY } from "@/lib/gemini";
import { billAnalysisJsonSchema, type BillAnalysis } from "@/lib/schemas";
import demoCache from "@/data/demo-cache.json";

export const maxDuration = 120;

// Last good results for our two demo bills, keyed by file SHA-256. Used only when Gemini fails on that exact file,
// so a Gemini outage during judging can't break the demo. Responses say `cached: true` when this is used.
const DEMO_RESULTS = demoCache.bills as Record<string, { source: string; analysis: BillAnalysis }>;
// Warm-instance cache: re-uploading the same file returns instantly.
const recent = new Map<string, BillAnalysis>();

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];
// Vercel rejects request bodies over 4.5 MB before they reach this code. The frontend should shrink big photos first.
const MAX_BYTES = 4.4 * 1024 * 1024;

const SYSTEM_PROMPT = `You read San Diego Gas & Electric (SDG&E) residential bills and explain them to people with no energy background.

EXTRACTION RULES
- Set "isUtilityBill" to false if the document is not an electric or gas utility bill; then fill other fields with empty values.
- Extract every charge and credit line exactly as printed, in the order printed. Credits are negative numbers.
- Do not include subtotal or total lines ("Total Electric Delivery", "Total Electric Charges") as line items.
- Never invent numbers. If a value is not on the bill, use 0 (or "" for text).
- "provider" is "SDCP" if San Diego Community Power (or any Community Choice provider) supplies generation, else "SDG&E".
- "kwhByPeriod": kWh used on-peak (4-9 PM), off-peak and super off-peak, from the usage lines.
- "totalDue": the total amount due for this statement.
- "previousBalance": unpaid amount carried over from earlier bills = previous balance minus payments received
  (0 if fully paid or not shown). Previous balance, payments and subtotals are NOT line items.
- category: delivery (SDG&E wires/usage/base services), generation (power supply), credit (any negative line),
  fees_taxes (PCIA, wildfire fund, taxes, regulatory/franchise fees), gas, other.

EXPLANATION RULES
- "plainEnglish": 1-2 short sentences, 6th-grade reading level, say WHY the person pays it. Explain that the SDG&E
  generation credit cancels SDG&E's own generation charge (not a double charge) when relevant.
- "summary": 2-3 sentences on what drove this bill, mentioning the share of usage during 4-9 PM.
- "topSavingTip": one specific action tied to THIS bill's numbers.

GLOSSARY${SDGE_GLOSSARY}`;

type GeminiBill = BillAnalysis & { isUtilityBill: boolean };

export async function POST(req: Request) {
  let hash = "";
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: "Please upload a PDF or a photo (JPG, PNG, WEBP, HEIC)." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 4.4 MB). Try a smaller photo or the PDF." }, { status: 413 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    hash = createHash("sha256").update(bytes).digest("hex");
    const seen = recent.get(hash);
    if (seen) return NextResponse.json(seen);

    const data = bytes.toString("base64");
    const { isUtilityBill, ...bill } = await generateJson<GeminiBill>({
      system: SYSTEM_PROMPT,
      parts: [{ inlineData: { mimeType: file.type, data } }, { text: "Analyze this bill." }],
      schema: billAnalysisJsonSchema,
    });
    if (!isUtilityBill) {
      return NextResponse.json({ error: "That doesn't look like a utility bill. Please upload an SDG&E bill." }, { status: 422 });
    }

    // Server-side sanity checks (our code does the math, not Gemini).
    const lineItemsSum = +bill.lineItems.reduce((s, i) => s + i.amount, 0).toFixed(2);
    const { onPeak, offPeak, superOffPeak } = bill.kwhByPeriod;
    const totalKwh = onPeak + offPeak + superOffPeak;
    const result: BillAnalysis = {
      ...bill,
      checks: {
        lineItemsSum,
        // Current charges = amount due minus any unpaid balance carried over from earlier bills.
        matchesTotal: Math.abs(lineItemsSum - (bill.totalDue - (bill.previousBalance ?? 0))) <= 1,
        totalKwh,
        peakSharePct: totalKwh ? +((onPeak / totalKwh) * 100).toFixed(1) : 0,
      },
    };
    if (recent.size > 100) recent.clear();
    recent.set(hash, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    const demo = hash ? DEMO_RESULTS[hash] : undefined;
    if (demo) {
      console.warn(`[analyze-bill] Gemini failed; serving saved result for ${demo.source}`);
      return NextResponse.json({ ...demo.analysis, cached: true });
    }
    return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
  }
}
