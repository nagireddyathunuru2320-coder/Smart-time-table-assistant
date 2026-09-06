export interface AssistantMessage {
  id: number;
  conversation_id: number;
  role: string;
  content: string;
  validation_status: string | null;
  created_at: string;
}

export interface SendMessageResult {
  conversation_id: number;
  user_message: AssistantMessage;
  assistant_message: AssistantMessage;
}

async function parseOrThrow(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
      : data.detail ?? "Request failed";
    throw new Error(message);
  }
  return data;
}

export async function sendAssistantMessage(
  content: string,
  conversationId: number | null,
): Promise<SendMessageResult> {
  const response = await fetch("/api/assistant/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, conversation_id: conversationId }),
  });
  return parseOrThrow(response);
}
