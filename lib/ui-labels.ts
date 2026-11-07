// Fixed UI labels for the Bill Analyzer, so the whole results view switches language — not just Gemini's text.
// Gemini translates the bill-specific text (charge names, explanations, summary); these are the static labels.
import type { Language, LineItem } from "./schemas";

type Labels = {
  billingPeriod: string;
  peakUsage: string;
  ofYourKwh: string;
  totalElectricity: string;
  totalDue: string;
  byTimeOfDay: string;
  peakWindow: string;
  summary: string;
  topTip: string;
  quickRead: string;
  energyStory: string;
  whereItGoes: string;
  chargesTitle: string;
  lineItems: string;
  billAnalyzed: string;
  sampleBill: string;
  amountsStay: string;
  totalMismatch: string;
  categories: Record<LineItem["category"], string>;
};

export const UI_LABELS: Record<Language, Labels> = {
  English: {
    billingPeriod: "Billing period",
    peakUsage: "Usage during peak",
    ofYourKwh: "of your kWh",
    totalElectricity: "Total electricity",
    totalDue: "Monthly bill · total due",
    byTimeOfDay: "Your electricity by time of day",
    peakWindow: "4–9 PM is SDG&E’s most expensive window.",
    summary: "Summary",
    topTip: "Top tip",
    quickRead: "A QUICK READ",
    energyStory: "Your energy story",
    whereItGoes: "WHERE IT GOES",
    chargesTitle: "Charges, in plain English",
    lineItems: "line items",
    billAnalyzed: "Bill analyzed",
    sampleBill: "Sample bill · try the layout",
    amountsStay: "Amounts and usage stay the same when translated.",
    totalMismatch: "Heads up: the charges we found don’t add up exactly to the total. Some lines may be on pages we didn’t receive.",
    categories: { delivery: "Delivery", generation: "Generation", fees_taxes: "Fees & taxes", credit: "Credit", gas: "Gas", other: "Other" },
  },
  Spanish: {
    billingPeriod: "Periodo de facturación",
    peakUsage: "Uso en horas pico",
    ofYourKwh: "de tus kWh",
    totalElectricity: "Electricidad total",
    totalDue: "Factura mensual · total a pagar",
    byTimeOfDay: "Tu electricidad según la hora del día",
    peakWindow: "De 4 a 9 PM es el horario más caro de SDG&E.",
    summary: "Resumen",
    topTip: "Consejo principal",
    quickRead: "UN VISTAZO RÁPIDO",
    energyStory: "Tu historia de energía",
    whereItGoes: "A DÓNDE VA TU DINERO",
    chargesTitle: "Cargos, en palabras sencillas",
    lineItems: "cargos",
    billAnalyzed: "Factura analizada",
    sampleBill: "Factura de ejemplo",
    amountsStay: "Los montos y el consumo no cambian al traducir.",
    totalMismatch: "Atención: los cargos encontrados no suman exactamente el total. Puede haber cargos en páginas que no recibimos.",
    categories: { delivery: "Entrega", generation: "Generación", fees_taxes: "Cargos e impuestos", credit: "Crédito", gas: "Gas", other: "Otro" },
  },
  Vietnamese: {
    billingPeriod: "Kỳ hóa đơn",
    peakUsage: "Dùng giờ cao điểm",
    ofYourKwh: "số kWh của bạn",
    totalElectricity: "Tổng điện năng",
    totalDue: "Hóa đơn tháng · tổng phải trả",
    byTimeOfDay: "Điện bạn dùng theo giờ trong ngày",
    peakWindow: "4–9 giờ tối là khung giờ đắt nhất của SDG&E.",
    summary: "Tóm tắt",
    topTip: "Mẹo hàng đầu",
    quickRead: "XEM NHANH",
    energyStory: "Câu chuyện năng lượng của bạn",
    whereItGoes: "TIỀN ĐI ĐÂU",
    chargesTitle: "Các khoản phí, giải thích dễ hiểu",
    lineItems: "khoản phí",
    billAnalyzed: "Đã phân tích hóa đơn",
    sampleBill: "Hóa đơn mẫu",
    amountsStay: "Số tiền và mức sử dụng giữ nguyên khi dịch.",
    totalMismatch: "Lưu ý: các khoản phí tìm thấy không cộng đúng bằng tổng. Có thể một số khoản nằm ở trang chúng tôi chưa nhận.",
    categories: { delivery: "Truyền tải", generation: "Sản xuất điện", fees_taxes: "Phí & thuế", credit: "Khoản giảm", gas: "Khí đốt", other: "Khác" },
  },
  Tagalog: {
    billingPeriod: "Panahon ng singil",
    peakUsage: "Gamit sa peak hours",
    ofYourKwh: "ng iyong kWh",
    totalElectricity: "Kabuuang kuryente",
    totalDue: "Buwanang bill · kabuuang babayaran",
    byTimeOfDay: "Ang iyong kuryente ayon sa oras",
    peakWindow: "4–9 PM ang pinakamahal na oras ng SDG&E.",
    summary: "Buod",
    topTip: "Pangunahing tip",
    quickRead: "MABILISANG TINGIN",
    energyStory: "Ang kuwento ng iyong enerhiya",
    whereItGoes: "SAAN NAPUPUNTA",
    chargesTitle: "Mga singil, sa simpleng salita",
    lineItems: "singil",
    billAnalyzed: "Nasuri ang bill",
    sampleBill: "Halimbawang bill",
    amountsStay: "Hindi nagbabago ang halaga at gamit kapag isinalin.",
    totalMismatch: "Paalala: hindi eksaktong tumutugma sa kabuuan ang mga singil na nakita. Maaaring may singil sa pahinang hindi namin natanggap.",
    categories: { delivery: "Paghahatid", generation: "Paglikha ng kuryente", fees_taxes: "Bayarin at buwis", credit: "Credit", gas: "Gas", other: "Iba pa" },
  },
  "Chinese (Simplified)": {
    billingPeriod: "账单周期",
    peakUsage: "高峰时段用电",
    ofYourKwh: "占您的用电量",
    totalElectricity: "总用电量",
    totalDue: "月度账单 · 应付总额",
    byTimeOfDay: "按时段划分的用电量",
    peakWindow: "下午4点至9点是SDG&E电价最高的时段。",
    summary: "摘要",
    topTip: "最佳建议",
    quickRead: "快速了解",
    energyStory: "您的用电情况",
    whereItGoes: "费用去向",
    chargesTitle: "费用明细（通俗解释）",
    lineItems: "项费用",
    billAnalyzed: "账单已分析",
    sampleBill: "示例账单",
    amountsStay: "翻译后金额和用电量保持不变。",
    totalMismatch: "提示：识别到的费用与总额不完全一致，部分费用可能在我们未收到的页面上。",
    categories: { delivery: "输电", generation: "发电", fees_taxes: "费用和税", credit: "抵扣", gas: "燃气", other: "其他" },
  },
  Arabic: {
    billingPeriod: "فترة الفاتورة",
    peakUsage: "الاستهلاك في ساعات الذروة",
    ofYourKwh: "من استهلاكك",
    totalElectricity: "إجمالي الكهرباء",
    totalDue: "الفاتورة الشهرية · المبلغ المستحق",
    byTimeOfDay: "استهلاكك للكهرباء حسب الوقت",
    peakWindow: "من 4 إلى 9 مساءً هي أغلى فترة لدى SDG&E.",
    summary: "ملخص",
    topTip: "أهم نصيحة",
    quickRead: "نظرة سريعة",
    energyStory: "قصة استهلاكك للطاقة",
    whereItGoes: "أين تذهب أموالك",
    chargesTitle: "الرسوم بلغة بسيطة",
    lineItems: "بنود",
    billAnalyzed: "تم تحليل الفاتورة",
    sampleBill: "فاتورة نموذجية",
    amountsStay: "تبقى المبالغ والاستهلاك كما هي عند الترجمة.",
    totalMismatch: "تنبيه: الرسوم التي وجدناها لا تساوي الإجمالي تمامًا. قد تكون بعض البنود في صفحات لم نستلمها.",
    categories: { delivery: "التوصيل", generation: "التوليد", fees_taxes: "رسوم وضرائب", credit: "رصيد", gas: "غاز", other: "أخرى" },
  },
};
