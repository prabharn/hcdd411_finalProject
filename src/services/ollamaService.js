const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

export async function checkOllamaStatus() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    return response.ok;
  } catch {
    return false;
  }
}

export async function sendMessageToOllama(messages) {
  const conversation = messages
    .map((message) => {
      if (message.role === "user") {
        return `Student: ${message.text}`;
      }

      return `Tutor: ${message.text}`;
    })
    .join("\n");

  const prompt = `
You are BookLight, a private open-source AI study buddy.

Rules:
- Help students understand topics clearly.
- Keep answers useful and concise.
- Do not encourage cheating.
- If the student asks for homework help, explain the process instead of only giving the answer.
- When useful, suggest a task or study schedule.

Conversation:
${conversation}

Tutor:
`;

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error("Ollama request failed");
  }

  const data = await response.json();

  return data.response || "No AI response generated.";
}