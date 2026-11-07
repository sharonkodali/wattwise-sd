import { ArrowUpRight, Leaf, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillAnalyzer } from "@/components/BillAnalyzer";
import { WhenToUsePower } from "@/components/when-to-use-power/WhenToUsePower";
import { AskWattWise } from "@/components/AskWattWise";

export default function Home() {
  return (
    <div className="app-shell min-h-screen">
      <header className="topbar">
        <a href="#home" className="brand-lockup" aria-label="WattWise SD home">
          <span className="brand-mark"><Leaf size={18} strokeWidth={2.2} aria-hidden /></span>
          <span>Watt<span className="brand-light">Wise SD</span></span>
        </a>
        <div className="location-label"><MapPin size={14} aria-hidden /> San Diego, CA</div>
      </header>

      <main id="home" className="dashboard-main">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">YOUR HOME ENERGY, MADE CLEAR</p>
            <h1>Good energy starts here.</h1>
            <p className="welcome-copy">A clearer look at your SDG&amp;E bill, your habits, and what you can save together.</p>
          </div>
          <a className="utility-link" href="https://www.sdge.com/residential/pay-bill/get-payment-bill-assistance" target="_blank" rel="noreferrer">
            Need bill assistance? <ArrowUpRight size={15} aria-hidden />
          </a>
        </div>

        <Tabs defaultValue="bill" className="dashboard-tabs">
          <TabsList className="nav-tabs">
            <TabsTrigger value="bill">Bill overview</TabsTrigger>
            <TabsTrigger value="when">Best time to use power</TabsTrigger>
            <TabsTrigger value="ask">Ask WattSplit</TabsTrigger>
          </TabsList>
          <TabsContent value="bill"><BillAnalyzer /></TabsContent>
          <TabsContent value="when"><WhenToUsePower /></TabsContent>
          <TabsContent value="ask"><AskWattWise /></TabsContent>
        </Tabs>

        <footer className="page-footer"><span>Made for San Diego households</span><span>Clear bills. Fair splits. Lighter living.</span></footer>
      </main>
    </div>
  );
}
