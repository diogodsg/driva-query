import type { Message, ThinkingStatus } from "../types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ThinkingIndicator } from "./ThinkingIndicator";

interface MessageBubbleProps {
  message: Message;
  isThinking?: boolean;
  status?: ThinkingStatus;
}

export const MessageBubble = ({
  message,
  isThinking = false,
  status = "thinking",
}: MessageBubbleProps) => {
  const isUser = message.role === "user";
  const showThinking = isThinking && !message.content;

  return (
    <div
      className={`flex gap-2 sm:gap-3 mb-4 sm:mb-6 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="sm:w-[14px] sm:h-[14px]"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
      )}

      <div className={`max-w-[90%] sm:max-w-[85%] ${isUser ? "order-1" : ""}`}>
        {isUser ? (
          <div className="bg-[#2a2a2a] rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 text-gray-100 text-sm sm:text-base">
            {message.content}
          </div>
        ) : (
          <div className="markdown-content text-gray-200 leading-relaxed text-sm sm:text-base">
            {showThinking ? (
              <ThinkingIndicator status={status} />
            ) : (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline =
                        !match && !String(children).includes("\n");

                      return !isInline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-lg my-4 text-sm"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-pink-400"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre({ children }) {
                      return <>{children}</>;
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          className="text-blue-400 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-3 last:mb-0">{children}</p>;
                    },
                    ul({ children }) {
                      return (
                        <ul className="list-disc list-inside mb-3 space-y-1">
                          {children}
                        </ul>
                      );
                    },
                    ol({ children }) {
                      return (
                        <ol className="list-decimal list-inside mb-3 space-y-1">
                          {children}
                        </ol>
                      );
                    },
                    li({ children }) {
                      return <li className="text-gray-200">{children}</li>;
                    },
                    h1({ children }) {
                      return (
                        <h1 className="text-xl font-bold mb-3 mt-4 text-gray-100">
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-lg font-bold mb-2 mt-4 text-gray-100">
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-base font-semibold mb-2 mt-3 text-gray-100">
                          {children}
                        </h3>
                      );
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-gray-600 pl-4 my-3 text-gray-400 italic">
                          {children}
                        </blockquote>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-gray-700">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="border border-gray-700 bg-gray-800 px-4 py-2 text-left font-semibold">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="border border-gray-700 px-4 py-2">
                          {children}
                        </td>
                      );
                    },
                    strong({ children }) {
                      return (
                        <strong className="font-bold text-gray-100">
                          {children}
                        </strong>
                      );
                    },
                    em({ children }) {
                      return (
                        <em className="italic text-gray-300">{children}</em>
                      );
                    },
                    hr() {
                      return <hr className="border-gray-700 my-4" />;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
