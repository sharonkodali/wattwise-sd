import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini", async () => {
  const actual = await vi.importActual<typeof import("../lib/gemini")>("@/lib/gemini");
  return {
    ...actual,
    generateJson: vi.fn(),
    friendlyError: actual.friendlyError,
  };
});

import { POST } from "../app/api/translate/route";
import { generateJson } from "@/lib/gemini";

const mockGenerateJson = vi.mocked(generateJson);

describe("translate route", () => {
  beforeEach(() => {
    mockGenerateJson.mockReset();
  });

  it("keeps dollar amounts and usage values unchanged after translation", async () => {
    mockGenerateJson.mockResolvedValue({
      billingPeriod: "Período de facturación",
      summary: "Resumen traducido",
      topSavingTip: "Consejo traducido",
      lineItems: [
        { name: "Uso de la tarde", plainEnglish: "Su uso entre 4 y 9 PM" },
        { name: "Cargo base", plainEnglish: "Cargo fijo mensual" },
      ],
    });

    const analysis = {
      billingPeriod: "Sep 12 - Oct 11, 2026",
      ratePlan: "TOU-DR1",
      provider: "SDCP",
      totalDue: 171.1,
      kwhByPeriod: { onPeak: 62, offPeak: 180, superOffPeak: 148 },
      lineItems: [
        { name: "On-Peak usage (4-9 PM)", amount: 37.2, category: "delivery", plainEnglish: "Power you used between 4 and 9 PM." },
        { name: "Base Services Charge", amount: 24.0, category: "fees_taxes", plainEnglish: "Fixed monthly fee." },
      ],
      summary: "Most of this bill comes from evening use.",
      topSavingTip: "Run laundry after 9 PM.",
    } as const;

    const res = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        body: JSON.stringify({ analysis, language: "Spanish" }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.totalDue).toBe(171.1);
    expect(json.lineItems[0].amount).toBe(37.2);
    expect(json.kwhByPeriod).toEqual({ onPeak: 62, offPeak: 180, superOffPeak: 148 });
    expect(json.summary).toBe("Resumen traducido");
  });

  it("rejects unsupported languages", async () => {
    const analysis = {
      billingPeriod: "Sep 12 - Oct 11, 2026",
      ratePlan: "TOU-DR1",
      provider: "SDCP",
      totalDue: 171.1,
      kwhByPeriod: { onPeak: 62, offPeak: 180, superOffPeak: 148 },
      lineItems: [{ name: "Test", amount: 10, category: "delivery", plainEnglish: "Test" }],
      summary: "Summary",
      topSavingTip: "Tip",
    };

    const res = await POST(
      new Request("http://localhost/api/translate", {
        method: "POST",
        body: JSON.stringify({ analysis, language: "Klingon" }),
      })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Unsupported language");
  });
});
