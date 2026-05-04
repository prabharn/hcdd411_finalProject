import CalendarEvent from "../models/CalendarEvent.js";

function parseAiEventText(text) {
  const timeMatch = text.match(/\b(1[0-2]|0?[1-9])(:[0-5][0-9])?\s?(am|pm)\b/i);

  let time = "";
  let title = text.trim();

  if (timeMatch) {
    time = timeMatch[0].toUpperCase();
    title = text.replace(timeMatch[0], "").replace(/\bat\b/i, "").trim();
  }

  if (!title) {
    title = "Study Session";
  }

  const today = new Date().toISOString().slice(0, 10);

  return {
    title,
    date: today,
    time,
    source: "ai"
  };
}

export async function getEvents(req, res) {
  const month = req.query.month;
  const query = {};

  if (month) {
    query.date = {
      $regex: `^${month}`
    };
  }

  const events = await CalendarEvent.find(query).sort({
    date: 1,
    time: 1
  });

  res.json(events);
}

export async function createEvent(req, res) {
  const { title, date, time } = req.body;

  if (!title || !date) {
    return res.status(400).json({
      error: "Event title and date are required"
    });
  }

  const event = await CalendarEvent.create({
    title,
    date,
    time: time || "",
    source: "manual"
  });

  res.json(event);
}

export async function createEventFromAi(req, res) {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({
      error: "Text is required"
    });
  }

  const parsedEvent = parseAiEventText(text);
  const event = await CalendarEvent.create(parsedEvent);

  res.json(event);
}

export async function getEventById(req, res) {
  const event = await CalendarEvent.findById(req.params.id);

  if (!event) {
    return res.status(404).json({
      error: "Event not found"
    });
  }

  res.json(event);
}

export async function updateEvent(req, res) {
  const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, {
    new: true
  });

  if (!event) {
    return res.status(404).json({
      error: "Event not found"
    });
  }

  res.json(event);
}

export async function deleteEvent(req, res) {
  const event = await CalendarEvent.findByIdAndDelete(req.params.id);

  if (!event) {
    return res.status(404).json({
      error: "Event not found"
    });
  }

  res.json({
    message: "Event deleted"
  });
}