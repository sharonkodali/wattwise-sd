"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { BillAnalysis } from "@/lib/schemas";

const config = {
  kwh: { label: "kWh" },
  onPeak: { label: "On-peak 4–9 PM", color: "var(--chart-1)" },
  offPeak: { label: "Off-peak", color: "var(--chart-2)" },
  superOffPeak: { label: "Super off-peak", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function KwhDonut({ kwhByPeriod }: { kwhByPeriod: BillAnalysis["kwhByPeriod"] }) {
  const data = [
    { period: "onPeak", kwh: kwhByPeriod.onPeak, fill: "var(--color-onPeak)" },
    { period: "offPeak", kwh: kwhByPeriod.offPeak, fill: "var(--color-offPeak)" },
    { period: "superOffPeak", kwh: kwhByPeriod.superOffPeak, fill: "var(--color-superOffPeak)" },
  ];
  const total = kwhByPeriod.onPeak + kwhByPeriod.offPeak + kwhByPeriod.superOffPeak;

  return (
    <div className="relative">
      <ChartContainer config={config} className="mx-auto aspect-square h-64 w-full max-w-sm">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="period" hideLabel />} />
          <Pie data={data} dataKey="kwh" nameKey="period" innerRadius={62} outerRadius={88} strokeWidth={2} paddingAngle={2}>
            {data.map((slice) => (
              <Cell key={slice.period} fill={slice.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="period" className="flex-wrap" />} />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[38%] flex -translate-y-1/2 flex-col items-center">
        <span className="text-2xl font-bold tabular-nums">{total.toLocaleString("en-US")}</span>
        <span className="text-xs text-muted-foreground">kWh</span>
      </div>
    </div>
  );
}
