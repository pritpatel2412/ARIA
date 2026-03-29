import { Router } from "express";
import { randomUUID } from "crypto";
import { eq, desc, and } from "drizzle-orm";
import { db, schema } from "../lib/db.js";
import { requireAuth } from "../lib/auth.js";
import { checkCompetitorPage, detectChanges, computeNextCheckAt, type WatchType } from "../lib/aria/watchlistChecker.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/watchlist", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as { userId?: string }).userId!;
    const items = await db
      .select()
      .from(schema.watchlistItemsTable)
      .where(eq(schema.watchlistItemsTable.userId, userId))
      .orderBy(desc(schema.watchlistItemsTable.createdAt));

    const itemsWithChanges = await Promise.all(
      items.map(async (item) => {
        const changes = await db
          .select()
          .from(schema.watchlistChangesTable)
          .where(eq(schema.watchlistChangesTable.watchlistItemId, item.id))
          .orderBy(desc(schema.watchlistChangesTable.detectedAt))
          .limit(5);
        return { ...item, recentChanges: changes };
      })
    );

    res.json({ items: itemsWithChanges });
  } catch (err) {
    logger.error({ err }, "GET /watchlist error");
    res.status(500).json({ error: "Failed to load watchlist" });
  }
});

router.post("/watchlist", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as { userId?: string }).userId!;
    const { url, name, watchType, checkFrequency } = req.body as {
      url: string;
      name: string;
      watchType: WatchType;
      checkFrequency: string;
    };

    if (!url || !name) {
      return res.status(400).json({ error: "url and name are required" });
    }

    const id = randomUUID();
    await db.insert(schema.watchlistItemsTable).values({
      id,
      userId,
      url: url.startsWith("http") ? url : `https://${url}`,
      name,
      watchType: watchType ?? "all",
      checkFrequency: checkFrequency ?? "daily",
      nextCheckAt: new Date(),
      status: "pending",
      changeCount: 0,
    });

    const item = await db
      .select()
      .from(schema.watchlistItemsTable)
      .where(eq(schema.watchlistItemsTable.id, id))
      .limit(1);

    res.json({ item: item[0] });
  } catch (err) {
    logger.error({ err }, "POST /watchlist error");
    res.status(500).json({ error: "Failed to add competitor" });
  }
});

router.delete("/watchlist/:id", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as { userId?: string }).userId!;
    await db
      .delete(schema.watchlistItemsTable)
      .where(
        and(
          eq(schema.watchlistItemsTable.id, req.params.id),
          eq(schema.watchlistItemsTable.userId, userId)
        )
      );
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "DELETE /watchlist/:id error");
    res.status(500).json({ error: "Failed to remove competitor" });
  }
});

router.post("/watchlist/:id/check", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as { userId?: string }).userId!;

    const [item] = await db
      .select()
      .from(schema.watchlistItemsTable)
      .where(
        and(
          eq(schema.watchlistItemsTable.id, req.params.id),
          eq(schema.watchlistItemsTable.userId, userId)
        )
      )
      .limit(1);

    if (!item) return res.status(404).json({ error: "Item not found" });

    await db
      .update(schema.watchlistItemsTable)
      .set({ status: "checking" })
      .where(eq(schema.watchlistItemsTable.id, item.id));

    res.json({ ok: true, status: "checking" });

    // Run TinyFish check asynchronously (don't block the response)
    setImmediate(async () => {
      try {
        const result = await checkCompetitorPage(item.url, item.watchType as WatchType, item.name);
        const now = new Date();
        const nextCheck = computeNextCheckAt(item.checkFrequency);

        if (!result.success || !result.resultJson) {
          await db
            .update(schema.watchlistItemsTable)
            .set({ status: "error", lastCheckedAt: now, nextCheckAt: nextCheck })
            .where(eq(schema.watchlistItemsTable.id, item.id));
          return;
        }

        let newChanges = 0;

        if (item.lastContent) {
          try {
            const oldContent = JSON.parse(item.lastContent) as Record<string, unknown>;
            const detected = await detectChanges(
              item.name,
              item.url,
              item.watchType as WatchType,
              oldContent,
              result.resultJson
            );

            if (detected.hasChanges && detected.changes.length > 0) {
              newChanges = detected.changes.length;
              await Promise.all(
                detected.changes.map((change) =>
                  db.insert(schema.watchlistChangesTable).values({
                    id: randomUUID(),
                    watchlistItemId: item.id,
                    userId,
                    changeType: change.changeType,
                    changeTitle: change.changeTitle,
                    changeDescription: change.changeDescription,
                    oldValue: change.oldValue,
                    newValue: change.newValue,
                    severity: change.severity,
                    screenshot: result.screenshot,
                  })
                )
              );
            }
          } catch {
            logger.warn({ itemId: item.id }, "Failed to parse lastContent for diff");
          }
        }

        await db
          .update(schema.watchlistItemsTable)
          .set({
            status: "active",
            lastCheckedAt: now,
            nextCheckAt: nextCheck,
            lastContent: JSON.stringify(result.resultJson),
            lastScreenshot: result.screenshot ?? item.lastScreenshot,
            changeCount: item.changeCount + newChanges,
          })
          .where(eq(schema.watchlistItemsTable.id, item.id));

        logger.info({ itemId: item.id, newChanges }, "Watchlist check complete");
      } catch (err) {
        logger.error({ err, itemId: item.id }, "Async watchlist check failed");
        await db
          .update(schema.watchlistItemsTable)
          .set({ status: "error" })
          .where(eq(schema.watchlistItemsTable.id, item.id));
      }
    });
  } catch (err) {
    logger.error({ err }, "POST /watchlist/:id/check error");
    res.status(500).json({ error: "Failed to trigger check" });
  }
});

