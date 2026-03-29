import { GoogleGenAI } from "@google/genai";
import { logger } from "../logger.js";

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

export async function parseResume(fileBase64: string, mimeType: string): Promise<ParsedResume> {
  const ai = makeClient();

  const prompt = `You are a resume parser. Extract ALL information from this resume document and return structured JSON only — no markdown, no explanation.

Return this exact JSON shape (fill every field you can find, use empty arrays/strings for missing fields):
{
  "name": "Candidate full name",
  "email": "email@example.com or empty string",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    { "role": "Job title", "company": "Company name", "years": 2, "description": "Brief role description" }
  ],
  "preferredRoles": ["2-4 roles they would logically target next based on their background"],
  "locationPreference": "Remote / City name / Open to relocation / as stated",
  "education": "Highest degree and field",
  "summary": "2-3 sentence professional summary capturing their key value proposition"
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences. No extra text.`;

  logger.info({ mimeType }, "Parsing resume with Gemini AI Integrations");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: fileBase64 } },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });

  const rawText = response.text ?? "";
  if (!rawText) throw new Error("Gemini returned an empty response. Please try again.");

  // Strip any accidental markdown code fences
  let clean = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // If the JSON is truncated (no closing brace), try to recover by finding the last complete field
  if (!clean.endsWith("}")) {
    // Attempt to close the JSON at the last complete field
    const lastComma = clean.lastIndexOf(",");
    if (lastComma > 0) {
      clean = clean.slice(0, lastComma) + "\n}";
    } else {
      clean = clean + "\n}";
    }
  }

  try {
    const parsed = JSON.parse(clean) as ParsedResume;
    // Ensure arrays are never undefined
    parsed.skills = parsed.skills ?? [];
    parsed.experience = parsed.experience ?? [];
    parsed.preferredRoles = parsed.preferredRoles ?? [];
    parsed.locationPreference = parsed.locationPreference ?? "";
    parsed.summary = parsed.summary ?? "";
    logger.info({ name: parsed.name, skillCount: parsed.skills.length }, "Resume parsed successfully");
    return parsed;
  } catch {
    logger.error({ rawLength: rawText.length, preview: rawText.slice(0, 200) }, "Failed to parse Gemini JSON response");
    throw new Error("Failed to read resume content. Please ensure the file is a valid PDF or DOCX and try again.");
  }
}

/**
 * Formats parsed resume into a compact context string for injection into agent goals.
 */
export function resumeToContext(resume: ParsedResume): string {
  const skills = resume.skills.slice(0, 12).join(", ");
  const latestRole = resume.experience?.[0];
  const preferredRoles = resume.preferredRoles.join(", ");
  return [
    `[RESUME CONTEXT]`,
    `Candidate: ${resume.name}`,
    skills ? `Skills: ${skills}` : "",
    latestRole ? `Latest role: ${latestRole.role}${latestRole.company ? ` at ${latestRole.company}` : ""}` : "",
    preferredRoles ? `Target roles: ${preferredRoles}` : "",
    resume.locationPreference ? `Location: ${resume.locationPreference}` : "",
    resume.summary ? `Background: ${resume.summary}` : "",
    `[/RESUME CONTEXT]`,
  ]
    .filter(Boolean)
    .join("\n");
}
