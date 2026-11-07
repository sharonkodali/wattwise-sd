// lib/analysis.ts
// All dollar math lives here. Gemini never calculates numbers; it only explains these.
// Pure functions (no fs), so they work in client components, server components and API routes.

import rates from "@/data/rates.json";
import avgDay from "@/data/sd_avg_day.json";
import grid from "@/data/caiso_today.json";

export type Season = "summer" | "winter";
export type Plan = "standard" | "care";
export type Period = "onPeak" | "offPeak" | "superOffPeak";
export type DayType = "weekday" | "weekdayMarchApril" | "weekendHoliday";

export const PERIOD_LABEL: Record<Period, string> = {
  onPeak: "On-peak (4–9 PM)",
  offPeak: "Off-peak",
  superOffPeak: "Super off-peak",
};

// Approximate 30-day month: 22 weekdays + 8 weekend days.
const WEEKDAYS_PER_MONTH = 22;
const WEEKEND_DAYS_PER_MONTH = 8;
const DAYS_PER_MONTH = WEEKDAYS_PER_MONTH + WEEKEND_DAYS_PER_MONTH;

export const SOURCES = {
  rates: `SDG&E Schedule TOU-DR1 Total Rates Table, effective ${rates.effectiveDate}`,
  usage: avgDay.label + " (OpenEI/NREL TMY3, San Diego Lindbergh Field)",
  grid: `CAISO Today's Outlook, ${grid.date}`,
};

// ---------- basics ----------

