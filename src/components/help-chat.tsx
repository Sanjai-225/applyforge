"use client";

import React, { useState } from "react";
import type { HelpThread, HelpMessage } from "@/lib/types";
import { post } from "@/lib/client";
import {
  Search,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface HelpChatProps {
  threads: HelpThread[];
  onRefresh: () => void;
}

const CANNED_RESPONSES = [
  "Please clear your browser cookies and try again in an Incognito window.",
  "Your details have been verified in the placement portal.",
  "We are in touch with the company's HR regarding the portal issue.",
  "Please share a screenshot of the error screen so we can investigate.",
  "The application deadline has been extended by 24 hours.",
];

export function HelpChatMasterDetail({ threads, onRefresh }: HelpChatProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    threads.length > 0 ? threads[0].student_id : null
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "OPEN" | "RESOLVED">("ALL");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const selectedThread = threads.find((t) => t.student_id === selectedStudentId);

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.student_name.toLowerCase().includes(search.toLowerCase()) ||
      t.student_email.toLowerCase().includes(search.toLowerCase()) ||
      t.student_dept.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "UNREAD") return t.unread_count > 0;
    if (filter === "OPEN") return !t.is_resolved;
    if (filter === "RESOLVED") return t.is_resolved;
    return true;
  });

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || !selectedStudentId) return;

    setSending(true);
    const res = await post("/api/command", {
      type: "SEND_CHAT_MESSAGE",
      studentId: selectedStudentId,
      message: replyText.trim(),
    });

    if (res.ok) {
      setReplyText("");
      onRefresh();
    }
    setSending(false);
  }

  async function handleToggleResolve(isResolved: boolean) {
    if (!selectedStudentId) return;
    setUpdatingStatus(true);
    const res = await post("/api/command", {
      type: "RESOLVE_HELP_THREAD",
      studentId: selectedStudentId,
      isResolved,
    });
    if (res.ok) {
      onRefresh();
    }
    setUpdatingStatus(false);
  }

  function handleInsertCanned(text: string) {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  }

  return (
    <div className="h-[calc(100vh-120px)] rounded-3xl glass-card border border-white/10 overflow-hidden flex flex-col md:flex-row shadow-2xl">
      {/* ─── Left Sidebar: Student Threads List ─────────── */}
      <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-surface-950/70 backdrop-blur-xl">
        {/* Header & Search */}
        <div className="p-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white">Student Help Desk</h2>
            </div>
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh threads"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or department..."
              className="w-full rounded-xl glass-input pl-9 pr-3 py-2 text-xs text-white"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scroll text-xs">
            {(["ALL", "UNREAD", "OPEN", "RESOLVED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1 font-semibold transition-all shrink-0 ${
                  filter === f
                    ? "bg-primary-500/30 text-primary-200 border border-primary-500/40"
                    : "bg-surface-800/40 text-surface-400 hover:bg-surface-800"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto custom-scroll divide-y divide-white/5">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-surface-500 text-xs">
              No support queries found
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isSelected = t.student_id === selectedStudentId;
              return (
                <div
                  key={t.student_id}
                  onClick={() => setSelectedStudentId(t.student_id)}
                  className={`p-3.5 cursor-pointer transition-all hover:bg-white/5 flex gap-3 items-start ${
                    isSelected
                      ? "bg-primary-600/15 border-l-4 border-primary-500"
                      : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-700 flex items-center justify-center font-bold text-white text-xs shadow">
                      {t.student_name.slice(0, 2).toUpperCase()}
                    </div>
                    {t.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {t.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-white truncate">{t.student_name}</p>
                      <span className="text-[10px] text-surface-500 shrink-0">
                        {new Date(t.latest_timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="rounded-md bg-surface-800/70 border border-white/5 px-1.5 py-0.2 text-[9px] font-medium text-cyan-300">
                        {t.student_dept}
                      </span>
                      {t.is_resolved ? (
                        <span className="text-[10px] text-emerald-400 font-medium">✓ Resolved</span>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-medium">● Open query</span>
                      )}
                    </div>

                    <p className="text-[11px] text-surface-400 truncate mt-1">
                      {t.latest_message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Right Pane: Active Student Conversation ─────── */}
      <div className="flex-1 flex flex-col bg-surface-900/50 backdrop-blur-2xl">
        {selectedThread ? (
          <>
            {/* Active Thread Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3 bg-surface-950/40">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-pink-600 flex items-center justify-center font-bold text-white text-sm shadow">
                  {selectedThread.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{selectedThread.student_name}</h3>
                    <span className="rounded-full bg-primary-500/20 border border-primary-500/30 px-2 py-0.5 text-[10px] font-semibold text-primary-300">
                      {selectedThread.student_dept}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-surface-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-surface-500" />
                      {selectedThread.student_email}
                    </span>
                    {selectedThread.student_phone && (
                      <a
                        href={`https://wa.me/91${selectedThread.student_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        {selectedThread.student_phone} (WhatsApp)
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Action */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleResolve(!selectedThread.is_resolved)}
                  disabled={updatingStatus}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedThread.is_resolved
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {selectedThread.is_resolved ? "Reopen Query" : "Mark as Resolved"}
                </button>
              </div>
            </div>

            {/* Chat Messages Transcript */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5 custom-scroll">
              {selectedThread.messages.map((msg) => {
                const isAdmin = msg.sender_role === "admin";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md text-xs sm:text-sm leading-relaxed ${
                        isAdmin
                          ? "bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-tr-none border border-primary-400/30 shadow-primary-950/40"
                          : "bg-surface-800/80 text-surface-100 rounded-tl-none border border-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                        <span className="font-bold">
                          {isAdmin ? "Placement Cell" : selectedThread.student_name}
                        </span>
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Canned Responses */}
            <div className="px-4 py-2 border-t border-white/5 flex gap-2 overflow-x-auto custom-scroll bg-surface-950/30">
              <span className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" /> Quick Replies:
              </span>
              {CANNED_RESPONSES.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertCanned(res)}
                  className="rounded-lg bg-surface-800/60 border border-white/5 px-2.5 py-1 text-[11px] text-surface-300 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
                >
                  {res.slice(0, 35)}...
                </button>
              ))}
            </div>

            {/* Message Composer */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-white/10 bg-surface-950/60 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type reply to student..."
                className="flex-1 rounded-2xl glass-input px-4 py-3 text-sm text-white placeholder-surface-500"
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="flex items-center justify-center gap-1.5 rounded-2xl btn-vibrant-primary px-5 py-3 text-sm font-bold disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Reply</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-surface-500">
            <MessageSquare className="h-12 w-12 mb-3 text-surface-600" />
            <h4 className="text-sm font-bold text-surface-300">No Conversation Selected</h4>
            <p className="text-xs text-surface-500 mt-1 max-w-xs">
              Select a student thread from the list on the left to review support tickets and chat in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
