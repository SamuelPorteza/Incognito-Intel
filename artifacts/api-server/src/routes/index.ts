import { Router, type IRouter } from "express";
import healthRouter from "./health";
import questionsRouter from "./questions";
import topicsRouter from "./topics";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/questions", questionsRouter);
router.use("/topics", topicsRouter);
router.use("/analytics", analyticsRouter);

export default router;
