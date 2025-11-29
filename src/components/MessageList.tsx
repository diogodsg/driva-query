import { useEffect, useRef } from "react";
import type { Message } from "../types/chat";
import { MessageBubble } from "./MessageBubble";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-4">
            <h1 className="text-2xl sm:text-4xl font-normal mb-2">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Olá, como posso ajudar?
              </span>
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
