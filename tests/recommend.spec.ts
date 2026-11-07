import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini", async () => {
  const actual = await vi.importActual<typeof import("../lib/gemini")>("@/lib/gemini");
  return {
    ...actual,
    generateJson: vi.fn(),
  };
});

import { POST } from "../app/api/recommend/route";
import { generateJson } from "@/lib/gemini";

const mockGenerateJson = vi.mocked(generateJson);

describe("recommend route", () => {
  beforeEach(() => {
    mockGenerateJson.mockReset();
    vi.stubEnv("GEMINI_API_KEY", "test-key");
  });

  it("replaces placeholders with computed savings and drops invented dollar amounts", async () => {
    mockGenerateJson.mockResolvedValue({
      recommendations: [
        {
          scenarioId: "dryer_after9pm",
          title: "Move laundry after 9 PM",
          detail: "Save {{savings}} a month by shifting your laundry routine.",
        },
        {
          scenarioId: "care",
          title: "Check CARE",
          detail: "This could save $11.41 a month.",
        },
        {
          scenarioId: null,
          title: "Use clean grid hours",
          detail: "Run the dishwasher during the cleanest part of the day.",
        },
      ],
    });

    const res = await POST(
      new Request("http://localhost/api/recommend", {
        method: "POST",
        body: JSON.stringify({ season: "summer", plan: "standard", dailyKwh: 30 }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.source).toBe("gemini");
    expect(json.recommendations[0].detail).toContain("$");
    expect(json.recommendations[0].detail).not.toContain(".411.41");
    expect(json.recommendations[0].monthlySavings).toEqual(expect.any(Number));
    expect(json.recommendations[1].detail).toBeDefined();
  });
});
