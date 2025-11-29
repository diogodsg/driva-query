import { useState, type FormEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export const ChatInput = ({ onSendMessage, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="pb-6 pt-2">
      <div className="max-w-3xl mx-auto px-4">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-gray-500">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Peça ao Driva Query"
              disabled={isLoading}
              className="w-full pl-12 pr-24 py-4 bg-[#1e1e1e] border border-[#333] rounded-full text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#555] transition-colors"
            />
            <div className="absolute right-4 flex items-center gap-2">
              {isLoading ? (
                <div className="p-2">
                  <svg
                    className="animate-spin text-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 text-gray-400 hover:text-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="text-center text-xs text-gray-600 mt-3">
          O Driva Query pode cometer erros. Por isso, é bom checar as respostas.
        </p>
      </div>
    </div>
  );
};
