import { Children } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Halaman legal: keterbacaan di atas ekspresi visual.
 * Placeholder [ISI ...] / [CATATAN REVIEW HUKUM ...] di-highlight kuning pucat
 * biar gampang ditemukan saat review — kontennya tidak diubah.
 */

const SPLIT_BRACKET = /(\[[^\]]+\])/g;

function isPlaceholder(segment: string): boolean {
  return (
    segment.startsWith("[") &&
    segment.endsWith("]") &&
    /\[(?:ISI|CATATAN)/i.test(segment)
  );
}

function withHighlights(children: React.ReactNode): React.ReactNode {
  return Children.map(children, (child, i) => {
    if (typeof child !== "string") return child;
    const parts = child.split(SPLIT_BRACKET);
    if (parts.length === 1) return child;
    return parts.map((part, j) =>
      isPlaceholder(part) ? (
        <mark
          key={`${i}-${j}`}
          className="rounded-sm bg-gold/20 px-0.5 text-inherit"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  });
}

function H2({ children }: { children?: React.ReactNode }) {
  return (
    <h2 className="pt-4 text-xl leading-snug font-bold tracking-tight md:text-2xl">
      {withHighlights(children)}
    </h2>
  );
}

function H3({ children }: { children?: React.ReactNode }) {
  return <h3 className="text-lg font-bold">{withHighlights(children)}</h3>;
}

function P({ children }: { children?: React.ReactNode }) {
  return <p>{withHighlights(children)}</p>;
}

function LI({ children }: { children?: React.ReactNode }) {
  return <li>{withHighlights(children)}</li>;
}

export function LegalDoc({ content }: { content: string }) {
  return (
    <div className="space-y-5 text-base leading-loose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-3xl font-bold tracking-wide uppercase md:text-4xl">
              {children}
            </h1>
          ),
          h2: H2,
          h3: H3,
          p: P,
          li: LI,
          strong: ({ children }) => (
            <strong className="font-bold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          hr: () => <hr className="my-8 border-border" />,
          ul: ({ children }) => (
            <ul className="list-disc space-y-2 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-2 pl-5">{children}</ol>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-bu-red underline underline-offset-2"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[560px] border-collapse text-sm leading-relaxed">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-secondary/60 text-left">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold">
              {withHighlights(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-t px-3 py-2 align-top">
              {withHighlights(children)}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
