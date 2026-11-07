import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LineItem } from "@/lib/schemas";

const CATEGORY_LABEL: Record<LineItem["category"], string> = {
  delivery: "Delivery",
  generation: "Generation",
  fees_taxes: "Fees & taxes",
  credit: "Credit",
  gas: "Gas",
  other: "Other",
};

export function formatUsd(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function ChargeCard({ item }: { item: LineItem }) {
  const credit = item.amount < 0;
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle className="text-base leading-snug">{item.name}</CardTitle>
        <span dir="ltr" className={`shrink-0 text-base font-semibold tabular-nums ${credit ? "text-emerald-700" : ""}`}>
          {formatUsd(item.amount)}
        </span>
      </CardHeader>
      <CardContent className="space-y-2">
        <Badge variant="secondary">{CATEGORY_LABEL[item.category]}</Badge>
        <p className="text-sm leading-relaxed text-foreground/90">{item.plainEnglish}</p>
      </CardContent>
    </Card>
  );
}
