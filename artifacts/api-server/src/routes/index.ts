import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import orchestrateRouter from "./orchestrate.js";
import ttsRouter from "./tts.js";
import authRouter from "./auth.js";
import sessionsRouter from "./sessions.js";
import resumeRouter from "./resume.js";
import assistantRouter from "./assistant.js";
import contentRouter from "./content.js";
import watchlistRouter from "./watchlist.js";
import userKeysRouter from "./userKeys.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(orchestrateRouter);
router.use(ttsRouter);
router.use(authRouter);
router.use(sessionsRouter);
router.use(resumeRouter);
router.use(assistantRouter);
router.use(contentRouter);
router.use(watchlistRouter);
router.use(userKeysRouter);

export default router;
