export async function requestAiGateway(payload: unknown): Promise<Response | null> {
  const apiKey = Deno.env.get("AI_GATEWAY_API_KEY");
  const url = Deno.env.get("AI_GATEWAY_URL");

  if (!apiKey || !url) {
    return null;
  }

  return fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function parseToolArguments<T>(responsePayload: any): T | null {
  const toolCall = responsePayload?.choices?.[0]?.message?.tool_calls?.[0];
  const rawArguments = toolCall?.function?.arguments;

  if (typeof rawArguments !== "string") {
    return null;
  }

  try {
    return JSON.parse(rawArguments) as T;
  } catch {
    return null;
  }
}

export function getAssistantMessageContent(responsePayload: any): string | null {
  const content = responsePayload?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}
