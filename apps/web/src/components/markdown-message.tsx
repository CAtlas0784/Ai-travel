import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown text-sm leading-7 text-slate-800 dark:text-slate-100">
      <ReactMarkdown
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            return match ? (
              <SyntaxHighlighter PreTag="div" language={match[1]} style={oneLight} customStyle={{ borderRadius: 10, fontSize: 12 }}>
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code>{children}</code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
