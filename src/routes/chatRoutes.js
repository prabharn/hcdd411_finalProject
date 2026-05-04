import express from "express";

import {
  getStatus,
  startChat,
  continueChat,
  getSessions,
  getSessionById,
  updateSession,
  deleteSession,
  deleteMessage
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/status", getStatus);
router.post("/chat", startChat);
router.post("/chat/continue", continueChat);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSessionById);
router.patch("/sessions/:id", updateSession);
router.delete("/sessions/:id", deleteSession);
router.delete("/chat/message/:id", deleteMessage);

export default router;