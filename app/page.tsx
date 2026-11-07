// Tabs shell. OWNER: Person 2.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillAnalyzer } from "@/components/BillAnalyzer";
import { WhenToUsePower } from "@/components/when-to-use-power/WhenToUsePower";
import { AskWattWise } from "@/components/AskWattWise";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">WattWise SD</h1>
        <p className="text-muted-foreground">
          Understand your SDG&amp;E bill, find the expensive hours, and keep more of your money.
        </p>
      </header>
      <Tabs defaultValue="bill">
        <TabsList>
          <TabsTrigger value="bill">Bill Analyzer</TabsTrigger>
          <TabsTrigger value="when">When to Use Power</TabsTrigger>
          <TabsTrigger value="ask">Ask WattWise</TabsTrigger>
        </TabsList>
        <TabsContent value="bill"><BillAnalyzer /></TabsContent>
        <TabsContent value="when"><WhenToUsePower /></TabsContent>
        <TabsContent value="ask"><AskWattWise /></TabsContent>
      </Tabs>
    </main>
  );
}
