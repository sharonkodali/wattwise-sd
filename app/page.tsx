import { ArrowUpRight, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BillAnalyzer } from "@/components/BillAnalyzer";
import { WhenToUsePower } from "@/components/when-to-use-power/WhenToUsePower";
import { AskWattWise } from "@/components/AskWattWise";
import { Hero, HowItWorks } from "@/components/Hero";

export default function Home() {
  return (
    <div className="app-shell min-h-screen">
      <header className="topbar">
        <a href="#top" className="brand-lockup" aria-label="WattWise SD home">
          <span className="brand-mark"><Zap size={17} strokeWidth={2.4} aria-hidden /></span>
          <span>Watt<span className="brand-light">Wise</span> <span className="brand-sd">SD</span></span>
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="#how">How it works</a>
          <a href="#analyze">Analyze a bill</a>
          <a className="topnav-cta" href="https://www.sdge.com/residential/pay-bill/get-payment-bill-assistance" target="_blank" rel="noreferrer">
            Bill assistance <ArrowUpRight size={14} aria-hidden />
          </a>
        </nav>
      </header>

      <div id="top" />
      <Hero />

      <main className="dashboard-main">
        <HowItWorks />

        <Tabs id="analyze" defaultValue="bill" className="dashboard-tabs">
          <div className="tabs-head">
            <div>
              <p className="eyebrow">YOUR ENERGY DASHBOARD</p>
              <h2 className="section-title">Start with your bill</h2>
            </div>
            <TabsList className="nav-tabs">
              <TabsTrigger value="bill">Bill overview</TabsTrigger>
              <TabsTrigger value="when">Recommendations</TabsTrigger>
              <TabsTrigger value="ask">Ask WattSplit</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="bill"><BillAnalyzer /></TabsContent>
          <TabsContent value="when"><WhenToUsePower /></TabsContent>
          <TabsContent value="ask"><AskWattWise /></TabsContent>
        </Tabs>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <p className="footer-brand"><Zap size={15} aria-hidden /> WattWise SD</p>
            <p>Made for San Diego households · Hack for Humanity 2026</p>
          </div>
          <p className="footer-note">
            WattWise SD is an independent student project and is not affiliated with SDG&amp;E or San Diego Community Power.
            Estimates are not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
