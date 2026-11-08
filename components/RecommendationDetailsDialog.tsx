"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  careMonthlySavings,
  cleanestHours,
  hourLabel,
  money,
  peakShiftSavings,
  rateFor,
  savingsPerKwh,
  shiftScenarios,
  type Plan,
  type Season,
} from "@/lib/analysis";
import type { Recommendation } from "@/app/api/recommend/route";
import rates from "@/data/rates.json";
import avgDay from "@/data/sd_avg_day.json";
import grid from "@/data/caiso_today.json";

type Props = {
  recommendation: Recommendation;
  rank: number;
  season: Season;
  plan: Plan;
  dailyKwh?: number;
};

export function RecommendationDetailsDialog({ recommendation, rank, season, plan, dailyKwh }: Props) {
  const isCare = recommendation.scenarioId === "care";
  const isGeneralShift = recommendation.scenarioId === "general_shift";
  const scenario = recommendation.scenarioId && !isCare && !isGeneralShift
    ? shiftScenarios(season, plan).find(({ id }) => id === recommendation.scenarioId)
    : undefined;
  const isGridAdvice = recommendation.scenarioId == null &&
    /grid|renewable|cleaner|cleanest/i.test(`${recommendation.title} ${recommendation.detail}`);
  const generalShift = isGeneralShift
    ? peakShiftSavings(0.2, "after9pm", { season, plan, dailyKwh })
    : undefined;
  const topGridHours = isGridAdvice
    ? cleanestHours().map((hour) => ({
        hour,
        renewableShare: grid.hours.find((entry) => entry.hour === hour)?.renewablesPct ?? 0,
      }))
    : [];
  const sources = scenario
    ? [{ label: `SDG&E Schedule TOU-DR1 ${plan === "care" ? "CARE " : ""}rates, effective ${rates.effectiveDate}`, href: rates.sources[plan] }]
    : isCare
      ? [
          { label: `SDG&E Schedule TOU-DR1 rates, effective ${rates.effectiveDate}`, href: rates.sources.standard },
          { label: `SDG&E Schedule TOU-DR1 CARE rates, effective ${rates.effectiveDate}`, href: rates.sources.care },
          { label: "OpenEI/NREL San Diego modeled home usage profile", href: avgDay.sourceUrl },
        ]
      : isGeneralShift
        ? [
            { label: `SDG&E Schedule TOU-DR1 rates, effective ${rates.effectiveDate}`, href: rates.sources[plan] },
            { label: "OpenEI/NREL San Diego modeled home usage profile", href: avgDay.sourceUrl },
          ]
        : isGridAdvice
          ? grid.sourceUrls.map((href, index) => ({
              label: index === 0 ? "CAISO hourly demand data" : "CAISO hourly energy mix data",
              href,
            }))
          : [];
  const generalShiftSavingsPerKwh = savingsPerKwh("after9pm", season, plan);
  const careSavings = isCare ? careMonthlySavings(season, dailyKwh) : null;

  return (
    <Dialog>
      <DialogTrigger className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left text-card-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{recommendation.title}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{recommendation.detail}</span>
          <span className="mt-2 block text-xs font-medium text-primary">View why this was recommended</span>
        </span>
        {recommendation.monthlySavings != null && (
          <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-sm font-semibold text-secondary-foreground">
            {money(recommendation.monthlySavings)}/mo
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <p className="mb-1 text-xs text-muted-foreground">
          Recommendation {rank} · {season} · {plan === "care" ? "CARE" : "Standard"} plan
        </p>
        <DialogTitle className="pr-8 text-lg font-semibold">{recommendation.title}</DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-relaxed text-muted-foreground">{recommendation.detail}</DialogDescription>

        <section className="mt-4 rounded-lg border bg-muted p-4" aria-labelledby={`recommendation-evidence-${rank}`}>
          <h3 id={`recommendation-evidence-${rank}`} className="mb-2 font-medium">Why this was recommended</h3>
          {scenario && (
            <>
              <p className="text-sm leading-relaxed">
                This estimate assumes {scenario.assumption}. Moving that use from {scenario.fromLabel} to {scenario.toLabel}
                {" "}changes the energy rate from {money(rateFor("onPeak", season, plan), 3)}/kWh to{" "}
                {money(rateFor(scenario.toLabel.includes("Super") ? "superOffPeak" : "offPeak", season, plan), 3)}/kWh.
              </p>
              <p className="mt-3 rounded-md border-l-4 border-accent bg-card p-3 text-sm font-semibold">
                {scenario.kwhPerMonth.toFixed(1)} kWh/month × {money(scenario.savingsPerKwh, 3)}/kWh
                {" = "}{money(scenario.monthlySavings)}/month estimated savings.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Appliance use is a WattWise estimate, not measured usage. Actual savings depend on your appliance,
                schedule, and bill.
              </p>
            </>
          )}
          {isGeneralShift && generalShift && (
            <>
              <p className="text-sm leading-relaxed">
                This estimate assumes shifting 20% of typical 4–9 PM electricity use to after 9 PM. The selected
                {` ${plan === "care" ? "CARE" : "Standard"} ${season} `}rate is {money(generalShiftSavingsPerKwh, 3)}/kWh lower after 9 PM.
              </p>
              <p className="mt-3 rounded-md border-l-4 border-accent bg-card p-3 text-sm font-semibold">
                {generalShift.kwhPerMonth.toFixed(1)} kWh/month shifted × {money(generalShiftSavingsPerKwh, 3)}/kWh
                {" = "}{money(generalShift.monthlySavings)}/month estimated savings.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {dailyKwh
                  ? `The usage profile is scaled to ${dailyKwh.toFixed(1)} kWh/day from your bill.`
                  : "Usage is based on a modeled San Diego home, not meter readings."}
                {" "}This estimate excludes taxes, fees, baseline credits, and separate community-power generation charges.
              </p>
            </>
          )}
          {isCare && careSavings != null && (
            <>
              <p className="text-sm leading-relaxed">
                CARE pricing may lower eligible households&apos; bills. We compare the same estimated usage at Standard
                and CARE rates for {season}; the base services charge is included in this comparison.
              </p>
              <p className="mt-3 rounded-md border-l-4 border-accent bg-card p-3 text-sm font-semibold">
                Standard-to-CARE rate comparison: {money(careSavings)}/month estimated difference.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                CARE has eligibility requirements. Usage is {dailyKwh ? "scaled to your bill's daily average" : "modeled for a typical San Diego home"}.
                {" "}Taxes, fees, baseline credits, and separate community-power generation charges are excluded.
              </p>
            </>
          )}
          {isGridAdvice && (
            <>
              <p className="text-sm leading-relaxed">
                The latest CAISO snapshot in this app is dated {grid.date}. The hours below had the highest renewable
                share in that day&apos;s dataset:
              </p>
              <ul className="mt-3 space-y-2">
                {topGridHours.map(({ hour, renewableShare }) => (
                  <li key={hour} className="flex justify-between gap-3 rounded-md bg-card p-2 text-sm">
                    <span>{hourLabel(hour)}</span><strong>{renewableShare.toFixed(1)}% renewable</strong>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Grid mix varies by day. This is historical California grid data, not a live forecast, and this suggestion
                does not include a bill-savings estimate.
              </p>
            </>
          )}
          {!scenario && !isGeneralShift && !isCare && !isGridAdvice && (
            <>
              <p className="text-sm leading-relaxed">
                This is a practical tip without a verified dollar estimate. We don&apos;t show bill savings unless there
                is a matching calculation from the rate and usage data.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">The explanation above describes the suggested action; it is not a measured result from your meter.</p>
            </>
          )}
        </section>

        {sources.length > 0 && (
          <section className="mt-4" aria-labelledby={`recommendation-sources-${rank}`}>
            <h3 id={`recommendation-sources-${rank}`} className="mb-2 font-medium">Sources</h3>
            <ul className="space-y-2 text-sm">
              {sources.map((source) => (
                <li key={source.href}>
                  <a className="text-primary underline underline-offset-2" href={source.href} target="_blank" rel="noreferrer">
                    {source.label}
                  </a>
                </li>
              ))}
            </ul>
            {(isGeneralShift || isCare) && (
              <p className="mt-2 text-xs text-muted-foreground">
                Usage profile: {avgDay.label}.
              </p>
            )}
            {scenario && (
              <p className="mt-2 text-xs text-muted-foreground">Appliance-use figures are WattWise estimates, not usage reported by SDG&amp;E.</p>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
