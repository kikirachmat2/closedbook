"use client";

import React from "react";

export interface HighlightTextProps {
  text: string;
  query?: string;
  className?: string;
}

export default function HighlightText({
  text,
  query = "",
  className = "",
}: HighlightTextProps) {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${cleanQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            data-testid="search-highlight"
            className="bg-[var(--color-primary,#ff1e42)]/25 text-[var(--color-paper,#fdfdfd)] px-0.5 rounded font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}
