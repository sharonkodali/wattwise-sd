// Cost-by-hour math. OWNER: Person 3. Golden rule: every $ figure shown in the app comes from here, not from Gemini.
import rates from "@/data/rates.json";
import profile from "@/data/sd_load_profile_sample.json";

export type Season = "summer" | "winter";
export type Period = "onPeak" | "offPeak" | "superOffPeak";

/** Simplified SDG&E weekday TOU periods. TODO(P3): weekends/holidays and March-April midday super off-peak. */
export function periodForHour(hour: number): Period {
  if (hour >= 16 && hour < 21) return "onPeak";
  if (hour < 6) return "superOffPeak";
  return "offPeak";
}

export function hourlyCosts(season: Season = "summer", care = false, kwhByHour: number[] = profile.kwhByHour) {
  const r = rates[season];
  const factor = care ? 1 - rates.careDiscount : 1;
  return kwhByHour.map((kwh, hour) => {
    const period = periodForHour(hour);
    const rate = r[period] * factor;
    return { hour, label: `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`, kwh, period, rate, cost: +(kwh * rate).toFixed(3) };
  });
}

/** Summary numbers sent to /api/recommend and shown in Tab 2. */
export function usageStats(season: Season = "summer", shiftShare = 0.3) {
  const hours = hourlyCosts(season);
  const dailyCost = hours.reduce((s, h) => s + h.cost, 0);
  const peak = hours.filter((h) => h.period === "onPeak");
  const peakCost = peak.reduce((s, h) => s + h.cost, 0);
  const peakKwh = peak.reduce((s, h) => s + h.kwh, 0);
  // Savings if `shiftShare` of peak kWh moves to off-peak (after 9 PM).
  const r = rates[season];
  const dailySavings = peakKwh * shiftShare * (r.onPeak - r.offPeak);
  const worst = [...hours].sort((a, b) => b.cost - a.cost).slice(0, 3).map((h) => h.label);
  const cheapest = [...hours].sort((a, b) => a.cost - b.cost).slice(0, 3).map((h) => h.label);
  return {
    season,
    ratePlan: rates.plan,
    monthlyCost: +(dailyCost * 30).toFixed(2),
    peakSharePct: +((peakCost / dailyCost) * 100).toFixed(1),
    worstHours: worst,
    cheapestHours: cheapest,
    shiftSharePct: shiftShare * 100,
    monthlySavingsIfShifted: +(dailySavings * 30).toFixed(2),
    careMonthlySavings: +(dailyCost * 30 * rates.careDiscount).toFixed(2),
  };
}
