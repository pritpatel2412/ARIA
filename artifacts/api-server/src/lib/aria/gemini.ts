import { GoogleGenAI } from "@google/genai";
import type { TaskResult } from "./types.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env["GROQ_API_KEY"];

const LANGUAGE_NAMES: Record<string, string> = {
  "hi-IN": "Hindi",
  "bn-IN": "Bengali",
  "gu-IN": "Gujarati",
  "kn-IN": "Kannada",
  "ml-IN": "Malayalam",
  "mr-IN": "Marathi",
  "od-IN": "Odia",
  "pa-IN": "Punjabi",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "en-IN": "English",
};

function makeClient() {
  const baseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
  const apiKey =
    process.env["AI_INTEGRATIONS_GEMINI_API_KEY"] ??
    process.env["GEMINI_API_KEY"] ??
    "";

  return new GoogleGenAI({
    apiKey,
    ...(baseUrl
      ? { httpOptions: { apiVersion: "", baseUrl } }
      : {}),
  });
}

function buildSynthesisPrompt(originalGoal: string, taskResults: TaskResult[], mode?: string, language?: string): string {
  const successfulResults = taskResults.filter((r) => r.success);
  const failedCount = taskResults.length - successfulResults.length;

  const resultsJson = JSON.stringify(
    successfulResults.map((r) => ({ taskId: r.taskId, data: r.resultJson })),
    null,
    2
  );

  const failedNote = failedCount > 0 ? `Note: ${failedCount} web browsing task(s) could not complete.\n` : "";
  const noDataNote = successfulResults.length === 0 ? `No live web data was collected. Answer comprehensively from your knowledge.\n` : "";

  const langName = language ? (LANGUAGE_NAMES[language] ?? "English") : "English";
  const langInstruction = langName !== "English"
    ? `\n\n**LANGUAGE RULE**: Write your ENTIRE response in ${langName}. Use English only for URLs, code snippets, and proper nouns with no ${langName} equivalent.`
    : "";

  const LINK_RULE = `
**LINKS ARE MANDATORY**: Every claim, product, company, tool, or data point MUST include the direct source URL as a markdown link like [Source Name](https://url.com). Include at least 5–10 clickable links spread throughout your response.`;

  if (mode === "job-apply") {
    const parsed: Record<string, string> = {};
    const withoutPrefix = originalGoal.replace(/^JOB_APPLY_V1::/, "");
    for (const seg of withoutPrefix.split("::")) {
      const idx = seg.indexOf(":");
      if (idx === -1) continue;
      parsed[seg.slice(0, idx).trim()] = seg.slice(idx + 1).trim();
    }
    const role = parsed["ROLE"] ?? "the position";
    const location = parsed["LOCATION"] ?? "";
    const name = parsed["NAME"] ?? "Applicant";
    const experience = parsed["EXPERIENCE"] ?? "";

    return `You are ARIA's autonomous job application engine. ${name} just applied to ${role} positions in ${location} using 6 parallel web agents.

Application Results from each agent:
${JSON.stringify(successfulResults.map((r) => ({ site: r.taskId, data: r.resultJson })), null, 2)}

${failedCount > 0 ? `${failedCount} agent(s) encountered issues.\n` : ""}

Write a comprehensive **Application Campaign Report** in markdown:

## Summary
One paragraph: how many applications were submitted, to which platforms, for what role.

## Application Results

For each platform, create a section:

### [Platform Name] — [Status Badge: ✅ Submitted | ⚠️ Partial | ❌ Failed]
- **Job Title**: exact title
- **Company**: company name  
- **Application URL**: direct link to the job posting
- **Status**: what happened — submitted, confirmation received, requires login, etc.
- **Confirmation**: any reference number, success message, or next steps
- **Notes**: anything the agent encountered (CAPTCHAs, redirects, form quirks)

## What Happens Next
For each successful submission, what should ${name} expect?
- Typical response time for that company/platform
- How to follow up (email, LinkedIn message template)
- Any action items

## Failed Applications — Manual Action Required
For applications that couldn't be auto-submitted, provide:
- Direct link to apply manually
- Exact fields to fill (pre-filled with applicant data)
- Estimated time to complete manually

## Application Summary Table

| Platform | Company | Role | Status | Response Time |
|----------|---------|------|--------|---------------|
${successfulResults.map((r) => {
  const d = r.resultJson as Record<string, string> | undefined;
  return `| ${d?.["site"] ?? r.taskId} | ${d?.["company"] ?? "—"} | ${role} | ${d?.["status"] ?? "—"} | 3–5 days |`;
}).join("\n")}

## Cover Letter Used
Here is the cover letter ARIA composed and submitted:

> ${parsed["RESUME"] ? `Based on ${name}'s background with ${experience} in ${role}.` : "Generated from provided resume."}

---
*ARIA submitted ${successfulResults.length} applications in parallel. Experience: ${experience} | Role: ${role} | Location: ${location}*`;
  }

  if (mode === "assistant") {
    return `You are ARIA, an expert executive assistant AI. The user asked: "${originalGoal}"

${resultsJson !== "[]" ? `Research gathered:\n${resultsJson}\n` : ""}
${failedNote}${noDataNote}

Produce a high-quality, immediately usable professional document. Adapt format to the request:

- **EMAIL**: Complete email with Subject:, greeting, full body paragraphs, and sign-off. Minimum 200 words.
- **PLAN / AGENDA**: Structured sections with time boxes, owners, and action items.
- **MEETING INVITE**: Full invitation with date options, agenda, Zoom/location placeholder.
- **SUMMARY**: Executive summary with key findings, risks, and recommendations.
- **OTHER DOCUMENT**: Full professional format appropriate to the type.

Requirements:
- Immediately copy-pasteable output
- Specific names, dates, and details — never generic filler
- For emails: always start with "Subject: ..."
- Minimum 300 words${langInstruction}`;
  }

  if (mode === "forms") {
    return `You are ARIA, an autonomous form-filling assistant. The user asked: "${originalGoal}"

Execution results:
${resultsJson}

${failedNote}${noDataNote}

Provide a detailed report of what happened:

## Action Taken
Describe exactly which site was visited and what form was filled.

## Fields Submitted
List every field that was filled with the actual values used.

## Outcome
Was the form submitted? What confirmation was received? Any confirmation number?

## Next Steps
What should the user expect next (email confirmation, review period, etc.)?

Be specific. Use actual data from the execution results.${langInstruction}`;
  }

  if (mode === "money") {
    return `You are ARIA, an expert financial analyst AI. The user asked: "${originalGoal}"

Live web research data:
${resultsJson}

${failedNote}${noDataNote}
${LINK_RULE}

Write a comprehensive financial intelligence report in **markdown** with these sections:

## Current Price & Performance
Exact price, 24h change %, 7-day trend, volume, market cap (use real numbers from research).

## Market Sentiment
Bullish / Bearish / Neutral with specific evidence — what are investors saying right now?

## Analyst Ratings & Price Targets
What are analysts recommending? Include specific price targets, ratings, and sources with links.

## Key Risks
Top 3–5 risks that could affect price in the near term.

## Technical Analysis
Support/resistance levels, RSI, trend direction if available in research.

## ARIA's Recommendation
A clear, specific recommendation: Buy / Hold / Sell with a one-sentence rationale and suggested entry/exit levels.

Use markdown tables for price comparisons. Include real source URLs as markdown links.${langInstruction}`;
  }

  if (mode === "content") {
    return `You are ARIA's content creation engine. The user wants to create content about: "${originalGoal}"

Web research data (trending posts, viral hooks, engagement patterns):
${resultsJson}

${failedNote}${noDataNote}

Generate a complete content package. Return STRICT JSON only — no markdown, no code fences:

{
  "content": {
    "topic": "the core topic in 3-5 words",
    "insights": ["key insight 1 from research", "key insight 2", "key insight 3"],
    "contentPillar": "thought_leadership",
    "imagePrompt": "Professional, eye-catching image description for this post — specific scene, mood, colors",
    "linkedin": {
      "post": "Complete LinkedIn post, ready to publish. Strong hook first line. Line breaks for readability. 3-5 relevant hashtags at the end. 200-400 words. Conversational yet professional.",
      "hashtags": ["#Tag1", "#Tag2", "#Tag3"],
      "charCount": 300
    },
    "twitter": {
      "thread": [
        "🧵 Hook tweet — the most attention-grabbing angle. Under 280 chars.",
        "1/ First point with specific detail or stat",
        "2/ Second point with example",
        "3/ Third key insight",
        "4/ Practical takeaway or action step",
        "5/ Call to action + follow prompt"
      ]
    },
    "summary": "2-sentence spoken summary: what you created and why it will resonate."
  }
}`;
  }

  if (mode === "career") {
    return `You are ARIA, an expert career advisor AI. The user asked: "${originalGoal}"

Web research results:
${resultsJson}

${failedNote}${noDataNote}
${LINK_RULE}

Write a comprehensive career guide in **markdown** with proper sections:

## Summary
One paragraph directly answering the user's question.

## Opportunities Found
For each opportunity found (job posting, course, program, etc.):
- **[Company / Program Name](URL)** — Title / Description
- Salary range, location, requirements
- Application deadline if available

## Detailed Analysis
Cover the landscape: which companies are hiring, which skills are most in demand, salary benchmarks, remote vs onsite trends. Use real data from research.

## Action Plan
5 concrete, numbered steps the user should take RIGHT NOW — specific, not generic. Include direct links to apply or enroll.

## Resources
A curated list of the most valuable links from research with markdown formatting.

Be specific and comprehensive. Include every relevant URL as a markdown link. Minimum 400 words.${langInstruction}`;
  }

  return `You are ARIA's research synthesis engine. The user asked: "${originalGoal}"

Web research data collected from live browsing:
${resultsJson}

${failedNote}${noDataNote}
${LINK_RULE}

Write a **comprehensive, well-structured report** in markdown. Use this structure:

## Summary
2–3 sentences directly answering the user's question with the key finding.

## Detailed Findings

For each item, product, service, or topic found:

### [Name](actual-url-from-research)
- **Key fact 1**: specific detail with number/metric
- **Key fact 2**: another specific detail
- **Key fact 3**: pricing, availability, requirements, etc.
- 🔗 [Visit Official Site](actual-url)

Continue for every result found in the research data.

## Comparison Table (if applicable)
Use a markdown table to compare options side by side on key metrics.

| Option | Price | Key Feature | Rating | Link |
|--------|-------|-------------|--------|------|
| ...    | ...   | ...         | ...    | [→](url) |

## Key Insights
Bullet list of the most important takeaways that directly answer what the user wanted to know.

## Recommendation
A clear, actionable recommendation based on the research. Who should choose what, and why.

## Sources
List every source URL visited as a markdown link:
- [Source Name](url) — what was found here

**Requirements:**
- Minimum 500 words
- Every company, product, or tool name must be a clickable markdown link to its actual URL
- Use real numbers, prices, and dates from the research data
- If data is missing, note it explicitly and provide best available information${langInstruction}`;
}

async function synthesizeWithGroq(originalGoal: string, taskResults: TaskResult[], mode?: string, language?: string): Promise<string> {
  const prompt = buildSynthesisPrompt(originalGoal, taskResults, mode, language);

  const maxTokens = mode === "content" ? 2000
    : mode === "forms" ? 800
    : mode === "assistant" ? 2000
    : 4000;

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq fallback error ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? "I was unable to generate an answer.";
}

export async function synthesizeResults(
  originalGoal: string,
  taskResults: TaskResult[],
  mode?: string,
  language?: string
): Promise<string> {
  const textPrompt = buildSynthesisPrompt(originalGoal, taskResults, mode, language);

  const maxTokens = mode === "content" ? 2000
    : mode === "forms" ? 800
    : mode === "assistant" ? 2000
    : 4000;

  try {
    const ai = makeClient();

    type GeminiPart =
      | { text: string }
      | { inlineData: { mimeType: string; data: string } };

    const parts: GeminiPart[] = [{ text: textPrompt }];

    const successfulResults = taskResults.filter((r) => r.success);
    for (const result of successfulResults) {
      if (result.screenshot) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: result.screenshot,
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        temperature: mode === "content" ? 0.8 : 0.5,
        maxOutputTokens: maxTokens,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return text.trim();
  } catch {
    return synthesizeWithGroq(originalGoal, taskResults, mode, language);
  }
}
