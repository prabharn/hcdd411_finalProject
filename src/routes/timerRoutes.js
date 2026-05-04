import express from "express";

import {
  createTimerLog,
  getDayStats,
  getWeekStats,
  getMonthStats,
  updateTimerLog,
  deleteTimerLog
} from "../controllers/timerController.js";

const router = express.Router();

router.post("/timer/log", createTimerLog);
router.get("/stats/day", getDayStats);
router.get("/stats/week", getWeekStats);
router.get("/stats/month", getMonthStats);
router.patch("/timer/log/:id", updateTimerLog);
router.delete("/timer/log/:id", deleteTimerLog);

export default router;