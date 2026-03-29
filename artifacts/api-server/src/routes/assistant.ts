import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger.js";
import { getUncachableGoogleCalendarClient, isCalendarAvailable } from "../lib/googleCalendar.js";
import { getUncachableGmailClient, isGmailAvailable, buildRawEmail } from "../lib/googleGmail.js";

const router: IRouter = Router();

// GET /api/assistant/status — calendar + gmail connection state + upcoming events + inbox preview
router.get("/assistant/status", async (_req: Request, res: Response) => {
  const calendarConnected = isCalendarAvailable();
  const gmailConnected = await isGmailAvailable().catch(() => false);

  const result: {
    calendar: boolean;
    gmail: boolean;
    calendarEvents: { id: string; summary: string; start: string; end: string; attendees?: string[] }[];
    gmailMessages: { id: string; subject: string; from: string; snippet: string; date: string }[];
  } = {
    calendar: calendarConnected,
    gmail: gmailConnected,
    calendarEvents: [],
    gmailMessages: [],
  };

  // Fetch next 5 calendar events in parallel with inbox
  await Promise.allSettled([
    // Calendar
    (async () => {
      if (!calendarConnected) return;
      const calendar = await getUncachableGoogleCalendarClient();
      const now = new Date().toISOString();
      const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const eventsRes = await calendar.events.list({
        calendarId: "primary",
        timeMin: now,
        timeMax: inTwoWeeks,
        maxResults: 5,
        singleEvents: true,
        orderBy: "startTime",
      });
      result.calendarEvents = (eventsRes.data.items ?? []).map((ev) => ({
        id: ev.id ?? "",
        summary: ev.summary ?? "(No title)",
        start: ev.start?.dateTime ?? ev.start?.date ?? "",
        end: ev.end?.dateTime ?? ev.end?.date ?? "",
        attendees: (ev.attendees ?? []).map((a) => a.email ?? "").filter(Boolean),
      }));
    })(),

    // Gmail inbox
    (async () => {
      if (!gmailConnected) return;
      const gmail = await getUncachableGmailClient();
      const listRes = await gmail.users.messages.list({
        userId: "me",
        labelIds: ["INBOX"],
        maxResults: 5,
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
          return {
            id,
            subject: get("Subject") || "(No subject)",
            from: get("From"),
            snippet: msg.data.snippet ?? "",
            date: get("Date"),
          };
        })
      );
      result.gmailMessages = messages;
    })(),
  ]);

  res.json(result);
});

// POST /api/assistant/calendar/event — Create a real Google Calendar event
router.post("/assistant/calendar/event", async (req: Request, res: Response) => {
  if (!isCalendarAvailable()) {
    res.status(503).json({ error: "google_not_connected", message: "Google Calendar is not connected." });
    return;
  }

  const { summary, description, startTime, endTime, attendees, location } = req.body as {
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    attendees?: string[];
    location?: string;
  };

  if (!summary || !startTime || !endTime) {
    res.status(400).json({ error: "bad_request", message: "summary, startTime, and endTime are required" });
    return;
  }

  try {
    const calendar = await getUncachableGoogleCalendarClient();
    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all",
      requestBody: {
        summary,
        description: description ?? "",
        location: location ?? "",
        start: { dateTime: startTime, timeZone: "UTC" },
        end: { dateTime: endTime, timeZone: "UTC" },
        attendees: (attendees ?? []).map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 15 },
          ],
        },
      },
    });

    logger.info({ eventId: event.data.id, summary }, "Calendar event created");
    res.json({
      success: true,
      eventId: event.data.id,
      htmlLink: event.data.htmlLink,
      message: `Event "${summary}" created in Google Calendar`,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create calendar event");
    res.status(500).json({ error: "calendar_error", message: (err as Error).message });
  }
});

// GET /api/assistant/calendar/availability — Free/busy check
router.get("/assistant/calendar/availability", async (req: Request, res: Response) => {
  if (!isCalendarAvailable()) {
    res.status(503).json({ error: "google_not_connected" });
    return;
  }

  const { from, to } = req.query as { from?: string; to?: string };
  const timeMin = from ?? new Date().toISOString();
  const timeMax = to ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const calendar = await getUncachableGoogleCalendarClient();
    const freeBusy = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: "primary" }] },
    });
    const busy = freeBusy.data.calendars?.["primary"]?.busy ?? [];
    res.json({ busy, timeMin, timeMax });
  } catch (err) {
    logger.error({ err }, "Failed to check availability");
    res.status(500).json({ error: "calendar_error", message: (err as Error).message });
  }
});

// POST /api/assistant/gmail/send — Send a real email via Gmail
router.post("/assistant/gmail/send", async (req: Request, res: Response) => {
  const gmailConnected = await isGmailAvailable().catch(() => false);
  if (!gmailConnected) {
    res.status(503).json({ error: "gmail_not_connected", message: "Gmail is not connected." });
    return;
  }

  const { to, subject, body } = req.body as { to?: string; subject?: string; body?: string };
  if (!to || !subject || !body) {
    res.status(400).json({ error: "bad_request", message: "to, subject, and body are required" });
    return;
  }

  try {
    const gmail = await getUncachableGmailClient();
    const raw = buildRawEmail({ to, subject, body });
    const sent = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });

    logger.info({ to, subject, messageId: sent.data.id }, "Gmail email sent");
    res.json({ success: true, messageId: sent.data.id, message: `Email sent to ${to}` });
  } catch (err) {
    logger.error({ err }, "Failed to send Gmail email");
    res.status(500).json({ error: "gmail_error", message: (err as Error).message });
  }
});

// GET /api/assistant/gmail/inbox — Real inbox summary
router.get("/assistant/gmail/inbox", async (_req: Request, res: Response) => {
  const gmailConnected = await isGmailAvailable().catch(() => false);
  if (!gmailConnected) {
    res.status(503).json({ error: "gmail_not_connected" });
    return;
  }

  try {
    const gmail = await getUncachableGmailClient();
    const listRes = await gmail.users.messages.list({ userId: "me", labelIds: ["INBOX"], maxResults: 10 });
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
        return {
          id,
          subject: get("Subject") || "(No subject)",
          from: get("From"),
          snippet: msg.data.snippet ?? "",
          date: get("Date"),
          unread: (msg.data.labelIds ?? []).includes("UNREAD"),
        };
      })
    );

    res.json({ messages, total: listRes.data.resultSizeEstimate ?? messages.length });
  } catch (err) {
    logger.error({ err }, "Failed to fetch Gmail inbox");
    res.status(500).json({ error: "gmail_error", message: (err as Error).message });
  }
});

export default router;
