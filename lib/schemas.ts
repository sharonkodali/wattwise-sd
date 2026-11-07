// Shared types + JSON schemas. OWNER: Person 1. Everyone imports from here.

export type LineItem = {
  name: string;
  amount: number;
  category: "delivery" | "generation" | "fees_taxes" | "credit" | "gas" | "other";
  plainEnglish: string;
};

export type BillAnalysis = {
  billingPeriod: string;
  ratePlan: string;
  provider: "SDCP" | "SDG&E";
  totalDue: number;
  kwhByPeriod: { onPeak: number; offPeak: number; superOffPeak: number };
  lineItems: LineItem[];
  summary: string;
  topSavingTip: string;
  /** true when Gemini was unavailable and the server returned the saved result for a known demo bill. */
  cached?: boolean;
  /** Added by the server after extraction (not by Gemini). */
  checks?: {
    lineItemsSum: number;
    matchesTotal: boolean; // line items add up to totalDue within $1
    totalKwh: number;
    peakSharePct: number; // % of kWh used 4-9 PM
  };
};

export const SUPPORTED_LANGUAGES = ["English", "Spanish", "Vietnamese", "Tagalog", "Chinese (Simplified)", "Arabic"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type Recommendation = { title: string; detail: string; monthlySavings?: string };

export type AskResult = {
  plan: { habit: string; why: string; fix: string }[];
  savingsEstimate: string;
  careHint: string;
};

// JSON Schema passed to Gemini as `responseJsonSchema` so output always matches BillAnalysis.
export const billAnalysisJsonSchema = {
  type: "object",
  properties: {
    isUtilityBill: { type: "boolean", description: "false if the document is not an electric/gas utility bill" },
    billingPeriod: { type: "string" },
    ratePlan: { type: "string" },
    provider: { type: "string", enum: ["SDCP", "SDG&E"] },
    totalDue: { type: "number" },
    kwhByPeriod: {
      type: "object",
      properties: {
        onPeak: { type: "number" },
        offPeak: { type: "number" },
        superOffPeak: { type: "number" },
      },
      required: ["onPeak", "offPeak", "superOffPeak"],
    },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "number" },
          category: {
            type: "string",
            enum: ["delivery", "generation", "fees_taxes", "credit", "gas", "other"],
          },
          plainEnglish: { type: "string" },
        },
        required: ["name", "amount", "category", "plainEnglish"],
      },
    },
    summary: { type: "string" },
    topSavingTip: { type: "string" },
  },
  required: ["isUtilityBill", "billingPeriod", "ratePlan", "provider", "totalDue", "kwhByPeriod", "lineItems", "summary", "topSavingTip"],
} as const;

export const recommendationsJsonSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          monthlySavings: { type: "string" },
        },
        required: ["title", "detail"],
      },
    },
  },
  required: ["recommendations"],
} as const;

export const askJsonSchema = {
  type: "object",
  properties: {
    plan: {
      type: "array",
      items: {
        type: "object",
        properties: { habit: { type: "string" }, why: { type: "string" }, fix: { type: "string" } },
        required: ["habit", "why", "fix"],
      },
    },
    savingsEstimate: { type: "string" },
    careHint: { type: "string" },
  },
  required: ["plan", "savingsEstimate", "careHint"],
} as const;
