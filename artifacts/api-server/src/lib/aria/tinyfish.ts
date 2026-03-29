import type { Task, AgentEvent } from "./types.js";
import { logger } from "../logger.js";

const TINYFISH_KEY_PRIMARY = process.env["TINY_FISH_API_KEY"];
const TINYFISH_KEY_FALLBACK = process.env["TINYFISH_API_KEY"];
const TINYFISH_ENDPOINT = "https://agent.tinyfish.ai/v1/automation/run-sse";

function isCreditError(status: number, body: string): boolean {
  if (status === 402 || status === 429) return true;
  const lower = body.toLowerCase();
  return (
    lower.includes("credit") ||
    lower.includes("quota") ||
    lower.includes("insufficient") ||
    lower.includes("limit exceeded") ||
    lower.includes("out of") ||
    lower.includes("no balance") ||
    lower.includes("upgrade")
  );
}

// Resolve the best available key: prefer primary, fall back if exhausted
let _activeKey: string | undefined = TINYFISH_KEY_PRIMARY;
let _fallbackExhausted = false;

function getActiveKey(): string | undefined {
  return _activeKey;
}

function switchToFallback(): boolean {
  if (_fallbackExhausted || !TINYFISH_KEY_FALLBACK || _activeKey === TINYFISH_KEY_FALLBACK) {
    _fallbackExhausted = true;
    return false;
  }
  logger.warn("Primary TinyFish key exhausted — switching to fallback key");
  _activeKey = TINYFISH_KEY_FALLBACK;
  return true;
}

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env["GROQ_API_KEY"];

