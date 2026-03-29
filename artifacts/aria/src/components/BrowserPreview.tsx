import { motion, AnimatePresence } from "framer-motion";
import { Globe, Loader2, CheckCircle2, RefreshCw, Maximize2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface TaskEntry {
  status: string;
  currentUrl?: string;
  screenshot?: string;
  streamingUrl?: string;
  task: { goal: string; url?: string };
}

interface BrowserPreviewProps {
  screenshot: string | null;
  currentUrl: string | null;
  streamingUrl: string | null;
  isActive: boolean;
  taskStates: Map<string, TaskEntry>;
}

export function BrowserPreview({ screenshot, currentUrl, streamingUrl, taskStates }: BrowserPreviewProps) {
  const { colors } = useTheme();
  const allTasks = Array.from(taskStates.values());
  const runningTasks = allTasks.filter((t) => t.status === "running");
  const completedTasks = allTasks.filter((t) => t.status === "complete");
  const activeTasks = allTasks.filter((t) => t.status === "running" || t.status === "complete");

  // Prefer a still-running task for display; fall back to most-recent completed
  const preferredTask = runningTasks[0] ?? completedTasks[completedTasks.length - 1] ?? null;

  // Resolve the best URL to show in the address bar — prefer running task
  const displayUrl =
    (runningTasks.find((t) => t.currentUrl)?.currentUrl) ||
    currentUrl ||
    (preferredTask?.task.url) ||
    "agent.tinyfish.ai";

  // Viewport priority:
  // 1. A currently-running task's streaming URL (live in-progress session)
  // 2. A currently-running task's screenshot
  // 3. Global streamingUrl only when no per-task data yet (connecting phase)
  // 4. Global screenshot
  // 5. Skeleton

  const runningStreamingUrl = runningTasks.find((t) => t.streamingUrl)?.streamingUrl ?? null;
  const runningScreenshot   = runningTasks.find((t) => t.screenshot)?.screenshot ?? null;

  // Use global values only while tasks are running and haven't produced per-task data yet
  const displayStreamingUrl = runningStreamingUrl ?? (runningTasks.length > 0 && !runningScreenshot ? streamingUrl : null);
  const displayScreenshot   = runningScreenshot ?? (runningTasks.length > 0 ? screenshot : screenshot ?? completedTasks.findLast?.((t) => t.screenshot)?.screenshot ?? null);

  const runningCount = Array.from(taskStates.values()).filter((t) => t.status === "running").length;
  const completeCount = Array.from(taskStates.values()).filter((t) => t.status === "complete").length;
  const totalCount = taskStates.size;

  // Clean URL for display (strip protocol)
  const shortUrl = displayUrl.replace(/^https?:\/\//, "").split("?")[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full rounded-xl border border-[#1E1E2E] bg-[#080810] overflow-hidden flex flex-col"
      style={{ boxShadow: `0 0 40px rgba(${colors.primaryRgb},0.06)` }}
    >
      {/* Browser chrome */}
      <div className="border-b border-[#1E1E2E] bg-[#0D0D14] px-3 py-2 flex items-center gap-2 shrink-0">
        {/* Traffic lights */}
        <div className="flex gap-1.5 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F87171]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88]/60" />
        </div>

        {/* Refresh/loading indicator */}
        <div className="shrink-0">
          {runningCount > 0 ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-3 h-3 text-[#00FF88]" />
            </motion.div>
          ) : (
            <CheckCircle2 className="w-3 h-3 text-[#00FF88]/50" />
          )}
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-[#111118] border border-[#1E1E2E] rounded-md px-2.5 py-1 min-w-0">
          <Globe className="w-2.5 h-2.5 text-[#00FF88] shrink-0" />
          <span className="text-[10px] sm:text-xs font-mono text-[#6B7280] truncate">
            {shortUrl}
          </span>
          {runningCount > 0 && (
            <motion.div
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              className="h-0.5 bg-[#00FF88] rounded-full ml-auto shrink-0"
              style={{ width: "36px", transformOrigin: "left" }}
            />
          )}
        </div>

        {/* Task counter */}
        {totalCount > 0 && (
          <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono">
            <span className="text-[#00FF88]">{completeCount}</span>
            <span className="text-[#374151]">/</span>
            <span className="text-[#4B5563]">{totalCount}</span>
          </div>
        )}

        {/* Open in new tab (for streaming URL) */}
        {displayStreamingUrl && (
          <a
            href={displayStreamingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1 text-[#4B5563] hover:text-[#00FF88] transition-colors"
            title="Open live view in new tab"
          >
            <Maximize2 className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Viewport */}
      <div className="relative bg-[#080810] flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {displayStreamingUrl ? (
            /* Live iframe stream from TinyFish */
            <motion.div
              key="stream"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 w-full h-full"
            >
              <iframe
                src={displayStreamingUrl}
                className="w-full h-full border-0"
                title="Live browser agent view"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                style={{ background: "#080810" }}
              />
            </motion.div>
          ) : displayScreenshot ? (
            /* Screenshot from TinyFish */
            <motion.img
              key={displayScreenshot.slice(-20)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              src={displayScreenshot}
              alt="Live browser view"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          ) : (
            /* Skeleton while waiting for stream/screenshot */
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8"
            >
              <div className="w-full max-w-xs space-y-2.5">
                <div className="flex gap-2 items-center mb-4">
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-4 bg-[#1E1E2E] rounded w-1/3"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="h-4 bg-[#1E1E2E] rounded w-1/4"
                  />
                </div>
                {[1, 0.7, 0.85, 0.6, 0.9].map((w, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.1 }}
                    className="h-3 bg-[#1E1E2E] rounded"
                    style={{ width: `${w * 100}%` }}
                  />
                ))}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 0.45, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                      className="h-16 bg-[#1E1E2E] rounded-lg"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-[#4B5563]">
                <Loader2 className="w-3 h-3 animate-spin text-[#00FF88]" />
                <span>
                  {runningCount > 0
                    ? `${runningCount} agent${runningCount > 1 ? "s" : ""} browsing live...`
                    : "Connecting to browser agent..."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LIVE badge */}
        {runningCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0F]/80 border border-[#1E1E2E] rounded-full backdrop-blur-sm z-10">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"
            />
            <span className="text-[10px] font-mono text-[#00FF88]">LIVE</span>
          </div>
        )}

        {/* "Stream active" badge when iframe is showing */}
        {displayStreamingUrl && runningCount > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-[#0A0A0F]/80 border border-[#00FF88]/20 rounded-full backdrop-blur-sm z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00FF88]/70">Real browser stream</span>
          </div>
        )}
      </div>

      {/* Task chips */}
      {activeTasks.length > 0 && (
        <div className="border-t border-[#1E1E2E] px-3 py-2 bg-[#0D0D14] shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {Array.from(taskStates.entries()).map(([id, state]) => {
              let hostname = id;
              try { hostname = state.task.url ? new URL(state.task.url).hostname : id; } catch {}
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono"
                  style={{
                    borderColor: state.status === "complete" ? `rgba(${colors.primaryRgb},0.3)` : state.status === "error" ? "rgba(248,113,113,0.3)" : `rgba(${colors.secondaryRgb},0.3)`,
                    color: state.status === "complete" ? colors.primary : state.status === "error" ? "#F87171" : colors.secondary,
                    background: state.status === "complete" ? `rgba(${colors.primaryRgb},0.05)` : state.status === "error" ? "rgba(248,113,113,0.05)" : `rgba(${colors.secondaryRgb},0.05)`,
                  }}
                >
                  {state.status === "running" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-2 h-2 border border-current rounded-full border-t-transparent"
                    />
                  )}
                  {state.status === "complete" && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {state.status === "error" && <span>✗</span>}
                  {state.status === "pending" && <div className="w-2 h-2 rounded-full bg-current opacity-30" />}
                  <span className="truncate max-w-[120px]">{hostname}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
