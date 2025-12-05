import { useState, useRef, useEffect } from "react";
import type { Message } from "../types/chat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import {
  sendMessageStream,
  sendMessage,
  getChatWithMessages,
  addMessageToChat,
  type ChatMessage,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface ChatContainerProps {
  chatId?: string | null;
  onChatStart?: (firstMessage: string) => Promise<string | null | undefined>;
}

export const ChatContainer = ({ chatId, onChatStart }: ChatContainerProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    chatId || null
  );
  const hasStartedChat = useRef(false);

  // Load messages when chatId changes
  useEffect(() => {
    const loadMessages = async () => {
      if (chatId) {
        try {
          const chatData = await getChatWithMessages(chatId);
          const loadedMessages: Message[] = chatData.messages.map((msg) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages(loadedMessages);
          setCurrentChatId(chatId);
          hasStartedChat.current = true;
        } catch (error) {
          console.error("Error loading messages:", error);
        }
      } else {
        setMessages([]);
        setCurrentChatId(null);
        hasStartedChat.current = false;
      }
    };

    loadMessages();
  }, [chatId]);

  const handleSendMessage = async (content: string) => {
    if (!user?.drivaUserId) return;

    let activeChatId = currentChatId;

    // Create chat if this is the first message
    if (!hasStartedChat.current) {
      hasStartedChat.current = true;
      if (onChatStart) {
        const newChatId = await onChatStart(content);
        if (newChatId) {
          activeChatId = newChatId;
          setCurrentChatId(newChatId);
        }
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Save user message to backend
    if (activeChatId) {
      try {
        await addMessageToChat(activeChatId, "user", content);
      } catch (error) {
        console.error("Error saving user message:", error);
      }
    }

    const assistantMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(assistantMessageId);

    // Create empty assistant message for streaming
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    // Convert messages to history format (exclude the empty assistant message we just added)
    const history: ChatMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let fullResponse = "";

    try {
      // Try streaming first
      await sendMessageStream(
        content,
        (chunk) => {
          fullResponse += chunk;
          setMessages((prev) => {
            return prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            );
          });
        },
        history,
        (status) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, status } : msg
            )
          );
        },
        user.drivaUserId! // Use drivaUserId as messagingId for authenticated users
      );

      // Save assistant message to backend
      if (activeChatId && fullResponse) {
        try {
          await addMessageToChat(activeChatId, "assistant", fullResponse);
        } catch (error) {
          console.error("Error saving assistant message:", error);
        }
      }
    } catch (streamErr) {
      // Fallback to non-streaming
      try {
        const response = await sendMessage(content, history, user.drivaUserId!);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: response } : msg
          )
        );

        // Save assistant message to backend
        if (activeChatId && response) {
          try {
            await addMessageToChat(activeChatId, "assistant", response);
          } catch (error) {
            console.error("Error saving assistant message:", error);
          }
        }
      } catch (err) {
        setError("Erro ao enviar mensagem. Tente novamente.");
        console.error("Error:", err);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
                }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-transparent overflow-hidden">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 sm:px-4 py-2 sm:py-3 mx-3 sm:mx-4 mt-3 sm:mt-4 rounded-lg backdrop-blur-sm text-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              className="text-red-400 hover:text-red-300 transition-colors"
              onClick={() => setError(null)}
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>
      )}

      <MessageList
        messages={messages}
        isLoading={isLoading}
        streamingMessageId={streamingMessageId}
      />
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};