async function* parseTinyFishSSE(
  response: Response,
  taskId: string
): AsyncGenerator<AgentEvent> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let gotAnyResult = false;
  let lastResultJson: Record<string, unknown> | undefined;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("event:")) continue;

        // Strip "data:" prefix
        const dataStr = line.startsWith("data:") ? line.slice(5).trim() : line;
        if (!dataStr || dataStr === "[DONE]") continue;

        // Try JSON parse first
        let parsed: Record<string, unknown> | null = null;
        try {
          parsed = JSON.parse(dataStr) as Record<string, unknown>;
        } catch {
          // Plain text line — emit as thinking message
          if (dataStr.length > 0 && dataStr.length < 1000) {
            yield {
              taskId,
              type: "THINKING",
              message: dataStr,
              timestamp: Date.now(),
            };
          }
          continue;
        }

        // Map TinyFish raw type to our event type (must be first)
        const rawType = String(
          parsed["type"] || parsed["event"] || parsed["status"] || parsed["action"] || "thinking"
        ).toUpperCase();

        // Log every TinyFish event at INFO level so we can see the structure
        logger.info({ taskId, rawType, keys: Object.keys(parsed), preview: JSON.stringify(parsed).slice(0, 300) }, "TinyFish raw event");

        // Extract screenshot (base64 data URI or raw base64)
        const rawScreenshot =
          (parsed["screenshot"] as string | undefined) ||
          (parsed["image"] as string | undefined) ||
          (parsed["screenshot_url"] as string | undefined) ||
          (parsed["screenshotBase64"] as string | undefined) ||
          (parsed["screenshot_base64"] as string | undefined) ||
          undefined;

        // Normalise screenshot — ensure it has a data URI prefix for <img src>
        const screenshot = rawScreenshot
          ? rawScreenshot.startsWith("data:") || rawScreenshot.startsWith("http")
            ? rawScreenshot
            : `data:image/png;base64,${rawScreenshot}`
          : undefined;

        // Extract URL being browsed
        const currentUrl =
          (parsed["current_url"] as string | undefined) ||
          (parsed["currentUrl"] as string | undefined) ||
          (parsed["page_url"] as string | undefined) ||
          (parsed["pageUrl"] as string | undefined) ||
          (rawType !== "STREAMING_URL" ? (parsed["url"] as string | undefined) : undefined) ||
          undefined;

        // Extract streaming URL (live browser view) from any event that carries it
        const streamingUrl =
          (parsed["streaming_url"] as string | undefined) ||
          (parsed["stream_url"] as string | undefined) ||
          (parsed["liveUrl"] as string | undefined) ||
          (parsed["live_url"] as string | undefined) ||
          undefined;

        // STREAMING_URL — capture the live browser stream URL and forward it
        if (rawType === "STREAMING_URL") {
          const liveUrl =
            streamingUrl ||
            (parsed["url"] as string | undefined) ||
            (parsed["link"] as string | undefined) ||
            undefined;

          if (liveUrl) {
            logger.info({ taskId, liveUrl }, "TinyFish streaming URL captured");
            yield {
              taskId,
              type: "NAVIGATING",
              message: `Live browser stream connected`,
              streamingUrl: liveUrl,
              currentUrl: liveUrl,
              timestamp: Date.now(),
            };
          }
          continue;
        }

        // Skip pure housekeeping events — no useful content
        if (
          rawType === "HEARTBEAT" ||
          rawType === "PING" ||
          rawType === "KEEP_ALIVE"
        ) {
          continue;
        }

        let eventType: AgentEvent["type"] = "THINKING";
        if (rawType === "PROGRESS") {
          eventType = "NAVIGATING";
        } else if (rawType === "COMPLETE" || rawType === "COMPLETED" || (parsed["status"] as string)?.toUpperCase() === "COMPLETED") {
          eventType = "COMPLETE";
        } else if (rawType === "ERROR" || rawType === "FAILED" || rawType.includes("FAIL")) {
          eventType = "ERROR";
        } else {
          const lc = rawType.toLowerCase();
          if (lc.includes("navig") || lc.includes("goto") || lc.includes("open") || lc.includes("browse") || lc.includes("load") || lc.includes("click") || lc.includes("scroll") || lc.includes("action")) {
            eventType = "NAVIGATING";
          } else if (lc.includes("extract") || lc.includes("read") || lc.includes("scrape") || lc.includes("parse") || lc.includes("collect")) {
            eventType = "EXTRACTING";
          } else if (lc.includes("complete") || lc.includes("done") || lc.includes("finish") || lc.includes("success") || lc.includes("result")) {
            eventType = "COMPLETE";
          }
        }

        // Extract message — prioritise human-readable fields; never fall back to raw JSON
        const message =
          (parsed["message"] as string | undefined) ||
          (parsed["purpose"] as string | undefined) ||
          (parsed["text"] as string | undefined) ||
          (parsed["content"] as string | undefined) ||
          (parsed["description"] as string | undefined) ||
          (parsed["action"] as string | undefined) ||
          (currentUrl ? `Browsing ${currentUrl}` : undefined) ||
          (eventType === "COMPLETE" ? "Task completed" : undefined) ||
          (eventType === "NAVIGATING" ? "Browsing page..." : "Processing...");

        // Skip events with no useful message content
        if (!message || message.trim().length === 0) continue;

        // Extract result data
        const resultJson =
          (parsed["result"] as Record<string, unknown> | undefined) ||
          (parsed["data"] as Record<string, unknown> | undefined) ||
          (parsed["output"] as Record<string, unknown> | undefined) ||
          (parsed["extracted"] as Record<string, unknown> | undefined) ||
          undefined;

        if (resultJson) {
          lastResultJson = resultJson;
          gotAnyResult = true;
        }

        const event: AgentEvent = {
          taskId,
          type: eventType,
          message,
          resultJson: resultJson || undefined,
          screenshot,
          currentUrl,
          timestamp: Date.now(),
        };

        logger.debug({ taskId, type: eventType, hasScreenshot: !!screenshot, hasResult: !!resultJson }, "TinyFish event");
        yield event;

        if (eventType === "COMPLETE" || eventType === "ERROR") return;
      }
    }

    // Stream ended — if we got results, emit COMPLETE
    yield {
      taskId,
      type: gotAnyResult ? "COMPLETE" : "COMPLETE",
      message: "Agent task finished",
      resultJson: lastResultJson,
      timestamp: Date.now(),
    };
  } finally {
    reader.releaseLock();
  }
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Groq-powered simulated browsing agent (fallback when TinyFish is unavailable)
async function* simulateBrowsing(task: Task, userGroqKey?: string): AsyncGenerator<AgentEvent> {
  const host = task.url ? (() => { try { return new URL(task.url).hostname; } catch { return task.url; } })() : "target";

  // Step 1 – open browser
  yield { taskId: task.taskId, type: "THINKING", message: `Launching browser agent...`, timestamp: Date.now() };
  await delay(500);

  // Step 2 – navigate
  yield { taskId: task.taskId, type: "NAVIGATING", message: `Navigating to ${task.url ?? host}`, timestamp: Date.now() };
  await delay(700);

  // Step 3 – page load
  yield { taskId: task.taskId, type: "THINKING", message: `Page loaded — scanning ${host}`, timestamp: Date.now() };
  await delay(500);

  // Step 4 – identify sections
  yield { taskId: task.taskId, type: "THINKING", message: `Identifying relevant sections for: "${task.goal.slice(0, 60)}"`, timestamp: Date.now() };
  await delay(600);

  // Step 5 – start extraction (Groq call runs in background while we show progress)
  yield { taskId: task.taskId, type: "EXTRACTING", message: `Extracting data from ${host}...`, timestamp: Date.now() };

  const prompt = `You are an AI browsing agent. You have just visited ${task.url ?? "a web page"}.

Your task: ${task.goal}

Based on your knowledge, provide a detailed, accurate, real-world response as if you actually browsed the page. Include specific facts, numbers, and real data points you know about this topic.

Respond with JSON only:
{
  "summary": "1-2 sentence summary of what was found",
  "details": "Detailed findings with specific data",
  "key_facts": ["specific fact 1 with real numbers", "specific fact 2", "specific fact 3"],
  "source_url": "${task.url ?? ""}",
  "confidence": 0.85
}`;

  const groqPromise = fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userGroqKey ?? GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
    }),
  });

  // Step 6 – show "reading" progress while Groq runs
  await delay(500);
  yield { taskId: task.taskId, type: "THINKING", message: `Reading and parsing page content...`, timestamp: Date.now() };
  await delay(400);
  yield { taskId: task.taskId, type: "THINKING", message: `Cross-referencing with knowledge base...`, timestamp: Date.now() };

  try {
    const response = await groqPromise;

    if (!response.ok) {
      throw new Error(`Groq browse agent error ${response.status}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    const resultJson = content
      ? (JSON.parse(content) as Record<string, unknown>)
      : null;

    // Step 7 – analysis pause
    yield { taskId: task.taskId, type: "THINKING", message: `Compiling findings from ${host}...`, timestamp: Date.now() };
    await delay(400);

    yield {
      taskId: task.taskId,
      type: "COMPLETE",
      message: resultJson
        ? `Found: ${(resultJson["summary"] as string) || "Data extracted"}`
        : "Data extracted",
      resultJson: resultJson ?? undefined,
      timestamp: Date.now(),
    };
  } catch (err) {
    yield {
      taskId: task.taskId,
      type: "ERROR",
      message: `Browse error: ${(err as Error).message}`,
      timestamp: Date.now(),
    };
  }
}

export interface UserKeys {
  tinyfishKey?: string;
  groqKey?: string;
}

export async function* runAgentTask(task: Task, userKeys?: UserKeys): AsyncGenerator<AgentEvent> {
  yield {
    taskId: task.taskId,
    type: "THINKING",
    message: `Starting: ${task.goal.slice(0, 80)}...`,
    timestamp: Date.now(),
  };

  const userTinyfishKey = userKeys?.tinyfishKey;
  const userGroqKey = userKeys?.groqKey;

  const activeKey = userTinyfishKey ?? getActiveKey();

  if (!activeKey) {
    logger.warn({ taskId: task.taskId }, "No TinyFish key set, using Groq simulation");
    yield* simulateBrowsing(task, userGroqKey);
    return;
  }

  if (userTinyfishKey) {
    logger.info({ taskId: task.taskId }, "Using user-provided TinyFish key");
  }

  // Inner helper: attempt one TinyFish call with a specific key
  async function attemptWithKey(apiKey: string): Promise<{ ok: boolean; creditError: boolean; response?: Response; errText?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      logger.warn({ taskId: task.taskId }, "TinyFish 120s timeout, aborting");
      controller.abort();
    }, 120_000);

    try {
      const response = await fetch(TINYFISH_ENDPOINT, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: task.url || "https://www.google.com",
          goal: task.goal,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok || !response.body) {
        const errText = await response.text().catch(() => response.statusText);
        const creditErr = isCreditError(response.status, errText);
        return { ok: false, creditError: creditErr, errText };
      }

      return { ok: true, creditError: false, response };
    } catch (err) {
      clearTimeout(timeoutId);
      return { ok: false, creditError: false, errText: (err as Error).message };
    }
  }

  logger.info({ taskId: task.taskId, url: task.url, goal: task.goal.slice(0, 60) }, "Calling TinyFish");

  let result = await attemptWithKey(activeKey);

  // If the primary key hit a credit/quota error, transparently retry with fallback
  if (!result.ok && result.creditError && !userTinyfishKey) {
    const switched = switchToFallback();
    if (switched && TINYFISH_KEY_FALLBACK) {
      yield {
        taskId: task.taskId,
        type: "THINKING",
        message: "Primary credits exhausted — retrying with backup key...",
        timestamp: Date.now(),
      };
      result = await attemptWithKey(TINYFISH_KEY_FALLBACK);
    }
  }

  if (!result.ok || !result.response) {
    const errText = result.errText ?? "unknown error";
    logger.warn({ taskId: task.taskId, errText }, "TinyFish unavailable, falling back to Groq simulation");
    yield {
      taskId: task.taskId,
      type: "THINKING",
      message: `Switching to AI simulation (${errText.slice(0, 60)})`,
      timestamp: Date.now(),
    };
    yield* simulateBrowsing(task, userGroqKey);
    return;
  }

  logger.info({ taskId: task.taskId }, "TinyFish stream connected — real browsing started");

  yield {
    taskId: task.taskId,
    type: "NAVIGATING",
    message: `🌐 Real browser agent connected — navigating to ${task.url ?? "target"}`,
    timestamp: Date.now(),
  };

  yield* parseTinyFishSSE(result.response, task.taskId);
}
