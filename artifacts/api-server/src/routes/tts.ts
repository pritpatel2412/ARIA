import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const SARVAM_API_KEY = process.env["SARVAM_API_KEY"] ?? "";
const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";
const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";

const LANGUAGE_VOICES: Record<string, string> = {
  "hi-IN": "manisha",
  "bn-IN": "manisha",
  "mr-IN": "manisha",
  "ta-IN": "anushka",
  "kn-IN": "anushka",
  "gu-IN": "manisha",
  "ml-IN": "anushka",
  "te-IN": "anushka",
  "od-IN": "manisha",
  "pa-IN": "manisha",
  "en-IN": "anushka",
};

function splitTextIntoChunks(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }
    const candidates = [
      remaining.lastIndexOf(". ", maxChars),
      remaining.lastIndexOf("? ", maxChars),
      remaining.lastIndexOf("! ", maxChars),
      remaining.lastIndexOf("\n", maxChars),
      remaining.lastIndexOf(", ", maxChars),
    ].filter((i) => i > maxChars * 0.4);
    const cutAt = candidates.length > 0 ? Math.max(...candidates) + 2 : maxChars;
    chunks.push(remaining.slice(0, cutAt).trim());
    remaining = remaining.slice(cutAt).trim();
  }
  return chunks.filter((c) => c.length > 0);
}

router.post("/tts", (async (req: Request, res: Response) => {
  const { text, language = "hi-IN", speaker } = req.body as {
    text?: string;
    language?: string;
    speaker?: string;
  };

  if (!text?.trim()) {
    res.status(400).json({ error: "text required" });
    return;
  }

  if (!SARVAM_API_KEY) {
    res.status(503).json({ error: "SARVAM_API_KEY not configured" });
    return;
  }

  try {
    const chunks = splitTextIntoChunks(text.trim(), 300).slice(0, 10);
    const selectedSpeaker = speaker ?? LANGUAGE_VOICES[language] ?? "shubh";

    const response = await fetch(SARVAM_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: chunks,
        target_language_code: language,
        speaker: selectedSpeaker,
        model: "bulbul:v2",
        enable_preprocessing: true,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: "TTS failed", status: response.status, detail: errText });
      return;
    }

    const data = (await response.json()) as { audios?: string[] };
    res.json({ audios: data.audios ?? [] });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}) as (req: Request, res: Response) => void);

router.post("/stt", (async (req: Request, res: Response) => {
  const { audio, mimeType = "audio/webm", language = "unknown" } = req.body as {
    audio?: string;
    mimeType?: string;
    language?: string;
  };

  if (!audio) {
    res.status(400).json({ error: "audio required" });
    return;
  }

  if (!SARVAM_API_KEY) {
    res.status(503).json({ error: "SARVAM_API_KEY not configured" });
    return;
  }

  try {
    const buffer = Buffer.from(audio, "base64");
    const ext = mimeType.split("/")[1]?.split(";")[0] ?? "webm";
    const blob = new Blob([buffer], { type: mimeType });

    const form = new FormData();
    form.append("file", blob, `recording.${ext}`);
    form.append("language_code", language === "unknown" ? "unknown" : language);
    form.append("model", "saarika:v2.5");
    form.append("with_timestamps", "false");

    const response = await fetch(SARVAM_STT_URL, {
      method: "POST",
      headers: { "api-subscription-key": SARVAM_API_KEY },
      body: form,
    });

    if (!response.ok) {
      const errText = await response.text();
      res.status(502).json({ error: "STT failed", status: response.status, detail: errText });
      return;
    }

    const data = (await response.json()) as { transcript?: string; language_code?: string };
    res.json({ transcript: data.transcript ?? "", language: data.language_code ?? language });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}) as (req: Request, res: Response) => void);

export default router;
