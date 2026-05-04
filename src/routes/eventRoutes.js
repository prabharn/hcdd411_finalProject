import express from "express";

import {
  getEvents,
  createEvent,
  createEventFromAi,
  getEventById,
  updateEvent,
  deleteEvent
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/events", getEvents);
router.post("/events", createEvent);
router.post("/events/from-ai", createEventFromAi);
router.get("/events/:id", getEventById);
router.patch("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

export default router;