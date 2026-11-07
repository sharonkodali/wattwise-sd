// Turns data/sd_load_profile.csv (8,760 hourly rows, OpenEI TMY3 San Diego BASE home)
// into data/sd_avg_day.json: average kWh used in each hour of the day, summer vs winter.
// Run: node scripts/build-avg-day.mjs
import { readFileSync, writeFileSync } from "node:fs";

const rates = JSON.parse(readFileSync("data/rates.json", "utf8"));
const lines = readFileSync("data/sd_load_profile.csv", "utf8").trim().split(/\r?\n/);
const header = lines[0].split(",").map((h) => h.trim());
const col = header.indexOf("Electricity:Facility [kW](Hourly)");
if (col < 0) throw new Error("Electricity:Facility column not found");

const sums = { summer: Array(24).fill(0), winter: Array(24).fill(0) };
const counts = { summer: Array(24).fill(0), winter: Array(24).fill(0) };

for (const line of lines.slice(1)) {
  const cells = line.split(",");
  // Format: " MM/DD  HH:00:00", HH runs 01-24 and marks the END of the hour.
  const m = cells[0].trim().match(/^(\d{2})\/(\d{2})\s+(\d{2}):/);
  if (!m) continue;
  const month = Number(m[1]);
  const hour = Number(m[3]) - 1; // "01:00:00" = usage from 0:00 to 1:00 -> hour 0
  const kwh = Number(cells[col]); // kW averaged over one hour = kWh
  const season = rates.seasons.summer.months.includes(month) ? "summer" : "winter";
  sums[season][hour] += kwh;
  counts[season][hour] += 1;
}

const avg = (s) => sums[s].map((v, h) => +(v / counts[s][h]).toFixed(4));
const out = {
  source: "OpenEI/NREL Commercial and Residential Hourly Load Profiles for all TMY3 Locations: USA_CA_San.Diego-Lindbergh.Field.722900_TMY3_BASE",
  sourceUrl: "https://openei.org/datasets/files/961/pub/RESIDENTIAL_LOAD_DATA_E_PLUS_OUTPUT/BASE/USA_CA_San.Diego-Lindbergh.Field.722900_TMY3_BASE.csv",
  label: "Modeled typical San Diego home (simulated, not metered data)",
  units: "kWh per hour; index 0 = 12:00-12:59 AM",
  summer: avg("summer"),
  winter: avg("winter"),
};
out.dailyKwh = {
  summer: +out.summer.reduce((a, b) => a + b, 0).toFixed(2),
  winter: +out.winter.reduce((a, b) => a + b, 0).toFixed(2),
};
writeFileSync("data/sd_avg_day.json", JSON.stringify(out, null, 2) + "\n");
console.log("Wrote data/sd_avg_day.json", out.dailyKwh);
