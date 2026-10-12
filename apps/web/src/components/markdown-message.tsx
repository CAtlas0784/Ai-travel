import ReactMarkdown from "react-markdown";

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="markdown text-sm leading-7 text-slate-800 dark:text-slate-100">
      <ReactMarkdown
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            return match ? (
              <pre className="my-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
                <code className={className}>{String(children).replace(/\n$/, "")}</code>
              </pre>
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
