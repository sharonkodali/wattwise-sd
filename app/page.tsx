// Tabs shell. OWNER: Person 2.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillAnalyzer } from "@/components/BillAnalyzer";
import { WhenToUsePower } from "@/components/when-to-use-power/WhenToUsePower";
import { AskWattWise } from "@/components/AskWattWise";

export default function Home() {
  return (
    <div className="min-h-full bg-[radial-gradient(ellipse_at_top,oklch(0.9_0.045_220),transparent_55%),radial-gradient(ellipse_at_bottom_right,oklch(0.92_0.07_70),transparent_48%)]">
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
        <header className="mb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">San Diego</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">WattWise SD</h1>
          <p className="mt-2 max-w-xl text-base text-muted-foreground">
            Understand your SDG&amp;E bill, find the expensive hours, and keep more of your money.
          </p>
        </header>
        <Tabs defaultValue="bill" className="gap-4">
          <TabsList className="grid h-11! w-full grid-cols-3">
            <TabsTrigger value="bill" className="px-1 text-xs sm:text-sm">
              <span className="sm:hidden">Bill</span>
              <span className="hidden sm:inline">Bill Analyzer</span>
            </TabsTrigger>
            <TabsTrigger value="when" className="px-1 text-xs sm:text-sm">
              <span className="sm:hidden">Hours</span>
              <span className="hidden sm:inline">When to Use Power</span>
            </TabsTrigger>
            <TabsTrigger value="ask" className="px-1 text-xs sm:text-sm">
              <span className="sm:hidden">Ask</span>
              <span className="hidden sm:inline">Ask WattWise</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bill">
            <BillAnalyzer />
          </TabsContent>
          <TabsContent value="when">
            <WhenToUsePower />
          </TabsContent>
          <TabsContent value="ask">
            <AskWattWise />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
