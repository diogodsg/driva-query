export type ThinkingStatus =
  | "thinking"
  | "searching"
  | "analyzing"
  | "writing"
  | "executing";

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  status?: ThinkingStatus;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
