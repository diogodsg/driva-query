import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://services.driva.io";
const AUTH_URL = "https://services.driva.io";

// Axios instance for auth requests with cookies
const authApi = axios.create({
  baseURL: AUTH_URL,
  withCredentials: true, // Send cookies with requests
});

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
  onStatus?: (status: ThinkingStatus) => void,
  userId?: string
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
          from: userId || "anonymous",
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

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
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

            // Try to parse as JSON first
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
            } else {
              // If not JSON, treat the whole line as content (plain text stream)
              onChunk(trimmedLine);
            }
          } catch (e) {
            // If JSON parse fails, treat as plain text
            onChunk(trimmedLine);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      onChunk(buffer.trim());
    }
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Fallback for non-streaming endpoints
export const sendMessage = async (
  message: string,
  history: ChatMessage[] = [],
  userId?: string
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
          from: userId || "anonymous",
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

// ==================== Authentication APIs ====================

export interface DrivaWorkspace {
  id: string;
  name: string;
}

export interface SignInResponse {
  status: string;
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  workspaceId: string;
  jwt: string;
  photo?: string;
  permissions: string[];
  workspaces?: DrivaWorkspace[];
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  workspaceId: string;
  workspaceName?: string;
  jwt: string;
}

export interface GuestUserResponse {
  id: string;
  messagingId: string;
  name: string;
  email: string | null;
  companyId: string;
  drivaUserId: string | null;
}

/**
 * Authenticate user with Driva Management API (signin)
 * Uses axios with credentials to set session cookie
 */
export const authenticateDriva = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await authApi.post<SignInResponse>(
      "/management/v1/signin",
      { email, password }
    );

    const data = response.data;

    let workspaceId = data.workspaceId;
    let workspaceName = "Driva Workspace";

    if (data.workspaces && data.workspaces.length > 0) {
      // Try to find the workspace matching the top-level ID to get its name
      const foundWorkspace = data.workspaces.find((w) => w.id === data.workspaceId);
      if (foundWorkspace) {
        workspaceName = foundWorkspace.name;
      } else {
        // If not found (or top-level ID is missing/invalid), use the first workspace from the array
        workspaceId = data.workspaces[0].id;
        workspaceName = data.workspaces[0].name;
      }
    }

    // Map signin response to AuthResponse format
    return {
      id: data.id,
      name: `${data.firstname} ${data.lastname}`.trim(),
      email: data.email,
      workspaceId: workspaceId,
      workspaceName: workspaceName,
      jwt: data.jwt,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || "Credenciais inválidas");
    }
    throw error;
  }
};

/**
 * Verify if user is still logged in using session cookie
 */
export const verifyAuth = async (): Promise<AuthResponse | null> => {
  try {
    console.log("Calling current-user API with cookies...");
    const response = await authApi.get<SignInResponse>(
      "/management/v1/current-user"
    );

    console.log("current-user response status:", response.status);
    const data = response.data;
    console.log("current-user data:", data.firstname, data.lastname);

    let workspaceId = data.workspaceId;
    let workspaceName = "Driva Workspace";

    if (data.workspaces && data.workspaces.length > 0) {
      const foundWorkspace = data.workspaces.find((w) => w.id === data.workspaceId);
      if (foundWorkspace) {
        workspaceName = foundWorkspace.name;
      } else {
        workspaceId = data.workspaces[0].id;
        workspaceName = data.workspaces[0].name;
      }
    }

    return {
      id: data.id,
      name: `${data.firstname} ${data.lastname}`.trim(),
      email: data.email,
      workspaceId: workspaceId,
      workspaceName: workspaceName,
      jwt: data.jwt || "",
    };
  } catch (error) {
    console.error("verifyAuth error:", error);
    return null;
  }
};

/**
 * Create a guest user for anonymous access
 */
export const createGuestUser = async (
  name?: string
): Promise<GuestUserResponse> => {
  const response = await fetch(`${API_BASE_URL}/sales-copilot/v3/users/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar usuário visitante");
  }

  return response.json();
};

/**
 * Link a guest user to a Driva account
 */
export const linkUserAccount = async (
  userId: string,
  email: string,
  drivaUserId: string,
  name?: string
): Promise<GuestUserResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/sales-copilot/v3/users/${userId}/link`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, drivaUserId, name }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao vincular conta");
  }

  return response.json();
};

/**
 * Sync/create user from Driva authentication
 * This ensures the user exists in sales-copilot with drivaUserId as messagingId
 */
export const syncDrivaUser = async (
  drivaUserId: string,
  email: string,
  name: string,
  workspaceId: string,
  companyName?: string
): Promise<GuestUserResponse> => {
  const response = await fetch(`${API_BASE_URL}/sales-copilot/v3/users/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ drivaUserId, email, name, workspaceId, companyName }),
  });

  if (!response.ok) {
    throw new Error("Erro ao sincronizar usuário");
  }

  return response.json();
};

// ==================== Chat History API ====================

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  id: string;
  chatId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatWithMessages extends ChatSession {
  messages: ChatMessageData[];
}

/**
 * Create a new chat session
 */
export const createChat = async (
  userId: string,
  title: string
): Promise<ChatSession> => {
  const response = await fetch(`${API_BASE_URL}/sales-copilot/v3/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId, title }),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar chat");
  }

  return response.json();
};

/**
 * Get all chats for a user
 */
export const getChats = async (userId: string): Promise<ChatSession[]> => {
  const response = await fetch(
    `${API_BASE_URL}/sales-copilot/v3/chats?userId=${encodeURIComponent(
      userId
    )}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar chats");
  }

  return response.json();
};

/**
 * Get a chat with its messages
 */
export const getChatWithMessages = async (
  chatId: string
): Promise<ChatWithMessages> => {
  const response = await fetch(
    `${API_BASE_URL}/sales-copilot/v3/chats/${chatId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar chat");
  }

  return response.json();
};

/**
 * Update a chat title
 */
export const updateChat = async (
  chatId: string,
  title: string
): Promise<ChatSession> => {
  const response = await fetch(
    `${API_BASE_URL}/sales-copilot/v3/chats/${chatId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao atualizar chat");
  }

  return response.json();
};

/**
 * Delete a chat
 */
export const deleteChat = async (chatId: string): Promise<void> => {
  const response = await fetch(
    `${API_BASE_URL}/sales-copilot/v3/chats/${chatId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao deletar chat");
  }
};

/**
 * Add a message to a chat
 */
export const addMessageToChat = async (
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessageData> => {
  const response = await fetch(
    `${API_BASE_URL}/sales-copilot/v3/chats/${chatId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, content }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao adicionar mensagem");
  }

  return response.json();
};
