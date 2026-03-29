import { useEffect, useRef } from "react";
import type { StreamEvent, TaskState } from "../types";
import { useTheme } from "@/context/ThemeContext";

interface AgentTerminalProps {
  events: StreamEvent[];
  taskStates: Map<string, TaskState>;
}

const EVENT_ICONS: Record<string, string> = {
  THINKING: "🤔",
  NAVIGATING: "🧭",
  EXTRACTING: "📦",
  COMPLETE: "✅",
  TASK_DONE: "✅",
  ERROR: "❌",
  PLAN_READY: "📋",
  ANSWER_READY: "🎯",
};

const EVENT_COLORS: Record<string, string> = {
  THINKING: "text-[#9CA3AF]",
  NAVIGATING: "text-[#60A5FA]",
  EXTRACTING: "text-[#F59E0B]",
  COMPLETE: "text-[#00FF88]",
  TASK_DONE: "text-[#00FF88]",
  ERROR: "text-red-400",
  PLAN_READY: "text-[#A78BFA]",
  ANSWER_READY: "text-[#00FF88]",
};

function TaskBadge({ taskId, state }: { taskId: string; state: TaskState }) {
  const { status } = state;
  const { colors } = useTheme();
  const pr = colors.primaryRgb;
  const se = colors.secondaryRgb;
  const color =
    status === "complete"
      ? { border: `rgba(${pr},0.35)`, text: colors.primary, dot: colors.primary }
      : status === "error"
      ? { border: "rgba(248,113,113,0.35)", text: "#F87171", dot: "#F87171" }
      : status === "running"
      ? { border: `rgba(${se},0.35)`, text: colors.secondary, dot: colors.secondary }
      : { border: "rgba(55,65,81,0.5)", text: "#4B5563", dot: "#374151" };

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0"
      style={{ borderColor: color.border, color: color.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: color.dot,
          animation: status === "running" ? "pulse 1s ease-in-out infinite" : "none",
        }}
      />
      <span className="uppercase">{taskId}</span>
    </div>
  );
}

export function AgentTerminal({ events, taskStates }: AgentTerminalProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const filteredEvents = events.filter(
    (e) => e.type !== "ANSWER_READY" && e.message
  );

  return (
    <div className="relative rounded-xl border border-[#1E1E2E] bg-[#0D0D14] overflow-hidden flex flex-col h-full">
      {/* Terminal header — single row, no wrapping */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1E1E2E] bg-[#111118] shrink-0 min-w-0">
        <div className="flex gap-1 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[#4B5563] text-[10px] font-mono shrink-0">aria-agent — bash</span>

        {/* Task badges — scrollable row, never wrap */}
        {taskStates.size > 0 && (
          <div className="flex gap-1 ml-auto overflow-x-auto scrollbar-none shrink-0">
            {Array.from(taskStates.entries()).map(([taskId, state]) => (
              <TaskBadge key={taskId} taskId={taskId} state={state} />
            ))}
          </div>
        )}
      </div>

      {/* Terminal body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 relative z-0">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center gap-2 text-[#374151] text-xs font-mono">
            <span className="text-[#00FF88]">$</span>
            <span className="cursor-blink">_</span>
          </div>
        ) : (
          <>
            {filteredEvents.map((event, i) => (
              <div
                key={i}
                className={`flex items-start gap-1.5 text-xs font-mono leading-relaxed ${
                  EVENT_COLORS[event.type] || "text-[#9CA3AF]"
                }`}
                style={{
                  animation: `termFadeIn 0.15s ease-out ${Math.min(i * 0.04, 0.4)}s both`,
                }}
              >
                <span className="flex-shrink-0 w-4 text-center text-[11px]">
                  {EVENT_ICONS[event.type] || "·"}
                </span>
                {event.taskId && (
                  <span className="flex-shrink-0 text-[#4B5563] text-[10px] leading-relaxed">
                    [{event.taskId}]
                  </span>
                )}
                <span className="min-w-0 break-words">{event.message}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      <style>{`
        @keyframes termFadeIn {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
