import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Mail, CheckCircle2, Link2, Clock, Inbox, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

interface GoogleStatus {
  calendar: boolean;
  gmail: boolean;
  calendarEvents?: CalendarEvent[];
  gmailMessages?: GmailMessage[];
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  attendees?: string[];
}

interface GmailMessage {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  void navigator.clipboard.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
}

function DraftResult({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded-lg border border-[#1E1E2E] bg-[#0A0A0F] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1E1E2E]">
        <span className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider">Ready to use</span>
        <button
          onClick={() => copyToClipboard(content, setCopied)}
          className="flex items-center gap-1 text-[10px] font-mono text-[#4B5563] hover:text-[#00FF88] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-[#00FF88]" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="px-3 py-2 text-xs font-mono text-[#9CA3AF] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

interface ServiceCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  connected: boolean;
  color: string;
  children?: React.ReactNode;
}

function ServiceCard({ icon, label, description, connected, color, children }: ServiceCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden">
      <button
        onClick={() => connected && setExpanded((v) => !v)}
        className={`w-full px-4 py-3 flex items-center gap-3 ${connected ? "hover:bg-[#111118]" : ""} transition-colors`}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-medium text-[#F8FAFC]">{label}</span>
            {connected && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/20">
                connected
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-[#4B5563] truncate">{description}</p>
        </div>
        {connected && (
          <span className="text-[#4B5563] shrink-0">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
        {!connected && (
          <div className="shrink-0 w-2 h-2 rounded-full bg-[#374151]" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && connected && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-[#1E1E2E]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AssistantConnect({ lastDraft }: { lastDraft?: string }) {
  const { colors } = useTheme();
  const [status, setStatus] = useState<GoogleStatus>({ calendar: false, gmail: false });
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<number | null>(null);

  const fetchStatus = () => {
    fetch(`${BASE_URL}/api/assistant/status`)
      .then((r) => r.json())
      .then((data: GoogleStatus) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatus();
    pollRef.current = window.setInterval(fetchStatus, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const bothConnected = status.calendar && status.gmail;
  const eitherConnected = status.calendar || status.gmail;

  return (
    <div className="w-full space-y-3">
      {/* Connection status banner */}
      {!loading && (
        <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 text-xs font-mono ${
          bothConnected
            ? "border-[#00FF88]/20 bg-[#00FF88]/5 text-[#00FF88]"
            : eitherConnected
            ? "border-[#F59E0B]/20 bg-[#F59E0B]/5 text-[#F59E0B]"
            : "border-[#1E1E2E] bg-[#0D0D14] text-[#6B7280]"
        }`}>
          {bothConnected ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Google Calendar + Gmail connected — full assistant mode active</>
          ) : eitherConnected ? (
            <><Link2 className="w-3.5 h-3.5" /> Partially connected — ask your admin to connect the remaining Google service</>
          ) : (
            <><Link2 className="w-3.5 h-3.5" /> Google not connected — AI drafting works, live Calendar/Gmail requires connection</>
          )}
        </div>
      )}

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ServiceCard
          icon={<Calendar className="w-4 h-4" />}
          label="Google Calendar"
          description={status.calendar ? "Upcoming events visible" : "Create events, check availability"}
          connected={status.calendar}
          color={colors.primary}
        >
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-2">Upcoming</p>
            {status.calendarEvents && status.calendarEvents.length > 0 ? (
              status.calendarEvents.map((ev) => (
                <div key={ev.id} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: colors.primary }} />
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-[#F8FAFC] truncate">{ev.summary}</p>
                    <p className="text-[10px] font-mono text-[#4B5563]">
                      {new Date(ev.start).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-[#4B5563]">No upcoming events</p>
            )}
          </div>
        </ServiceCard>

        <ServiceCard
          icon={<Mail className="w-4 h-4" />}
          label="Gmail"
          description={status.gmail ? "Inbox accessible" : "Send emails, read inbox, auto-reply"}
          connected={status.gmail}
          color={colors.secondary}
        >
          <div className="px-4 py-3 space-y-2">
            <p className="text-[10px] font-mono text-[#4B5563] uppercase tracking-wider mb-2">Recent</p>
            {status.gmailMessages && status.gmailMessages.length > 0 ? (
              status.gmailMessages.map((msg) => (
                <div key={msg.id} className="border-b border-[#1E1E2E] pb-2 last:border-0 last:pb-0">
                  <p className="text-xs font-mono text-[#F8FAFC] truncate">{msg.subject}</p>
                  <p className="text-[10px] font-mono text-[#6B7280] truncate">From: {msg.from}</p>
                  <p className="text-[10px] font-mono text-[#4B5563] truncate">{msg.snippet}</p>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-[#4B5563]">No recent emails</p>
            )}
          </div>
        </ServiceCard>
      </div>

      {/* What ARIA can do */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { icon: <Mail className="w-3 h-3" />, label: "Draft emails", always: true },
          { icon: <Calendar className="w-3 h-3" />, label: "Create plans", always: true },
          { icon: <Calendar className="w-3 h-3" />, label: "Schedule meetings", always: false },
          { icon: <Inbox className="w-3 h-3" />, label: "Summarize inbox", always: false },
        ].map(({ icon, label, always }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[10px] font-mono"
            style={{
              borderColor: (always || eitherConnected) ? `rgba(${colors.primaryRgb},0.2)` : "rgba(55,65,81,0.5)",
              color: (always || eitherConnected) ? colors.primary : "#374151",
              background: (always || eitherConnected) ? `rgba(${colors.primaryRgb},0.05)` : "transparent",
            }}
          >
            {icon}
            <span>{label}</span>
            {!always && !eitherConnected && (
              <Clock className="w-2.5 h-2.5 ml-auto opacity-50" />
            )}
          </div>
        ))}
      </div>

      {/* If there's a draft from the last ARIA run, show it with copy button */}
      {lastDraft && <DraftResult content={lastDraft} />}
    </div>
  );
}
