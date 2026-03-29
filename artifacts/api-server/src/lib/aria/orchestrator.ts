import { parseIntent } from "./groq.js";
import { runAgentTask, type UserKeys } from "./tinyfish.js";
import { synthesizeResults } from "./gemini.js";
import type { StreamEvent, TaskResult, TaskPlan } from "./types.js";
import { logger } from "../logger.js";
import { getUncachableGoogleCalendarClient, isCalendarAvailable } from "../googleCalendar.js";
import { getUncachableGmailClient, isGmailAvailable } from "../googleGmail.js";

async function fetchAssistantContext(): Promise<string> {
  const parts: string[] = [];

  await Promise.allSettled([
    // Calendar: next 7 days of events
    (async () => {
      if (!isCalendarAvailable()) return;
      const calendar = await getUncachableGoogleCalendarClient();
      const now = new Date().toISOString();
      const inOneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const res = await calendar.events.list({
        calendarId: "primary",
        timeMin: now,
        timeMax: inOneWeek,
        maxResults: 10,
        singleEvents: true,
        orderBy: "startTime",
      });
      const events = res.data.items ?? [];
      if (events.length > 0) {
        const lines = events.map((ev) => {
          const start = ev.start?.dateTime ?? ev.start?.date ?? "?";
          const attendees = (ev.attendees ?? []).map((a) => a.email).filter(Boolean).join(", ");
          return `- ${ev.summary ?? "(No title)"} at ${start}${attendees ? ` with ${attendees}` : ""}`;
        });
        parts.push(`USER'S UPCOMING CALENDAR (next 7 days):\n${lines.join("\n")}`);
      } else {
        parts.push("USER'S CALENDAR: No events in the next 7 days.");
      }
    })(),

    // Gmail: most recent 10 inbox messages
    (async () => {
      if (!(await isGmailAvailable().catch(() => false))) return;
      const gmail = await getUncachableGmailClient();
      const listRes = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        maxResults: 10,
      });
      const messageIds = (listRes.data.messages ?? []).map((m) => m.id ?? "").filter(Boolean);
      const messages = await Promise.all(
        messageIds.map(async (id) => {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          });
          const headers = msg.data.payload?.headers ?? [];
          const get = (name: string) => headers.find((h) => h.name === name)?.value ?? "";
          const unread = (msg.data.labelIds ?? []).includes("UNREAD");
          return `- [${unread ? "UNREAD" : "read"}] "${get("Subject") || "(No subject)"}" from ${get("From")} (${get("Date")}) — ${msg.data.snippet?.slice(0, 100) ?? ""}`;
        })
      );
      if (messages.length > 0) {
        parts.push(`USER'S GMAIL INBOX (most recent):\n${messages.join("\n")}`);
      }
    })(),
  ]);

  return parts.length > 0
    ? `\n\n---\nLIVE GOOGLE DATA (use this to answer questions about calendar/email):\n${parts.join("\n\n")}\n---`
    : "";
}

function parseJobApplyGoal(goalStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  const withoutPrefix = goalStr.replace(/^JOB_APPLY_V1::/, "");
  const segments = withoutPrefix.split("::");
  for (const seg of segments) {
    const colonIdx = seg.indexOf(":");
    if (colonIdx === -1) continue;
    const key = seg.slice(0, colonIdx).trim();
    const val = seg.slice(colonIdx + 1).trim();
    if (key) result[key] = val;
  }
  return result;
}

function buildCoverLetter(p: Record<string, string>, style: string): string {
  const name = p["NAME"] ?? "I";
  const role = p["ROLE"] ?? "this position";
  const experience = p["EXPERIENCE"] ?? "";
  const skills = p["RESUME"] ?? "";
  const salary = p["SALARY"] ? ` I am looking for a compensation package in the range of ${p["SALARY"]}.` : "";
  const notes = p["NOTES"] ? ` Note: ${p["NOTES"]}.` : "";

  const snippets: Record<string, string> = {
    enthusiastic: `I am genuinely excited to apply for the ${role} position! With ${experience} of hands-on experience, I have built real products that users love. My background: ${skills.slice(0, 200)}. I thrive in fast-moving environments and would love to bring that energy to your team.${salary}${notes}`,
    professional: `I am writing to express my interest in the ${role} role. With ${experience} of relevant experience, I have consistently delivered high-impact results. ${skills.slice(0, 200)}.${salary}${notes} I look forward to discussing how my background aligns with your team's goals.`,
    technical: `Applying for: ${role} | Experience: ${experience} | Stack: ${skills.slice(0, 250)}.${salary}${notes} I prefer work samples over words — happy to share GitHub/portfolio for review.`,
    brief: `Hi! I am ${name}. ${experience} of ${role} experience. ${skills.slice(0, 150)}.${salary}${notes} Would love to connect.`,
  };

  return snippets[style] ?? snippets["professional"];
}

