import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import { sql, eq, and } from "drizzle-orm";
import { logger } from "../lib/logger.js";
import { db, schema } from "../lib/db.js";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const LINKEDIN_CLIENT_ID = process.env["LINKEDIN_CLIENT_ID"] ?? "";
const LINKEDIN_CLIENT_SECRET = process.env["LINKEDIN_CLIENT_SECRET"] ?? "";
const TWITTER_CLIENT_ID = process.env["TWITTER_CLIENT_ID"] ?? "";
const TWITTER_CLIENT_SECRET = process.env["TWITTER_CLIENT_SECRET"] ?? "";

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  return `${proto}://${host}`;
}

function makeGeminiClient() {
  const baseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] ?? process.env["GEMINI_API_KEY"] ?? "";
  return new GoogleGenAI({ apiKey, ...(baseUrl ? { httpOptions: { apiVersion: "", baseUrl } } : {}) });
}

// Ensure tables exist
async function ensureTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS social_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expires_at TIMESTAMPTZ,
      platform_user_id TEXT,
      platform_username TEXT,
      platform_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, platform)
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS content_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      platform TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      platform_post_id TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TIMESTAMPTZ,
      impressions INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
ensureTables().catch((err) => logger.warn({ err }, "Content table migration warning"));

function requireAuth(req: Request, res: Response): string | null {
  const userId = (req.session as Record<string, unknown> & { userId?: string })?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return null; }
  return userId;
}

// GET /api/content/accounts
router.get("/content/accounts", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const rows = await db
      .select({
        platform: schema.socialAccountsTable.platform,
        platformUsername: schema.socialAccountsTable.platformUsername,
        platformName: schema.socialAccountsTable.platformName,
        expiresAt: schema.socialAccountsTable.expiresAt,
      })
      .from(schema.socialAccountsTable)
      .where(eq(schema.socialAccountsTable.userId, userId));
    res.json({ accounts: rows, linkedinConfigured: !!LINKEDIN_CLIENT_ID, twitterConfigured: !!TWITTER_CLIENT_ID });
  } catch {
    res.json({ accounts: [], linkedinConfigured: !!LINKEDIN_CLIENT_ID, twitterConfigured: !!TWITTER_CLIENT_ID });
  }
});

// ─── LinkedIn OAuth ────────────────────────────────────────────────────────────

