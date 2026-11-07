"use client";
// Tab 3: Ask WattWise. OWNER: Person 4.
// TODO(P4): nicer result layout, loading skeleton, links in careHint.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AskResult } from "@/lib/schemas";

const EXAMPLES = [
  {
    label: "UCSD student",
    text: "I'm a UCSD student sharing a 3-bedroom apartment in La Jolla with 2 roommates. We run the AC from 6 to 10 PM, one of us has a gaming PC on all evening, and we do laundry around 7 PM.",
  },
  {
    label: "Chula Vista family",
    text: "Family of 5 in Chula Vista. Electric dryer, two fridges, we cook dinner 5-7 PM and the kids game after school. Household income about $55,000.",
  },
  {
    label: "El Cajon retiree",
    text: "Retired, living alone in El Cajon. Window AC unit runs most of the afternoon and evening in summer. Fixed income from Social Security.",
  },
];

function renderHintWithLinks(text: string) {
  const tokens = text.split(/(https?:\/\/[^\s]+)/g);
  return tokens.map((token, index) => {
    if (!token.startsWith("http")) return <span key={`${token}-${index}`}>{token}</span>;
    return (
      <a key={`${token}-${index}`} href={token} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline">
        {token}
      </a>
    );
  });
}

export function AskWattWise() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>Describe your home and habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <Button key={ex.label} size="sm" variant="outline" onClick={() => setText(ex.text)}>
                {ex.label}
              </Button>
            ))}
          </div>
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Who lives there, what appliances you use, and when..."
          />
          <Button onClick={ask} disabled={loading || !text.trim()}>
            {loading ? "Thinking..." : "Get my savings plan"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
      {loading && (
        <Card>
          <CardHeader>
            <CardTitle>Planning your savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-16 w-full animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      )}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Your plan · {result.savingsEstimate}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {result.plan.map((p, i) => (
                <div key={i} className="rounded-md border border-border bg-muted/30 p-3">
                  <p className="font-medium text-foreground">{p.habit}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {p.why} <span className="font-semibold text-foreground">Fix:</span> {p.fix}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground">
              {renderHintWithLinks(result.careHint)}
            </div>
            <p className="text-xs text-muted-foreground">Estimates only, not financial advice.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