router.get("/watchlist/:id/changes", requireAuth, async (req, res) => {
  try {
    const userId = (req.session as { userId?: string }).userId!;
    const changes = await db
      .select()
      .from(schema.watchlistChangesTable)
      .where(
        and(
          eq(schema.watchlistChangesTable.watchlistItemId, req.params.id),
          eq(schema.watchlistChangesTable.userId, userId)
        )
      )
      .orderBy(desc(schema.watchlistChangesTable.detectedAt))
      .limit(50);
    res.json({ changes });
  } catch (err) {
    logger.error({ err }, "GET /watchlist/:id/changes error");
    res.status(500).json({ error: "Failed to load changes" });
  }
});

export async function runScheduledChecks(): Promise<void> {
  try {
    const now = new Date();
    const dueItems = await db
      .select()
      .from(schema.watchlistItemsTable)
      .where(eq(schema.watchlistItemsTable.status, "active"));

    const toCheck = dueItems.filter(
      (item) => !item.nextCheckAt || item.nextCheckAt <= now
    );

    if (toCheck.length === 0) return;

    logger.info({ count: toCheck.length }, "Running scheduled watchlist checks");

    await Promise.allSettled(
      toCheck.map(async (item) => {
        const result = await checkCompetitorPage(item.url, item.watchType as WatchType, item.name);
        const nextCheck = computeNextCheckAt(item.checkFrequency);

        if (!result.success || !result.resultJson) {
          await db
            .update(schema.watchlistItemsTable)
            .set({ status: "error", lastCheckedAt: now, nextCheckAt: nextCheck })
            .where(eq(schema.watchlistItemsTable.id, item.id));
          return;
        }

        let newChanges = 0;
        if (item.lastContent) {
          const oldContent = JSON.parse(item.lastContent) as Record<string, unknown>;
          const detected = await detectChanges(item.name, item.url, item.watchType as WatchType, oldContent, result.resultJson);
          if (detected.hasChanges) {
            newChanges = detected.changes.length;
            await Promise.all(
              detected.changes.map((c) =>
                db.insert(schema.watchlistChangesTable).values({
                  id: randomUUID(),
                  watchlistItemId: item.id,
                  userId: item.userId,
                  changeType: c.changeType,
                  changeTitle: c.changeTitle,
                  changeDescription: c.changeDescription,
                  oldValue: c.oldValue,
                  newValue: c.newValue,
                  severity: c.severity,
                  screenshot: result.screenshot,
                })
              )
            );
          }
        }

        await db
          .update(schema.watchlistItemsTable)
          .set({
            status: "active",
            lastCheckedAt: now,
            nextCheckAt: nextCheck,
            lastContent: JSON.stringify(result.resultJson),
            lastScreenshot: result.screenshot ?? item.lastScreenshot,
            changeCount: item.changeCount + newChanges,
          })
          .where(eq(schema.watchlistItemsTable.id, item.id));
      })
    );
  } catch (err) {
    logger.error({ err }, "runScheduledChecks failed");
  }
}

export default router;
