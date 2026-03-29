import { Copy, Play, Check, Square } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "@/context/ThemeContext";

interface ResultCardProps {
  answer: string;
  successCount: number;
  totalCount: number;
  onReplay: () => void;
  onStop: () => void;
  isSpeaking: boolean;
}

export function ResultCard({ answer, successCount, totalCount, onReplay, onStop, isSpeaking }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const { colors } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidence = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;

  return (
    <div
      className="slide-up rounded-xl overflow-hidden"
      style={{ border: `1px solid rgba(${colors.primaryRgb},0.2)`, backgroundColor: "#0D0D14" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `rgba(${colors.primaryRgb},0.1)`, backgroundColor: `rgba(${colors.primaryRgb},0.05)` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full glow-pulse" style={{ backgroundColor: colors.primary }} />
          <span className="text-xs font-mono uppercase tracking-wider" style={{ color: colors.primary }}>
            ARIA Response
          </span>
        </div>

        <div className="flex items-center gap-3">
          {totalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#4B5563] text-xs font-mono">confidence</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-3 rounded-sm"
                    style={{ backgroundColor: i < Math.round(confidence / 20) ? colors.primary : "#1E1E2E" }}
                  />
                ))}
              </div>
              <span className="text-xs font-mono" style={{ color: colors.primary }}>{confidence}%</span>
            </div>
          )}

          <div className="flex gap-1">
            {isSpeaking ? (
              <button
                onClick={onStop}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-[11px] font-mono font-bold"
                title="Stop reading"
              >
                <Square className="w-3 h-3 fill-red-400" />
                STOP
              </button>
            ) : (
              <button
                onClick={onReplay}
                className="p-1.5 rounded border border-[#1E1E2E] text-[#6B7280] hover:text-[#F59E0B] hover:border-[#F59E0B]/30 transition-colors"
                title="Play again"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded border border-[#1E1E2E] text-[#6B7280] transition-colors"
              onMouseEnter={e => { const el = e.currentTarget; el.style.color = colors.primary; el.style.borderColor = `rgba(${colors.primaryRgb},0.3)`; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.color = ""; el.style.borderColor = ""; }}
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" style={{ color: colors.primary }} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="px-5 pt-3 flex items-center gap-3">
          <div className="flex items-end gap-0.5 h-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="speak-bar w-1.5 rounded-full bg-[#F59E0B]" style={{ height: "100%" }} />
            ))}
          </div>
          <span className="text-[#F59E0B] text-xs font-mono">READING FULL RESPONSE...</span>
        </div>
      )}

      {/* Markdown-rendered answer */}
      <div className="px-5 py-4 aria-answer">
        <style>{`
          .aria-answer h1 { font-size: 1.35rem; font-weight: 700; color: #F8FAFC; margin: 1.1rem 0 0.5rem; line-height: 1.3; }
          .aria-answer h2 { font-size: 1.1rem; font-weight: 700; color: ${colors.primary}; margin: 1rem 0 0.4rem; letter-spacing: 0.01em; }
          .aria-answer h3 { font-size: 0.95rem; font-weight: 600; color: #E5E7EB; margin: 0.8rem 0 0.3rem; }
          .aria-answer p { color: #D1D5DB; font-size: 0.9rem; line-height: 1.75; margin: 0.5rem 0; }
          .aria-answer ul, .aria-answer ol { padding-left: 1.4rem; margin: 0.5rem 0; }
          .aria-answer ul { list-style-type: disc; }
          .aria-answer ol { list-style-type: decimal; }
          .aria-answer li { color: #D1D5DB; font-size: 0.9rem; line-height: 1.7; margin: 0.25rem 0; }
          .aria-answer li::marker { color: ${colors.primary}; }
          .aria-answer a { color: ${colors.primary}; text-decoration: underline; text-underline-offset: 3px; word-break: break-all; transition: opacity 0.15s; }
          .aria-answer a:hover { opacity: 0.75; }
          .aria-answer strong { color: #F8FAFC; font-weight: 600; }
          .aria-answer em { color: #9CA3AF; font-style: italic; }
          .aria-answer code { background: #1E1E2E; color: ${colors.primary}; font-family: monospace; font-size: 0.82rem; padding: 0.15rem 0.4rem; border-radius: 4px; }
          .aria-answer pre { background: #111118; border: 1px solid #1E1E2E; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0.75rem 0; }
          .aria-answer pre code { background: none; padding: 0; color: #D1D5DB; }
          .aria-answer blockquote { border-left: 3px solid ${colors.primary}; padding-left: 1rem; margin: 0.75rem 0; color: #9CA3AF; }
          .aria-answer hr { border: none; border-top: 1px solid #1E1E2E; margin: 1rem 0; }
          .aria-answer table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.85rem; }
          .aria-answer th { background: rgba(${colors.primaryRgb},0.08); color: ${colors.primary}; font-weight: 600; padding: 0.5rem 0.75rem; border: 1px solid #1E1E2E; text-align: left; }
          .aria-answer td { padding: 0.4rem 0.75rem; border: 1px solid #1E1E2E; color: #D1D5DB; }
          .aria-answer tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        `}</style>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {answer}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      {totalCount > 0 && (
        <div className="px-5 py-2 border-t border-[#1E1E2E]">
          <span className="text-[#4B5563] text-xs font-mono">
            {successCount}/{totalCount} tasks completed · Sources included above
          </span>
        </div>
      )}
    </div>
  );
}