export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12} ${suffix}`;
}

export function currentSeason(date = new Date()): Season {
  return rates.seasons.summer.months.includes(date.getMonth() + 1) ? "summer" : "winter";
}

export function periodForHour(hour: number, dayType: DayType = "weekday"): Period {
  const p = rates.periods[dayType];
  if (p.onPeak.includes(hour)) return "onPeak";
  if (p.superOffPeak.includes(hour)) return "superOffPeak";
  return "offPeak";
}

export function rateFor(period: Period, season: Season, plan: Plan): number {
  return rates[plan][season][period];
}

export function money(n: number, digits = 2): string {
  return `$${n.toFixed(digits)}`;
}

// ---------- cost by hour ----------

export interface HourCost {
  hour: number;
  label: string;
  kwh: number;
  period: Period;
  rate: number;
  cost: number;
  isPeak: boolean;
}

export interface UsageOptions {
  season: Season;
  plan: Plan;
  dayType?: DayType;
  /** User's own average daily kWh (e.g. bill kWh / days in billing period). Scales the typical-home curve. */
  dailyKwh?: number;
}

/** Average kWh for each hour of the day, scaled to the user's usage if given. */
export function usageByHour(season: Season, dailyKwh?: number): number[] {
  const profile = avgDay[season] as number[];
  const scale = dailyKwh && dailyKwh > 0 ? dailyKwh / avgDay.dailyKwh[season] : 1;
  return profile.map((kwh) => kwh * scale);
}

/** Cost per hour = kWh × rate for that hour's TOU period. */
export function hourlyCosts({ season, plan, dayType = "weekday", dailyKwh }: UsageOptions): HourCost[] {
  return usageByHour(season, dailyKwh).map((kwh, hour) => {
    const period = periodForHour(hour, dayType);
    const rate = rateFor(period, season, plan);
    return { hour, label: hourLabel(hour), kwh, period, rate, cost: kwh * rate, isPeak: period === "onPeak" };
  });
}

export interface DaySummary {
  totalKwh: number;
  totalCost: number;
  peakKwh: number;
  peakCost: number;
  /** Share of the day's energy cost that falls 4–9 PM, 0–100. */
  peakCostPct: number;
  /** Share of the day's kWh used 4–9 PM, 0–100. */
  peakKwhPct: number;
}

export function summarizeDay(hours: HourCost[]): DaySummary {
  const totalKwh = sum(hours.map((h) => h.kwh));
  const totalCost = sum(hours.map((h) => h.cost));
  const peak = hours.filter((h) => h.isPeak);
  const peakKwh = sum(peak.map((h) => h.kwh));
  const peakCost = sum(peak.map((h) => h.cost));
  return {
    totalKwh,
    totalCost,
    peakKwh,
    peakCost,
    peakCostPct: totalCost ? (100 * peakCost) / totalCost : 0,
    peakKwhPct: totalKwh ? (100 * peakKwh) / totalKwh : 0,
  };
}

export interface MonthlyEstimate {
  energyCost: number;
  baseServicesCharge: number;
  total: number;
  peakCost: number;
  peakCostPct: number;
  kwh: number;
}

/**
 * Estimated monthly bill for SDG&E bundled service on TOU-DR1.
 * Excludes the baseline credit (depends on the home's allowance) and taxes/fees,
 * and does not model San Diego Community Power generation rates.
 */
export function monthlyEstimate(opts: Omit<UsageOptions, "dayType">): MonthlyEstimate {
  const weekday = summarizeDay(hourlyCosts({ ...opts, dayType: "weekday" }));
  const weekend = summarizeDay(hourlyCosts({ ...opts, dayType: "weekendHoliday" }));
  const energyCost = WEEKDAYS_PER_MONTH * weekday.totalCost + WEEKEND_DAYS_PER_MONTH * weekend.totalCost;
  const peakCost = WEEKDAYS_PER_MONTH * weekday.peakCost + WEEKEND_DAYS_PER_MONTH * weekend.peakCost;
  const baseServicesCharge = rates[opts.plan].baseServicesChargePerDay * DAYS_PER_MONTH;
  return {
    energyCost,
    baseServicesCharge,
    total: energyCost + baseServicesCharge,
    peakCost,
    peakCostPct: energyCost ? (100 * peakCost) / energyCost : 0,
    kwh: DAYS_PER_MONTH * weekday.totalKwh,
  };
}

/** Monthly $ saved by CARE vs. standard pricing for the same usage. */
export function careMonthlySavings(season: Season, dailyKwh?: number): number {
  return monthlyEstimate({ season, plan: "standard", dailyKwh }).total - monthlyEstimate({ season, plan: "care", dailyKwh }).total;
}

// ---------- savings from moving peak use ----------

export type ShiftTarget = "after9pm" | "overnight" | "weekendMorning" | "before4pm";

const TARGETS: Record<ShiftTarget, { period: Period; label: string }> = {
  after9pm: { period: "offPeak", label: "after 9 PM" },
  overnight: { period: "superOffPeak", label: "between midnight and 6 AM" },
  weekendMorning: { period: "superOffPeak", label: "on a weekend morning (before 2 PM)" },
  before4pm: { period: "offPeak", label: "before 4 PM" },
};

/** $ saved per kWh moved from on-peak to the target period. */
export function savingsPerKwh(target: ShiftTarget, season: Season, plan: Plan): number {
  return rateFor("onPeak", season, plan) - rateFor(TARGETS[target].period, season, plan);
}

/** Savings if a fraction (0–1) of daily 4–9 PM use moves to the target period every day. */
export function peakShiftSavings(fraction: number, target: ShiftTarget, opts: Omit<UsageOptions, "dayType">) {
  const peakKwhPerDay = summarizeDay(hourlyCosts({ ...opts, dayType: "weekday" })).peakKwh;
  const kwhPerMonth = peakKwhPerDay * fraction * DAYS_PER_MONTH;
  const monthly = kwhPerMonth * savingsPerKwh(target, opts.season, opts.plan);
  return { kwhPerMonth, monthlySavings: monthly, yearlySavings: monthly * 12 };
}

/** Typical-use estimates (not measured). Edit freely; every tip's $ comes from these × the real rates. */
export const APPLIANCES = [
  { id: "dryer", name: "Electric clothes dryer", kwhPerUse: 3.0, usesPerMonth: 12, unit: "load", targets: ["after9pm", "weekendMorning"] },
  { id: "dishwasher", name: "Dishwasher", kwhPerUse: 1.5, usesPerMonth: 20, unit: "load", targets: ["after9pm", "overnight"] },
  { id: "washer", name: "Washing machine (warm water)", kwhPerUse: 1.0, usesPerMonth: 12, unit: "load", targets: ["after9pm", "weekendMorning"] },
  { id: "ev", name: "EV charging", kwhPerUse: 10, usesPerMonth: 15, unit: "charge", targets: ["overnight"] },
  { id: "ac", name: "Air conditioning (pre-cool before 4 PM)", kwhPerUse: 1.5, usesPerMonth: 60, unit: "hour of AC", targets: ["before4pm"], seasons: ["summer"] },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  kwhPerUse: number;
  usesPerMonth: number;
  unit: string;
  targets: readonly ShiftTarget[];
  seasons?: readonly Season[];
}>;

export interface ShiftScenario {
  id: string;
  appliance: string;
  action: string;
  kwhPerMonth: number;
  fromLabel: string;
  toLabel: string;
  savingsPerKwh: number;
  monthlySavings: number;
  yearlySavings: number;
  assumption: string;
}

/** Every appliance × target combination, best savings first. */
export function shiftScenarios(season: Season, plan: Plan): ShiftScenario[] {
  const out: ShiftScenario[] = [];
  for (const a of APPLIANCES) {
    if ("seasons" in a && !(a.seasons as readonly Season[]).includes(season)) continue;
    for (const target of a.targets as readonly ShiftTarget[]) {
      const kwhPerMonth = a.kwhPerUse * a.usesPerMonth;
      const perKwh = savingsPerKwh(target, season, plan);
      const monthly = kwhPerMonth * perKwh;
      out.push({
        id: `${a.id}_${target}`,
        appliance: a.name,
        action: `Move ${a.name.toLowerCase()} use from 4–9 PM to ${TARGETS[target].label}`,
        kwhPerMonth,
        fromLabel: PERIOD_LABEL.onPeak,
        toLabel: `${PERIOD_LABEL[TARGETS[target].period]} (${TARGETS[target].label})`,
        savingsPerKwh: perKwh,
        monthlySavings: monthly,
        yearlySavings: monthly * 12,
        assumption: `${a.kwhPerUse} kWh per ${a.unit}, ${a.usesPerMonth} per month (typical estimate)`,
      });
    }
  }
  return out.sort((x, y) => y.monthlySavings - x.monthlySavings);
}

// ---------- grid (CAISO) ----------

export interface GridHour {
  hour: number;
  label: string;
  demandMW: number;
  renewablesPct: number;
  naturalGasMW: number;
  cost: number;
  isPeak: boolean;
}

/** CAISO grid data joined by hour with this household's cost curve. */
export function gridByHour(opts: UsageOptions): GridHour[] {
  const costs = hourlyCosts(opts);
  return grid.hours.map((g) => ({
    hour: g.hour,
    label: hourLabel(g.hour),
    demandMW: g.demandMW,
    renewablesPct: g.renewablesPct,
    naturalGasMW: g.naturalGasMW,
    cost: costs[g.hour].cost,
    isPeak: costs[g.hour].isPeak,
  }));
}

export function cleanestHours(n = 3): number[] {
  return [...grid.hours].sort((a, b) => b.renewablesPct - a.renewablesPct).slice(0, n).map((h) => h.hour).sort((a, b) => a - b);
}

export function dirtiestHours(n = 3): number[] {
  return [...grid.hours].sort((a, b) => a.renewablesPct - b.renewablesPct).slice(0, n).map((h) => h.hour).sort((a, b) => a - b);
}

// ---------- chart 3 ----------

export function seasonPlanComparison(dailyKwh?: number) {
  return (["summer", "winter"] as const).map((season) => ({
    season: season === "summer" ? "Summer" : "Winter",
    standard: monthlyEstimate({ season, plan: "standard", dailyKwh }).total,
    care: monthlyEstimate({ season, plan: "care", dailyKwh }).total,
  }));
}

// ---------- input for /api/recommend ----------

export interface RecommendationInput {
  season: Season;
  plan: Plan;
  ratesPerKwh: Record<Period, number>;
  monthlyBillEstimate: number;
  peakCostPct: number;
  peakKwhPct: number;
  scenarios: Pick<ShiftScenario, "id" | "action" | "monthlySavings" | "yearlySavings" | "assumption">[];
  generalShift: { description: string; monthlySavings: number };
  careMonthlySavings: number | null;
  cleanestGridHours: string[];
  dirtiestGridHours: string[];
  sources: typeof SOURCES;
}

export function buildRecommendationInput(season: Season, plan: Plan, dailyKwh?: number): RecommendationInput {
  const month = monthlyEstimate({ season, plan, dailyKwh });
  const day = summarizeDay(hourlyCosts({ season, plan, dailyKwh }));
  const shift = peakShiftSavings(0.2, "after9pm", { season, plan, dailyKwh });
  return {
    season,
    plan,
    ratesPerKwh: rates[plan][season],
    monthlyBillEstimate: round2(month.total),
    peakCostPct: Math.round(month.peakCostPct),
    peakKwhPct: Math.round(day.peakKwhPct),
    scenarios: shiftScenarios(season, plan).slice(0, 6).map((s) => ({
      id: s.id,
      action: s.action,
      monthlySavings: round2(s.monthlySavings),
      yearlySavings: round2(s.yearlySavings),
      assumption: s.assumption,
    })),
    generalShift: {
      description: "Move 20% of all 4–9 PM use to after 9 PM",
      monthlySavings: round2(shift.monthlySavings),
    },
    careMonthlySavings: plan === "standard" ? round2(careMonthlySavings(season, dailyKwh)) : null,
    cleanestGridHours: cleanestHours().map(hourLabel),
    dirtiestGridHours: dirtiestHours().map(hourLabel),
    sources: SOURCES,
  };
}

// ---------- helpers ----------

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