function createJobApplyTaskPlan(goalStr: string): TaskPlan {
  const p = parseJobApplyGoal(goalStr);
  const role = p["ROLE"] ?? "Software Engineer";
  const location = p["LOCATION"] ?? "India";
  const experience = p["EXPERIENCE"] ?? "3-5 years";
  const name = p["NAME"] ?? "";
  const email = p["EMAIL"] ?? "";
  const phone = p["PHONE"] ?? "";
  const linkedin = p["LINKEDIN"] ?? "";
  const portfolio = p["PORTFOLIO"] ?? "";
  const resumeText = (p["RESUME"] ?? "").slice(0, 700);
  const coverStyle = p["COVER_STYLE"] ?? "professional";
  const salary = p["SALARY"] ?? "";
  const city = location.split(",")[0]?.trim() ?? location;

  const coverLetter = buildCoverLetter(p, coverStyle);

  const applicantBlock = [
    `Full Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    linkedin ? `LinkedIn: ${linkedin}` : null,
    portfolio ? `Portfolio/GitHub: ${portfolio}` : null,
    `Years of Experience: ${experience}`,
    salary ? `Expected Salary: ${salary}` : null,
    `Resume Summary: ${resumeText}`,
    `Cover Letter / Pitch (use this text verbatim in any cover letter or "why are you interested" field): "${coverLetter}"`,
  ].filter(Boolean).join("\n");

  const roleEncoded = encodeURIComponent(role);
  const locationEncoded = encodeURIComponent(location);

  return {
    taskType: "job_application",
    reasoning: `Applying to ${role} positions in ${location} across 6 job platforms simultaneously`,
    tasks: [
      {
        taskId: "t1",
        url: `https://in.indeed.com/jobs?q=${roleEncoded}&l=${locationEncoded}`,
        goal: `Navigate to https://in.indeed.com. In the search boxes, type "${role}" in the "What" field and "${location}" in the "Where" field, then press Search. Sort results by "Date" (most recent). Look through the job listings and find one with a direct "Apply Now" button on the listing page or an "Indeed Easy Apply" option. Click on the most relevant recent job. On the job application page, fill in all form fields using the applicant details below:\n\n${applicantBlock}\n\nIf there is a resume upload button, look for a "Paste your resume" or text alternative. Submit the completed application by clicking the Apply/Submit button. Take a screenshot of the confirmation or success page. Return ONLY valid JSON: {"site":"indeed","job_title":"...","company":"...","job_url":"...","status":"submitted|failed|requires_login","confirmation":"...","error":"..."}`,
        expectedOutputType: "form_submission",
      },
      {
        taskId: "t2",
        url: `https://www.linkedin.com/jobs/search/?keywords=${roleEncoded}&location=${locationEncoded}`,
        goal: `Navigate to https://www.linkedin.com/jobs/search/?keywords=${roleEncoded}&location=${locationEncoded}. You do NOT need to log in — this page is publicly accessible. Scroll through the job listings on the left panel. Look specifically for a job card that shows "Apply on company website" (not "Easy Apply" which requires login). Click on that job to open its details. Then click the "Apply on company website" button — this opens the company's own careers page. On the company careers page, fill in the application form with:\n\n${applicantBlock}\n\nComplete all required fields and submit. Return ONLY valid JSON: {"site":"linkedin_external","job_title":"...","company":"...","company_apply_url":"...","status":"submitted|failed|navigated_to_company_site|no_external_apply_found","confirmation":"..."}`,
        expectedOutputType: "form_submission",
      },
      {
        taskId: "t3",
        url: `https://www.google.com/search?q=site:boards.greenhouse.io+"${encodeURIComponent(role)}"+"${encodeURIComponent(city)}"`,
        goal: `Navigate to Google and search for: site:boards.greenhouse.io "${role}" "${city}". Click on one of the Greenhouse job application results (boards.greenhouse.io links). Greenhouse application forms are open and do NOT require authentication. On the Greenhouse form, fill in:\n\n${applicantBlock}\n\nFor the Resume field: if there is a "Paste" option, click it and paste the Resume Summary above. Fill all required fields marked with asterisks. Scroll down to find the "Submit Application" button and click it. Return ONLY valid JSON: {"site":"greenhouse","job_title":"...","company":"...","greenhouse_url":"...","status":"submitted|failed|requires_upload_only","confirmation":"...","error":"..."}`,
        expectedOutputType: "form_submission",
      },
      {
        taskId: "t4",
        url: `https://www.google.com/search?q=site:jobs.lever.co+"${encodeURIComponent(role)}"+"${encodeURIComponent(city)}"`,
        goal: `Navigate to Google and search for: site:jobs.lever.co "${role}" "${city}". Click on a relevant Lever job posting result (jobs.lever.co links). Lever application pages are fully open — no account needed. On the Lever application form, fill in:\n\n${applicantBlock}\n\nFor the resume section, look for "Paste your resume" option. Complete all fields and click "Submit Application". Return ONLY valid JSON: {"site":"lever","job_title":"...","company":"...","lever_url":"...","status":"submitted|failed","confirmation":"..."}`,
        expectedOutputType: "form_submission",
      },
      {
        taskId: "t5",
        url: `https://www.naukri.com/jobs-in-india?keyword=${roleEncoded}&location=${locationEncoded}`,
        goal: `Navigate to https://www.naukri.com. In the search bar, type "${role}" and set location to "${location}". Press Search. Sort by "Date" (freshness). Click on a recent relevant job. On the job detail page, look for an "Apply" button. Click Apply. If Naukri shows a quick-apply form (sometimes available without full login), fill it with:\n\n${applicantBlock}\n\nIf asked for a message or cover note field, use the Cover Letter above. Submit and record the outcome. Return ONLY valid JSON: {"site":"naukri","job_title":"...","company":"...","status":"submitted|requires_login|quick_apply_done|failed","notes":"..."}`,
        expectedOutputType: "form_submission",
      },
      {
        taskId: "t6",
        url: `https://wellfound.com/jobs?role=${roleEncoded}&location=${locationEncoded}`,
        goal: `Navigate to https://wellfound.com/jobs. In the search/filter area, search for "${role}" and filter by location "${location}" if possible. Browse the startup job listings. Click on a relevant job. On the job page, click "Apply". Wellfound allows applying without a full account for many roles — look for an "Apply with email" or direct form option. Fill in:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n${linkedin ? `LinkedIn: ${linkedin}` : ""}\nIntro message: ${coverLetter.slice(0, 300)}\n\nSubmit the application. Return ONLY valid JSON: {"site":"wellfound","job_title":"...","company":"...","startup_stage":"...","status":"submitted|requires_linkedin|failed","notes":"..."}`,
        expectedOutputType: "form_submission",
      },
    ],
  };
}

