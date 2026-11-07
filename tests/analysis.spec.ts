import { describe, expect, it } from "vitest";
import { hourlyCosts, periodForHour, summarizeDay } from "../lib/analysis";

describe("analysis math", () => {
  it("treats 4–9 PM as on-peak every weekday", () => {
    for (let hour = 16; hour <= 20; hour += 1) {
      expect(periodForHour(hour, "weekday")).toBe("onPeak");
    }
    expect(periodForHour(15, "weekday")).toBe("offPeak");
    expect(periodForHour(21, "weekday")).toBe("offPeak");
  });

  it("keeps cost totals consistent across the full day", () => {
    const hours = hourlyCosts({ season: "summer", plan: "standard", dailyKwh: 20 });
    const summary = summarizeDay(hours);
    const totalCost = hours.reduce((sum, hour) => sum + hour.cost, 0);

    expect(Math.abs(totalCost - summary.totalCost)).toBeLessThan(1e-9);
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.peakCost).toBeGreaterThan(0);
  });
});
