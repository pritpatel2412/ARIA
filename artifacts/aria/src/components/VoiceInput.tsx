import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Send, Globe, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const CYCLING_PLACEHOLDERS = [
  "Research the latest AI funding rounds...",
  "Find remote Python jobs at Y Combinator startups...",
  "Summarize Hacker News top stories today...",
  "Track Bitcoin price and market sentiment...",
  "Compare salary ranges for Staff Engineer at Google vs Meta...",
  "Find and fill out the Y Combinator application form...",
  "Summarize my Gmail inbox from today...",
  "Search for Series A SaaS startups hiring in India...",
];

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export const SARVAM_LANGUAGES = [
  { code: "hi-IN", label: "हिंदी", english: "Hindi" },
  { code: "en-IN", label: "English", english: "English" },
  { code: "bn-IN", label: "বাংলা", english: "Bengali" },
  { code: "gu-IN", label: "ગુજરાતી", english: "Gujarati" },
  { code: "kn-IN", label: "ಕನ್ನಡ", english: "Kannada" },
  { code: "ml-IN", label: "മലയാളം", english: "Malayalam" },
  { code: "mr-IN", label: "मराठी", english: "Marathi" },
  { code: "od-IN", label: "ଓଡ଼ିଆ", english: "Odia" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ", english: "Punjabi" },
  { code: "ta-IN", label: "தமிழ்", english: "Tamil" },
  { code: "te-IN", label: "తెలుగు", english: "Telugu" },
];

interface VoiceInputProps {
  onSubmit: (text: string) => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  disabled?: boolean;
}

function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "audio/webm";
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function VoiceInput({ onSubmit, language = "hi-IN", onLanguageChange, disabled }: VoiceInputProps) {
  const { colors } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [manualText, setManualText] = useState("");
  const [mode, setMode] = useState<"voice" | "text">("voice");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const selectedLang = SARVAM_LANGUAGES.find((l) => l.code === language) ?? SARVAM_LANGUAGES[0];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus text input when switching to text mode
  useEffect(() => {
    if (mode === "text" && !disabled) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode, disabled]);

  // Cycle placeholder every 3s when input is empty
  useEffect(() => {
    if (mode !== "text" || disabled || manualText) return;
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % CYCLING_PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, [mode, disabled, manualText]);

  const startRecording = useCallback(async () => {
    setRecordingError(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setRecordingError("Microphone access denied. Please allow microphone access or use text input.");
      setMode("text");
      return;
    }

    streamRef.current = stream;
    const mimeType = getSupportedMimeType();
    const recorder = new MediaRecorder(stream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);

      if (chunksRef.current.length === 0) return;

      setIsTranscribing(true);
      const blob = new Blob(chunksRef.current, { type: mimeType });

      try {
        const base64 = await blobToBase64(blob);
        const res = await fetch(`${BASE_URL}/api/stt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: base64, mimeType, language }),
        });

        if (!res.ok) throw new Error(`STT error ${res.status}`);
        const data = (await res.json()) as { transcript?: string };
        const transcript = data.transcript?.trim() ?? "";

        if (transcript) {
          setInterimText(transcript);
          onSubmit(transcript);
          setTimeout(() => setInterimText(""), 1500);
        } else {
          setRecordingError("No speech detected. Please try again.");
        }
      } catch {
        setRecordingError("Transcription failed. Please try text input.");
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [language, onSubmit]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      onSubmit(manualText.trim());
      setManualText("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Top controls: mode toggle + language picker */}
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {/* Voice / Type toggle */}
        <div className="flex items-center gap-1 text-xs font-mono">
          {(["voice", "text"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 rounded-lg border transition-colors"
              style={mode === m ? {
                borderColor: colors.primary,
                color: colors.primary,
                backgroundColor: `rgba(${colors.primaryRgb},0.1)`,
              } : {
                borderColor: "#1E1E2E",
                color: "#4B5563",
              }}
            >
              {m === "voice" ? "🎙 VOICE" : "⌨ TYPE"}
            </button>
          ))}
        </div>

        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E1E2E] text-xs font-mono text-[#9CA3AF] hover:border-[#374151] transition-colors"
          >
            <Globe className="w-3 h-3" />
            <span>{selectedLang.label}</span>
            <span className="text-[#4B5563]">▾</span>
          </button>

          {showLangPicker && (
            <div
              className="absolute top-full mt-1 left-0 z-50 rounded-xl border border-[#1E1E2E] bg-[#0D0D14] shadow-2xl overflow-hidden"
              style={{ minWidth: "200px" }}
            >
              <div className="p-2 grid grid-cols-1 gap-0.5 max-h-64 overflow-y-auto">
                {SARVAM_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange?.(lang.code);
                      setShowLangPicker(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#1E1E2E] transition-colors"
                    style={lang.code === language ? { color: colors.primary } : { color: "#9CA3AF" }}
                  >
                    <span className="text-sm font-medium">{lang.label}</span>
                    <span className="text-xs text-[#4B5563]">{lang.english}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close picker */}
      {showLangPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowLangPicker(false)} />
      )}

      {/* Voice recording UI */}
      {mode === "voice" ? (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isTranscribing}
            className="relative w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all duration-300 focus:outline-none"
            style={
              isRecording
                ? { borderColor: colors.primary, backgroundColor: `rgba(${colors.primaryRgb},0.1)` }
                : disabled || isTranscribing
                ? { borderColor: "#1E1E2E", backgroundColor: "#111118", opacity: 0.5, cursor: "not-allowed" }
                : { borderColor: "#1E1E2E", backgroundColor: "#111118", cursor: "pointer" }
            }
            onMouseEnter={(e) => {
              if (!disabled && !isRecording && !isTranscribing) {
                const el = e.currentTarget;
                el.style.borderColor = `rgba(${colors.primaryRgb},0.5)`;
                el.style.backgroundColor = `rgba(${colors.primaryRgb},0.05)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isRecording) {
                const el = e.currentTarget;
                el.style.borderColor = "#1E1E2E";
                el.style.backgroundColor = "#111118";
              }
            }}
          >
            {isTranscribing ? (
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
            ) : isRecording ? (
              <>
                <Square className="w-8 h-8" style={{ color: colors.primary }} />
                <div className="absolute -bottom-8 flex items-end gap-0.5 h-6">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="wave-bar w-1 rounded-full"
                      style={{ height: "100%", backgroundColor: colors.primary }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <Mic className={`w-8 h-8 ${disabled ? "text-[#374151]" : "text-[#6B7280]"}`} />
            )}
          </button>

          <div className="text-center mt-6">
            {isTranscribing ? (
              <span className="text-xs font-mono" style={{ color: colors.primary }}>
                TRANSCRIBING...
              </span>
            ) : isRecording ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-mono animate-pulse" style={{ color: colors.primary }}>
                  RECORDING... (tap to stop)
                </span>
                {interimText && (
                  <span className="text-[#9CA3AF] text-sm font-mono max-w-xs text-center">
                    &ldquo;{interimText}&rdquo;
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[#4B5563] text-sm font-mono">
                {disabled ? "PROCESSING..." : `TAP TO SPEAK IN ${selectedLang.english.toUpperCase()}`}
              </span>
            )}
            {recordingError && !isRecording && !isTranscribing && (
              <p className="text-[#F87171] text-xs font-mono mt-1 max-w-xs text-center">{recordingError}</p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleTextSubmit} className="w-full max-w-lg">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder={manualText ? `Type in ${selectedLang.english}...` : CYCLING_PLACEHOLDERS[placeholderIdx]}
              disabled={disabled}
              className="flex-1 bg-[#111118] border border-[#1E1E2E] rounded-lg px-4 py-3 text-[#F8FAFC] placeholder-[#374151] font-mono text-sm focus:outline-none disabled:opacity-50 transition-all"
              style={{ transition: "border-color 0.2s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = `rgba(${colors.primaryRgb},0.5)`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#1E1E2E"; }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && manualText.trim() && !disabled) {
                  e.preventDefault();
                  handleTextSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
            <div className="flex flex-col gap-1 items-end">
              <button
                type="submit"
                disabled={!manualText.trim() || disabled}
                className="px-4 py-3 rounded-lg font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: `rgba(${colors.primaryRgb},0.1)`,
                  border: `1px solid rgba(${colors.primaryRgb},0.3)`,
                  color: colors.primary,
                }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          {manualText.trim() && (
            <p className="text-[10px] font-mono text-[#374151] mt-1.5 text-right pr-0.5">
              ⌘↩ or click Send
            </p>
          )}
        </form>
      )}
    </div>
  );
}
