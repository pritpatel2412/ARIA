import { useState } from "react";
import { Link } from "wouter";
import { loginUrl } from "@/lib/api";
import { CheckCircle, X, Zap, CreditCard, IndianRupee, DollarSign, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

export const PLANS = [
  {
    name: "Free",
    usdMonthly: 0,
    usdAnnual: 0,
    inrMonthly: 0,
    inrAnnual: 0,
    period: "forever",
    tagline: "Explore ARIA at no cost.",
    color: "#9CA3AF",
    features: [
      { text: "10 queries / day", included: true },
      { text: "All 8 agent modes", included: true },
      { text: "Voice + text input", included: true },
      { text: "Session history (last 20)", included: true },
      { text: "Sarvam AI voice (11 languages)", included: true },
      { text: "Competitor Watch (1 site)", included: true },
      { text: "Resume storage & parsing", included: false },
      { text: "Job auto-apply", included: false },
      { text: "Priority agents", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Pro",
    usdMonthly: 19,
    usdAnnual: 15,
    inrMonthly: 1599,
    inrAnnual: 1279,
    period: "/ month",
    tagline: "For power users who need speed.",
    color: "#00FF88",
    popular: true,
    features: [
      { text: "500 queries / day", included: true },
      { text: "All 8 agent modes", included: true },
      { text: "Voice + text input", included: true },
      { text: "Full session history", included: true },
      { text: "Sarvam AI voice (11 languages)", included: true },
      { text: "Competitor Watch (20 sites)", included: true },
      { text: "Resume storage & parsing", included: true },
      { text: "Auto-apply (5 / day)", included: true },
      { text: "Priority agents (3× faster)", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    name: "Team",
    usdMonthly: 79,
    usdAnnual: 63,
    inrMonthly: 6599,
    inrAnnual: 5279,
    period: "/ month",
    tagline: "ARIA at scale for your whole team.",
    color: "#F59E0B",
    features: [
      { text: "Unlimited queries", included: true },
      { text: "All 8 agent modes", included: true },
      { text: "Voice + text input", included: true },
      { text: "Full session history", included: true },
      { text: "Sarvam AI voice (11 languages)", included: true },
      { text: "Competitor Watch (unlimited)", included: true },
      { text: "Resume storage & parsing", included: true },
      { text: "Unlimited auto-apply", included: true },
      { text: "Priority agents (5× faster)", included: true },
      { text: "API access + Team workspace (10 seats)", included: true },
    ],
  },
];

const FAQ = [
  { q: "How does the free plan work?", a: "You get 10 queries per day at no cost, forever. No credit card required. Upgrade any time for more capacity." },
  { q: "What counts as a query?", a: "Each goal you submit to ARIA counts as one query, regardless of how many sub-tasks or web pages it visits internally." },
  { q: "Can I cancel anytime?", a: "Yes — cancel at any time. Your plan stays active until the end of the billing period with no additional charges." },
  { q: "Which payment methods are accepted?", a: "USD plans use Stripe — all major cards accepted. INR plans use Razorpay — supporting UPI, Net Banking, Cards, Wallets, and EMI." },
  { q: "What are the 8 agent modes?", a: "Research, Career, Money, Forms, Assistant, Content, Job Autopilot, and Competitor Watch. Every plan gets access to all 8." },
  { q: "Do you offer refunds?", a: "Yes — 7-day money-back guarantee on all paid plans. Contact support to request a refund, no questions asked." },
];

function PricingCard({
  plan,
  isINR,
  isAnnual,
  delay,
}: {
  plan: typeof PLANS[0];
  isINR: boolean;
  isAnnual: boolean;
  delay: number;
}) {
  const { colors } = useTheme();
  const themeColor = plan.popular ? colors.primary : plan.name === "Team" ? colors.secondary : plan.color;

  const monthlyPrice = isINR ? plan.inrMonthly : plan.usdMonthly;
  const annualPrice = isINR ? plan.inrAnnual : plan.usdAnnual;
  const displayPrice = isAnnual ? annualPrice : monthlyPrice;
  const currency = isINR ? "₹" : "$";
  const isFree = plan.usdMonthly === 0;

  const annualSavingsUSD = (plan.usdMonthly - plan.usdAnnual) * 12;
  const annualSavingsINR = (plan.inrMonthly - plan.inrAnnual) * 12;
  const annualSavings = isINR ? annualSavingsINR : annualSavingsUSD;

  const provider = isINR ? "Razorpay · INR" : "Stripe · USD";
  const providerColor = isINR ? "#3395FF" : "#635BFF";
  const providerBg = isINR ? "rgba(51,149,255,0.08)" : "rgba(99,91,255,0.08)";
  const providerBorder = isINR ? "rgba(51,149,255,0.20)" : "rgba(99,91,255,0.20)";

  return (
    <motion.div
      className="relative flex flex-col"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
    >
      {/* Popular glow */}
      {plan.popular && (
        <div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${colors.primary}40, transparent 60%)`, zIndex: 0 }}
        />
      )}

      <div
        className={`relative flex flex-col h-full rounded-2xl border p-6 ${
          plan.popular
            ? "border-[#00FF88]/50 bg-[#00FF88]/[0.04]"
            : "border-[#1E1E2E] bg-[#0D0D14]"
        }`}
        style={plan.popular ? { boxShadow: `0 0 50px rgba(${colors.primaryRgb},0.12)` } : {}}
      >
        {/* Most popular badge */}
        {plan.popular && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 px-3 py-1 bg-[#00FF88] text-[#0A0A0F] rounded-full text-[10px] font-bold font-mono tracking-widest whitespace-nowrap shadow-lg shadow-[#00FF88]/20">
              <Sparkles className="w-2.5 h-2.5" />
              MOST POPULAR
            </div>
          </div>
        )}

        {/* Plan name + tagline */}
        <div className="mb-5">
          <h3 className="text-sm font-bold mb-0.5 font-mono" style={{ color: themeColor }}>
            {plan.name.toUpperCase()}
          </h3>
          <p className="text-[11px] text-[#6B7280]">{plan.tagline}</p>
        </div>

        {/* Price */}
        <div className="mb-5">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-[#9CA3AF]">{currency}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={`${displayPrice}-${isINR}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="text-5xl font-bold leading-none tracking-tight"
              >
                {displayPrice.toLocaleString()}
              </motion.span>
            </AnimatePresence>
            {!isFree && (
              <span className="text-xs text-[#4B5563] font-mono ml-1">/ mo</span>
            )}
            {isFree && (
              <span className="text-xs text-[#4B5563] font-mono ml-1">forever</span>
            )}
          </div>

          {/* Annual note */}
          {!isFree && isAnnual && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-1.5 flex items-center gap-2"
            >
              <span className="text-[10px] font-mono text-[#4B5563]">
                {currency}{(displayPrice * 12).toLocaleString()} billed annually
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88]">
                Save {currency}{annualSavings.toLocaleString()}
              </span>
            </motion.div>
          )}
          {!isFree && !isAnnual && (
            <p className="text-[10px] text-[#374151] font-mono mt-1">
              or {currency}{(isINR ? plan.inrAnnual : plan.usdAnnual).toLocaleString()}/mo billed annually
            </p>
          )}
        </div>

        {/* Provider badge */}
        <div
          className="inline-flex items-center gap-1.5 mb-4 px-2.5 py-1 rounded-lg w-fit"
          style={{ background: providerBg, border: `1px solid ${providerBorder}` }}
        >
          <CreditCard className="w-2.5 h-2.5 shrink-0" style={{ color: providerColor }} />
          <span className="text-[9px] font-mono font-bold tracking-widest" style={{ color: providerColor }}>
            {provider}
          </span>
        </div>

        {/* CTA */}
        <motion.a
          href={loginUrl()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`block w-full py-3 rounded-xl text-center font-bold text-sm font-mono mb-5 transition-all ${
            plan.popular
              ? "bg-[#00FF88] text-[#0A0A0F]"
              : "border border-[#2A2A3A] text-[#9CA3AF] hover:border-[#3A3A4A] hover:text-[#F8FAFC]"
          }`}
          style={plan.popular ? { boxShadow: `0 4px 20px rgba(${colors.primaryRgb},0.30)` } : {}}
        >
          {isFree ? "Get started free" : `Start ${plan.name}`}
        </motion.a>

        {/* Divider */}
        <div className="h-px bg-[#1E1E2E] mb-4" />

        {/* Features */}
        <ul className="space-y-2 flex-1">
          {plan.features.map((f) => (
            <li key={f.text} className="flex items-start gap-2.5">
              {f.included ? (
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: themeColor }} />
              ) : (
                <X className="w-3.5 h-3.5 text-[#2A2A3A] shrink-0 mt-0.5" />
              )}
              <span className={`text-[11px] leading-snug ${f.included ? "text-[#9CA3AF]" : "text-[#2E2E3A]"}`}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>

        {/* INR payment methods */}
        {isINR && !isFree && (
          <div className="mt-4 pt-4 border-t border-[#1E1E2E] flex flex-wrap gap-1">
            {["UPI", "Net Banking", "Cards", "Wallets", "EMI"].map((m) => (
              <span key={m} className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#1E1E2E] text-[#374151]">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const { colors } = useTheme();
  const [isINR, setIsINR] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC]">
      <Navbar />

      <div className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
            >
              Simple, honest pricing
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[#6B7280] text-base mb-8"
            >
              Start free. No hidden fees. Cancel anytime.
            </motion.p>

            {/* Toggles row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
              {/* Annual/Monthly toggle */}
              <div className="inline-flex items-center gap-0.5 p-1 rounded-xl border border-[#1E1E2E] bg-[#0D0D14]">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    !isAnnual ? "bg-[#1E1E2E] text-[#F8FAFC]" : "text-[#4B5563] hover:text-[#9CA3AF]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    isAnnual ? "bg-[#1E1E2E] text-[#F8FAFC]" : "text-[#4B5563] hover:text-[#9CA3AF]"
                  }`}
                >
                  Annual
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#00FF88]/15 text-[#00FF88] rounded-full font-bold">
                    −20%
                  </span>
                </button>
              </div>

              {/* Currency toggle */}
              <div className="inline-flex items-center gap-0.5 p-1 rounded-xl border border-[#1E1E2E] bg-[#0D0D14]">
                <button
                  onClick={() => setIsINR(false)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    !isINR ? "bg-[#635BFF] text-white shadow-lg shadow-[#635BFF]/25" : "text-[#4B5563] hover:text-[#9CA3AF]"
                  }`}
                >
                  <DollarSign className="w-3 h-3" />
                  USD · Stripe
                </button>
                <button
                  onClick={() => setIsINR(true)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    isINR ? "bg-[#3395FF] text-white shadow-lg shadow-[#3395FF]/25" : "text-[#4B5563] hover:text-[#9CA3AF]"
                  }`}
                >
                  <IndianRupee className="w-3 h-3" />
                  INR · Razorpay
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={`${isINR}-${isAnnual}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-mono text-[#374151]"
              >
                {isINR
                  ? isAnnual
                    ? "Annual prices in Indian Rupees · billed once per year via Razorpay"
                    : "Monthly prices in Indian Rupees · UPI, Net Banking, Cards & EMI via Razorpay"
                  : isAnnual
                  ? "Annual prices in US Dollars · billed once per year via Stripe"
                  : "Monthly prices in US Dollars · all major cards via Stripe"}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {PLANS.map((plan, i) => (
              <PricingCard
                key={plan.name}
                plan={plan}
                isINR={isINR}
                isAnnual={isAnnual}
                delay={i * 0.08}
              />
            ))}
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <span className="text-xs font-mono text-[#374151]">Secure payments via</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#635BFF]/20 bg-[#635BFF]/5">
              <CreditCard className="w-3.5 h-3.5 text-[#635BFF]" />
              <span className="text-xs font-bold font-mono text-[#635BFF]">Stripe</span>
              <span className="text-[10px] font-mono text-[#374151]">· PCI-DSS Level 1</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#3395FF]/20 bg-[#3395FF]/5">
              <IndianRupee className="w-3.5 h-3.5 text-[#3395FF]" />
              <span className="text-xs font-bold font-mono text-[#3395FF]">Razorpay</span>
              <span className="text-[10px] font-mono text-[#374151]">· PCI-DSS Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E1E2E] bg-[#0D0D14]">
              <span className="text-[10px] font-mono text-[#4B5563]">🔒 7-day money-back guarantee</span>
            </div>
          </div>

          {/* Compare — feature highlight row */}
          <div className="mb-16 rounded-2xl border border-[#1E1E2E] overflow-hidden bg-[#0D0D14]">
            <div className="px-6 py-4 border-b border-[#1E1E2E]">
              <h3 className="text-sm font-bold font-mono text-[#9CA3AF] uppercase tracking-wider">All plans include</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-[#1E1E2E]">
              {[
                { icon: "🤖", title: "8 Agent Modes", sub: "Research, Career, Money, Forms, Assistant, Content, Jobs, Competitor" },
                { icon: "🐟", title: "TinyFish Browsing", sub: "Real web pages, not cached data" },
                { icon: "🎙️", title: "Sarvam AI Voice", sub: "11 Indian languages supported" },
                { icon: "⚡", title: "Gemini AI Core", sub: "State-of-the-art synthesis" },
              ].map((item) => (
                <div key={item.title} className="px-5 py-4">
                  <div className="text-xl mb-1">{item.icon}</div>
                  <p className="text-xs font-bold text-[#F8FAFC] mb-0.5">{item.title}</p>
                  <p className="text-[10px] text-[#4B5563] leading-snug">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
            <div className="space-y-2">
              {FAQ.map((item) => (
                <details key={item.q} className="group border border-[#1E1E2E] rounded-xl overflow-hidden">
                  <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between text-sm font-medium text-[#F8FAFC] hover:text-[#00FF88] transition-colors">
                    {item.q}
                    <span className="text-[#4B5563] text-lg transition-transform duration-200 group-open:rotate-45 ml-4 shrink-0">+</span>
                  </summary>
                  <div className="px-5 pb-4 text-xs text-[#6B7280] leading-relaxed border-t border-[#1E1E2E] pt-3">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#1E1E2E] px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="font-mono font-bold text-sm">ARIA</span>
          </div>
          <div className="flex gap-6 text-xs font-mono text-[#4B5563]">
            <Link href="/privacy" className="hover:text-[#9CA3AF] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#9CA3AF] transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
