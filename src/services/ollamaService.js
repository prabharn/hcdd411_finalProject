const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export async function checkOllamaStatus(modelOverride) {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      return {
        online: false,
        message: "Ollama server not responding"
      };
    }

    const data = await response.json();
    const modelName = modelOverride || DEFAULT_MODEL;
    const models = data.models || [];

    const modelExists = models.some((item) => {
      return item.name === modelName || item.name.startsWith(modelName + ":");
    });

    if (!modelExists) {
      return {
        online: false,
        message: `Ollama is running, but model "${modelName}" is not installed`
      };
    }

    return {
      online: true,
      message: "online"
    };
  } catch {
    return {
      online: false,
      message: "Ollama is not running"
    };
  }
}

export async function sendMessageToOllama(messages, modelOverride) {
  const model = modelOverride || DEFAULT_MODEL;

  const conversationText = messages
    .map((message) => {
      return `${message.role === "user" ? "Student" : "BookLight"}: ${message.text}`;
    })
    .join("\n");

  const prompt = `
You are BookLight, a study assistant inside a student productivity dashboard.

Rules:
- Help students understand academic topics.
- Explain steps clearly.
- Keep responses short enough for a dashboard UI.
- Suggest tasks or calendar study blocks when useful.
- Do not encourage cheating.
- If asked to do homework directly, explain the process instead of only giving the answer.

Conversation:
${conversationText}

Respond as BookLight:
`;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed: ${errorText}`);
  }

  const data = await response.json();

  return data.response || "No Ollama response generated.";
}