"use client";
// Tab 1: Bill Analyzer (MAIN feature). OWNER: Person 2 (UI) + Person 1 (API).
import { useRef, useState } from "react";
import { ArrowUpRight, Lightbulb, Users, ShieldCheck, TrendingUp, Zap, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BillUpload } from "@/components/BillUpload";
import { ChargeCard, formatUsd } from "@/components/ChargeCard";
import { KwhDonut } from "@/components/KwhDonut";
import { LanguageSelect, type Language } from "@/components/LanguageSelect";
import type { BillAnalysis } from "@/lib/schemas";
import { mockBill } from "@/lib/mock-bill";
import { UI_LABELS } from "@/lib/ui-labels";

const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];
// Vercel rejects request bodies over 4.5 MB, so the API limit is 4.4 MB (see docs/API.md).
const MAX_UPLOAD_BYTES = 4.4 * 1024 * 1024;

/** Shrink large phone photos in the browser so they fit under the upload limit. PDFs and HEIC pass through. */
async function shrinkImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES || !/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height)); // 2400px keeps small bill text readable
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", quality));
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  }
  return file; // still too big; the size check below shows a clear message
}

/** Parse a JSON API response; Vercel platform errors (e.g. 413) can return plain text. */
async function readJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 413) return { error: "That file is too large. Try the PDF or a smaller photo (under 4 MB)." };
    if (res.status === 504) return { error: "Reading the bill took too long. Please try again." };
    return { error: "Something went wrong. Please try again." };
  }
}

