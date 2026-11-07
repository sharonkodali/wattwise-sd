// Gemini client + helper. OWNER: Person 1. Server-only: never import this in a "use client" file.
import { GoogleGenAI, type Part } from "@google/genai";

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"; // check AI Studio for the newest Flash model

let client: GoogleGenAI | null = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set (add it to .env.local and Vercel)");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Call Gemini and get JSON back that matches `schema`. */
export async function generateJson<T>(opts: {
  system: string;
  parts: Part[];
  schema: unknown;
}): Promise<T> {
  const res = await getClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: opts.parts }],
    config: {
      systemInstruction: opts.system,
      responseMimeType: "application/json",
      responseJsonSchema: opts.schema,
      temperature: 0.3,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini returned an empty response");
  return JSON.parse(text) as T;
}

/** Plain-English glossary of SDG&E bill terms, included in prompts so explanations are accurate. */
export const SDGE_GLOSSARY = `
- TOU-DR1 / TOU-DR2 / EV-TOU: time-of-use rate plans. On-peak is 4-9 PM every day (most expensive).
- Electric Delivery: SDG&E's charge to move power over its wires. Everyone pays this.
- Electric Generation: the power itself. If the customer is with San Diego Community Power (SDCP), SDCP charges for it
  and SDG&E shows a "generation credit" that cancels SDG&E's own generation charge, so it is NOT a double charge.
- PCIA (Power Charge Indifference Adjustment): fee Community Power customers pay for power contracts SDG&E signed before they switched.
- Base Services Charge: fixed monthly charge (since Oct 2025) for grid costs like meters and transformers.
- Baseline adjustment credit: discount on the first block of usage each month, based on climate zone.
- California Climate Credit: credit that appears on some bills (typically spring and fall).
- Wildfire Fund charge: state charge that funds wildfire liability costs.
- CARE: about 30-35% discount for income-qualified households. FERA: about 18% for slightly higher incomes.
`;
