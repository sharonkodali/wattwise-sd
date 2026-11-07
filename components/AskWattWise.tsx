"use client";

import { useState } from "react";
import type { ReactNode } from "react";
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

function renderCareHint(text: string): ReactNode[] {
  const urlPattern = /https?:\/\/[^\s<>"'`]+/gi;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlPattern.exec(text)) !== null) {
    const rawUrl = match[0];
    const url = rawUrl.replace(/[),.!?;:]+$/, "");

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (url) {
      parts.push(
        <a
          key={`care-link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open link: ${url}`}
          className="my-1 inline-flex flex-col rounded-md border bg-background px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          <span>Open program or application link</span>
          <span className="break-all text-xs font-normal text-muted-foreground">
            {url}
          </span>
        </a>,
      );
    }

    const trailingText = rawUrl.slice(url.length);
    if (trailingText) parts.push(trailingText);

    lastIndex = match.index + rawUrl.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function AskWattWise() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    setResult(null);

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
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Something went wrong. Please try again.",
      );
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
              <Button
                key={ex.label}
                size="sm"
                variant="outline"
                onClick={() => setText(ex.text)}
                disabled={loading}
              >
                {ex.label}
              </Button>
            ))}
          </div>
          <Textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Who lives there, what appliances you use, and when..."
            disabled={loading}
            aria-label="Describe your household and energy habits"
          />
          <Button onClick={ask} disabled={loading || !text.trim()}>
            {loading ? "Creating your plan…" : "Get my savings plan"}
          </Button>
          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card aria-busy="true">
          <CardContent className="space-y-4 p-6">
            <p role="status" className="text-sm font-medium text-muted-foreground">
              Building your personalized plan…
            </p>
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-4" aria-live="polite">
          <Card>
            <CardHeader>
              <CardTitle>Your personalized plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-primary/5 p-5">
                <p className="text-sm font-medium text-muted-foreground">
                  Estimated savings
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {result.savingsEstimate}
                </p>
              </div>
            </CardContent>
          </Card>

          <section aria-labelledby="habits-heading" className="space-y-3">
            <h2 id="habits-heading" className="text-lg font-semibold">
              Recommended habits
            </h2>
            {result.plan.map((item, index) => (
              <Card key={`${index}-${item.habit}`}>
                <CardContent className="flex gap-4 p-4">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-3">
                    <h3 className="font-semibold">{item.habit}</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Why: </span>
                        <span className="text-muted-foreground">{item.why}</span>
                      </p>
                      <p>
                        <span className="font-medium">Try this: </span>
                        <span className="text-muted-foreground">{item.fix}</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>CARE and FERA bill assistance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-sm leading-relaxed">
                {renderCareHint(result.careHint)}
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            Estimates only, not financial advice.
          </p>
        </div>
      )}
    </div>
  );
}