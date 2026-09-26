"use client";

import React, { useState } from "react";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  collapsible?: boolean;
  maxCollapsedLength?: number;
}

export default function MarkdownRenderer({
  content,
  isStreaming = false,
  collapsible = true,
  maxCollapsedLength = 600,
}: MarkdownRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const shouldCollapse = collapsible && !isStreaming && content.length > maxCollapsedLength;
  const displayContent = shouldCollapse && !isExpanded ? content.slice(0, maxCollapsedLength) + "..." : content;

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Parse lines into blocks
  const parseBlocks = (raw: string) => {
    const lines = raw.split("\n");
    const blocks: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeLines: string[] = [];
    let listItems: string[] = [];
    let isNumberedList = false;

    const flushList = (key: string) => {
      if (listItems.length === 0) return;
      if (isNumberedList) {
        blocks.push(
          <ol key={key} className="list-decimal pl-5 space-y-1 my-2 text-xs text-[#fdfdfd]/90 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInline(item)}</li>
            ))}
          </ol>
        );
      } else {
        blocks.push(
          <ul key={key} className="list-disc pl-5 space-y-1 my-2 text-xs text-[#fdfdfd]/90 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInline(item)}</li>
            ))}
          </ul>
        );
      }
      listItems = [];
    };

    lines.forEach((line, index) => {
      // Code block start/end
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          // End code block
          const codeString = codeLines.join("\n");
          const blockId = `code-block-${index}`;
          blocks.push(
            <div key={blockId} className="my-2.5 rounded-lg border border-white/[0.1] bg-[#121212] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border-b border-white/[0.06] text-[10px] font-mono text-[#9ca3af]">
                <span>{codeLanguage || "code"}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeString, blockId)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  aria-label="Copy code block"
                >
                  {copiedCodeId === blockId ? (
                    <>
                      <Check className="w-3 h-3 text-[#10b981]" />
                      <span className="text-[#10b981]">Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] font-mono text-[#fdfdfd] leading-relaxed">
                <code>{codeString}</code>
              </pre>
            </div>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          // Start code block
          flushList(`list-before-code-${index}`);
          inCodeBlock = true;
          codeLanguage = line.trim().replace(/^```/, "").trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      // Check lists
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        if (listItems.length > 0 && isNumberedList) {
          flushList(`flush-num-${index}`);
        }
        isNumberedList = false;
        listItems.push(bulletMatch[2]);
        return;
      }

      const numMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (numMatch) {
        if (listItems.length > 0 && !isNumberedList) {
          flushList(`flush-bullet-${index}`);
        }
        isNumberedList = true;
        listItems.push(numMatch[2]);
        return;
      }

      // Regular line: flush any pending lists
      flushList(`list-${index}`);

      if (line.trim().length === 0) {
        return;
      }

      // Headers
      if (line.startsWith("### ")) {
        blocks.push(
          <h4 key={`h4-${index}`} className="text-xs font-semibold text-[#fdfdfd] mt-2 mb-1">
            {renderInline(line.replace("### ", ""))}
          </h4>
        );
      } else if (line.startsWith("## ")) {
        blocks.push(
          <h3 key={`h3-${index}`} className="text-sm font-bold text-[#fdfdfd] mt-2.5 mb-1">
            {renderInline(line.replace("## ", ""))}
          </h3>
        );
      } else if (line.startsWith("# ")) {
        blocks.push(
          <h2 key={`h2-${index}`} className="text-base font-bold text-[#fdfdfd] mt-3 mb-1">
            {renderInline(line.replace("# ", ""))}
          </h2>
        );
      } else {
        blocks.push(
          <p key={`p-${index}`} className="text-xs text-[#fdfdfd]/90 leading-relaxed my-1">
            {renderInline(line)}
          </p>
        );
      }
    });

    flushList("final-list");
    return blocks;
  };

  /**
   * Parse inline formatting: bold, italic, inline code, links
   */
  const renderInline = (text: string): React.ReactNode => {
    // Regex for inline code: `code`
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

    return parts.map((part, i) => {
      if (!part) return null;

      // Inline code
      if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-white/[0.08] text-[11px] font-mono text-[#ff4d6d]">
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold
      if (part.startsWith("**") && part.endsWith("**") && part.length > 3) {
        return (
          <strong key={i} className="font-semibold text-[#fdfdfd]">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return (
          <em key={i} className="italic text-[#fdfdfd]/90">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Link: [text](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-primary,#ff1e42)] hover:underline inline-flex items-center gap-0.5 font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }

      return part;
    });
  };

  return (
    <div className="space-y-1 text-xs">
      {parseBlocks(displayContent)}

      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-[11px] text-[var(--color-primary,#ff1e42)] hover:underline flex items-center gap-1 font-medium min-h-[32px]"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? "Tampilkan lebih sedikit" : "Lihat selengkapnya"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
