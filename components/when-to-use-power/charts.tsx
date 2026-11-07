"use client";

// Tab 2 charts. Needs: npx shadcn@latest add chart card button
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { GridHour, HourCost } from "@/lib/analysis";

const RED = "#dc2626";
const BLUE = "#2563eb";
const GREEN = "#16a34a";
const SLATE = "#64748b";

// 4–9 PM = hours 16..20, labels "4 PM".."8 PM"
const PEAK_START = "4 PM";
const PEAK_END = "8 PM";

const usd = (v: unknown) => `$${Number(v).toFixed(2)}`;

// ---------- Chart 1: cost by hour ----------

const costConfig = {
  cost: { label: "Cost", color: BLUE },
  peak: { label: "4–9 PM (on-peak)", color: RED },
} satisfies ChartConfig;

export function CostByHourChart({ data }: { data: HourCost[] }) {
  return (
    <ChartContainer config={costConfig} className="aspect-auto h-[280px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} />
        <ReferenceArea x1={PEAK_START} x2={PEAK_END} fill={RED} fillOpacity={0.08} ifOverflow="extendDomain" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={2} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `$${Number(v).toFixed(2)}`} fontSize={11} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => {
                const d = p?.[0]?.payload as HourCost | undefined;
                return d ? `${d.label} · ${d.kwh.toFixed(2)} kWh × $${d.rate.toFixed(3)}` : "";
              }}
              formatter={(v) => usd(v)}
            />
          }
        />
        <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.hour} fill={d.isPeak ? RED : BLUE} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ---------- Chart 2: grid demand vs renewables ----------

const gridConfig = {
  demandMW: { label: "Grid demand (MW)", color: SLATE },
  renewablesPct: { label: "Renewables %", color: GREEN },
} satisfies ChartConfig;

export function GridChart({ data }: { data: GridHour[] }) {
  return (
    <ChartContainer config={gridConfig} className="aspect-auto h-[280px] w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={2} fontSize={11} />
        <YAxis yAxisId="mw" tickLine={false} axisLine={false} width={52} fontSize={11} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
        <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} width={40} fontSize={11} tickFormatter={(v) => `${v}%`} />
        <ReferenceArea yAxisId="mw" x1={PEAK_START} x2={PEAK_END} fill={RED} fillOpacity={0.08} ifOverflow="extendDomain" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(v, name) => (name === "renewablesPct" ? `Renewables ${Number(v).toFixed(0)}%` : `Demand ${Number(v).toLocaleString()} MW`)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar yAxisId="mw" dataKey="demandMW" fill={SLATE} fillOpacity={0.5} radius={[3, 3, 0, 0]} />
        <Line yAxisId="pct" dataKey="renewablesPct" stroke={GREEN} strokeWidth={2.5} dot={false} type="monotone" />
      </ComposedChart>
    </ChartContainer>
  );
}

// ---------- Chart 3: summer vs winter, standard vs CARE ----------

const compareConfig = {
  standard: { label: "Standard", color: BLUE },
  care: { label: "With CARE", color: GREEN },
} satisfies ChartConfig;

export function SeasonPlanChart({ data }: { data: { season: string; standard: number; care: number }[] }) {
  return (
    <ChartContainer config={compareConfig} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="season" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={52} fontSize={11} tickFormatter={(v) => `$${Math.round(Number(v))}`} />
        <ChartTooltip content={<ChartTooltipContent formatter={(v, name) => `${name === "care" ? "With CARE" : "Standard"}: ${usd(v)}/mo`} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="standard" fill={BLUE} radius={[4, 4, 0, 0]} />
        <Bar dataKey="care" fill={GREEN} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
