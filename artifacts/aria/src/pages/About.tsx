import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Zap, Brain, Target, Globe } from "lucide-react";
import { loginUrl } from "@/lib/api";
import { useTheme } from "@/context/ThemeContext";

export function About() {
  const { colors } = useTheme();
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F8FAFC]">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-full text-xs font-mono text-[#00FF88] mb-6">
              <Zap className="w-3 h-3" /> Our mission
            </div>
            <h1 className="text-5xl font-bold mb-6">AI that <span className="text-[#00FF88]">does</span>, not just talks</h1>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto leading-relaxed">
              ARIA was built on a single belief: the gap between asking AI a question and having AI actually complete a task for you is worth closing. We're building the infrastructure for autonomous digital work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: <Brain className="w-6 h-6" style={{ color: colors.primary }} />, title: "Multi-model intelligence", desc: "ARIA combines Groq's Llama 3.3 70B for speed, Gemini for synthesis, and specialized agents for action." },
              { icon: <Globe className="w-6 h-6" style={{ color: colors.secondary }} />, title: "Real-world access", desc: "Unlike chatbots, ARIA's agents navigate real websites, extract live data, and submit actual forms." },
              { icon: <Target className="w-6 h-6" style={{ color: colors.primary }} />, title: "Goal-oriented", desc: "You give ARIA an objective. It figures out the steps, executes them in parallel, and reports back." },
            ].map((v) => (
              <div key={v.title} className="p-6 rounded-xl border border-[#1E1E2E] bg-[#0D0D14]">
                <div className="p-2 rounded-lg bg-[#1E1E2E] w-fit mb-4">{v.icon}</div>
                <h3 className="font-bold mb-2">{v.title}</h3>
                <p className="text-[#9CA3AF] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">The technology stack</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Groq LLaMA 3.3 70B", role: "Intent parsing & fallback synthesis", color: colors.secondary },
                { name: "Google Gemini 2.0 Flash", role: "Multi-modal result synthesis", color: colors.primary },
                { name: "TinyFish Agents", role: "Autonomous web browsing & form filling", color: colors.secondary },
                { name: "Server-Sent Events (SSE)", role: "Real-time streaming pipeline", color: colors.primary },
                { name: "Web Speech API", role: "Voice input & text-to-speech output", color: colors.secondary },
                { name: "PostgreSQL + Drizzle ORM", role: "User data & session persistence", color: colors.primary },
              ].map((t) => (
                <div key={t.name} className="flex items-center gap-4 p-4 rounded-xl border border-[#1E1E2E] bg-[#0D0D14]">
                  <div className="w-2 h-8 rounded-full" style={{ background: t.color }} />
                  <div>
                    <p className="font-mono font-bold text-sm">{t.name}</p>
                    <p className="text-[#9CA3AF] text-xs">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#1E1E2E] bg-[#0D0D14] p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Join us in building the future of AI work</h2>
            <p className="text-[#9CA3AF] mb-6">ARIA is in active development. Your feedback directly shapes what we build next.</p>
            <a href={loginUrl()} className="inline-block px-8 py-3 bg-[#00FF88] text-[#0A0A0F] font-bold rounded-xl hover:bg-[#00FF88]/90 transition-colors">
              Try ARIA free today
            </a>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#1E1E2E] px-4 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: colors.primary }} />
            <span className="font-mono font-bold text-sm">ARIA</span>
          </div>
          <div className="flex gap-6 text-sm font-mono text-[#4B5563]">
            <Link href="/privacy" className="hover:text-[#9CA3AF]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#9CA3AF]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
