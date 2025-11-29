const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://services.driva.io";
const USER_FROM = import.meta.env.VITE_USER_FROM || "5519999406763";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  content: string;
  from: string;
  history?: ChatMessage[];
}

export type ThinkingStatus =
  | "thinking"
  | "searching"
  | "analyzing"
  | "writing"
  | "executing";

// Response can have content, status, or both
export interface ChatResponse {
  content?: string;
  status?: ThinkingStatus;
}

export const sendMessageStream = async (
  message: string,
  onChunk: (chunk: string) => void,
  history: ChatMessage[] = [],
  onStatus?: (status: ThinkingStatus) => void
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sales-copilot/v3/chat/webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
          from: USER_FROM,
          history,
          tools: ["clickhouse"],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine) {
          try {
            let jsonStr = trimmedLine;

            // Handle SSE "data: {...}" format
            if (trimmedLine.startsWith("data:")) {
              jsonStr = trimmedLine.substring(5).trim();
            }
            // Handle "event:" lines - skip them
            else if (
              trimmedLine.startsWith("event:") ||
              trimmedLine.startsWith("id:") ||
              trimmedLine.startsWith("retry:")
            ) {
              continue;
            }

            if (jsonStr.startsWith("{")) {
              const parsed: ChatResponse = JSON.parse(jsonStr);

              // Handle status field (new format)
              if (parsed.status && onStatus) {
                onStatus(parsed.status);
              }

              // Handle content field
              if (parsed.content) {
                onChunk(parsed.content);
              }
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
            console.debug("Parse error for line:", trimmedLine, e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Fallback for non-streaming endpoints
export const sendMessage = async (
  message: string,
  history: ChatMessage[] = []
): Promise<string> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sales-copilot/v3/chat/webhook`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: message,
          from: USER_FROM,
          history,
          tools: ["clickhouse"],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Collect all chunks into a single response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed: ChatResponse = JSON.parse(line);
              if (parsed.content) {
                fullContent += parsed.content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    }

    return fullContent;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};
