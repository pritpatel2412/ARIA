import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useARIA } from "@/lib/useARIA";
import { useUser } from "@/lib/useUser";
import { getUserSessions, loginUrl, saveSesssion, type ParsedResume } from "@/lib/api";
import { VoiceInput } from "@/components/VoiceInput";
import { AgentTerminal } from "@/components/AgentTerminal";
import { TaskTimeline } from "@/components/TaskTimeline";
import { ResultCard } from "@/components/ResultCard";
import { BrowserPreview } from "@/components/BrowserPreview";
import { ResumeUpload } from "@/components/ResumeUpload";
import { FormProfile, buildFormContext, type FormProfileData } from "@/components/FormProfile";
import { AssistantConnect } from "@/components/AssistantConnect";
import { ContentConnect } from "@/components/ContentConnect";
import { ContentPublisher, type ContentPackage } from "@/components/ContentPublisher";
import { JobApplyForm } from "@/components/JobApplyForm";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import {
  RotateCcw, Zap, Search, FileText, DollarSign, Calendar, Share2, 
  LogOut, Crown, ChevronRight, Briefcase, Rocket, Eye,
  Loader2, Menu, X, Settings
} from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/context/ThemeContext";


type DBSession = {
  id: string;
  goal: string;
  answer?: string | null;
  mode: string;
  taskCount: number;
  successCount: number;
  createdAt: string;
};

type AgentMode = {
  id: string;
  label: string;
  icon: ReactNode;
  color: string;
  desc: string;
  demos: string[];
  prompt: string;
};

