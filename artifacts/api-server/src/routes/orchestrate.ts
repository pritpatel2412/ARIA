import { Router, type IRouter, type Request, type Response } from "express";
import { runARIA } from "../lib/aria/orchestrator.js";
import type { StreamEvent } from "../lib/aria/types.js";
import { logger } from "../lib/logger.js";
import { db, schema } from "../lib/db.js";
import { eq } from "drizzle-orm";
import { decryptKey } from "../lib/keyEncryption.js";

const router: IRouter = Router();

// In-memory session store — events accumulate here as ARIA runs
interface Session {
  events: StreamEvent[];
  done: boolean;
  createdAt: number;
}
const sessions = new Map<string, Session>();

// Clean up sessions older than 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [id, session] of sessions) {
    if (session.done && session.createdAt < cutoff) {
      sessions.delete(id);
    }
  }
}, 60_000);

// POST /orchestrate — start a new ARIA session, return sessionId immediately
router.post("/orchestrate", async (req: Request, res: Response) => {
  const { goal, resumeContext, formContext, mode, language } = req.body as {
    goal?: string;
    resumeContext?: string;
    formContext?: string;
    mode?: string;
    language?: string;
  };

  if (!goal || typeof goal !== "string" || goal.trim().length === 0) {
    res.status(400).json({ error: "bad_request", message: "goal is required" });
    return;
  }

  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session: Session = { events: [], done: false, createdAt: Date.now() };
  sessions.set(sessionId, session);

  const enrichedGoal = resumeContext
    ? `${resumeContext}\n\nUser goal: ${goal.trim()}`
    : formContext
    ? `${formContext}\n\nUser goal: ${goal.trim()}`
    : goal.trim();

  // Look up user's personal API keys (if logged in) for priority key usage
  const userId = req.session?.["userId"] as string | undefined;
  const userKeys: { tinyfishKey?: string; groqKey?: string } = {};
  if (userId) {
    try {
      const keyRows = await db.select().from(schema.userApiKeysTable).where(eq(schema.userApiKeysTable.userId, userId));
      const tfRow = keyRows.find((r) => r.service === "tinyfish");
      const groqRow = keyRows.find((r) => r.service === "groq");
      if (tfRow) userKeys.tinyfishKey = decryptKey(tfRow.encryptedKey);
      if (groqRow) userKeys.groqKey = decryptKey(groqRow.encryptedKey);
    } catch (err) {
      logger.warn({ err }, "Failed to load user keys — using platform defaults");
    }
  }

  // Run ARIA in background — push events to session store as they come in
  void runARIA(
    enrichedGoal,
    (event: StreamEvent) => {
      const s = sessions.get(sessionId);
      if (s) s.events.push(event);
    },
    mode,
    language,
    userKeys
  )
    .catch((err: unknown) => {
      logger.error({ err }, "ARIA orchestration error");
      const s = sessions.get(sessionId);
      if (s) {
        s.events.push({
          type: "ERROR",
          message: `ARIA encountered an error: ${(err as Error).message}`,
          timestamp: Date.now(),
        });
      }
    })
    .finally(() => {
      const s = sessions.get(sessionId);
      if (s) {
        s.events.push({ type: "DONE", timestamp: Date.now() });
        s.done = true;
      }
    });

  res.json({ sessionId });
});

// GET /orchestrate/poll/:sessionId?after=N — return events[N..] + done flag
router.get("/orchestrate/poll/:sessionId", (req: Request, res: Response) => {
  const session = sessions.get(req.params["sessionId"] ?? "");
  if (!session) {
    res.status(404).json({ error: "not_found", events: [], done: true, total: 0 });
    return;
  }

  const after = Math.max(0, parseInt((req.query["after"] as string) || "0", 10) || 0);
  const newEvents = session.events.slice(after);

  res.json({
    events: newEvents,
    done: session.done,
    total: session.events.length,
  });
});

export default router;
