"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hourLabel, money, periodForHour, rateFor, type DayType, type Plan, type Season } from "@/lib/analysis";

const meterBars = Array.from({ length: 20 }, (_, index) => index);

export function PowerPulse({ season, plan }: { season: Season; plan: Plan }) {
  const [hour, setHour] = useState(18);
  const [powerKw, setPowerKw] = useState(3);
  const [dayType, setDayType] = useState<DayType>("weekday");

  const period = periodForHour(hour, dayType);
  const rate = rateFor(period, season, plan);
  const hourlyCost = powerKw * rate;
  const isPeak = period === "onPeak";

  return (
    <section className="power-pulse" aria-labelledby="power-pulse-title">
      <div className="power-pulse-main">
        <div className="power-pulse-heading">
          <span className="power-pulse-icon"><Zap size={18} aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">SDG&amp;E TIME-OF-USE</p>
            <h2 id="power-pulse-title">See what an hour of power costs</h2>
          </div>
        </div>

        <div className="power-pulse-controls">
          <div className="power-pulse-control">
            <div className="power-pulse-label-row">
              <label htmlFor="power-load">Appliance power</label>
              <strong>{powerKw.toFixed(1)} kW</strong>
            </div>
            <input
              id="power-load"
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={powerKw}
              onChange={(event) => setPowerKw(Number(event.target.value))}
            />
            <div className="power-pulse-range-labels"><span>Small appliance</span><span>High draw</span></div>
          </div>

          <div className="power-pulse-control">
            <div className="power-pulse-label-row">
              <label htmlFor="power-hour">Start time</label>
              <strong>{hourLabel(hour)}</strong>
            </div>
            <input
              id="power-hour"
              type="range"
              min="0"
              max="23"
              step="1"
              value={hour}
              aria-valuetext={hourLabel(hour)}
              onChange={(event) => setHour(Number(event.target.value))}
            />
            <div className="power-pulse-range-labels"><span>12 AM</span><span>11 PM</span></div>
          </div>
        </div>

        <div className="power-pulse-options">
          <div className="power-pulse-option-group" role="group" aria-label="Day type">
            <Button size="sm" variant={dayType === "weekday" ? "default" : "ghost"} aria-pressed={dayType === "weekday"} onClick={() => setDayType("weekday")}>Weekday</Button>
            <Button size="sm" variant={dayType === "weekendHoliday" ? "default" : "ghost"} aria-pressed={dayType === "weekendHoliday"} onClick={() => setDayType("weekendHoliday")}>Weekend</Button>
          </div>
          <div className="power-pulse-rate-context">
            {season} · {plan === "care" ? "CARE" : "Standard"} rate
          </div>
        </div>
      </div>

      <div className={`power-pulse-meter${isPeak ? " is-peak" : ""}`} aria-live="polite">
        <div className="power-pulse-meter-top">
          <span className="power-pulse-meter-label">ESTIMATED COST · 1 HOUR</span>
          <span className={`power-pulse-period${isPeak ? " is-peak" : ""}`}>{isPeak ? "ON-PEAK" : period === "superOffPeak" ? "SUPER OFF-PEAK" : "OFF-PEAK"}</span>
        </div>
        <div className="power-pulse-cost">{money(hourlyCost, 2)}</div>
        <div className="power-pulse-rate">{powerKw.toFixed(1)} kWh × {money(rate, 3)}/kWh</div>
        <div className="power-pulse-wave" aria-hidden="true">
          {meterBars.map((bar) => (
            <span
              key={bar}
              style={{
                height: `${22 + ((bar * 19) % 70)}%`,
                animationDelay: `${bar * -0.09}s`,
                animationDuration: `${Math.max(0.65, 2.5 - powerKw * 0.16)}s`,
              }}
            />
          ))}
        </div>
        <p className="power-pulse-note">Estimate only. Uses stored SDG&amp;E TOU-DR1 rates; not live meter data.</p>
      </div>
    </section>
  );
}