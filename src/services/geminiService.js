import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

if (!apiKey) {
  console.warn("Missing GEMINI_API_KEY in .env");
}

const genAI = new GoogleGenerativeAI(apiKey || "missing-key");

export async function checkGeminiStatus() {
  if (!apiKey) {
    return false;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName
    });

    const result = await model.generateContent("Reply with only: online");
    const text = result.response.text();

    return text.toLowerCase().includes("online");
  } catch {
    return false;
  }
}

export async function sendMessageToGemini(messages) {
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `
You are BookLight, a private study assistant inside a student productivity dashboard.

Your job:
- Help students understand academic topics.
- Explain steps clearly.
- Keep responses practical and concise.
- When useful, suggest tasks or study blocks.
- Do not encourage cheating.
- If asked to do homework directly, explain the process and help the student learn.
`
  });

  const conversationText = messages
    .map((message) => {
      if (message.role === "user") {
        return `Student: ${message.text}`;
      }

      return `BookLight: ${message.text}`;
    })
    .join("\n");

  const prompt = `
Conversation so far:

${conversationText}

Respond as BookLight:
`;

  const result = await model.generateContent(prompt);

  return result.response.text() || "No Gemini response generated.";
}