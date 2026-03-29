import { useState, useRef, useCallback } from "react";
import type { StreamEvent, TaskState, Task, PipelineStep, ARIASession } from "../types";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/gs, "$2")
    .replace(/(\*|_)(.*?)\1/gs, "$2")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/  +/g, " ")
    .trim();
}

function extractSpeakableText(text: string, maxChars = 700): string {
  const clean = stripMarkdown(text);
  if (clean.length <= maxChars) return clean;
  const truncated = clean.slice(0, maxChars);
  const lastSentence = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
    truncated.lastIndexOf(".\n"),
  );
  if (lastSentence > maxChars * 0.5) return truncated.slice(0, lastSentence + 1);
  return truncated + "...";
}

const DEMO_QUERIES = [
  "Compare the free plans of Notion, Trello, and Asana",
  "What is the current Bitcoin price and what are analysts saying today?",
  "Find the top 3 GitHub repos for building AI agents and summarize what each one does",
  "Check if Anthropic has posted any new models or updates on their website this week",
];

function loadSessions(): ARIASession[] {
  try {
    return JSON.parse(localStorage.getItem("aria-sessions") || "[]");
  } catch {
    return [];
  }
}

function saveSession(session: ARIASession) {
  const sessions = loadSessions();
  sessions.unshift(session);
  localStorage.setItem("aria-sessions", JSON.stringify(sessions.slice(0, 20)));
}

let _activeAudioCtx: AudioContext | null = null;

function stopActiveAudio() {
  if (_activeAudioCtx) {
    try { void _activeAudioCtx.close(); } catch { /* ignore */ }
    _activeAudioCtx = null;
  }
}

async function speakWithSarvam(
  text: string,
  language: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { audios?: string[] };
    const audios = data.audios ?? [];
    if (audios.length === 0) return false;

    stopActiveAudio();
    const audioCtx = new AudioContext();
    _activeAudioCtx = audioCtx;
    onStart?.();

    let startTime = audioCtx.currentTime;
    let lastSource: AudioBufferSourceNode | null = null;

    for (const b64 of audios) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      let decoded: AudioBuffer;
      try {
        decoded = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
      } catch {
        continue;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      source.start(startTime);
      startTime += decoded.duration;
      lastSource = source;
    }

    if (lastSource) {
      lastSource.onended = () => {
        onEnd?.();
        if (_activeAudioCtx === audioCtx) _activeAudioCtx = null;
        void audioCtx.close();
      };
    } else {
      onEnd?.();
      if (_activeAudioCtx === audioCtx) _activeAudioCtx = null;
      void audioCtx.close();
    }

    return true;
  } catch {
    return false;
  }
}

function speakWithBrowser(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.name.toLowerCase().includes("google uk english female") ||
      v.name.toLowerCase().includes("samantha") ||
      v.name.toLowerCase().includes("karen") ||
      v.name.toLowerCase().includes("female") ||
      (v.lang === "en-GB" && v.name.toLowerCase().includes("google"))
  );
  if (preferred) utterance.voice = preferred;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.onend = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
}

async function speakText(text: string, language: string, onEnd?: () => void) {
  const success = await speakWithSarvam(text, language, undefined, onEnd);
  if (!success) {
    speakWithBrowser(text, onEnd);
  }
}

