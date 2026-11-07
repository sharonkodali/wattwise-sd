// Tabs shell. OWNER: Person 2.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillAnalyzer } from "@/components/BillAnalyzer";
import { WhenToUsePower } from "@/components/WhenToUsePower";
import { AskWattWise } from "@/components/AskWattWise";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
          </div>
          <div>
            <h1 className="font-neuton text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
              WattWise SD
            </h1>
            <p className="text-sm text-muted-foreground">
              Understand your SDG&amp;E bill, find the expensive hours, and keep more of your money.
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="bill" className="w-full">
        <TabsList className="mb-6 w-full justify-start rounded-xl bg-card p-1 ring-1 ring-foreground/5 sm:w-auto">
          <TabsTrigger value="bill" className="rounded-lg px-4 py-2 text-sm font-medium">
            Bill Analyzer
          </TabsTrigger>
          <TabsTrigger value="when" className="rounded-lg px-4 py-2 text-sm font-medium">
            When to Use Power
          </TabsTrigger>
          <TabsTrigger value="ask" className="rounded-lg px-4 py-2 text-sm font-medium">
            Ask WattWise
          </TabsTrigger>
        </TabsList>
        <TabsContent value="bill"><BillAnalyzer /></TabsContent>
        <TabsContent value="when"><WhenToUsePower /></TabsContent>
        <TabsContent value="ask"><AskWattWise /></TabsContent>
      </Tabs>
    </main>
  );
}