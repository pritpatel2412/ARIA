import { Router, type IRouter, type Request, type Response } from "express";
import * as oidc from "openid-client";
import { buildLoginUrl, handleCallback, upsertUser } from "../lib/auth.js";
import { db, schema } from "../lib/db.js";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

router.get("/auth/login", async (req: Request, res: Response) => {
  try {
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const pkceVerifier = oidc.randomPKCECodeVerifier();
    const returnTo = (req.query["returnTo"] as string) || "/app";

    req.session!["oidcState"] = state;
    req.session!["oidcNonce"] = nonce;
    req.session!["oidcPKCE"] = pkceVerifier;
    req.session!["returnTo"] = returnTo;

    await new Promise<void>((resolve, reject) =>
      req.session!.save((err) => (err ? reject(err) : resolve())),
    );

    const authUrl = await buildLoginUrl(state, nonce, pkceVerifier);
    res.redirect(authUrl.toString());
  } catch (err) {
    logger.error({ err }, "Login initiation error");
    res.redirect("/?error=login_failed");
  }
});

router.get("/auth/callback", async (req: Request, res: Response) => {
  try {
    const returnTo = (req.session!["returnTo"] as string) || "/app";
    const tokens = await handleCallback(req);
    const claims = tokens.claims();

    if (!claims) throw new Error("No claims in token");

    const user = await upsertUser(claims as oidc.IDToken & Record<string, unknown>);
    req.session!["userId"] = user.id;
    req.session!["user"] = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      profileImage: user.profileImage,
      plan: user.plan,
    };

    delete req.session!["oidcState"];
    delete req.session!["oidcNonce"];
    delete req.session!["oidcPKCE"];

    await new Promise<void>((resolve, reject) =>
      req.session!.save((err) => (err ? reject(err) : resolve())),
    );

    res.redirect(returnTo);
  } catch (err) {
    logger.error({ err }, "Auth callback error");
    res.redirect("/?error=auth_failed");
  }
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session?.destroy((err) => {
    if (err) logger.error({ err }, "Session destroy error");
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const userId = req.session?.["userId"] as string | undefined;
  if (!userId) {
    res.json({ user: null });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(schema.usersTable)
      .where(eq(schema.usersTable.id, userId))
      .limit(1);
    if (!user) {
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        profileImage: user.profileImage,
        plan: user.plan,
        queryCount: user.queryCount,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    logger.error({ err }, "Get user error");
    res.json({ user: null });
  }
});

export default router;
