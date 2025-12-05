import { useEffect, useRef } from "react";
import type { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";
import { useAuth } from "../contexts/AuthContext";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId?: string | null;
}

export const MessageList = ({
  messages,
  isLoading,
  streamingMessageId,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const getUserFirstName = () => {
    if (!user?.name) return "Visitante";
    return user.name.split(" ")[0];
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full px-4">
          {/* Greeting */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-normal text-white">
              Olá, {getUserFirstName()}
            </h1>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isThinking={message.id === streamingMessageId && !message.content}
              status={message.status}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
