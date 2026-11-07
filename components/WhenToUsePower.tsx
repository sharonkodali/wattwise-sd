"use client";
// Tab 2: When to Use Power. OWNER: Person 3.
// TODO(P3): real OpenEI profile + SDG&E rates, CAISO grid chart, summer/winter or CARE comparison, source captions.
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { hourlyCosts, usageStats, type Season } from "@/lib/analysis";
import type { Recommendation } from "@/lib/schemas";

const config = { cost: { label: "Cost ($)", color: "var(--chart-1)" } } satisfies ChartConfig;

export function WhenToUsePower() {
  const [season, setSeason] = useState<Season>("summer");
  const data = useMemo(() => hourlyCosts(season), [season]);
  const stats = useMemo(() => usageStats(season), [season]);
  const [recs, setRecs] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getRecs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRecs(json.recommendations ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cost of a typical San Diego home, by hour</CardTitle>
          <div className="flex gap-2">
            {(["summer", "winter"] as const).map((s) => (
              <Button key={s} size="sm" variant={s === season ? "default" : "outline"} onClick={() => setSeason(s)}>
                {s}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-72 w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" interval={2} />
              <YAxis tickFormatter={(v) => `$${v}`} width={48} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="cost" radius={3}>
                {data.map((d) => (
                  <Cell key={d.hour} fill={d.period === "onPeak" ? "#dc2626" : "var(--color-cost)"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <p className="mt-2 text-sm text-muted-foreground">
            Red = on-peak (4–9 PM). {stats.peakSharePct}% of daily cost happens on-peak. Est. ${stats.monthlyCost}/month.
            Data: SAMPLE profile and rates — replace with OpenEI + SDG&amp;E TOU-DR1.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recommendations</CardTitle>
          <Button size="sm" onClick={getRecs} disabled={loading}>
            {loading ? "Thinking..." : "Get tips from Gemini"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {recs?.map((r, i) => (
            <div key={i}>
              <p className="font-medium">
                {r.title}
                {r.monthlySavings ? ` · ${r.monthlySavings}` : ""}
              </p>
              <p className="text-sm">{r.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
