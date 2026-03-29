const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

export async function getUser() {
  const res = await fetch(`${BASE_URL}/api/auth/me`, { credentials: "include" });
  return res.json();
}

export function loginUrl(returnTo = "/app") {
  return `${BASE_URL}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function logout() {
  await fetch(`${BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
}

export async function saveSesssion(data: {
  goal: string;
  mode?: string;
  answer?: string;
  taskCount?: number;
  successCount?: number;
}) {
  try {
    await fetch(`${BASE_URL}/api/user/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
  } catch {
    // fail silently — not critical
  }
}

export async function getUserSessions() {
  const res = await fetch(`${BASE_URL}/api/user/sessions`, { credentials: "include" });
  if (!res.ok) return { sessions: [] };
  return res.json();
}

export interface ParsedResume {
  name: string;
  email?: string;
  skills: string[];
  experience: Array<{ role: string; company?: string; years?: number; description?: string }>;
  preferredRoles: string[];
  locationPreference: string;
  education?: string;
  summary: string;
}

export async function getContentAccounts() {
  const res = await fetch(`${BASE_URL}/api/content/accounts`, { credentials: "include" });
  if (!res.ok) return { accounts: [], linkedinConfigured: false, twitterConfigured: false };
  return res.json() as Promise<{ accounts: { platform: string; platformUsername?: string; platformName?: string }[]; linkedinConfigured: boolean; twitterConfigured: boolean }>;
}

export async function publishContent(data: { platform: "linkedin" | "twitter"; content: string | string[]; topic: string }) {
  const res = await fetch(`${BASE_URL}/api/content/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ success: boolean; platformPostId?: string; url?: string; message?: string; error?: string }>;
}

export async function generateContentImage(prompt: string) {
  const res = await fetch(`${BASE_URL}/api/content/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ prompt }),
  });
  return res.json() as Promise<{ success: boolean; imageBase64?: string; mimeType?: string; message?: string }>;
}

export async function getContentAnalytics() {
  const res = await fetch(`${BASE_URL}/api/content/analytics`, { credentials: "include" });
  if (!res.ok) return { posts: [] };
  return res.json() as Promise<{ posts: Record<string, unknown>[] }>;
}

export interface WatchlistChange {
  id: string;
  watchlistItemId: string;
  userId: string;
  detectedAt: string;
  changeType: string;
  changeTitle: string;
  changeDescription: string;
  oldValue?: string;
  newValue?: string;
  severity: string;
  screenshot?: string;
}

export interface WatchlistItemWithChanges {
  id: string;
  userId: string;
  url: string;
  name: string;
  watchType: string;
  checkFrequency: string;
  lastCheckedAt: string | null;
  nextCheckAt: string;
  lastContent: string | null;
  lastScreenshot: string | null;
  changeCount: number;
  status: string;
  createdAt: string;
  recentChanges: WatchlistChange[];
}

export async function getWatchlist(): Promise<{ items: WatchlistItemWithChanges[] }> {
  const res = await fetch(`${BASE_URL}/api/watchlist`, { credentials: "include" });
  if (!res.ok) return { items: [] };
  return res.json();
}

export async function addWatchlistItem(data: {
  url: string;
  name: string;
  watchType: string;
  checkFrequency: string;
}): Promise<{ item: WatchlistItemWithChanges }> {
  const res = await fetch(`${BASE_URL}/api/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function removeWatchlistItem(id: string): Promise<void> {
  await fetch(`${BASE_URL}/api/watchlist/${id}`, { method: "DELETE", credentials: "include" });
}

export async function checkWatchlistItem(id: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE_URL}/api/watchlist/${id}/check`, { method: "POST", credentials: "include" });
  return res.json();
}

export async function getWatchlistChanges(id: string): Promise<{ changes: WatchlistChange[] }> {
  const res = await fetch(`${BASE_URL}/api/watchlist/${id}/changes`, { credentials: "include" });
  if (!res.ok) return { changes: [] };
  return res.json();
}

export async function parseResume(fileBase64: string, mimeType: string, fileName: string): Promise<ParsedResume> {
  const res = await fetch(`${BASE_URL}/api/resume/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ fileBase64, mimeType, fileName }),
  });
  const data = await res.json() as { resume?: ParsedResume; error?: string };
  if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data.resume!;
}

export interface UserApiKeyStatus {
  set: boolean;
  hint: string;
}

export async function getUserKeys(): Promise<Record<string, UserApiKeyStatus>> {
  const res = await fetch(`${BASE_URL}/api/user/keys`, { credentials: "include" });
  if (!res.ok) return {};
  return res.json();
}

export async function saveUserKey(service: "tinyfish" | "groq", key: string): Promise<{ ok: boolean; hint: string; error?: string }> {
  const res = await fetch(`${BASE_URL}/api/user/keys/${service}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ key }),
  });
  return res.json();
}

export async function deleteUserKey(service: "tinyfish" | "groq"): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE_URL}/api/user/keys/${service}`, {
    method: "DELETE",
    credentials: "include",
  });
  return res.json();
}

export async function getUserProfile(): Promise<{ user: Record<string, unknown> }> {
  const res = await fetch(`${BASE_URL}/api/user/profile`, { credentials: "include" });
  if (!res.ok) return { user: {} };
  return res.json();
}
