"use client";
// Tab 1: Bill Analyzer (MAIN feature). OWNER: Person 2 (UI) + Person 1 (API).
// TODO(P2): drag-and-drop, kWh-by-period donut chart, nicer ChargeCards, mobile layout.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BillAnalysis } from "@/lib/schemas";
import { mockBill } from "@/lib/mock-bill";

const LANGUAGES = ["English", "Spanish", "Vietnamese", "Tagalog", "Chinese (Simplified)", "Arabic"];

export function BillAnalyzer() {
  const [original, setOriginal] = useState<BillAnalysis | null>(null);
  const [bill, setBill] = useState<BillAnalysis | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading("Reading your bill..."); setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/analyze-bill", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOriginal(data); setBill(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setLoading(null); }
  }

  async function translate(language: string) {
    if (!original) return;
    if (language === "English") return setBill(original);
    setLoading(`Translating to ${language}...`); setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: original, language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBill(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Translation failed"); }
    finally { setLoading(null); }
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader><CardTitle>Upload your SDG&amp;E bill (PDF or photo)</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <input type="file" accept="application/pdf,image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <Button variant="outline" onClick={() => { setOriginal(mockBill); setBill(mockBill); }}>Use sample data</Button>
          {original && (
            <select className="rounded-md border px-2 py-1" onChange={(e) => translate(e.target.value)} defaultValue="English">
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          )}
          {loading && <span className="text-sm text-muted-foreground">{loading}</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </CardContent>
      </Card>

      {bill && (
        <>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{bill.billingPeriod} · {bill.ratePlan} · {bill.provider === "SDCP" ? "San Diego Community Power" : "SDG&E"}</p>
              <p className="text-4xl font-bold">${bill.totalDue.toFixed(2)}</p>
              <p className="mt-2">{bill.summary}</p>
              <p className="mt-2 font-medium">Top tip: {bill.topSavingTip}</p>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2">
            {bill.lineItems.map((item, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{item.name}</CardTitle>
                  <span className={item.amount < 0 ? "text-green-600" : ""}>${item.amount.toFixed(2)}</span>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mb-2">{item.category.replace("_", " & ")}</Badge>
                  <p className="text-sm">{item.plainEnglish}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
