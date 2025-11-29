import { useState } from "react";
import type { Message } from "../types/chat";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import {
  sendMessageStream,
  sendMessage,
  type ChatMessage,
} from "../services/api";

export const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

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

    try {
      // Try streaming first
      await sendMessageStream(
        content,
        (chunk) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        history,
        (status) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, status } : msg
            )
          );
        }
      );
    } catch (streamErr) {
      // Fallback to non-streaming
      try {
        const response = await sendMessage(content, history);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: response } : msg
          )
        );
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
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
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
