// Landing hero: what the app does, with an animated "power flow" background and a live-looking bill preview.
// Pure CSS/SVG animation (no client JS); motion is disabled for people who prefer reduced motion.
import { ArrowDown, Languages, ScanLine, Zap } from "lucide-react";

// A typical day's electricity use by hour (0 = midnight), just for the illustration.
const DAY = [28, 24, 22, 21, 21, 24, 32, 40, 38, 34, 33, 34, 36, 38, 41, 47, 62, 80, 92, 95, 86, 70, 52, 38];

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden>
        <svg className="hero-lines" viewBox="0 0 1200 420" preserveAspectRatio="none">
          <path className="line l1" d="M-20 300 C 200 240, 380 360, 600 290 S 1000 200, 1220 250" />
          <path className="line l2" d="M-20 340 C 240 300, 420 400, 640 330 S 1020 260, 1220 300" />
          <path className="line l3" d="M-20 120 C 220 170, 420 60, 660 120 S 1040 180, 1220 110" />
          <path className="spark s1" d="M-20 300 C 200 240, 380 360, 600 290 S 1000 200, 1220 250" />
          <path className="spark s2" d="M-20 120 C 220 170, 420 60, 660 120 S 1040 180, 1220 110" />
        </svg>
        <div className="hero-glow" />
      </div>

      <div className="hero-inner">
        <div className="hero-copy">
          <p className="hero-pill"><span className="pulse-dot" /> Built for San Diego households</p>
          <h1 id="hero-title">
            Your <span className="brand-word">SDG&amp;E</span> bill,
            <br />
            <span className="hero-highlight">finally explained.</span>
          </h1>
          <p className="hero-sub">
            Upload your bill and get every charge in plain language, in your language, plus the exact hours that cost you the most.
          </p>
          <div className="hero-actions">
            <a href="#analyze" className="btn-primary">
              Analyze my bill <ArrowDown size={16} aria-hidden />
            </a>
            <a href="#how" className="btn-ghost">How it works</a>
          </div>
          <ul className="hero-facts">
            <li><ScanLine size={15} aria-hidden /> Reads PDFs &amp; photos</li>
            <li><Languages size={15} aria-hidden /> 6 languages</li>
            <li><Zap size={15} aria-hidden /> Real SDG&amp;E rates</li>
          </ul>
        </div>

        <div className="hero-visual" aria-hidden>
          <div className="preview-card">
            <div className="preview-top">
              <span>Total due</span>
              <span className="preview-chip">Bill analyzed</span>
            </div>
            <p className="preview-amount">$186.42</p>
            <p className="preview-label">Electricity cost by hour</p>
            <div className="preview-bars">
              {DAY.map((v, h) => (
                <span
                  key={h}
                  className={h >= 16 && h < 21 ? "peak" : h < 6 ? "super" : ""}
                  style={{ height: `${v}%`, animationDelay: `${h * 45}ms` }}
                />
              ))}
            </div>
            <div className="preview-axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div>
          </div>
          <div className="float-badge badge-a"><span className="dot peak" /> 4–9 PM is peak</div>
          <div className="float-badge badge-b"><span className="dot ok" /> Every charge explained</div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "1", title: "Upload your bill", text: "A PDF from your SDG&E account or a photo of the paper bill." },
    { n: "2", title: "Gemini reads every line", text: "Each charge explained in plain words. Our code checks the math." },
    { n: "3", title: "See where to save", text: "The costly hours, tips with real dollar amounts, and discounts you may qualify for." },
  ];
  return (
    <section id="how" className="how" aria-label="How it works">
      {steps.map((s) => (
        <div key={s.n} className="how-step">
          <span className="how-num">{s.n}</span>
          <div>
            <p className="how-title">{s.title}</p>
            <p className="how-text">{s.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