function ModeCard({ mode, active, onClick }: { mode: AgentMode; active: boolean; onClick: () => void }) {
  const { colors } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        active ? "text-[#F8FAFC]" : "border-[#1E1E2E] hover:border-[#374151] text-[#9CA3AF] hover:text-[#F8FAFC]"
      }`}
      style={active ? {
        borderColor: `rgba(${colors.primaryRgb},0.5)`,
        backgroundColor: `rgba(${colors.primaryRgb},0.1)`,
      } : undefined}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: active ? mode.color : undefined }}>{mode.icon}</span>
        <span className="text-sm font-mono font-medium truncate">{mode.label}</span>
      </div>
    </button>
  );
}

export function AppDashboard() {
  const { user, loading: userLoading, logout } = useUser();
  const { colors } = useTheme();
  const { status, transcript, events, taskStates, answer, pipelineStep, successCount, totalCount, sessions, isSpeaking, currentScreenshot, currentBrowseUrl, currentStreamingUrl, language, setLanguage, submit, replay, reset, stopSpeaking, setIsSpeaking } = useARIA();
  const [activeMode, setActiveMode] = useState("research");

  const AGENT_MODES: AgentMode[] = useMemo(() => [
    {
      id: "research",
      label: "Research Analyst",
      icon: <Search className="w-4 h-4" />,
      color: colors.primary,
      desc: "Browse the web and synthesize deep insights on any topic.",
      demos: [
        "Compare the free plans of Notion, Trello, and Asana",
        "What are analysts saying about AI agent stocks today?",
        "Find the top 3 GitHub repos for building AI agents and summarize each",
        "What is OpenAI's current pricing for GPT-4o?",
      ],
      prompt: "Research and synthesize information about:",
    },
    {
      id: "career",
      label: "Career Copilot",
      icon: <Briefcase className="w-4 h-4" />,
      color: colors.secondary,
      desc: "Find jobs, write cover letters, and auto-apply. Upload your resume to start.",
      demos: [
        "Find Senior React Developer jobs posted this week in San Francisco",
        "Write a cover letter for a Product Manager role at Stripe",
        "What skills are most in demand for ML engineers in 2026?",
        "Compare salary ranges for Staff Engineer at Google vs Meta",
      ],
      prompt: "Career task:",
    },
    {
      id: "money",
      label: "Money Agent",
      icon: <DollarSign className="w-4 h-4" />,
      color: colors.primary,
      desc: "Track prices, analyze sentiment, and surface financial opportunities. Get buy/hold/sell signals backed by live data.",
      demos: [
        "Should I invest in Bitcoin this week?",
        "Compare ETF fees and returns for VOO, VTI, and VXUS",
        "What are analysts saying about NVIDIA stock today? Give me a buy/sell rating",
        "Find the best high-yield savings account rates and compare the top 5",
      ],
      prompt: "Financial query:",
    },
    {
      id: "forms",
      label: "Form Executor",
      icon: <Zap className="w-4 h-4" />,
      color: colors.secondary,
      desc: "Register for events, apply to programs, and fill web forms autonomously using your saved profile.",
      demos: [
        "Register me for the next major AI hackathon",
        "Find and submit an application to Y Combinator's next batch",
        "Apply to Thiel Fellowship 2026 with my details",
        "Find 3 open AI research internships and apply to each",
      ],
      prompt: "Form task:",
    },
    {
      id: "assistant",
      label: "Executive Assistant",
      icon: <Calendar className="w-4 h-4" />,
      color: colors.primary,
      desc: "Draft emails, schedule meetings, summarize inbox, and manage your workday with AI. Connect Google for live Calendar + Gmail.",
      demos: [
        "Draft a follow-up email to a client I met at a conference — warm and professional",
        "Schedule a 30-minute team sync next Tuesday at 2pm and write the invite email",
        "Write a 30-60-90 day plan for a new VP of Sales starting Monday",
        "Summarize my inbox and flag the 3 most urgent emails",
      ],
      prompt: "Assistant task:",
    },
    {
      id: "content",
      label: "Content Creator",
      icon: <Share2 className="w-4 h-4" />,
      color: colors.secondary,
      desc: "Research trends, write posts, and publish to any platform.",
      demos: [
        "Write a LinkedIn post about the future of AI agents",
        "Create a Twitter/X thread about productivity with AI tools",
        "Draft a blog intro: 'How I used AI to get 10x more done'",
        "Write 5 Instagram captions for a tech startup launch",
      ],
      prompt: "Content task:",
    },
    {
      id: "job-apply",
      label: "Job Autopilot",
      icon: <Rocket className="w-4 h-4" />,
      color: "#F59E0B",
      desc: "Apply to 6 job platforms simultaneously. TinyFish navigates real career pages, fills forms, and submits applications autonomously.",
      demos: [],
      prompt: "Job application:",
    },
    {
      id: "competitor-watch",
      label: "Competitor Watch",
      icon: <Eye className="w-4 h-4" />,
      color: "#A78BFA",
      desc: "Monitor competitor pricing, features, and announcements 24/7. Get instant alerts when your rivals make a move.",
      demos: [],
      prompt: "Monitor:",
    },
  ], [colors.primary, colors.secondary]);
  const [dbSessions, setDbSessions] = useState<DBSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const [savedGoal, setSavedGoal] = useState<string | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [formProfile, setFormProfile] = useState<FormProfileData | null>(null);
  const [lastAssistantDraft, setLastAssistantDraft] = useState<string | null>(null);
  const [contentPackage, setContentPackage] = useState<ContentPackage | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<{ platform: string; platformUsername?: string; platformName?: string }[]>([]);
  const [socialConfigured, setSocialConfigured] = useState({ linkedin: false, twitter: false });

  const mode = AGENT_MODES.find((m) => m.id === activeMode) ?? AGENT_MODES[0];
  const isIdle = status === "idle";
  const isProcessing = status === "processing";
  const isDone = status === "done" || status === "error";

  // Load DB sessions on mount (if authed)
  useEffect(() => {
    if (user) {
      getUserSessions()
        .then((data: { sessions: DBSession[] }) => setDbSessions(data.sessions ?? []))
        .catch(() => {});
    }
  }, [user]);

  // Scroll to result when ARIA finishes
  useEffect(() => {
    if (isDone && answer) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
  }, [isDone, answer]);

  // Save session to DB after answer
  useEffect(() => {
    if (isDone && answer && user && transcript && transcript !== savedGoal) {
      setSavedGoal(transcript);
      void saveSesssion({
        goal: transcript,
        mode: activeMode,
        answer,
        taskCount: totalCount,
        successCount,
      }).then(() => {
        getUserSessions()
          .then((data: { sessions: DBSession[] }) => setDbSessions(data.sessions ?? []))
          .catch(() => {});
      });
    }
  }, [isDone, answer, user, transcript, activeMode, totalCount, successCount, savedGoal]);

  // Capture last assistant draft for copy functionality
  useEffect(() => {
    if (isDone && answer && activeMode === "assistant") {
      setLastAssistantDraft(answer);
    }
  }, [isDone, answer, activeMode]);

  // Parse content package from structured JSON answer
  useEffect(() => {
    if (isDone && answer && activeMode === "content") {
      try {
        const raw = answer.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
        const parsed = JSON.parse(raw) as { content?: ContentPackage };
        if (parsed?.content) setContentPackage(parsed.content);
      } catch {
        // Not JSON — plain text answer, ignore
      }
    }
    if (!isDone) setContentPackage(null);
  }, [isDone, answer, activeMode]);

  // Redirect to login if not authed
  if (!userLoading && !user) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `rgba(${colors.primaryRgb},0.1)`, border: `1px solid rgba(${colors.primaryRgb},0.3)` }}>
          <Zap className="w-8 h-8" style={{ color: colors.primary }} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in to use ARIA</h1>
          <p className="text-[#9CA3AF] text-sm">Your AI agent, your sessions, your data — all saved and secure.</p>
        </div>
        <a
          href={loginUrl("/app")}
          className="px-8 py-3 font-bold rounded-xl transition-colors font-mono"
          style={{ backgroundColor: colors.primary, color: "#0A0A0F" }}
        >
          Sign in with Replit
        </a>
        <a href="/" className="text-sm font-mono text-[#4B5563] hover:text-[#9CA3AF] transition-colors">← Back to home</a>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  const buildResumeContext = (resume: ParsedResume): string => {
    const skills = resume.skills.slice(0, 12).join(", ");
    const latest = resume.experience?.[0];
    const roles = resume.preferredRoles.join(", ");
    return [
      "[RESUME CONTEXT]",
      `Candidate: ${resume.name}`,
      skills ? `Skills: ${skills}` : "",
      latest ? `Latest role: ${latest.role}${latest.company ? ` at ${latest.company}` : ""}` : "",
      roles ? `Target roles: ${roles}` : "",
      resume.locationPreference ? `Location preference: ${resume.locationPreference}` : "",
      resume.summary ? `Background: ${resume.summary}` : "",
      "[/RESUME CONTEXT]",
    ].filter(Boolean).join("\n");
  };

  const handleSubmit = (goal: string) => {
    setSavedGoal(null);
    const resumeContext = activeMode === "career" && parsedResume
      ? buildResumeContext(parsedResume)
      : undefined;
    const formContext = activeMode === "forms" && formProfile
      ? buildFormContext(formProfile)
      : undefined;
    void submit(goal, resumeContext, activeMode, formContext, language);
  };

  const formatTranscriptDisplay = (t: string): string => {
    if (!t.startsWith("JOB_APPLY_V1")) return t;
    const role = t.match(/ROLE:([^:]+?)(?:::|$)/)?.[1]?.trim() ?? "";
    const location = t.match(/LOCATION:([^:]+?)(?:::|$)/)?.[1]?.trim() ?? "";
    const name = t.match(/NAME:([^:]+?)(?:::|$)/)?.[1]?.trim() ?? "";
    return `Job Autopilot: Applying ${name} to ${role} positions in ${location} across 6 platforms`;
  };

  const handleReset = () => {
    setSavedGoal(null);
    reset();
  };

  const allSessions = dbSessions.length > 0 ? dbSessions.map(s => ({
    id: s.id,
    goal: s.goal,
    answer: s.answer ?? "",
    createdAt: s.createdAt,
    taskCount: s.taskCount,
    successCount: s.successCount,
  })) : sessions;

  return (
    <div className="h-screen overflow-hidden bg-[#0A0A0F] flex flex-col text-[#F8FAFC]">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1E1E2E] bg-[#0A0A0F] z-20">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `rgba(${colors.primaryRgb},0.1)`, border: `1px solid rgba(${colors.primaryRgb},0.3)` }}>
              <Zap className="w-3.5 h-3.5" style={{ color: colors.primary }} />
            </div>
            <span className="font-mono font-bold text-sm">ARIA</span>
          </div>
          <span className="hidden sm:block text-[#1E1E2E]">|</span>
          <span className="hidden sm:block text-xs font-mono text-[#4B5563]">{mode.label}</span>
        </div>
        <div className="flex items-center gap-3">
          {!isIdle && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#1E1E2E] text-[#6B7280] hover:text-[#F8FAFC] hover:border-[#374151] transition-colors text-xs font-mono"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          <Link href="/settings" title="Settings">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              {user!.profileImage ? (
                <img src={user!.profileImage} alt={user!.name ?? ""} className="w-7 h-7 rounded-full border border-[#1E1E2E]" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#1E1E2E] flex items-center justify-center font-mono text-xs" style={{ color: colors.primary }}>
                  {(user!.name ?? user!.email ?? "U")[0].toUpperCase()}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-xs font-mono text-[#9CA3AF] leading-none">{user!.name ?? user!.email}</p>
                <p className="text-xs font-mono text-[#F59E0B] capitalize leading-none mt-0.5">{user!.plan}</p>
              </div>
            </div>
          </Link>
          <Link href="/settings">
            <button
              className="p-1.5 text-[#4B5563] hover:text-[#9CA3AF] transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 text-[#4B5563] hover:text-[#F87171] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? "flex" : "hidden"} md:flex flex-col w-64 border-r border-[#1E1E2E] bg-[#0A0A0F] flex-shrink-0 absolute md:relative top-0 bottom-0 left-0 z-10 pt-14 md:pt-0 h-full`}>
          <div className="p-4 border-b border-[#1E1E2E]">
            <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider mb-3">Agent Mode</p>
            <div className="space-y-1">
              {AGENT_MODES.map((m) => (
                <ModeCard
                  key={m.id}
                  mode={m}
                  active={activeMode === m.id}
                  onClick={() => {
                    setActiveMode(m.id);
                    setSidebarOpen(false);
                    if (!isIdle) handleReset();
                  }}
                />
              ))}
            </div>
          </div>

          {/* Plan info */}
          <div className="p-4 border-b border-[#1E1E2E]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-[#4B5563]">Plan</span>
              <span className="text-xs font-mono capitalize flex items-center gap-1" style={{ color: user!.plan === "free" ? "#9CA3AF" : colors.secondary }}>
                {user!.plan !== "free" && <Crown className="w-3 h-3" />}
                {user!.plan}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono text-[#4B5563]">Queries today</span>
              <span className="text-xs font-mono text-[#9CA3AF]">
                {user!.plan === "free"
                  ? `${Math.min(user!.queryCount ?? 0, 10)} / 10`
                  : `${user!.queryCount ?? 0} / 500`}
              </span>
            </div>
            {user!.plan === "free" && (
              <div className="w-full h-1 rounded-full bg-[#1E1E2E] overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(((user!.queryCount ?? 0) / 10) * 100, 100)}%`,
                    background: (user!.queryCount ?? 0) >= 10 ? "#EF4444" : colors.primary,
                  }}
                />
              </div>
            )}
            {user!.plan === "free" && (
              <Link href="/pricing" className="flex items-center gap-1 text-xs font-mono hover:underline" style={{ color: colors.primary }}>
                Upgrade to Pro <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Session history */}
          <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-mono text-[#4B5563] uppercase tracking-wider">Recent</p>
              {allSessions.length > 0 && (
                <button
                  onClick={() => { if (!isIdle) handleReset(); setSidebarOpen(false); }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#1E1E2E] text-[#4B5563] hover:text-[#9CA3AF] hover:border-[#2A2A3A] transition-colors"
                >
                  + New
                </button>
              )}
            </div>

            {allSessions.length > 5 && (
              <input
                type="text"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                placeholder="Search sessions..."
                className="w-full bg-[#111118] border border-[#1E1E2E] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F8FAFC] placeholder-[#374151] focus:outline-none focus:border-[#2A2A3A] transition-colors"
              />
            )}

            {allSessions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="w-8 h-8 rounded-xl bg-[#111118] border border-[#1E1E2E] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#374151]" />
                </div>
                <p className="text-[11px] font-mono text-[#374151] leading-relaxed">
                  Your sessions will<br />appear here
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {allSessions
                  .filter((s) => !sessionSearch || s.goal.toLowerCase().includes(sessionSearch.toLowerCase()))
                  .slice(0, 15)
                  .map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSidebarOpen(false);
                        handleSubmit(s.goal);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#111118] transition-colors group"
                    >
                      <p className="text-xs font-mono text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors line-clamp-2">{s.goal}</p>
                    </button>
                  ))}
                {sessionSearch && allSessions.filter((s) => s.goal.toLowerCase().includes(sessionSearch.toLowerCase())).length === 0 && (
                  <p className="text-xs font-mono text-[#374151] text-center py-4">No matches</p>
                )}
              </div>
            )}
          </div>

          {/* TinyFish badge */}
          <div className="p-4 mt-auto border-t border-[#1E1E2E]">
            <a
              href="https://tinyfish.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all group"
              style={{
                background: "linear-gradient(135deg, rgba(34,211,238,0.07), rgba(6,182,212,0.03))",
                border: "1px solid rgba(34,211,238,0.20)",
              }}
            >
              <span className="text-lg leading-none">🐟</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono font-bold text-[#22D3EE] leading-tight">Powered by TinyFish</p>
                <p className="text-[9px] font-mono text-[#374151] leading-tight mt-0.5">Real browser · Real web</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-pulse flex-shrink-0" />
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 py-6 gap-5 w-full overflow-y-auto">
          {/* Goal display */}
          {transcript && (
            <div className="w-full max-w-2xl mx-auto p-4 rounded-xl border border-[#1E1E2E] bg-[#111118]">
              <p className="text-[#4B5563] text-xs font-mono uppercase tracking-wider mb-1">Goal</p>
              <p className="text-[#F8FAFC] text-sm font-mono">"{formatTranscriptDisplay(transcript)}"</p>
            </div>
          )}

          {/* Idle state */}
          {isIdle && (
            <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
              {/* Competitor Watch — persistent dashboard panel */}
              {activeMode === "competitor-watch" ? (
                <WatchlistPanel />
              ) : activeMode === "job-apply" ? (
                <JobApplyForm
                  onLaunch={handleSubmit}
                  isProcessing={isProcessing}
                />
              ) : (
                <>
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E1E2E] rounded-full text-xs font-mono mb-4" style={{ color: mode.color }}>
                      {mode.icon}
                      <span>{mode.label}</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                      {activeMode === "research" && "What do you want to know?"}
                      {activeMode === "career" && "What job or career task?"}
                      {activeMode === "money" && "What financial data do you need?"}
                      {activeMode === "forms" && "What form should I fill?"}
                      {activeMode === "assistant" && "What should I help you with?"}
                      {activeMode === "content" && "What content should I create?"}
                    </h2>
                    <p className="text-[#6B7280] text-sm font-mono">{mode.desc}</p>
                  </div>

                  {/* Resume upload — Career Copilot only */}
                  {activeMode === "career" && (
                    <div className="w-full">
                      <p className="text-[#4B5563] text-xs font-mono uppercase tracking-wider mb-2">
                        Your Resume
                      </p>
                      <ResumeUpload
                        parsedResume={parsedResume}
                        onResumeParsed={setParsedResume}
                      />
                      {parsedResume && (
                        <p className="mt-2 text-xs font-mono text-[#4B5563] text-center">
                          Resume loaded · ARIA will use it for job searches and applications
                        </p>
                      )}
                    </div>
                  )}

                  {/* Content Creator — social connect panel */}
                  {activeMode === "content" && isIdle && (
                    <div className="mb-4">
                      <ContentConnect
                        onAccountsLoaded={(accts, cfg) => { setSocialAccounts(accts); setSocialConfigured(cfg); }}
                      />
                    </div>
                  )}

                  {activeMode === "assistant" && (
                    <div className="w-full">
                      <p className="text-[#4B5563] text-xs font-mono uppercase tracking-wider mb-2">
                        Google Integration
                      </p>
                      <AssistantConnect lastDraft={lastAssistantDraft ?? undefined} />
                    </div>
                  )}

                  {/* Form profile — Form Executor only */}
                  {activeMode === "forms" && (
                    <div className="w-full">
                      <p className="text-[#4B5563] text-xs font-mono uppercase tracking-wider mb-2">
                        Your Details
                      </p>
                      <FormProfile onProfileReady={setFormProfile} />
                      {formProfile && (
                        <p className="mt-2 text-xs font-mono text-[#4B5563] text-center">
                          Profile ready · ARIA will use your info to auto-fill forms
                        </p>
                      )}
                    </div>
                  )}

                  <VoiceInput
                    onSubmit={handleSubmit}
                    language={language}
                    onLanguageChange={setLanguage}
                    disabled={false}
                  />

                  {/* Demo queries */}
                  {mode.demos.length > 0 && (
                    <div className="w-full">
                      <p className="text-[#374151] text-xs font-mono uppercase tracking-wider mb-3 text-center">Try these</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mode.demos.map((query, i) => (
                          <button
                            key={i}
                            onClick={() => handleSubmit(query)}
                            className="text-left p-3 rounded-lg border border-[#1E1E2E] bg-[#111118] transition-all group"
                            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `rgba(${colors.primaryRgb},0.3)`; el.style.backgroundColor = `rgba(${colors.primaryRgb},0.05)`; }}
                            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = ""; el.style.backgroundColor = ""; }}
                          >
                            <span className="text-[#F59E0B] text-xs font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                            <span className="text-[#9CA3AF] text-xs font-mono group-hover:text-[#F8FAFC] transition-colors">{query}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto">
              <VoiceInput
                onSubmit={handleSubmit}
                language={language}
                onLanguageChange={setLanguage}
                disabled={true}
              />
              <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] glow-pulse" />
                ARIA IS WORKING...
              </div>
            </div>
          )}

          {/* Pipeline timeline */}
          {!isIdle && pipelineStep !== "idle" && (
            <div className="w-full max-w-2xl mx-auto">
              <TaskTimeline currentStep={pipelineStep} />
            </div>
          )}

          {/* Side-by-side: browser preview + agent terminal */}
          {!isIdle && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3" style={{ height: "420px" }}>
              {/* Left: live browser preview */}
              <BrowserPreview
                screenshot={currentScreenshot}
                currentUrl={currentBrowseUrl}
                streamingUrl={currentStreamingUrl}
                isActive={true}
                taskStates={taskStates as Map<string, { status: string; currentUrl?: string; screenshot?: string; streamingUrl?: string; task: { goal: string; url?: string } }>}
              />

              {/* Right: agent terminal */}
              <AgentTerminal events={events} taskStates={taskStates} />
            </div>
          )}

          {/* Result — content mode shows ContentPublisher instead of plain ResultCard */}
          {isDone && answer && activeMode === "content" && contentPackage ? (
            <div ref={resultRef} className="w-full space-y-3">
              {/* Brief spoken summary in ResultCard */}
              <ResultCard
                answer={contentPackage.summary}
                successCount={successCount}
                totalCount={totalCount}
                onReplay={replay}
                onStop={stopSpeaking}
                isSpeaking={isSpeaking}
              />
              {/* Full ContentPublisher */}
              <ContentPublisher
                content={contentPackage}
                accounts={socialAccounts}
                linkedinConfigured={socialConfigured.linkedin}
                twitterConfigured={socialConfigured.twitter}
              />
            </div>
          ) : isDone && answer ? (
            <div ref={resultRef} className="w-full">
              <ResultCard
                answer={answer}
                successCount={successCount}
                totalCount={totalCount}
                onReplay={replay}
                onStop={stopSpeaking}
                isSpeaking={isSpeaking}
              />
            </div>
          ) : null}

          {isDone && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-mono text-sm transition-colors"
              style={{ borderWidth: 1, borderStyle: "solid", borderColor: `rgba(${colors.primaryRgb},0.3)`, backgroundColor: `rgba(${colors.primaryRgb},0.1)`, color: colors.primary }}
            >
              <RotateCcw className="w-4 h-4" />
              Ask another question
            </button>
          )}
        </main>
      </div>
    </div>
  );
}
