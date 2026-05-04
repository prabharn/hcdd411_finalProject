import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const chatSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: "New Study Session"
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;