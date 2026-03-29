import { Router, type IRouter, type Request, type Response } from "express";
import { parseResume } from "../lib/aria/resumeParser.js";
import { logger } from "../lib/logger.js";

const router: IRouter = Router();

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
]);

router.post("/resume/parse", (req: Request, res: Response) => {
  void (async () => {
    const { fileBase64, mimeType, fileName } = req.body as {
      fileBase64?: string;
      mimeType?: string;
      fileName?: string;
    };

    if (!fileBase64 || typeof fileBase64 !== "string") {
      res.status(400).json({ error: "fileBase64 is required" });
      return;
    }
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      res.status(400).json({
        error: "Unsupported file type. Please upload a PDF, DOCX, or TXT resume.",
      });
      return;
    }

    // Sanity check — base64 of 10MB is ~13MB string
    if (fileBase64.length > 14_000_000) {
      res.status(413).json({ error: "File too large. Please upload a resume under 10 MB." });
      return;
    }

    logger.info({ fileName, mimeType }, "Resume parse request");

    try {
      const resume = await parseResume(fileBase64, mimeType);
      res.json({ resume });
    } catch (err) {
      logger.error({ err }, "Resume parse error");
      res.status(500).json({ error: (err as Error).message });
    }
  })();
});

export default router;
