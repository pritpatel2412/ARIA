import { useARIA } from "../lib/useARIA";
import { VoiceInput } from "../components/VoiceInput";
import { AgentTerminal } from "../components/AgentTerminal";
import { TaskTimeline } from "../components/TaskTimeline";
import { ResultCard } from "../components/ResultCard";
import { SessionHistory } from "../components/SessionHistory";
import { RotateCcw, Zap } from "lucide-react";

export function Home() {
  const {
    status,
    transcript,
    events,
    taskStates,
    answer,
    pipelineStep,
    successCount,
    totalCount,
    sessions,
    isSpeaking,
    submit,
    replay,
    reset,
    stopSpeaking,
    demoQueries,
  } = useARIA();

  const isIdle = status === "idle";
  const isProcessing = status === "processing";
  const isDone = status === "done" || status === "error";

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#1E1E2E]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00FF88]/10 border border-[#00FF88]/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#00FF88]" />
          </div>
          <div>
            <h1 className="text-[#F8FAFC] text-sm font-semibold tracking-wide font-mono">
              ARIA
            </h1>
            <p className="text-[#374151] text-xs font-mono">Autonomous Real-time Intelligence Agent</p>
          </div>
        </div>

        {!isIdle && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E1E2E] text-[#6B7280] hover:text-[#F8FAFC] hover:border-[#374151] transition-colors text-xs font-mono"
          >
            <RotateCcw className="w-3 h-3" />
            RESET
          </button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-8 py-8 gap-8 max-w-3xl mx-auto w-full">

        {/* Transcript display */}
        {transcript && (
          <div className="w-full p-4 rounded-xl border border-[#1E1E2E] bg-[#111118]">
            <p className="text-[#4B5563] text-xs font-mono uppercase tracking-wider mb-1">
              Your goal
            </p>
            <p className="text-[#F8FAFC] text-sm font-mono">"{transcript}"</p>
          </div>
        )}

        {/* Voice / text input — shown when idle */}
        {isIdle && (
          <div className="flex flex-col items-center gap-8 w-full">
            <div className="text-center">
              <h2 className="text-[#F8FAFC] text-3xl font-bold mb-2">
                What do you want to <span className="text-[#00FF88]">know?</span>
              </h2>
              <p className="text-[#6B7280] text-sm font-mono">
                Speak or type a goal. ARIA will browse the web and answer in seconds.
              </p>
            </div>

            <VoiceInput onSubmit={submit} disabled={false} />

            {/* Demo queries */}
            <div className="w-full">
              <p className="text-[#374151] text-xs font-mono uppercase tracking-wider mb-3 text-center">
                Try these
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoQueries.map((query, i) => (
                  <button
                    key={i}
                    onClick={() => submit(query)}
                    className="text-left p-3 rounded-lg border border-[#1E1E2E] bg-[#111118] hover:border-[#00FF88]/30 hover:bg-[#00FF88]/5 transition-all group"
                  >
                    <span className="text-[#F59E0B] text-xs font-mono mr-2">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[#9CA3AF] text-xs font-mono group-hover:text-[#F8FAFC] transition-colors">
                      {query}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Session history */}
            {sessions.length > 0 && (
              <div className="w-full">
                <SessionHistory sessions={sessions} onSelect={submit} />
              </div>
            )}
          </div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="flex flex-col items-center gap-4 w-full py-4">
            <VoiceInput onSubmit={submit} disabled={true} />
            <div className="flex items-center gap-2 text-[#F59E0B] text-xs font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] glow-pulse" />
              ARIA IS WORKING...
            </div>
          </div>
        )}

        {/* Pipeline timeline — shown during and after processing */}
        {!isIdle && pipelineStep !== "idle" && (
          <div className="w-full">
            <TaskTimeline currentStep={pipelineStep} />
          </div>
        )}

        {/* Agent terminal — shown during processing */}
        {!isIdle && (
          <div className="w-full">
            <AgentTerminal events={events} taskStates={taskStates} />
          </div>
        )}

        {/* Result card */}
        {isDone && answer && (
          <div className="w-full">
            <ResultCard
              answer={answer}
              successCount={successCount}
              totalCount={totalCount}
              onReplay={replay}
              onStop={stopSpeaking}
              isSpeaking={isSpeaking}
            />
          </div>
        )}

        {/* Ask another question button */}
        {isDone && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88] font-mono text-sm hover:bg-[#00FF88]/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Ask another question
          </button>
        )}
      </main>
    </div>
  );
}
