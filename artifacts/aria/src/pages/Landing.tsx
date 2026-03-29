import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { loginUrl } from "@/lib/api";
import { useUser } from "@/lib/useUser";
import { Navbar } from "@/components/Navbar";
import { BorderGlow } from "@/components/BorderGlow";
import { useTheme } from "@/context/ThemeContext";
import Lightning from "@/components/Lightning";
import { PLANS } from "@/pages/Pricing";
import {
  Zap, Search, FileText, DollarSign, Calendar, Share2,
  ChevronRight, CheckCircle, Play, ArrowRight, Star, ExternalLink, Sparkles,
} from "lucide-react";

const STEPS = [
  { num: "01", title: "Speak or type your goal", desc: "Use your voice or keyboard. ARIA understands natural language." },
  { num: "02", title: "Watch agents work", desc: "ARIA spins up parallel AI agents to research, extract, and act." },
  { num: "03", title: "Get a spoken answer", desc: "Results synthesized and read aloud. Sessions saved automatically." },
];

const TESTIMONIALS = [
  { name: "Sarah Chen", role: "Product Manager", text: "ARIA saved me 10 hours a week on research. It's like having a team of researchers on demand.", avatar: "SC", stars: 5 },
  { name: "Marcus Wells", role: "Startup Founder", text: "The job search feature is insane. ARIA applied to 20 positions while I slept.", avatar: "MW", stars: 5 },
  { name: "Priya Sharma", role: "Data Analyst", text: "I asked ARIA to analyze the AI agent market. It gave me an investor-ready report in 5 minutes.", avatar: "PS", stars: 5 },
];



function useTypewriter(lines: { delay: number }[], active: boolean) {
  const [visible, setVisible] = useState<number[]>([]);
  useEffect(() => {
    if (!active) return;
    setVisible([]);
    const timers = lines.map((l, i) =>
      setTimeout(() => setVisible((prev) => [...prev, i]), l.delay),
    );
    return () => timers.forEach(clearTimeout);
  }, [active]);
  return visible;
}

