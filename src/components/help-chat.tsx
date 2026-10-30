"use client";

import React, { useState, useEffect, useRef } from "react";
import { post } from "@/lib/client";
import type { HelpThread, HelpMessage } from "@/lib/types";
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Search,
  X,
} from "lucide-react";

/* ─── Admin Help Chat (WhatsApp-style) ──────────────────── */
interface AdminHelpChatProps {
  threads: HelpThread[];
  onRefresh: () => void;
  adminId: string;
}

export function AdminHelpChat({ threads, onRefresh, adminId }: AdminHelpChatProps) {
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filtered = threads.filter(
    (t) =>
      t.student_name.toLowerCase().includes(search.toLowerCase()) ||
      t.student_email.toLowerCase().includes(search.toLowerCase())
  );

  const activeThread = threads.find((t) => t.student_id === selectedThread);

  const threadMessages = activeThread?.messages || messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages, selectedThread]);

  async function handleSelectThread(studentId: string) {
    setSelectedThread(studentId);
    const thread = threads.find((t) => t.student_id === studentId);
    if (thread && thread.unread_count > 0) {
      thread.unread_count = 0;
      await post("/api/command", {
        type: "RESOLVE_HELP_THREAD",
        studentId,
      });
      onRefresh();
    }
  }

  async function handleSend() {
    if (!text.trim() || !selectedThread) return;
    setSending(true);
    const res = await post("/api/command", {
      type: "SEND_CHAT_MESSAGE",
      studentId: selectedThread,
      message: text.trim(),
    });
    if (res.ok) {
      setText("");
      onRefresh();
    }
    setSending(false);
  }

  async function handleResolve() {
    if (!selectedThread) return;
    await post("/api/command", {
      type: "RESOLVE_HELP_THREAD",
      studentId: selectedThread,
    });
    onRefresh();
  }

  return (
    <div className="flex h-[calc(100vh-200px)] rounded-2xl bg-surface-800/30 border border-surface-700 overflow-hidden">
      {/* Thread List (Left Panel) */}
      <div className="w-80 border-r border-surface-700 flex flex-col shrink-0">
        <div className="p-3 border-b border-surface-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-surface-800 border border-surface-600 pl-10 pr-4 py-2 text-sm text-white placeholder-surface-500"
              placeholder="Search students..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-500 p-4">
              <MessageCircle className="h-8 w-8 mb-2" />
              <p className="text-sm text-center">No help requests yet</p>
            </div>
          ) : (
            filtered.map((thread) => (
              <button
                key={thread.student_id}
                onClick={() => handleSelectThread(thread.student_id)}
                className={`w-full text-left px-4 py-3 border-b border-surface-800 transition-colors ${
                  selectedThread === thread.student_id
                    ? "bg-primary-600/10 border-l-2 border-l-primary-500"
                    : "hover:bg-surface-800/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{thread.student_name}</p>
                  {thread.unread_count > 0 && (
                    <span className="rounded-full bg-primary-500 text-white px-1.5 py-0.5 text-[10px] font-bold min-w-[18px] text-center">
                      {thread.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-surface-400 truncate">{thread.student_department} · {thread.student_email}</p>
                <p className="text-xs text-surface-500 truncate mt-0.5">{thread.last_message}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel (Right) */}
      <div className="flex-1 flex flex-col">
        {!selectedThread ? (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-500">
            <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Select a student to view chat</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-700 bg-surface-800/30">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-600/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{activeThread?.student_name}</p>
                  <p className="text-[11px] text-surface-400">{activeThread?.student_department} · {activeThread?.student_email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeThread && !activeThread.is_resolved && (
                  <button
                    onClick={handleResolve}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500/20 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => setSelectedThread(null)}
                  className="text-surface-400 hover:text-white transition-colors lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {(!threadMessages || threadMessages.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-surface-500 py-12">
                  <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">No messages in this thread yet</p>
                </div>
              ) : (
                <>
                  {threadMessages.map((msg) => {
                    const isAdmin = msg.sender_role === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
                            isAdmin
                              ? "bg-primary-600 text-white rounded-br-none"
                              : "bg-surface-800 text-surface-200 border border-surface-700 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] ${
                              isAdmin ? "text-primary-200 justify-end" : "text-surface-400"
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {isAdmin && <span>✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-surface-700 px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Reply to student..."
                  className="flex-1 rounded-xl bg-surface-800 border border-surface-600 px-4 py-2.5 text-sm text-white placeholder-surface-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="rounded-xl bg-primary-600 px-4 py-2.5 text-white hover:bg-primary-500 disabled:opacity-50 transition-all"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

