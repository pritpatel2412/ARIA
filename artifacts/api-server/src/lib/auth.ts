import * as oidc from "openid-client";
import { db, schema } from "./db.js";
import { eq } from "drizzle-orm";
import { logger } from "./logger.js";
import type { Request, Response, NextFunction } from "express";

let oidcConfig: oidc.Configuration | null = null;

export async function getOIDCConfig(): Promise<oidc.Configuration> {
  if (oidcConfig) return oidcConfig;
  const issuerUrl = new URL("https://replit.com/oidc");
  const clientId = process.env["REPL_ID"] ?? "aria-saas";
  oidcConfig = await oidc.discovery(issuerUrl, clientId, undefined, undefined, {
    [oidc.allowInsecureRequests]: process.env["NODE_ENV"] !== "production",
  });
  return oidcConfig;
}

export function getAppDomain(): string | null {
  // In production deployments, REPLIT_DOMAINS is set (comma-separated list of live domains).
  // Prefer it over REPLIT_DEV_DOMAIN so the callback URL always matches the actual host.
  const replitDomains = process.env["REPLIT_DOMAINS"];
  if (replitDomains) {
    return replitDomains.split(",")[0].trim();
  }
  return process.env["REPLIT_DEV_DOMAIN"] ?? null;
}

export function getCallbackUrl(): string {
  const domain = getAppDomain();
  if (domain) {
    return `https://${domain}/api/auth/callback`;
  }
  return `http://localhost:${process.env["PORT"] ?? 8080}/api/auth/callback`;
}

export async function buildLoginUrl(
  state: string,
  nonce: string,
  pkceVerifier: string,
): Promise<URL> {
  const config = await getOIDCConfig();
  const pkceChallenge = await oidc.calculatePKCECodeChallenge(pkceVerifier);

  const params = new URLSearchParams({
    scope: "openid email profile",
    state,
    nonce,
    redirect_uri: getCallbackUrl(),
    response_type: "code",
    code_challenge: pkceChallenge,
    code_challenge_method: "S256",
  });
  return oidc.buildAuthorizationUrl(config, params);
}

export async function handleCallback(req: Request): Promise<oidc.TokenEndpointResponse> {
  const config = await getOIDCConfig();

  const appDomain = getAppDomain();
  const baseOrigin = appDomain
    ? `https://${appDomain}`
    : `http://localhost:${process.env["PORT"] ?? 8080}`;

  // IMPORTANT: use req.originalUrl (full path including /api prefix) not req.url
  // which strips the mount-point prefix and causes a redirect_uri mismatch with Replit.
  const currentUrl = new URL(req.originalUrl, baseOrigin);

  // Some OIDC providers omit the "iss" parameter.
  // Add it from our discovered issuer to satisfy openid-client v6.
  if (!currentUrl.searchParams.has("iss")) {
    const issuerUrl = config.serverMetadata().issuer;
    if (issuerUrl) {
      currentUrl.searchParams.set("iss", issuerUrl);
    }
  }

  const pkceCodeVerifier = req.session!["oidcPKCE"] as string | undefined;
  const expectedState = req.session!["oidcState"] as string | undefined;
  const expectedNonce = req.session!["oidcNonce"] as string | undefined;

  logger.info({ expectedState, hasPKCE: !!pkceCodeVerifier, currentUrl: currentUrl.toString() }, "Handling OIDC callback");

  const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
    expectedState,
    expectedNonce,
    pkceCodeVerifier,
  });
  return tokens;
}

export async function upsertUser(claims: oidc.IDToken & Record<string, unknown>) {
  const id = claims.sub as string;
  const email = claims["email"] as string | undefined;
  const name = (claims["name"] as string) || (claims["username"] as string) || "User";
  const username = claims["username"] as string | undefined;
  const profileImage = claims["profile_image"] as string | undefined;

  const existing = await db
    .select()
    .from(schema.usersTable)
    .where(eq(schema.usersTable.id, id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(schema.usersTable)
      .set({ email, name, username, profileImage, updatedAt: new Date() })
      .where(eq(schema.usersTable.id, id));
    return { ...existing[0], email, name, username, profileImage };
  }

  const [user] = await db
    .insert(schema.usersTable)
    .values({ id, email, name, username, profileImage })
    .returning();

  logger.info({ userId: id }, "New user created");
  return user;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.["userId"]) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }
  next();
}

export { oidc };
