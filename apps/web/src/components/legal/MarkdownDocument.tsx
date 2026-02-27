import type { ReactNode } from "react";

interface MarkdownDocumentProps {
  markdown: string;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)|`([^`]+)`|\*\*([^*]+)\*\*)/g;

  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const [full, , linkText, linkUrl, inlineCode, strongText] = match;

    if (linkText && linkUrl) {
      const isExternal = /^https?:\/\//i.test(linkUrl);
      nodes.push(
        <a
          key={`${linkUrl}-${match.index}`}
          href={linkUrl}
          className="text-foreground underline underline-offset-2"
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noreferrer noopener" : undefined}
        >
          {linkText}
        </a>
      );
    } else if (inlineCode) {
      nodes.push(
        <code
          key={`code-${match.index}`}
          className="rounded bg-bg-secondary px-1 py-0.5 font-mono text-[0.85em]"
        >
          {inlineCode}
        </code>
      );
    } else if (strongText) {
      nodes.push(
        <strong key={`strong-${match.index}`} className="font-bold text-foreground">
          {strongText}
        </strong>
      );
    } else {
      nodes.push(full);
    }

    cursor = match.index + full.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}

type MarkdownBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "hr" };

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = markdown.split(/\r?\n/);

  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }

    blocks.push({ type: listType, items: [...listItems] });
    listType = null;
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    if (line === "---") {
      flushList();
      blocks.push({ type: "hr" });
      continue;
    }

    const ulMatch = line.match(/^- (.+)$/);
    if (ulMatch) {
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listItems.push(ulMatch[1].trim());
      continue;
    }

    const olMatch = line.match(/^\d+\. (.+)$/);
    if (olMatch) {
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listItems.push(olMatch[1].trim());
      continue;
    }

    flushList();

    if (line.startsWith("### ")) {
      blocks.push({ type: "h3", text: line.slice(4).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      continue;
    }

    blocks.push({ type: "p", text: line });
  }

  flushList();
  return blocks;
}

export function MarkdownDocument({ markdown }: MarkdownDocumentProps) {
  const blocks = parseMarkdownBlocks(markdown);

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return (
              <h1 key={idx} className="font-mono text-2xl font-bold text-foreground">
                {renderInlineMarkdown(block.text)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={idx} className="pt-2 font-mono text-lg font-bold text-foreground">
                {renderInlineMarkdown(block.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={idx} className="font-mono text-sm font-bold uppercase text-foreground">
                {renderInlineMarkdown(block.text)}
              </h3>
            );
          case "ul":
            return (
              <ul key={idx} className="list-disc space-y-1 pl-5 text-sm text-foreground">
                {block.items.map((item, itemIdx) => (
                  <li key={`${idx}-${itemIdx}`}>{renderInlineMarkdown(item)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="list-decimal space-y-1 pl-5 text-sm text-foreground">
                {block.items.map((item, itemIdx) => (
                  <li key={`${idx}-${itemIdx}`}>{renderInlineMarkdown(item)}</li>
                ))}
              </ol>
            );
          case "hr":
            return <hr key={idx} className="border-border" />;
          case "p":
            return (
              <p key={idx} className="text-sm leading-6 text-foreground">
                {renderInlineMarkdown(block.text)}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
