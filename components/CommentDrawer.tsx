"use client";

import React, { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "@/components/MotionProvider";
import { X, Send, MessageSquare, User, Clock } from "lucide-react";
import { ContextComment } from "@/lib/types";
import { usePreferences } from "@/lib/preferences";

interface CommentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string | null;
  entityTitle: string;
  comments: ContextComment[];
  onAddComment: (entityId: string, author: string, message: string) => void;
}

const AUTHOR_STORAGE_KEY = "closebook_comment_author";

export default function CommentDrawer({
  isOpen,
  onClose,
  entityId,
  entityTitle,
  comments,
  onAddComment,
}: CommentDrawerProps) {
  const { t } = usePreferences();
  const [inputText, setInputText] = useState("");
  const [authorName, setAuthorName] = useState("Current User");
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved author name from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTHOR_STORAGE_KEY);
      if (saved && saved.trim()) {
        setAuthorName(saved.trim());
      }
    } catch {}
  }, []);

  // Filter comments for this target entity
  const targetComments = comments.filter((c) => c.entityId === entityId);

  // Scroll to bottom when new comment arrives or drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isOpen, targetComments.length]);

  const handleSaveAuthor = (name: string) => {
    const trimmed = name.trim() || "Current User";
    setAuthorName(trimmed);
    try {
      localStorage.setItem(AUTHOR_STORAGE_KEY, trimmed);
    } catch {}
    setIsEditingAuthor(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !entityId) return;

    onAddComment(entityId, authorName, inputText.trim());
    setInputText("");
  };

  return (
    <AnimatePresence>
      {isOpen && entityId && (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid="comment-drawer-backdrop">
          {/* Backdrop with fade motion */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <m.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative z-10 w-full sm:max-w-md h-full bg-[var(--surface-panel,#121212)] border-l border-white/[0.08] shadow-2xl flex flex-col justify-between"
            data-testid="comment-drawer"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-black/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-badge-bg,rgba(255,30,66,0.12))] flex items-center justify-center text-[var(--color-primary,#ff1e42)] shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-primary,#ff1e42)]">
                      {t("commentThreadTitle")}
                    </span>
                    <span className="text-[10px] font-mono text-[#737373] bg-white/[0.05] px-1.5 py-0.5 rounded">
                      {entityId}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#fdfdfd] truncate mt-0.5" title={entityTitle}>
                    {entityTitle}
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#737373] hover:text-[#fdfdfd] hover:bg-white/[0.05] rounded-full transition-colors ml-2 shrink-0"
                aria-label="Close thread drawer"
                data-testid="close-comment-drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Author Name Bar */}
            <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#a3a3a3]">
                <User className="w-3.5 h-3.5 text-[#737373]" />
                <span>{t("postingAs")}:</span>
                {isEditingAuthor ? (
                  <input
                    type="text"
                    defaultValue={authorName}
                    autoFocus
                    onBlur={(e) => handleSaveAuthor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveAuthor(e.currentTarget.value);
                      if (e.key === "Escape") setIsEditingAuthor(false);
                    }}
                    className="bg-black/40 border border-white/[0.15] rounded px-2 py-0.5 text-xs text-[#fdfdfd] focus:outline-none focus:border-[var(--color-primary,#ff1e42)]"
                  />
                ) : (
                  <span
                    onClick={() => setIsEditingAuthor(true)}
                    className="font-medium text-[#fdfdfd] cursor-pointer hover:underline decoration-dotted"
                    title="Click to edit name"
                  >
                    {authorName}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#737373]" data-testid="drawer-comment-count">
                {targetComments.length} {t("commentsCount")}
              </span>
            </div>

            {/* Message Thread Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5" data-testid="comment-thread-list">
              {targetComments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#737373]">
                  <MessageSquare className="w-8 h-8 stroke-1 mb-2 opacity-40 text-[#737373]" />
                  <p className="text-xs">{t("noCommentsYet")}</p>
                </div>
              ) : (
                targetComments.map((comm) => (
                  <div
                    key={comm.id}
                    className="surface-overlay p-3.5 rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-[#fdfdfd] truncate">
                          {comm.author}
                        </span>
                        {comm.authorRole && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-[#a3a3a3]">
                            {comm.authorRole}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-[#737373] shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{comm.timestamp}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#d4d4d4] leading-relaxed whitespace-pre-wrap">
                      {comm.message}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Composer */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.08] bg-black/40">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t("addCommentPlaceholder")}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-[#161616] border border-white/[0.1] rounded-lg px-4 min-h-[44px] text-xs text-[#fdfdfd] placeholder:text-[#666666] focus:outline-none focus:border-[var(--color-primary,#ff1e42)] transition-colors"
                  data-testid="comment-drawer-input"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="btn-primary-crimson min-h-[44px] px-4 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  aria-label={t("sendComment")}
                  data-testid="comment-drawer-send"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium hidden sm:inline">{t("sendComment")}</span>
                </button>
              </div>
            </form>
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
