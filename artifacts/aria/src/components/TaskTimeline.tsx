import type { PipelineStep } from "../types";

interface TaskTimelineProps {
  currentStep: PipelineStep;
}

const STEPS: { key: PipelineStep; label: string; icon: string }[] = [
  { key: "parse", label: "Parse", icon: "🧠" },
  { key: "browse", label: "Browse", icon: "🌐" },
  { key: "extract", label: "Extract", icon: "📦" },
  { key: "synthesize", label: "Synthesize", icon: "✨" },
  { key: "speak", label: "Speak", icon: "🎙️" },
];

const STEP_ORDER: PipelineStep[] = ["idle", "parse", "browse", "extract", "synthesize", "speak"];

function getStepStatus(step: PipelineStep, current: PipelineStep): "done" | "active" | "pending" {
  const stepIdx = STEP_ORDER.indexOf(step);
  const currentIdx = STEP_ORDER.indexOf(current);
  if (stepIdx < currentIdx) return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export function TaskTimeline({ currentStep }: TaskTimelineProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-center gap-0 min-w-max mx-auto">
        {STEPS.map((step, idx) => {
          const status = getStepStatus(step.key, currentStep);

          return (
            <div key={step.key} className="flex items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-500 ${
                    status === "done"
                      ? "border-[#00FF88] bg-[#00FF88]/15 text-[#00FF88]"
                      : status === "active"
                      ? "border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B] glow-pulse"
                      : "border-[#1E1E2E] bg-transparent text-[#374151]"
                  }`}
                >
                  {status === "done" ? "✓" : step.icon}
                </div>
                <span
                  className={`text-xs font-mono uppercase tracking-wider transition-colors duration-500 ${
                    status === "done"
                      ? "text-[#00FF88]"
                      : status === "active"
                      ? "text-[#F59E0B]"
                      : "text-[#374151]"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 mt-[-18px] transition-all duration-500 ${
                    getStepStatus(STEPS[idx + 1].key, currentStep) !== "pending" ||
                    status === "done"
                      ? "bg-[#00FF88]/40"
                      : "bg-[#1E1E2E]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
