import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const defaultModelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
  console.warn("Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey || "missing-key");

export async function checkGeminiStatus(modelOverride) {
  if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    return {
      online: false,
      message: "Missing Gemini API key"
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelOverride || defaultModelName
    });

    const result = await model.generateContent("Reply with only the word online.");

    const text = result.response.text().toLowerCase();

    return {
      online: text.includes("online"),
      message: text.includes("online") ? "online" : "unexpected Gemini response"
    };
  } catch (error) {
    return {
      online: false,
      message: error.message || "Gemini request failed"
    };
  }
}

export async function sendMessageToGemini(messages, modelOverride) {
  if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("Missing Gemini API key");
  }

  const model = genAI.getGenerativeModel({
    model: modelOverride || defaultModelName,
    systemInstruction: `
You are BookLight, a study assistant inside a student productivity dashboard.

Rules:
- Help students understand academic topics.
- Explain steps clearly.
- Keep responses short enough for a dashboard UI.
- Suggest tasks or calendar study blocks when useful.
- Do not encourage cheating.
- If asked to do homework directly, explain the process instead of only giving the answer.
`
  });

  const conversationText = messages
    .map((message) => {
      return `${message.role === "user" ? "Student" : "BookLight"}: ${message.text}`;
    })
    .join("\n");

  const prompt = `
Conversation:
${conversationText}

Respond as BookLight:
`;

  const result = await model.generateContent(prompt);

  return result.response.text() || "No Gemini response generated.";
}