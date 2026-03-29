import { runAgentTask } from "./tinyfish.js";
import { logger } from "../logger.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env["GROQ_API_KEY"];

export type WatchType = "pricing" | "features" | "announcements" | "all";

function buildExtractionGoal(url: string, watchType: WatchType, name: string): string {
  const pricingInstruction = `
Extract the complete pricing structure as strict JSON:
{
  "type": "pricing",
  "url": "actual page URL",
  "pageTitle": "page title",
  "plans": [
    {
      "name": "plan name",
      "price": "exact price shown (e.g. $99/month or Free)",
      "billingPeriod": "monthly|annual|one-time|free",
      "annualPrice": "annual price if shown",
      "features": ["feature 1", "feature 2"],
      "limits": ["limit 1"],
      "highlighted": true
    }
  ],
  "currency": "USD",
  "trialOffered": false,
  "enterpriseAvailable": true,
  "specialOffers": "any discounts, promotions, or limited-time offers mentioned",
  "rawText": "first 800 characters of visible pricing text"
}`;

  const featuresInstruction = `
Extract the complete features/capabilities list as strict JSON:
{
  "type": "features",
  "url": "actual page URL",
  "pageTitle": "page title",
  "categories": [
    {
      "name": "category name",
      "features": ["feature 1", "feature 2"]
    }
  ],
  "integrations": ["integration 1", "integration 2"],
  "recentlyAdded": ["any features marked as New or Recent"],
  "comingSoon": ["any features marked as Coming Soon or Beta"],
  "rawText": "first 800 characters of visible text"
}`;

  const announcementsInstruction = `
Extract the latest announcements, blog posts, and changelog entries as strict JSON:
{
  "type": "announcements",
  "url": "actual page URL",
  "pageTitle": "page title",
  "posts": [
    {
      "title": "post title",
      "date": "date string as shown",
      "summary": "brief description",
      "category": "blog|changelog|press|product"
    }
  ],
  "latestUpdate": "most recent update date",
  "rawText": "first 800 characters of visible text"
}`;

  const allInstruction = `
Extract all intelligence from the page as strict JSON:
{
  "type": "general",
  "url": "actual page URL",
  "pageTitle": "page title",
  "pricing": {
    "detected": true,
    "plans": [],
    "pricePoints": ["any prices visible, e.g. '$99/month'"]
  },
  "features": ["key features listed on the page"],
  "announcements": ["any news, updates, or launches"],
  "navigation": ["main nav items — signals product scope"],
  "cta": ["primary call-to-action buttons"],
  "keywords": ["prominent competitive terms or differentiators"],
  "rawText": "first 1000 characters of visible page text"
}`;

  const extractionInstruction = watchType === "pricing" ? pricingInstruction
    : watchType === "features" ? featuresInstruction
    : watchType === "announcements" ? announcementsInstruction
    : allInstruction;

  return `Navigate to ${url} — this is the competitor "${name}" being monitored for intelligence.

Wait for the full page to load. If there is a cookie consent banner, close it. Scroll down to ensure all content is visible.

${extractionInstruction}

CRITICAL: Return ONLY the JSON object above. No markdown, no explanation, no code fences. Pure JSON only.`;
}

export interface CheckResult {
  success: boolean;
  resultJson?: Record<string, unknown>;
  screenshot?: string;
  error?: string;
}

export async function checkCompetitorPage(
  url: string,
  watchType: WatchType,
  name: string
): Promise<CheckResult> {
  const goal = buildExtractionGoal(url, watchType, name);
  const task = { taskId: `watch-${Date.now()}`, url, goal, expectedOutputType: "data" };

  let resultJson: Record<string, unknown> | undefined;
  let screenshot: string | undefined;
  let hadError = false;

  try {
    for await (const event of runAgentTask(task)) {
      if (event.resultJson) resultJson = event.resultJson;
      if (event.screenshot) screenshot = event.screenshot;
      if (event.type === "ERROR") hadError = true;
    }
  } catch (err) {
    logger.error({ err, url }, "watchlistChecker: TinyFish error");
    hadError = true;
  }

  return { success: !hadError && !!resultJson, resultJson, screenshot };
}

interface ChangeDetectionResult {
  hasChanges: boolean;
  changes: Array<{
    changeType: string;
    changeTitle: string;
    changeDescription: string;
    oldValue?: string;
    newValue?: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
}

export async function detectChanges(
  name: string,
  url: string,
  watchType: WatchType,
  oldContent: Record<string, unknown>,
  newContent: Record<string, unknown>
): Promise<ChangeDetectionResult> {
  const prompt = `You are a competitive intelligence analyst. Compare these two snapshots of the competitor "${name}" (${url}) and identify meaningful changes.

PREVIOUS SNAPSHOT:
${JSON.stringify(oldContent, null, 2).slice(0, 2000)}

CURRENT SNAPSHOT:
${JSON.stringify(newContent, null, 2).slice(0, 2000)}

Identify every meaningful change. Return ONLY strict JSON:
{
  "hasChanges": true,
  "changes": [
    {
      "changeType": "price_change|plan_added|plan_removed|feature_added|feature_removed|announcement|content_change|pricing_restructure",
      "changeTitle": "Short title: what changed (max 60 chars)",
      "changeDescription": "Detailed explanation of exactly what changed and business implications",
      "oldValue": "the previous value (be specific)",
      "newValue": "the new value (be specific)",
      "severity": "low|medium|high|critical"
    }
  ]
}

Severity guide:
- critical: price increase, major feature removed, product discontinuation
- high: price decrease (opportunity), major new feature, new product launch
- medium: new pricing tier, feature improvement, promotion
- low: copy change, minor update

If NOTHING meaningful changed, return: {"hasChanges": false, "changes": []}`;

  try {
    const res = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`Groq error ${res.status}`);
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(raw) as ChangeDetectionResult;
  } catch (err) {
    logger.error({ err }, "detectChanges: failed");
    return { hasChanges: false, changes: [] };
  }
}

export function computeNextCheckAt(frequency: string): Date {
  const now = Date.now();
  const ms = frequency === "hourly" ? 60 * 60 * 1000
    : frequency === "weekly" ? 7 * 24 * 60 * 60 * 1000
    : 24 * 60 * 60 * 1000; // daily default
  return new Date(now + ms);
}
