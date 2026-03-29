import { Clock, ChevronRight } from "lucide-react";
import type { ARIASession } from "../types";

interface SessionHistoryProps {
  sessions: ARIASession[];
  onSelect: (goal: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function SessionHistory({ sessions, onSelect }: SessionHistoryProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1E1E2E]">
        <Clock className="w-3.5 h-3.5 text-[#4B5563]" />
        <span className="text-[#4B5563] text-xs font-mono uppercase tracking-wider">
          Session History
        </span>
      </div>
      <div className="max-h-40 overflow-y-auto divide-y divide-[#1E1E2E]">
        {sessions.slice(0, 5).map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.goal)}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#111118] transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[#9CA3AF] text-xs font-mono truncate group-hover:text-[#F8FAFC] transition-colors">
                {session.goal}
              </p>
              <p className="text-[#374151] text-xs mt-0.5 font-mono">
                {timeAgo(session.createdAt)} · {session.successCount}/{session.taskCount} tasks
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#374151] flex-shrink-0 group-hover:text-[#6B7280] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