router.get("/content/oauth/linkedin/start", (req: Request, res: Response) => {
  if (!LINKEDIN_CLIENT_ID) { res.status(503).json({ error: "LinkedIn credentials not configured" }); return; }
  const state = crypto.randomBytes(16).toString("hex");
  (req.session as Record<string, unknown>).linkedinOAuthState = state;
  const base = getBaseUrl(req);
  const redirect = encodeURIComponent(`${base}/api/content/oauth/linkedin/callback`);
  const scope = encodeURIComponent("openid profile email w_member_social");
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${redirect}&scope=${scope}&state=${state}`);
});

router.get("/content/oauth/linkedin/callback", async (req: Request, res: Response) => {
  const userId = (req.session as Record<string, unknown> & { userId?: string })?.userId;
  if (!userId) { res.redirect("/app?error=not_authenticated"); return; }
  const { code, state, error } = req.query as Record<string, string>;
  if (error || state !== (req.session as Record<string, unknown>).linkedinOAuthState) { res.redirect("/app?error=oauth_failed"); return; }
  const base = getBaseUrl(req);
  const redirectUri = `${base}/api/content/oauth/linkedin/callback`;
  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: LINKEDIN_CLIENT_ID, client_secret: LINKEDIN_CLIENT_SECRET }),
  });
  if (!tokenRes.ok) { res.redirect("/app?error=linkedin_token_failed"); return; }
  const token = (await tokenRes.json()) as { access_token: string; expires_in?: number; refresh_token?: string };
  const profileRes = await fetch("https://api.linkedin.com/v2/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const profile = profileRes.ok ? (await profileRes.json() as { sub: string; name?: string }) : { sub: "unknown", name: undefined };
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined;
  await db.execute(sql`
    INSERT INTO social_accounts (id, user_id, platform, access_token, refresh_token, expires_at, platform_user_id, platform_name, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, 'linkedin', ${token.access_token}, ${token.refresh_token ?? null}, ${expiresAt ?? null}, ${profile.sub}, ${profile.name ?? null}, NOW())
    ON CONFLICT (user_id, platform) DO UPDATE SET
      access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at, platform_user_id = EXCLUDED.platform_user_id,
      platform_name = EXCLUDED.platform_name, updated_at = NOW()
  `);
  logger.info({ userId, platform: "linkedin" }, "LinkedIn OAuth complete");
  res.redirect("/app?connected=linkedin");
});

// ─── Twitter OAuth ─────────────────────────────────────────────────────────────

router.get("/content/oauth/twitter/start", (req: Request, res: Response) => {
  if (!TWITTER_CLIENT_ID) { res.status(503).json({ error: "Twitter credentials not configured" }); return; }
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  (req.session as Record<string, unknown>).twitterOAuthState = state;
  (req.session as Record<string, unknown>).twitterCodeVerifier = codeVerifier;
  const base = getBaseUrl(req);
  const redirect = encodeURIComponent(`${base}/api/content/oauth/twitter/callback`);
  const scope = encodeURIComponent("tweet.read tweet.write users.read offline.access");
  res.redirect(`https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${TWITTER_CLIENT_ID}&redirect_uri=${redirect}&scope=${scope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`);
});

router.get("/content/oauth/twitter/callback", async (req: Request, res: Response) => {
  const userId = (req.session as Record<string, unknown> & { userId?: string })?.userId;
  if (!userId) { res.redirect("/app?error=not_authenticated"); return; }
  const { code, state, error } = req.query as Record<string, string>;
  const savedState = (req.session as Record<string, unknown>).twitterOAuthState;
  const codeVerifier = (req.session as Record<string, unknown>).twitterCodeVerifier as string;
  if (error || state !== savedState || !codeVerifier) { res.redirect("/app?error=oauth_failed"); return; }
  const base = getBaseUrl(req);
  const redirectUri = `${base}/api/content/oauth/twitter/callback`;
  const credentials = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64");
  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri, code_verifier: codeVerifier }),
  });
  if (!tokenRes.ok) { res.redirect("/app?error=twitter_token_failed"); return; }
  const token = (await tokenRes.json()) as { access_token: string; expires_in?: number; refresh_token?: string };
  const meRes = await fetch("https://api.twitter.com/2/users/me", { headers: { Authorization: `Bearer ${token.access_token}` } });
  const me = meRes.ok ? (await meRes.json() as { data: { id: string; username: string; name: string } }).data : { id: "unknown", username: "", name: "" };
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : undefined;
  await db.execute(sql`
    INSERT INTO social_accounts (id, user_id, platform, access_token, refresh_token, expires_at, platform_user_id, platform_username, platform_name, updated_at)
    VALUES (${crypto.randomUUID()}, ${userId}, 'twitter', ${token.access_token}, ${token.refresh_token ?? null}, ${expiresAt ?? null}, ${me.id}, ${me.username}, ${me.name}, NOW())
    ON CONFLICT (user_id, platform) DO UPDATE SET
      access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at, platform_user_id = EXCLUDED.platform_user_id,
      platform_username = EXCLUDED.platform_username, platform_name = EXCLUDED.platform_name, updated_at = NOW()
  `);
  logger.info({ userId, platform: "twitter" }, "Twitter OAuth complete");
  res.redirect("/app?connected=twitter");
});

// ─── Publish ───────────────────────────────────────────────────────────────────

router.post("/content/publish", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { platform, content, topic } = req.body as { platform: "linkedin" | "twitter"; content: string | string[]; topic: string };
  if (!platform || !content || !topic) { res.status(400).json({ error: "platform, content, and topic are required" }); return; }
  const [account] = await db.select().from(schema.socialAccountsTable)
    .where(and(eq(schema.socialAccountsTable.userId, userId), eq(schema.socialAccountsTable.platform, platform)));
  if (!account) { res.status(403).json({ error: "not_connected", message: `${platform} account not connected` }); return; }
  try {
    let platformPostId: string;
    if (platform === "linkedin") {
      const postText = Array.isArray(content) ? content.join("\n\n") : content;
      const liRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: { Authorization: `Bearer ${account.accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({
          author: `urn:li:person:${account.platformUserId}`,
          lifecycleState: "PUBLISHED",
          specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text: postText }, shareMediaCategory: "NONE" } },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
      if (!liRes.ok) throw new Error(`LinkedIn ${liRes.status}: ${await liRes.text()}`);
      platformPostId = ((await liRes.json()) as { id: string }).id;
    } else {
      const tweets = Array.isArray(content) ? content : [content];
      let lastId: string | undefined;
      const ids: string[] = [];
      for (const tweet of tweets) {
        const body: Record<string, unknown> = { text: tweet.slice(0, 280) };
        if (lastId) body.reply = { in_reply_to_tweet_id: lastId };
        const twRes = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: { Authorization: `Bearer ${account.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!twRes.ok) throw new Error(`Twitter ${twRes.status}: ${await twRes.text()}`);
        lastId = ((await twRes.json()) as { data: { id: string } }).data.id;
        ids.push(lastId);
      }
      platformPostId = ids[0];
    }
    const postContent = Array.isArray(content) ? content.join("\n\n---\n\n") : content;
    await db.execute(sql`
      INSERT INTO content_posts (id, user_id, topic, platform, content, platform_post_id, status, published_at)
      VALUES (${crypto.randomUUID()}, ${userId}, ${topic}, ${platform}, ${postContent}, ${platformPostId}, 'published', NOW())
    `);
    logger.info({ userId, platform, platformPostId }, "Content published");
    res.json({
      success: true, platformPostId,
      message: `Published to ${platform}!`,
      url: platform === "twitter"
        ? `https://twitter.com/i/web/status/${platformPostId}`
        : `https://www.linkedin.com/feed/update/${platformPostId}/`,
    });
  } catch (err) {
    logger.error({ err }, "Publish failed");
    res.status(500).json({ error: "publish_failed", message: (err as Error).message });
  }
});

