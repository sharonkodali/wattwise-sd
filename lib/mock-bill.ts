// Fake BillAnalysis for building the UI before the API works. OWNER: Person 2. Numbers are made up.
import type { BillAnalysis } from "./schemas";

export const mockBill: BillAnalysis = {
  billingPeriod: "Sep 12 - Oct 11, 2026 (30 days)",
  ratePlan: "TOU-DR1",
  provider: "SDCP",
  totalDue: 171.1,
  kwhByPeriod: { onPeak: 62, offPeak: 180, superOffPeak: 148 },
  lineItems: [
    { name: "On-Peak usage (4-9 PM)", amount: 37.2, category: "delivery", plainEnglish: "Power you used between 4 and 9 PM, the most expensive time of day." },
    { name: "Base Services Charge", amount: 24.0, category: "fees_taxes", plainEnglish: "A fixed monthly fee for meters, wires and transformers. You pay it no matter how much you use." },
    { name: "San Diego Community Power generation", amount: 58.4, category: "generation", plainEnglish: "The cost of the electricity itself, from San Diego Community Power." },
    { name: "SDG&E generation credit", amount: -52.1, category: "credit", plainEnglish: "Cancels SDG&E's own generation charge, so you are not charged twice." },
    { name: "PCIA", amount: 9.8, category: "fees_taxes", plainEnglish: "A fee for power contracts SDG&E signed before you switched to Community Power." },
  ],
  summary: "Most of this bill comes from evening use. About a third of your cost happened between 4 and 9 PM.",
  topSavingTip: "Run laundry and the dishwasher after 9 PM to move about 15 kWh out of peak hours each month.",
};