export async function runARIA(
  userGoal: string,
  onEvent: (event: StreamEvent) => void,
  mode?: string,
  language?: string,
  userKeys?: UserKeys
): Promise<void> {
  // Step 1: Parse intent with Groq
  onEvent({
    type: "THINKING",
    message: mode === "assistant" ? "Checking your calendar and inbox..." : "Analyzing your goal...",
    timestamp: Date.now(),
  });

  logger.info({ goal: userGoal }, "Starting parseIntent");

  // For assistant mode, fetch real Google data and inject it as context
  let enrichedGoal = userGoal;
  if (mode === "assistant") {
    try {
      const context = await fetchAssistantContext();
      if (context) {
        enrichedGoal = userGoal + context;
        logger.info("Injected Google Calendar + Gmail context into assistant prompt");
      }
    } catch (err) {
      logger.warn({ err }, "Failed to fetch assistant context — proceeding without it");
    }
  }

  let taskPlan;
  try {
    if (mode === "job-apply" && enrichedGoal.startsWith("JOB_APPLY_V1")) {
      taskPlan = createJobApplyTaskPlan(enrichedGoal);
      logger.info({ taskCount: taskPlan.tasks.length }, "job-apply task plan created directly");
    } else {
      taskPlan = await parseIntent(enrichedGoal, mode, userKeys?.groqKey);
      logger.info({ taskCount: taskPlan.tasks.length }, "parseIntent complete");
    }
  } catch (err) {
    logger.error({ err }, "parseIntent failed");
    onEvent({
      type: "ERROR",
      message: `Failed to parse intent: ${(err as Error).message}`,
      timestamp: Date.now(),
    });
    return;
  }

  // Step 2: Emit PLAN_READY
  onEvent({
    type: "PLAN_READY",
    tasks: taskPlan.tasks,
    message: taskPlan.tasks.length === 0
      ? `Assistant drafting directly with AI...`
      : `Plan ready: ${taskPlan.reasoning}`,
    timestamp: Date.now(),
  });

  // Step 3: Run all tasks in parallel (skip if 0 tasks — pure AI mode)
  const taskResults: TaskResult[] = [];

  const runTask = async (task: typeof taskPlan.tasks[0]): Promise<void> => {
    logger.info({ taskId: task.taskId, url: task.url }, "Starting task");
    let lastResultJson: Record<string, unknown> | undefined;
    let lastScreenshot: string | undefined;
    let hadError = false;

    try {
      for await (const event of runAgentTask(task, userKeys)) {
        onEvent({
          type: event.type,
          taskId: event.taskId,
          message: event.message,
          screenshot: event.screenshot,
          currentUrl: event.currentUrl,
          streamingUrl: event.streamingUrl,
          timestamp: event.timestamp,
        });

        if (event.resultJson) lastResultJson = event.resultJson;
        if (event.screenshot) lastScreenshot = event.screenshot;
        if (event.type === "ERROR") hadError = true;
      }
    } catch (err) {
      logger.error({ err, taskId: task.taskId }, "Task generator error");
      hadError = true;
    }

    taskResults.push({
      taskId: task.taskId,
      success: !hadError,
      resultJson: lastResultJson,
      screenshot: lastScreenshot,
    });

    onEvent({
      type: "TASK_DONE",
      taskId: task.taskId,
      message: hadError ? `Task ${task.taskId} failed` : `Task ${task.taskId} completed`,
      timestamp: Date.now(),
    });
  };

  if (taskPlan.tasks.length > 0) {
    await Promise.allSettled(taskPlan.tasks.map(runTask));
  } else {
    logger.info({ mode }, "Zero-task plan — skipping TinyFish, going straight to AI synthesis");
    onEvent({ type: "EXTRACTING", message: "Drafting with AI...", timestamp: Date.now() });
  }

  // Step 4: Synthesize with Gemini — pass the enriched goal so it has full context
  onEvent({
    type: "EXTRACTING",
    message: "Synthesizing results with Gemini...",
    timestamp: Date.now(),
  });

  const successCount = taskResults.filter((r) => r.success).length;
  logger.info({ successCount, total: taskResults.length }, "Starting synthesis");

  let finalAnswer: string;
  try {
    finalAnswer = await synthesizeResults(enrichedGoal, taskResults, mode, language);
    logger.info("Synthesis complete");
  } catch (err) {
    logger.error({ err }, "Synthesis failed");
    finalAnswer = `I researched your question but had trouble synthesizing the results. Here's what I found: ${
      taskResults
        .filter((r) => r.success && r.resultJson)
        .map((r) => JSON.stringify(r.resultJson))
        .join(". ")
        .slice(0, 300)
    }`;
  }

  // Step 5: Emit ANSWER_READY
  onEvent({
    type: "ANSWER_READY",
    answer: finalAnswer,
    successCount,
    totalCount: taskPlan.tasks.length,
    message: finalAnswer,
    timestamp: Date.now(),
  });
}