export function BillAnalyzer() {
  const [original, setOriginal] = useState<BillAnalysis | null>(mockBill);
  const [bill, setBill] = useState<BillAnalysis | null>(mockBill);
  const [language, setLanguage] = useState<Language>("English");
  const [roommates, setRoommates] = useState(3);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const t = UI_LABELS[language] ?? UI_LABELS.English;

  function showResults(data: BillAnalysis) {
    setOriginal(data);
    setBill(data);
    setLanguage("English");
    // Bring the results into view so the audience sees them appear.
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function analyze(file: File, message: string) {
    setLoading(message);
    setError(null);
    try {
      const send = async () => {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/analyze-bill", { method: "POST", body });
        return { res, data: await readJson(res) };
      };
      let { res, data } = await send();
      if (res.status >= 500) {
        // Gemini hiccup: wait a moment and try once more before showing an error.
        setLoading("Still reading... one more try");
        await new Promise((r) => setTimeout(r, 2500));
        ({ res, data } = await send());
      }
      if (!res.ok) throw new Error(data.error ?? "Could not read that bill.");
      showResults(data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setLoading(null);
    }
  }

  /** Sample button: send the real sample PDF through Gemini; fall back to built-in sample data if that fails. */
  async function showSample() {
    try {
      const blob = await (await fetch("/sample-bill.pdf")).blob();
      const ok = await analyze(new File([blob], "sample-bill.pdf", { type: "application/pdf" }), "Reading the sample bill...");
      if (ok) return;
    } catch {
      /* fall through to offline sample */
    }
    showResults(mockBill);
  }

  async function upload(file: File) {
    if (!ALLOWED.includes(file.type) && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Use a PDF or a photo (JPG, PNG, WEBP, or HEIC).");
      return;
    }
    const ready = await shrinkImage(file).catch(() => file);
    if (ready.size > MAX_UPLOAD_BYTES) {
      setError("That file is over 4 MB. Try the PDF from your SDG&E account or a smaller photo.");
      return;
    }
    await analyze(ready, "Reading your bill...");
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
      const data = await readJson(res);
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
        <div ref={resultsRef} className="scroll-mt-4 space-y-4" dir={language === "Arabic" ? "rtl" : "ltr"}>
          <div className="insight-strip">
            <div className="insight-item"><span className="insight-icon"><TrendingUp size={16} /></span><div><small>{t.billingPeriod}</small><strong>{bill.billingPeriod.split("(")[0].trim()}</strong></div></div>
            <div className="insight-item"><span className="insight-icon amber"><Clock3 size={16} /></span><div><small>{t.peakUsage}</small><strong>{peakShare}% <em>{t.ofYourKwh}</em></strong></div></div>
            <div className="insight-item"><span className="insight-icon mint"><Zap size={16} /></span><div><small>{t.totalElectricity}</small><strong>{totalKwh.toLocaleString()} <em>kWh</em></strong></div></div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="sample-status"><span />{original === mockBill ? t.sampleBill : t.billAnalyzed}</span>
              <span className="hidden sm:inline">{t.amountsStay}</span>
            </div>
            <LanguageSelect value={language} disabled={loading !== null} onChange={translate} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <Card className="total-card border-0 text-primary-foreground">
              <CardContent className="flex h-full min-h-52 flex-col justify-between gap-4 py-3">
                <div>
                  <p className="total-label">{t.totalDue}</p>
                  <p dir="ltr" className="total-amount mt-2 tabular-nums">
                    {formatUsd(bill.totalDue)}
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary-foreground/70">{t.peakUsage}</p>
                    <p className="mt-1 text-base font-semibold text-white">{peakShare}% {t.ofYourKwh}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-primary-foreground/70">Provider</p>
                    <p className="mt-1 text-base font-semibold text-white">{provider}</p>
                  </div>
                </div>

                <p className="total-meta">
                  {bill.billingPeriod} · {bill.ratePlan} · {provider}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="mb-1 text-sm font-semibold text-foreground">{t.byTimeOfDay}</p>
                <p className="text-xs text-muted-foreground">{t.peakWindow}</p>
                <KwhDonut kwhByPeriod={bill.kwhByPeriod} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent>
                <p className="text-sm font-medium text-muted-foreground">{t.summary}</p>
                <p className="mt-1 text-base leading-relaxed">{bill.summary}</p>
              </CardContent>
            </Card>
            <Card className="tip-card border-accent/50 bg-accent/20">
              <CardContent>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Lightbulb className="size-4" aria-hidden />
                  {t.topTip}
                </p>
                <p className="mt-1 text-base leading-relaxed">{bill.topSavingTip}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="breakdown-card">
            <CardContent className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-center">
              <div><p className="eyebrow">{t.quickRead}</p><h2 className="breakdown-title">{t.energyStory}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">See how your electricity use is distributed across the day. Moving flexible chores out of the evening peak can help lower future bills.</p></div>
              <div className="period-bars" aria-label={`Energy use: ${peakShare}% on peak, ${Math.round(bill.kwhByPeriod.offPeak / totalKwh * 100)}% off peak, ${Math.round(bill.kwhByPeriod.superOffPeak / totalKwh * 100)}% super off peak`}>
                {[{name:"On peak · 4–9 PM",value:bill.kwhByPeriod.onPeak,color:"#d39130"},{name:"Off peak",value:bill.kwhByPeriod.offPeak,color:"#287963"},{name:"Super off peak",value:bill.kwhByPeriod.superOffPeak,color:"#a9c7aa"}].map((item)=><div className="period-row" key={item.name}><div className="period-label"><span><i style={{background:item.color}} />{item.name}</span><b>{item.value} kWh</b></div><div className="period-track"><span style={{width:`${totalKwh ? item.value/totalKwh*100 : 0}%`,background:item.color}} /></div></div>)}
              </div>
            </CardContent>
          </Card>

          <div className="section-heading">
            <div><p className="eyebrow">{t.whereItGoes}</p><h2>{t.chargesTitle}</h2></div>
            <span>{bill.lineItems.length} {t.lineItems}</span>
          </div>
          {bill.checks && !bill.checks.matchesTotal && (
            <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t.totalMismatch}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {bill.lineItems.map((item, i) => (
              <ChargeCard key={`${item.name}-${i}`} item={item} categoryLabel={t.categories[item.category]} />
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
