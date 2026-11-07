"use client";
// Tab 1: Bill Analyzer (MAIN feature). OWNER: Person 2 (UI) + Person 1 (API).
import { useState } from "react";
import { ArrowUpRight, Lightbulb, Users, ShieldCheck, TrendingUp, Zap, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BillUpload } from "@/components/BillUpload";
import { ChargeCard, formatUsd } from "@/components/ChargeCard";
import { KwhDonut } from "@/components/KwhDonut";
import { LanguageSelect, type Language } from "@/components/LanguageSelect";
import type { BillAnalysis } from "@/lib/schemas";
import { mockBill } from "@/lib/mock-bill";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"];

export function BillAnalyzer() {
  const [original, setOriginal] = useState<BillAnalysis | null>(mockBill);
  const [bill, setBill] = useState<BillAnalysis | null>(mockBill);
  const [language, setLanguage] = useState<Language>("English");
  const [roommates, setRoommates] = useState(3);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function showSample() {
    setOriginal(mockBill);
    setBill(mockBill);
    setLanguage("English");
    setError(null);
  }

  async function upload(file: File) {
    if (!ALLOWED.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Use a PDF or a photo (JPG, PNG, WEBP, or HEIC).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("That file is over 15 MB. Try a smaller photo or PDF.");
      return;
    }
    setLoading("Reading your bill...");
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/analyze-bill", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read that bill.");
      setOriginal(data);
      setBill(data);
      setLanguage("English");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function translate(next: Language) {
    if (!original) return;
    setLanguage(next);
    if (next === "English") {
      setBill(original);
      return;
    }
    setLoading(`Translating to ${next}...`);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: original, language: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Translation failed");
      setBill(data);
    } catch (e) {
      setLanguage("English");
      setBill(original);
      setError(e instanceof Error ? e.message : "Translation failed");
    } finally {
      setLoading(null);
    }
  }

  const provider =
    bill?.provider === "SDCP" ? "San Diego Community Power" : "SDG&E";
  const totalKwh = bill ? bill.kwhByPeriod.onPeak + bill.kwhByPeriod.offPeak + bill.kwhByPeriod.superOffPeak : 0;
  const peakShare = totalKwh ? Math.round((bill!.kwhByPeriod.onPeak / totalKwh) * 100) : 0;

  return (
    <div className="space-y-4 pt-3">
      <BillUpload loading={loading} error={error} onFile={upload} onSample={showSample} />

      {bill && (
        <div className="space-y-4" dir={language === "Arabic" ? "rtl" : "ltr"}>
          <div className="insight-strip">
            <div className="insight-item"><span className="insight-icon"><TrendingUp size={16} /></span><div><small>Billing period</small><strong>{bill.billingPeriod.split("(")[0].trim()}</strong></div></div>
            <div className="insight-item"><span className="insight-icon amber"><Clock3 size={16} /></span><div><small>Usage during peak</small><strong>{peakShare}% <em>of your kWh</em></strong></div></div>
            <div className="insight-item"><span className="insight-icon mint"><Zap size={16} /></span><div><small>Total electricity</small><strong>{totalKwh.toLocaleString()} <em>kWh</em></strong></div></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="sample-status"><span />{original === mockBill ? "Sample bill · try the layout" : "Bill analyzed"}</span>
              <span className="hidden sm:inline">Amounts and usage stay the same when translated.</span>
            </div>
            <LanguageSelect value={language} disabled={loading !== null} onChange={translate} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="total-card border-0 text-primary-foreground">
              <CardContent className="flex h-full min-h-52 flex-col justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-primary-foreground/75">Monthly bill · total due</p>
                  <p dir="ltr" className="mt-2 text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
                    {formatUsd(bill.totalDue)}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary-foreground/70">Peak use</p>
                    <p className="mt-1 text-base font-semibold text-white">{peakShare}% of kWh</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary-foreground/70">Provider</p>
                    <p className="mt-1 text-base font-semibold text-white">{provider}</p>
                  </div>
                </div>

                <p className="text-xs text-primary-foreground/75">
                  {bill.billingPeriod} · {bill.ratePlan} · {provider}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="mb-1 text-sm font-semibold text-foreground">Your electricity by time of day</p>
                <p className="text-xs text-muted-foreground">4–9 PM is SDG&amp;E’s most expensive window.</p>
                <KwhDonut kwhByPeriod={bill.kwhByPeriod} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">Summary</p>
                <p className="mt-1 text-base leading-relaxed">{bill.summary}</p>
              </CardContent>
            </Card>
            <Card className="tip-card border-accent/50 bg-accent/20">
              <CardContent>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightbulb className="size-4" aria-hidden />
                  Top tip
                </p>
                <p className="mt-1 text-base leading-relaxed">{bill.topSavingTip}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="breakdown-card">
            <CardContent className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-center">
              <div><p className="eyebrow">A QUICK READ</p><h2 className="breakdown-title">Your energy story</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">See how your electricity use is distributed across the day. Moving flexible chores out of the evening peak can help lower future bills.</p></div>
              <div className="period-bars" aria-label={`Energy use: ${peakShare}% on peak, ${Math.round(bill.kwhByPeriod.offPeak / totalKwh * 100)}% off peak, ${Math.round(bill.kwhByPeriod.superOffPeak / totalKwh * 100)}% super off peak`}>
                {[{name:"On peak · 4–9 PM",value:bill.kwhByPeriod.onPeak,color:"#d39130"},{name:"Off peak",value:bill.kwhByPeriod.offPeak,color:"#287963"},{name:"Super off peak",value:bill.kwhByPeriod.superOffPeak,color:"#a9c7aa"}].map((item)=><div className="period-row" key={item.name}><div className="period-label"><span><i style={{background:item.color}} />{item.name}</span><b>{item.value} kWh</b></div><div className="period-track"><span style={{width:`${totalKwh ? item.value/totalKwh*100 : 0}%`,background:item.color}} /></div></div>)}
              </div>
            </CardContent>
          </Card>

          <div className="section-heading">
            <div><p className="eyebrow">WHERE IT GOES</p><h2>Charges, in plain English</h2></div>
            <span>{bill.lineItems.length} line items</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {bill.lineItems.map((item, i) => (
              <ChargeCard key={`${item.name}-${i}`} item={item} />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="split-panel">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="feature-icon mint"><Users size={18} aria-hidden /></span>
                  <div><p className="font-semibold text-foreground">A fair split, made simple</p><p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Split this bill evenly with your household. Adjust the headcount to see each share.</p></div>
                </div>
                <div className="split-control">
                  <label htmlFor="roommate-count">People</label>
                  <input id="roommate-count" type="number" min={1} max={12} value={roommates} onChange={(e) => setRoommates(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
                  <strong>{formatUsd(bill.totalDue / roommates)} <small>each</small></strong>
                </div>
              </CardContent>
            </Card>
            <Card className="care-panel">
              <CardContent className="flex items-start gap-3">
                <span className="feature-icon"><ShieldCheck size={18} aria-hidden /></span>
                <div className="min-w-0"><p className="font-semibold text-foreground">You may qualify for a lower bill</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">SDG&amp;E’s CARE and FERA programs offer eligible households a monthly bill discount. Check the current requirements and apply directly with SDG&amp;E.</p><a className="inline-flex items-center gap-1 pt-3 text-sm font-semibold text-primary" href="https://www.sdge.com/residential/pay-bill/get-payment-bill-assistance/carefera" target="_blank" rel="noreferrer">Check CARE / FERA eligibility <ArrowUpRight size={14} aria-hidden /></a></div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