export function useARIA() {
  const [status, setStatus] = useState<"idle" | "listening" | "processing" | "done" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [taskStates, setTaskStates] = useState<Map<string, TaskState>>(new Map());
  const [answer, setAnswer] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");
  const [successCount, setSuccessCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sessions, setSessions] = useState<ARIASession[]>(loadSessions);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentScreenshot, setCurrentScreenshot] = useState<string | null>(null);
  const [currentBrowseUrl, setCurrentBrowseUrl] = useState<string | null>(null);
  const [currentStreamingUrl, setCurrentStreamingUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState("hi-IN");
  const abortRef = useRef<AbortController | null>(null);
  const languageRef = useRef("hi-IN");

  const setLanguageAndRef = useCallback((lang: string) => {
    setLanguage(lang);
    languageRef.current = lang;
  }, []);

  const addEvent = useCallback((event: StreamEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const updateTaskState = useCallback((taskId: string, update: Partial<TaskState>) => {
    setTaskStates((prev) => {
      const next = new Map(prev);
      const existing = next.get(taskId);
      if (existing) next.set(taskId, { ...existing, ...update });
      return next;
    });
  }, []);

  const triggerSpeak = useCallback((text: string) => {
    const lang = languageRef.current;
    const speakable = extractSpeakableText(text, 3000);
    if (!speakable) return;
    setIsSpeaking(true);
    void speakText(speakable, lang, () => setIsSpeaking(false));
  }, []);

  const stopSpeaking = useCallback(() => {
    stopActiveAudio();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const processEvent = useCallback(
    (event: StreamEvent, goalRef: string) => {
      addEvent(event);

      switch (event.type) {
        case "PLAN_READY": {
          setPipelineStep("browse");
          if (event.tasks) {
            const newMap = new Map<string, TaskState>();
            event.tasks.forEach((task: Task) => {
              newMap.set(task.taskId, { task, status: "pending", events: [] });
            });
            setTaskStates(newMap);
            setTotalCount(event.tasks.length);
          }
          break;
        }
        case "NAVIGATING":
        case "THINKING": {
          if (event.taskId) {
            updateTaskState(event.taskId, {
              status: "running",
              screenshot: event.screenshot || undefined,
              currentUrl: event.currentUrl || undefined,
              streamingUrl: event.streamingUrl || undefined,
            });
          }
          if (event.screenshot) setCurrentScreenshot(event.screenshot);
          if (event.currentUrl) setCurrentBrowseUrl(event.currentUrl);
          if (event.streamingUrl) setCurrentStreamingUrl(event.streamingUrl);
          setPipelineStep("browse");
          break;
        }
        case "EXTRACTING": {
          if (event.taskId) {
            updateTaskState(event.taskId, {
              status: "running",
              screenshot: event.screenshot || undefined,
              currentUrl: event.currentUrl || undefined,
              streamingUrl: event.streamingUrl || undefined,
            });
          }
          if (event.screenshot) setCurrentScreenshot(event.screenshot);
          if (event.currentUrl) setCurrentBrowseUrl(event.currentUrl);
          if (event.streamingUrl) setCurrentStreamingUrl(event.streamingUrl);
          setPipelineStep("extract");
          break;
        }
        case "TASK_DONE": {
          if (event.taskId) {
            updateTaskState(event.taskId, {
              status: event.message?.includes("failed") ? "error" : "complete",
            });
          }
          break;
        }
        case "COMPLETE": {
          if (event.taskId) updateTaskState(event.taskId, { status: "complete" });
          setPipelineStep("synthesize");
          break;
        }
        case "ERROR": {
          if (event.taskId) updateTaskState(event.taskId, { status: "error" });
          break;
        }
        case "ANSWER_READY": {
          setPipelineStep("speak");
          const text = event.answer ?? event.message ?? "";
          setAnswer(text);
          setSuccessCount(event.successCount ?? 0);
          setTotalCount(event.totalCount ?? 0);
          setStatus("done");

          if (text) {
            triggerSpeak(text);

            const session: ARIASession = {
              id: Date.now().toString(),
              goal: goalRef,
              answer: text,
              createdAt: new Date().toISOString(),
              taskCount: event.totalCount ?? 0,
              successCount: event.successCount ?? 0,
            };
            saveSession(session);
            setSessions(loadSessions());
          }
          break;
        }
      }
    },
    [addEvent, updateTaskState, triggerSpeak]
  );

  const submit = useCallback(
    async (goal: string, resumeContext?: string, mode?: string, formContext?: string, lang?: string) => {
      if (!goal.trim()) return;
      const activeLang = lang ?? languageRef.current;
      setStatus("processing");
      setTranscript(goal);
      setEvents([]);
      setTaskStates(new Map());
      setAnswer(null);
      setPipelineStep("parse");
      setCurrentScreenshot(null);
      setCurrentBrowseUrl(null);
      setCurrentStreamingUrl(null);

      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      try {
        const startRes = await fetch(`${BASE_URL}/api/orchestrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: goal.trim(), resumeContext, formContext, mode, language: activeLang }),
          signal,
        });

        if (!startRes.ok) throw new Error(`HTTP ${startRes.status}`);
        const { sessionId } = (await startRes.json()) as { sessionId: string };

        let cursor = 0;

        while (!signal.aborted) {
          await new Promise<void>((resolve) => setTimeout(resolve, 250));
          if (signal.aborted) break;

          let pollData: { events: StreamEvent[]; done: boolean; total: number };
          try {
            const pollRes = await fetch(
              `${BASE_URL}/api/orchestrate/poll/${sessionId}?after=${cursor}`,
              { signal }
            );
            if (!pollRes.ok) break;
            pollData = (await pollRes.json()) as typeof pollData;
          } catch {
            break;
          }

          for (const event of pollData.events) {
            if (signal.aborted) break;
            processEvent(event, goal);
          }

          cursor = pollData.total;
          if (pollData.done) break;
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          setStatus("error");
          addEvent({
            type: "ERROR",
            message: `Connection error: ${(err as Error).message}`,
            timestamp: Date.now(),
          });
        }
      }
    },
    [addEvent, processEvent]
  );

  const replay = useCallback(() => {
    if (answer) triggerSpeak(answer);
  }, [answer, triggerSpeak]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
    stopActiveAudio();
    setStatus("idle");
    setTranscript("");
    setEvents([]);
    setTaskStates(new Map());
    setAnswer(null);
    setPipelineStep("idle");
    setIsSpeaking(false);
    setSuccessCount(0);
    setTotalCount(0);
    setCurrentScreenshot(null);
    setCurrentBrowseUrl(null);
    setCurrentStreamingUrl(null);
  }, []);

  return {
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
    currentScreenshot,
    currentBrowseUrl,
    currentStreamingUrl,
    language,
    setLanguage: setLanguageAndRef,
    submit,
    replay,
    reset,
    stopSpeaking,
    demoQueries: DEMO_QUERIES,
    setIsSpeaking,
  };
}
