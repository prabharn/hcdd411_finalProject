import ChatSession from "../models/ChatSession.js";
import {
  checkGeminiStatus,
  sendMessageToGemini
} from "../services/geminiService.js";

function makeTitle(message) {
  return message.trim().slice(0, 45) || "New Study Session";
}

export async function getStatus(req, res) {
  const online = await checkGeminiStatus();

  res.json({
    status: online ? "online" : "offline"
  });
}

export async function startChat(req, res) {
  try {
    const { sessionId, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    let session = null;

    if (sessionId) {
      session = await ChatSession.findById(sessionId);
    }

    if (!session) {
      session = await ChatSession.create({
        title: makeTitle(message),
        messages: []
      });
    }

    session.messages.push({
      role: "user",
      text: message.trim()
    });

    const reply = await sendMessageToGemini(session.messages);

    session.messages.push({
      role: "ai",
      text: reply
    });

    await session.save();

    res.json({
      sessionId: session._id,
      reply
    });
  } catch (error) {
    res.status(500).json({
      error: "Gemini chat failed. Check your API key and internet connection."
    });
  }
}

export async function continueChat(req, res) {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message || !message.trim()) {
      return res.status(400).json({
        error: "sessionId and message are required"
      });
    }

    const session = await ChatSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found"
      });
    }

    session.messages.push({
      role: "user",
      text: message.trim()
    });

    const reply = await sendMessageToGemini(session.messages);

    session.messages.push({
      role: "ai",
      text: reply
    });

    await session.save();

    res.json({
      reply
    });
  } catch (error) {
    res.status(500).json({
      error: "Gemini chat failed"
    });
  }
}

export async function getSessions(req, res) {
  const sessions = await ChatSession.find({}, "_id title updatedAt").sort({
    updatedAt: -1
  });

  res.json(sessions);
}

export async function getSessionById(req, res) {
  const session = await ChatSession.findById(req.params.id);

  if (!session) {
    return res.status(404).json({
      error: "Session not found"
    });
  }

  res.json(session);
}

export async function updateSession(req, res) {
  const session = await ChatSession.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title || "Untitled Session"
    },
    {
      new: true
    }
  );

  if (!session) {
    return res.status(404).json({
      error: "Session not found"
    });
  }

  res.json(session);
}

export async function deleteSession(req, res) {
  const session = await ChatSession.findByIdAndDelete(req.params.id);

  if (!session) {
    return res.status(404).json({
      error: "Session not found"
    });
  }

  res.json({
    message: "Session deleted"
  });
}

export async function deleteMessage(req, res) {
  const session = await ChatSession.findOne({
    "messages._id": req.params.id
  });

  if (!session) {
    return res.status(404).json({
      error: "Message not found"
    });
  }

  session.messages.pull({
    _id: req.params.id
  });

  await session.save();

  res.json({
    message: "Message deleted"
  });
}