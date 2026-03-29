// Gmail integration via Replit Connectors
import { google } from "googleapis";

let connectionSettings: { settings: { expires_at?: string; access_token?: string; oauth?: { credentials?: { access_token?: string } } } } | null = null;

async function getAccessToken(): Promise<string> {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token!;
  }

  const hostname = process.env["REPLIT_CONNECTORS_HOSTNAME"];
  const xReplitToken = process.env["REPL_IDENTITY"]
    ? "repl " + process.env["REPL_IDENTITY"]
    : process.env["WEB_REPL_RENEWAL"]
    ? "depl " + process.env["WEB_REPL_RENEWAL"]
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error("Gmail not connected — Replit connector credentials missing");
  }

  const res = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-mail",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  );

  const data = (await res.json()) as { items?: typeof connectionSettings[] };
  connectionSettings = data.items?.[0] ?? null;

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error("Gmail not connected");
  }
  return accessToken;
}

export async function isGmailAvailable(): Promise<boolean> {
  if (!process.env["REPLIT_CONNECTORS_HOSTNAME"]) return false;
  if (!process.env["REPL_IDENTITY"] && !process.env["WEB_REPL_RENEWAL"]) return false;
  try {
    await getAccessToken();
    return true;
  } catch {
    return false;
  }
}

// WARNING: Never cache this client — tokens expire
export async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
}

// Build a raw RFC 2822 email message encoded in base64url
export function buildRawEmail({
  to,
  subject,
  body,
  from,
}: {
  to: string;
  subject: string;
  body: string;
  from?: string;
}): string {
  const lines = [
    from ? `From: ${from}` : "",
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].filter((l, i) => i !== 0 || l !== "");

  const raw = lines.join("\r\n");
  return Buffer.from(raw).toString("base64url");
}
