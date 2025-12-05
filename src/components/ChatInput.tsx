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
    <div className="pb-4 sm:pb-6 pt-2 flex-shrink-0 safe-area-bottom bg-[#131314]">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Insira um comando para o Mind"
              disabled={isLoading}
              className="w-full px-4 py-3 sm:py-4 pr-12 bg-[#1e1e1e] border border-[#333] rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#555] transition-colors text-base"
            />
            <div className="absolute right-3">
              {isLoading ? (
                <svg
                  className="animate-spin text-gray-400 w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-1 text-gray-400 hover:text-gray-200 disabled:text-gray-600 disabled:cursor-not-allowed transition-all"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </form>
        <p className="text-center text-[10px] sm:text-xs text-gray-600 mt-3 px-2">
          O Mind pode cometer erros. Por isso, é bom checar as respostas.
        </p>
      </div>
    </div>
  );
};