function TerminalDemo() {
  const { colors } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const terminalLines = [
    { text: '$ aria run "Compare free plans of Notion, Trello, and Asana"', color: "#4B5563", delay: 0 },
    { text: "✓ Parsing intent... [3 tasks]", color: colors.primary, delay: 600 },
    { text: "→ Agent t1 navigating notion.so/pricing", color: "#9CA3AF", delay: 1000 },
    { text: "→ Agent t2 navigating trello.com/pricing", color: "#9CA3AF", delay: 1300 },
    { text: "→ Agent t3 navigating asana.com/pricing", color: "#9CA3AF", delay: 1600 },
    { text: "✓ 3/3 tasks complete · synthesizing...", color: colors.primary, delay: 2200 },
  ];

  const visible = useTypewriter(terminalLines, inView);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden shadow-2xl relative"
      style={{ boxShadow: inView ? `0 0 60px 0 rgba(${colors.primaryRgb},0.06)` : "none" }}
    >
      <div className="border-b border-[#1E1E2E] px-4 py-3 flex items-center gap-2 bg-[#080810]">
        <div className="w-3 h-3 rounded-full bg-[#F87171]" />
        <div className="w-3 h-3 rounded-full" style={{ background: colors.secondary }} />
        <div className="w-3 h-3 rounded-full" style={{ background: colors.primary }} />
        <span className="ml-2 text-xs font-mono text-[#4B5563] truncate">ARIA — Autonomous Real-time Intelligence Agent</span>
      </div>
      <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm space-y-3 min-h-[180px]">
        <AnimatePresence>
          {visible.map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              style={{ color: terminalLines[i].color }}
            >
              {terminalLines[i].text}
            </motion.div>
          ))}
        </AnimatePresence>
        {visible.includes(5) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-[#F8FAFC] bg-[#111118] rounded-lg p-3 leading-relaxed"
            style={{ border: `1px solid rgba(${colors.primaryRgb},0.2)` }}
          >
            "Notion's free plan gives unlimited pages, Trello offers unlimited cards with 10 boards, and Asana allows up to 15 users. For solo productivity, Notion wins."
          </motion.div>
        )}
        {visible.includes(5) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
            style={{ color: colors.secondary }}
          >
            <Play className="w-3 h-3 shrink-0" />
            <span className="text-xs">Speaking answer... 4.2s total</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function FadeInSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Landing() {
  const { user } = useUser();
  const { colors, theme } = useTheme();
  const lightningHue = theme === "purple" ? 280 : 151;
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const isPurple = colors.primary.toLowerCase().includes("a8") || colors.primary.toLowerCase() === "#a855f7";
  const FEATURES = [
    {
      icon: <Search className="w-6 h-6" style={{ color: colors.primary }} />,
      title: "Research Analyst",
      desc: "Analyze markets, trends, and topics in minutes. ARIA browses multiple sources and synthesizes insights.",
      badge: "Research",
      color: colors.primary,
      rgb: colors.primaryRgb,
      glowHsl: isPurple ? "280 70 65" : "151 100 55",
      glowColors: isPurple ? [colors.primary, "#c084fc", "#818cf8"] : [colors.primary, "#22d3ee", "#4ade80"],
    },
    {
      icon: <FileText className="w-6 h-6" style={{ color: colors.secondary }} />,
      title: "Career Copilot",
      desc: "Upload your resume, find jobs, and auto-apply. ARIA matches you with roles and writes tailored cover letters.",
      badge: "Career",
      color: colors.secondary,
      rgb: colors.secondaryRgb,
      glowHsl: isPurple ? "151 100 55" : "280 70 65",
      glowColors: isPurple ? [colors.secondary, "#22d3ee", "#4ade80"] : [colors.secondary, "#c084fc", "#818cf8"],
    },
    {
      icon: <DollarSign className="w-6 h-6" style={{ color: colors.primary }} />,
      title: "Money Agent",
      desc: "Track prices, analyze sentiment, and surface financial opportunities across crypto, stocks, and more.",
      badge: "Finance",
      color: colors.primary,
      rgb: colors.primaryRgb,
      glowHsl: isPurple ? "280 70 65" : "151 100 55",
      glowColors: isPurple ? [colors.primary, "#c084fc", "#818cf8"] : [colors.primary, "#22d3ee", "#4ade80"],
    },
    {
      icon: <Zap className="w-6 h-6" style={{ color: colors.secondary }} />,
      title: "Form Executor",
      desc: "Register for hackathons, apply for scholarships, fill out any web form — automatically.",
      badge: "Automation",
      color: colors.secondary,
      rgb: colors.secondaryRgb,
      glowHsl: isPurple ? "151 100 55" : "280 70 65",
      glowColors: isPurple ? [colors.secondary, "#22d3ee", "#4ade80"] : [colors.secondary, "#c084fc", "#818cf8"],
    },
    {
      icon: <Calendar className="w-6 h-6" style={{ color: colors.primary }} />,
      title: "Executive Assistant",
      desc: "Schedule meetings, draft emails, and manage your calendar with natural language commands.",
      badge: "Productivity",
      color: colors.primary,
      rgb: colors.primaryRgb,
      glowHsl: isPurple ? "280 70 65" : "151 100 55",
      glowColors: isPurple ? [colors.primary, "#c084fc", "#818cf8"] : [colors.primary, "#22d3ee", "#4ade80"],
    },
    {
      icon: <Share2 className="w-6 h-6" style={{ color: colors.secondary }} />,
      title: "Content Creator",
      desc: "Research trends, write posts, and publish to LinkedIn, X, and other platforms in one command.",
      badge: "Content",
      color: colors.secondary,
      rgb: colors.secondaryRgb,
      glowHsl: isPurple ? "151 100 55" : "280 70 65",
      glowColors: isPurple ? [colors.secondary, "#22d3ee", "#4ade80"] : [colors.secondary, "#c084fc", "#818cf8"],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC] overflow-x-hidden">
      <Navbar />

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 text-center overflow-hidden">
        {/* Lightning background */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
          <Lightning
            hue={lightningHue}
            xOffset={0}
            speed={1}
            intensity={1}
            size={1}
          />
        </div>

        {/* Animated background glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-gradient-to-b from-[#0A0A0F]/30 via-transparent to-[#0A0A0F]/80 rounded-full blur-3xl" />
        </motion.div>

        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            zIndex: 2,
            backgroundImage: `linear-gradient(${colors.primary} 1px, transparent 1px), linear-gradient(to right, ${colors.primary} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: "relative", zIndex: 3 }} className="max-w-5xl mx-auto">
          {/* All three badges — same size */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-2 mb-8"
          >
            {/* TinyFish badge */}
            <motion.a
              href="https://tinyfish.ai"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer transition-all"
              style={{
                background: "rgba(34,211,238,0.10)",
                border: "1px solid rgba(34,211,238,0.35)",
                color: "#22D3EE",
              }}
            >
              <span className="text-xs leading-none">🐟</span>
              Built on TinyFish Real Browser Agents
              <ExternalLink className="w-3 h-3 opacity-60" />
            </motion.a>

            {/* Hackathon badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.30)",
                color: "#F59E0B",
              }}
            >
              <motion.span
                className="w-1.5 h-1.5 bg-[#F59E0B] rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              />
              $2M Pre-Accelerator Hackathon Entry
            </motion.div>

            {/* AI DOES badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full text-xs font-mono text-[#00FF88]"
            >
              <motion.span
                className="w-1.5 h-1.5 bg-[#00FF88] rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              />
              AI that DOES, not just answers
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            Your AI that{" "}
            <span
              className="text-[#00FF88] relative"
              style={{ textShadow: `0 0 40px rgba(${colors.primaryRgb},0.4)` }}
            >
              browses, acts
            </span>
            <br className="hidden sm:block" />
            {" "}& speaks for you
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="text-base sm:text-lg md:text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            ARIA sends autonomous agents across the web in parallel, synthesizes intelligence with Gemini, and delivers spoken answers in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            {user ? (
              <Link href="/app">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 bg-[#00FF88] text-[#0A0A0F] font-bold rounded-xl text-lg cursor-pointer"
                  style={{ boxShadow: `0 0 30px rgba(${colors.primaryRgb},0.35)` }}
                >
                  Open Dashboard <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
            ) : (
              <>
                <motion.a
                  href={loginUrl("/app")}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#00FF88] text-[#0A0A0F] font-bold rounded-xl text-lg"
                  style={{ boxShadow: `0 0 30px rgba(${colors.primaryRgb},0.35)` }}
                >
                  Start for free <ArrowRight className="w-5 h-5" />
                </motion.a>
                <Link href="/pricing">
                  <motion.span
                    whileHover={{ scale: 1.04, borderColor: "rgba(0,255,136,0.5)" }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-4 border border-[#1E1E2E] text-[#9CA3AF] rounded-xl text-lg cursor-pointer transition-colors hover:text-[#F8FAFC]"
                  >
                    See pricing
                  </motion.span>
                </Link>
              </>
            )}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 text-sm text-[#4B5563] font-mono"
          >
            No credit card required · Free 10 queries/day
          </motion.p>
        </motion.div>
      </section>

      {/* ── Demo Terminal ── */}
      <section className="max-w-4xl mx-auto px-4 mb-20 sm:mb-28">
        <TerminalDemo />
      </section>

      {/* ── Trusted By Strip ── */}
      <FadeInSection className="max-w-4xl mx-auto px-4 mb-20 sm:mb-28 text-center">
        <p className="text-xs font-mono text-[#374151] uppercase tracking-widest mb-6">Trusted by professionals at</p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {["Google", "Stripe", "Figma", "Notion", "Linear", "Vercel"].map((co, i) => (
            <motion.span
              key={co}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-[#374151] text-sm sm:text-base font-bold tracking-tight hover:text-[#4B5563] transition-colors cursor-default select-none"
            >
              {co}
            </motion.span>
          ))}
        </div>
      </FadeInSection>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 mb-20 sm:mb-28">
        <FadeInSection className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">6 Autonomous Agent Modes</h2>
          <p className="text-[#9CA3AF] text-base sm:text-lg max-w-2xl mx-auto">One platform, infinite use cases. Switch modes with a voice command.</p>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <BorderGlow
                backgroundColor="#0D0D14"
                borderRadius={12}
                glowColor={f.glowHsl}
                colors={f.glowColors}
                glowIntensity={0.9}
                glowRadius={36}
                edgeSensitivity={28}
                coneSpread={22}
                fillOpacity={0.35}
                style={{ height: "100%" }}
              >
                <div className="p-5 sm:p-6 group cursor-default">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="p-2 rounded-lg bg-[#1A1A26]"
                      style={{ border: `1px solid rgba(${f.rgb},0.15)` }}
                    >
                      {f.icon}
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 bg-[#1A1A26] text-[#4B5563] rounded-full border border-[#1E1E2E]">{f.badge}</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2">{f.title}</h3>
                  <p className="text-[#9CA3AF] text-sm leading-relaxed">{f.desc}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="max-w-4xl mx-auto px-4 mb-20 sm:mb-28">
        <FadeInSection className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">How ARIA works</h2>
        </FadeInSection>

        {/* Connecting line */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 relative">
          <div className="hidden sm:block absolute top-6 left-[calc(33%-12px)] right-[calc(33%-12px)] h-px bg-gradient-to-r from-transparent via-[#1E1E2E] to-transparent" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.15, ease: "easeOut" }}
              viewport={{ once: true, margin: "-60px" }}
              className="relative flex sm:block items-start gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="text-3xl sm:text-4xl font-mono font-bold shrink-0"
                style={{ color: `rgba(${colors.primaryRgb},0.25)` }}
              >
                {s.num}
              </motion.div>
              <div>
                <h3 className="font-bold mb-1 sm:mb-2 mt-1 sm:mt-1">{s.title}</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-6xl mx-auto px-4 mb-20 sm:mb-28">
        <FadeInSection className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">What users say</h2>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
              viewport={{ once: true, margin: "-60px" }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="p-5 sm:p-6 rounded-xl border border-[#1E1E2E] bg-[#0D0D14] relative overflow-hidden group"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 0%, rgba(${colors.primaryRgb},0.04) 0%, transparent 60%)` }} />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="text-[#9CA3AF] text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center text-[#00FF88] font-mono text-xs font-bold shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-[#4B5563]">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <section className="max-w-5xl mx-auto px-4 mb-20 sm:mb-28">
        <FadeInSection>
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight">Simple, honest pricing</h2>
            <p className="text-[#9CA3AF] text-sm sm:text-base">Start free. No credit card required. Upgrade when you need more power.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {PLANS.map((p, i) => {
              const themeColor = p.popular ? colors.primary : p.name === "Team" ? colors.secondary : p.color;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className={`relative flex flex-col rounded-2xl border p-5 ${
                    p.popular
                      ? "border-[#00FF88]/50 bg-[#00FF88]/[0.04]"
                      : "border-[#1E1E2E] bg-[#0D0D14]"
                  }`}
                  style={p.popular ? { boxShadow: `0 0 40px rgba(${colors.primaryRgb},0.10)` } : {}}
                >
                  {p.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-1 px-3 py-0.5 bg-[#00FF88] text-[#0A0A0F] rounded-full text-[10px] font-bold font-mono tracking-widest whitespace-nowrap">
                        <Sparkles className="w-2.5 h-2.5" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Plan name */}
                  <p className="text-xs font-bold font-mono uppercase tracking-wider mb-0.5" style={{ color: themeColor }}>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-[#4B5563] mb-4">{p.tagline}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-sm text-[#9CA3AF]">$</span>
                    <span className="text-4xl font-bold leading-none">{p.usdMonthly}</span>
                    {p.usdMonthly > 0 && <span className="text-xs text-[#4B5563] font-mono">/mo</span>}
                    {p.usdMonthly === 0 && <span className="text-xs text-[#4B5563] font-mono">forever</span>}
                  </div>
                  {p.usdMonthly > 0 && (
                    <p className="text-[10px] text-[#374151] font-mono mb-4">
                      or ${p.usdAnnual}/mo billed annually
                    </p>
                  )}
                  {p.usdMonthly === 0 && <div className="mb-4" />}

                  {/* CTA */}
                  <a
                    href={loginUrl()}
                    className={`block w-full py-2.5 rounded-xl text-center font-bold text-xs font-mono mb-4 transition-all ${
                      p.popular
                        ? "bg-[#00FF88] text-[#0A0A0F]"
                        : "border border-[#2A2A3A] text-[#9CA3AF] hover:border-[#3A3A4A] hover:text-[#F8FAFC]"
                    }`}
                    style={p.popular ? { boxShadow: `0 4px 16px rgba(${colors.primaryRgb},0.25)` } : {}}
                  >
                    {p.usdMonthly === 0 ? "Get started free" : `Start ${p.name}`}
                  </a>

                  <div className="h-px bg-[#1E1E2E] mb-4" />

                  {/* Top features only */}
                  <ul className="space-y-2">
                    {p.features.filter((f) => f.included).slice(0, 5).map((f) => (
                      <li key={f.text} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 shrink-0" style={{ color: themeColor }} />
                        <span className="text-[11px] text-[#9CA3AF]">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 font-mono text-sm hover:underline" style={{ color: colors.primary }}>
              See full pricing · Annual discounts · INR plans <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeInSection>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 mb-16 sm:mb-28">
        <FadeInSection>
          <div className="relative rounded-3xl border border-[#00FF88]/15 bg-[#0D0D14] p-10 sm:p-16 text-center overflow-hidden">
            {/* Glow orbs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#00FF88]/6 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#F59E0B]/4 rounded-full blur-3xl pointer-events-none" />

            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/25 rounded-full text-xs font-mono text-[#00FF88] mb-6"
            >
              <span className="w-1.5 h-1.5 bg-[#00FF88] rounded-full animate-pulse" />
              Join 10,000+ professionals
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 relative">Start doing,<br />not just asking</h2>
            <p className="text-[#9CA3AF] mb-8 text-base sm:text-lg max-w-xl mx-auto">
              The difference between ChatGPT and a billion-dollar product is action. ARIA acts.
            </p>

            {user ? (
              <Link href="/app">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-10 py-4 bg-[#00FF88] text-[#0A0A0F] font-bold rounded-xl text-lg cursor-pointer"
                  style={{ boxShadow: `0 0 40px rgba(${colors.primaryRgb},0.4)` }}
                >
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Link>
            ) : (
              <motion.a
                href={loginUrl("/app")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-10 py-4 bg-[#00FF88] text-[#0A0A0F] font-bold rounded-xl text-lg"
                style={{ boxShadow: `0 0 40px rgba(${colors.primaryRgb},0.4)` }}
              >
                Get started for free <ArrowRight className="w-5 h-5" />
              </motion.a>
            )}
            <p className="mt-4 text-sm text-[#4B5563] font-mono">Sign up with Replit · No credit card</p>
          </div>
        </FadeInSection>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E1E2E] px-4 pt-8 pb-10 sm:pt-10">
        {/* TinyFish powered row */}
        <div className="max-w-6xl mx-auto mb-6 pb-6 border-b border-[#1E1E2E]">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐟</span>
              <div>
                <p className="text-xs font-mono font-bold text-[#22D3EE]">Powered by TinyFish</p>
                <p className="text-[10px] font-mono text-[#4B5563]">Real browser automation · Agents that browse actual websites</p>
              </div>
            </div>
            <a
              href="https://tinyfish.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:opacity-80"
              style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", color: "#22D3EE" }}
            >
              tinyfish.ai <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: colors.primary }} />
            <span className="font-mono font-bold text-[#F8FAFC]">ARIA</span>
            <span className="text-[#4B5563] text-xs sm:text-sm ml-1 sm:ml-2">Autonomous Real-time Intelligence Agent</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-sm font-mono text-[#4B5563]">
            <Link href="/privacy" className="hover:text-[#9CA3AF] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#9CA3AF] transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-[#374151] font-mono">© 2026 ARIA. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
