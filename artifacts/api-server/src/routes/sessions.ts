import { Router, type IRouter, type Request, type Response } from "express";
import { db, schema } from "../lib/db.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/user/sessions", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session!["userId"] as string;
  try {
    const sessions = await db.select()
      .from(schema.agentSessionsTable)
      .where(eq(schema.agentSessionsTable.userId, userId))
      .orderBy(desc(schema.agentSessionsTable.createdAt))
      .limit(50);
    res.json({ sessions });
  } catch (err) {
    logger.error({ err }, "Get sessions error");
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/user/sessions", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session!["userId"] as string;
  const { goal, mode, answer, taskCount, successCount, metadata } = req.body as {
    goal: string;
    mode?: string;
    answer?: string;
    taskCount?: number;
    successCount?: number;
    metadata?: Record<string, unknown>;
  };

  if (!goal) {
    res.status(400).json({ error: "goal is required" });
    return;
  }

  try {
    const [session] = await db.insert(schema.agentSessionsTable)
      .values({
        id: randomUUID(),
        userId,
        goal,
        mode: mode ?? "research",
        answer,
        taskCount: taskCount ?? 0,
        successCount: successCount ?? 0,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      })
      .returning();

    await db.update(schema.usersTable)
      .set({ queryCount: (await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, userId)).limit(1))[0].queryCount + 1 })
      .where(eq(schema.usersTable.id, userId));

    res.json({ session });
  } catch (err) {
    logger.error({ err }, "Save session error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
