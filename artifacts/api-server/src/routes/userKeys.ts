import { Router, type IRouter, type Request, type Response } from "express";
import { db, schema } from "../lib/db.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { encryptKey, decryptKey, maskKey } from "../lib/keyEncryption.js";
import { logger } from "../lib/logger.js";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const VALID_SERVICES = ["tinyfish", "groq"] as const;
type Service = typeof VALID_SERVICES[number];

router.get("/user/profile", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session!["userId"] as string;
  try {
    const [user] = await db.select().from(schema.usersTable).where(eq(schema.usersTable.id, userId)).limit(1);
    res.json({ user: user ?? req.session!["user"] });
  } catch (err) {
    logger.error({ err }, "Get profile error");
    res.json({ user: req.session!["user"] });
  }
});

router.get("/user/keys", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session!["userId"] as string;
  try {
    const rows = await db.select().from(schema.userApiKeysTable).where(eq(schema.userApiKeysTable.userId, userId));
    const result: Record<string, { set: boolean; hint: string }> = {};
    for (const service of VALID_SERVICES) {
      const row = rows.find((r) => r.service === service);
      result[service] = { set: !!row, hint: row?.keyHint ?? "" };
    }
    res.json(result);
  } catch (err) {
    logger.error({ err }, "Get user keys error");
    res.status(500).json({ error: "internal_error" });
  }
});

router.put("/user/keys/:service", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session!["userId"] as string;
  const service = req.params["service"] as Service;
  if (!VALID_SERVICES.includes(service)) {
    res.status(400).json({ error: "Invalid service. Must be: tinyfish or groq" });
    return;
  }
  const { key } = req.body as { key?: string };
  if (!key?.trim() || key.trim().length < 8) {
    res.status(400).json({ error: "Key must be at least 8 characters" });
    return;
  }
  try {
    const trimmed = key.trim();
    const encrypted = encryptKey(trimmed);
    const hint = maskKey(trimmed);
    const id = `${userId}-${service}`;
    await db
      .insert(schema.userApiKeysTable)
      .values({ id, userId, service, encryptedKey: encrypted, keyHint: hint })
      .onConflictDoUpdate({
        target: [schema.userApiKeysTable.userId, schema.userApiKeysTable.service],
        set: { encryptedKey: encrypted, keyHint: hint, updatedAt: new Date() },
      });
    res.json({ ok: true, hint });
  } catch (err) {
    logger.error({ err }, "Save user key error");
    res.status(500).json({ error: "internal_error" });
  }
});

router.delete("/user/keys/:service", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session!["userId"] as string;
  const service = req.params["service"] as Service;
  if (!VALID_SERVICES.includes(service)) {
    res.status(400).json({ error: "Invalid service" });
    return;
  }
  try {
    await db.delete(schema.userApiKeysTable).where(
      and(eq(schema.userApiKeysTable.userId, userId), eq(schema.userApiKeysTable.service, service))
    );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Delete user key error");
    res.status(500).json({ error: "internal_error" });
  }
});

export { decryptKey };
export default router;
