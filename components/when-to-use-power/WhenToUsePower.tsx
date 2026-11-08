"use client";

// Tab 2: "When to Use Power". Drop into app/page.tsx: <WhenToUsePower dailyKwh={billDailyKwh} />
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendationDetailsDialog } from "@/components/RecommendationDetailsDialog";
import {
  SOURCES,
  careMonthlySavings,
  cleanestHours,
  currentSeason,
  gridByHour,
  hourLabel,
  hourlyCosts,
  money,
  monthlyEstimate,
  seasonPlanComparison,
  summarizeDay,
  type Plan,
  type Season,
} from "@/lib/analysis";
import type { Recommendation } from "@/app/api/recommend/route";
import { PowerPulse } from "@/components/PowerPulse";
import { CostByHourChart, GridChart, SeasonPlanChart } from "./charts";

export function WhenToUsePower({ dailyKwh }: { dailyKwh?: number }) {
  const [season, setSeason] = useState<Season>(() => currentSeason());
  const [plan, setPlan] = useState<Plan>("standard");

  const hours = useMemo(() => hourlyCosts({ season, plan, dailyKwh }), [season, plan, dailyKwh]);
  const day = useMemo(() => summarizeDay(hours), [hours]);
  const month = useMemo(() => monthlyEstimate({ season, plan, dailyKwh }), [season, plan, dailyKwh]);
  const grid = useMemo(() => gridByHour({ season, plan, dailyKwh }), [season, plan, dailyKwh]);
  const compare = useMemo(() => seasonPlanComparison(dailyKwh), [dailyKwh]);
  const care = useMemo(() => careMonthlySavings(season, dailyKwh), [season, dailyKwh]);

  const [tips, setTips] = useState<Recommendation[] | null>(null);
  const [tipsLoading, setTipsLoading] = useState(true);
  const [tipsError, setTipsError] = useState<string | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() => new Set());
  const rankedTips = useMemo(
    () => [...(tips ?? [])]
      .filter((tip) => !dismissedTips.has(`${tip.scenarioId ?? "general"}-${tip.title}`))
      .sort((a, b) => (b.monthlySavings ?? -1) - (a.monthlySavings ?? -1)),
    [tips, dismissedTips],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ season, plan, dailyKwh }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
        return r.json() as Promise<{ recommendations: Recommendation[] }>;
      })
      .then((d) => {
        if (!ctrl.signal.aborted) setTips(d.recommendations);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setTipsError("Couldn't load tips right now.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setTipsLoading(false);
      });
    return () => ctrl.abort();
  }, [season, plan, dailyKwh]);

  return (
    <div className="space-y-6">
      {/* Tips */}
      <section aria-labelledby="next-moves-title" className="space-y-5">
        <div>
          <h2 id="next-moves-title" className="text-2xl font-semibold tracking-tight text-foreground">Your next moves</h2>
          <p className="mt-1 text-sm text-muted-foreground">Choose a move to see why it could help.</p>
        </div>
        <div className="divide-y divide-border">
          {tipsLoading && <p className="text-sm text-muted-foreground">Finding your best savings…</p>}
          {tipsError && <p className="text-sm text-destructive">{tipsError}</p>}
          {!tipsLoading &&
            rankedTips.map((t, i) => (
              <RecommendationDetailsDialog
                key={`${t.scenarioId ?? "general"}-${t.title}`}
                recommendation={t}
                rank={i + 1}
                season={season}
                plan={plan}
                dailyKwh={dailyKwh}
                onDismiss={() => setDismissedTips((current) => new Set(current).add(`${t.scenarioId ?? "general"}-${t.title}`))}
              />
            ))}
          {!tipsLoading && !tipsError && rankedTips.length === 0 && (
            <p className="py-4 text-sm text-muted-foreground">No recommendations are available right now.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Savings are estimates based on SDG&amp;E rates and typical appliance use, not a guarantee.</p>
      </section>

      {/* Controls */}
      <div className="flex flex-wrap gap-2">
        <Toggle
          value={season}
          onChange={(value) => {
            if (value !== season) {
              setTipsLoading(true);
              setTipsError(null);
              setSeason(value);
            }
          }}
          options={[["summer", "Summer (Jun–Oct)"], ["winter", "Winter (Nov–May)"]]}
        />
        <Toggle
          value={plan}
          onChange={(value) => {
            if (value !== plan) {
              setTipsLoading(true);
              setTipsError(null);
              setPlan(value);
            }
          }}
          options={[["standard", "Standard"], ["care", "CARE pricing"]]}
        />
      </div>

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          big={`${Math.round(day.peakCostPct)}%`}
          text={`of a typical day's electricity cost happens 4–9 PM, which is only 5 of the 24 hours (${Math.round(day.peakKwhPct)}% of the kWh).`}
        />
        <Stat big={money(month.total, 0)} text={`estimated monthly bill (${Math.round(month.kwh)} kWh, ${season}, ${plan === "care" ? "CARE" : "standard"} pricing).`} />
        <Stat
          big={plan === "standard" ? money(care, 0) : "On CARE"}
          text={plan === "standard" ? "per month saved with CARE (about 35% off) if your household qualifies." : "You're seeing CARE prices. Switch to Standard to compare."}
        />
      </div>

      {/* Chart 1 */}
      <Card>
        <CardHeader>
          <CardTitle>What each hour of the day costs you</CardTitle>
          <CardDescription>Average {season} weekday. Orange bars are on-peak (4–9 PM), the most expensive hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <CostByHourChart data={hours} />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Rates: {SOURCES.rates}. Usage: {SOURCES.usage}
          {dailyKwh ? `, scaled to ${dailyKwh.toFixed(1)} kWh/day from your bill` : ""}.
        </CardFooter>
      </Card>

      {/* Chart 2 */}
      <Card>
        <CardHeader>
          <CardTitle>When California&apos;s grid is most strained</CardTitle>
          <CardDescription>
            Demand peaks right as solar disappears. Cleanest hours: {cleanestHours().map(hourLabel).join(", ")}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GridChart data={grid} />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {SOURCES.grid}. Renewables = solar, wind, geothermal, biomass, biogas, small hydro as a share of demand (capped at 100%).
        </CardFooter>
      </Card>

      {/* Chart 3 */}
      <Card>
        <CardHeader>
          <CardTitle>Summer vs. winter, standard vs. CARE</CardTitle>
          <CardDescription>Estimated monthly bill for the same household.</CardDescription>
        </CardHeader>
        <CardContent>
          <SeasonPlanChart data={compare} />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {SOURCES.rates} (standard and CARE tables). Excludes baseline credit, taxes, and San Diego Community Power generation rates.
        </CardFooter>
      </Card>

      <PowerPulse season={season} plan={plan} />
    </div>
  );
}

function Stat({ big, text }: { big: string; text: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-3xl font-bold tracking-tight">{big}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function Toggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="inline-flex rounded-lg border p-1" role="group">
      {options.map(([v, label]) => (
        <Button
          key={v}
          type="button"
          size="sm"
          variant={value === v ? "default" : "ghost"}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