// ─── Analytics ─────────────────────────────────────────────────────────────────

router.get("/content/analytics", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const posts = await db.execute(sql`
    SELECT id, topic, platform, platform_post_id, status, published_at, impressions, likes, comments, shares, created_at
    FROM content_posts WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
  `);
  res.json({ posts: posts.rows });
});

// ─── Image Generation ──────────────────────────────────────────────────────────

router.post("/content/generate-image", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  const { prompt } = req.body as { prompt?: string };
  if (!prompt) { res.status(400).json({ error: "prompt required" }); return; }
  try {
    const ai = makeGeminiClient();
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: `Professional high-quality social media image for: ${prompt}. Modern, striking, suitable for LinkedIn and Twitter. No text overlays.` }] }],
      config: { responseModalities: ["IMAGE", "TEXT"] as string[] },
    });
    type Part = { inlineData?: { mimeType: string; data: string } };
    const parts = result.candidates?.[0]?.content?.parts as Part[] | undefined;
    const img = parts?.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
    if (img?.inlineData) {
      res.json({ success: true, imageBase64: img.inlineData.data, mimeType: img.inlineData.mimeType });
    } else {
      res.json({ success: false, message: "Image generation returned no image" });
    }
  } catch (err) {
    logger.warn({ err }, "Image generation failed");
    res.json({ success: false, message: "Image generation unavailable" });
  }
});

export default router;
