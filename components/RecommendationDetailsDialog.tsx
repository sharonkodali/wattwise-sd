"use client";

import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
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
      <DialogTrigger className="recommendation-row">
        <span className="recommendation-rank" aria-label={`Move ${rank}`}>
          {rank === 1 ? <ArrowUp size={17} aria-hidden="true" /> : <span>{rank}</span>}
        </span>
        <span className="recommendation-copy">
          <span className="recommendation-title">{recommendation.title}</span>
          <span className="recommendation-detail">{recommendation.detail}</span>
          <span className="recommendation-link">Why this move? <ArrowDown size={14} aria-hidden="true" /></span>
        </span>
        {recommendation.monthlySavings != null && (
          <span className="recommendation-savings">{money(recommendation.monthlySavings)}<small>/mo</small></span>
        )}
      </DialogTrigger>
      <DialogContent>
        <div className="dialog-kicker">MOVE {rank} · {season} · {plan === "care" ? "CARE" : "STANDARD"} PLAN</div>
        <DialogTitle className="dialog-title">{recommendation.title}</DialogTitle>
        <DialogDescription className="dialog-description">{recommendation.detail}</DialogDescription>

        <section className="dialog-evidence" aria-labelledby={`recommendation-evidence-${rank}`}>
          <h3 id={`recommendation-evidence-${rank}`}>Why this was recommended</h3>
          {scenario && (
            <>
              <p>
                This estimate assumes {scenario.assumption}. Moving that use from {scenario.fromLabel} to {scenario.toLabel}
                {" "}changes the energy rate from {money(rateFor("onPeak", season, plan), 3)}/kWh to{" "}
                {money(rateFor(scenario.toLabel.includes("Super") ? "superOffPeak" : "offPeak", season, plan), 3)}/kWh.
              </p>
              <p className="dialog-calculation">
                {scenario.kwhPerMonth.toFixed(1)} kWh/month × {money(scenario.savingsPerKwh, 3)}/kWh
                {" = "}{money(scenario.monthlySavings)}/month estimated savings.
              </p>
              <p className="dialog-caveat">
                Appliance use is a WattWise estimate, not measured usage. Actual savings depend on your appliance,
                schedule, and bill.
              </p>
            </>
          )}
          {isGeneralShift && generalShift && (
            <>
              <p>
                This estimate assumes shifting 20% of typical 4–9 PM electricity use to after 9 PM. The selected
                {` ${plan === "care" ? "CARE" : "Standard"} ${season} `}rate is {money(generalShiftSavingsPerKwh, 3)}/kWh lower after 9 PM.
              </p>
              <p className="dialog-calculation">
                {generalShift.kwhPerMonth.toFixed(1)} kWh/month shifted × {money(generalShiftSavingsPerKwh, 3)}/kWh
                {" = "}{money(generalShift.monthlySavings)}/month estimated savings.
              </p>
              <p className="dialog-caveat">
                {dailyKwh
                  ? `The usage profile is scaled to ${dailyKwh.toFixed(1)} kWh/day from your bill.`
                  : "Usage is based on a modeled San Diego home, not meter readings."}
                {" "}This estimate excludes taxes, fees, baseline credits, and separate community-power generation charges.
              </p>
            </>
          )}
          {isCare && careSavings != null && (
            <>
              <p>
                CARE pricing may lower eligible households&apos; bills. We compare the same estimated usage at Standard
                and CARE rates for {season}; the base services charge is included in this comparison.
              </p>
              <p className="dialog-calculation">
                Standard-to-CARE rate comparison: {money(careSavings)}/month estimated difference.
              </p>
              <p className="dialog-caveat">
                CARE has eligibility requirements. Usage is {dailyKwh ? "scaled to your bill's daily average" : "modeled for a typical San Diego home"}.
                {" "}Taxes, fees, baseline credits, and separate community-power generation charges are excluded.
              </p>
            </>
          )}
          {isGridAdvice && (
            <>
              <p>
                The latest CAISO snapshot in this app is dated {grid.date}. The hours below had the highest renewable
                share in that day&apos;s dataset:
              </p>
              <ul className="dialog-grid-hours">
                {topGridHours.map(({ hour, renewableShare }) => (
                  <li key={hour}>{hourLabel(hour)} <strong>{renewableShare.toFixed(1)}% renewable</strong></li>
                ))}
              </ul>
              <p className="dialog-caveat">
                Grid mix varies by day. This is historical California grid data, not a live forecast, and this suggestion
                does not include a bill-savings estimate.
              </p>
            </>
          )}
          {!scenario && !isGeneralShift && !isCare && !isGridAdvice && (
            <>
              <p>
                This is a practical tip without a verified dollar estimate. We don&apos;t show bill savings unless there
                is a matching calculation from the rate and usage data.
              </p>
              <p className="dialog-caveat">The explanation above describes the suggested action; it is not a measured result from your meter.</p>
            </>
          )}
        </section>

        {sources.length > 0 && (
          <section className="dialog-sources" aria-labelledby={`recommendation-sources-${rank}`}>
            <h3 id={`recommendation-sources-${rank}`}>Sources</h3>
            <ul>
              {sources.map((source) => (
                <li key={source.href}>
                  <a href={source.href} target="_blank" rel="noreferrer">
                    {source.label}<ExternalLink size={13} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            {(isGeneralShift || isCare) && (
              <p>
                Usage profile: {avgDay.label}.
              </p>
            )}
            {scenario && (
              <p>Appliance-use figures are WattWise estimates, not usage reported by SDG&amp;E.</p>
            )}
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
