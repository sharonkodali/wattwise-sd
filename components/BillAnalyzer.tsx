"use client";
// Tab 1: Bill Analyzer (MAIN feature). OWNER: Person 2 (UI) + Person 1 (API).
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BillUpload } from "@/components/BillUpload";
import { ChargeCard, formatUsd } from "@/components/ChargeCard";
import { KwhDonut } from "@/components/KwhDonut";
import { LanguageSelect, type Language } from "@/components/LanguageSelect";
import type { BillAnalysis } from "@/lib/schemas";
import { mockBill } from "@/lib/mock-bill";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"];

export function BillAnalyzer() {
  const [original, setOriginal] = useState<BillAnalysis | null>(null);
  const [bill, setBill] = useState<BillAnalysis | null>(null);
  const [language, setLanguage] = useState<Language>("English");
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

  return (
    <div className="space-y-4 pt-3">
      <BillUpload loading={loading} error={error} onFile={upload} onSample={showSample} />

      {bill && (
        <div className="space-y-4" dir={language === "Arabic" ? "rtl" : "ltr"}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Translate the words. Dollar amounts and kWh stay the same.
            </p>
            <LanguageSelect value={language} disabled={loading !== null} onChange={translate} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="bg-gradient-to-br from-primary to-[oklch(0.34_0.07_230)] text-primary-foreground">
              <CardContent className="flex h-full flex-col justify-center gap-2 py-2">
                <p className="text-sm text-primary-foreground/80">Total due</p>
                <p dir="ltr" className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">
                  {formatUsd(bill.totalDue)}
                </p>
                <p className="text-sm text-primary-foreground/85">
                  {bill.billingPeriod} · {bill.ratePlan} · {provider}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="mb-1 text-sm font-medium">kWh by time of day</p>
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
            <Card className="border-accent/60 bg-accent/25">
              <CardContent>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightbulb className="size-4" aria-hidden />
                  Top tip
                </p>
                <p className="mt-1 text-base leading-relaxed">{bill.topSavingTip}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {bill.lineItems.map((item, i) => (
              <ChargeCard key={`${item.name}-${i}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
