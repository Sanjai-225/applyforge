"use client";

import React, { useState } from "react";
import type { StudentNotification, HelpMessage } from "@/lib/types";
import { Drawer } from "./shared";
import { post } from "@/lib/client";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
} from "lucide-react";

/* ─── Notification Inbox Drawer ────────────────────────── */
export function NotificationInboxDrawer({
  isOpen,
  onClose,
  notifications,
  onNotificationRead,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: StudentNotification[];
  onNotificationRead: () => void;
}) {
  const [marking, setMarking] = useState<string | null>(null);

  async function handleMarkRead(id: string) {
    setMarking(id);
    const res = await post("/api/command", {
      type: "MARK_NOTIFICATION_READ",
      notificationId: id,
    });
    if (res.ok) {
      onNotificationRead();
    }
    setMarking(null);
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Reminders & Announcements" size="md">
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-surface-500">
            <Bell className="h-10 w-10 mx-auto mb-2 text-surface-600" />
            <p className="text-sm font-semibold text-surface-400">All caught up!</p>
            <p className="text-xs text-surface-500 mt-0.5">
              No new placement alerts or reminders at this time.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isUnread = !notif.is_read;
            return (
              <div
                key={notif.id}
                className={`rounded-2xl p-4 transition-all border ${
                  isUnread
                    ? "bg-gradient-to-r from-primary-950/40 via-surface-900/60 to-surface-900/40 border-primary-500/40 shadow-lg shadow-primary-950/40"
                    : "bg-surface-900/30 border-white/5 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === "JOB_ALERT"
                          ? "bg-sky-500/20 text-sky-400"
                          : notif.type === "SUPPORT"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {notif.type === "JOB_ALERT" ? (
                        <Sparkles className="h-4 w-4" />
                      ) : notif.type === "SUPPORT" ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{notif.title}</h4>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-surface-300 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-surface-500 mt-2 block">
                        {new Date(notif.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {isUnread && (
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      disabled={marking === notif.id}
                      className="rounded-xl bg-white/5 hover:bg-white/10 p-2 text-surface-400 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      {marking === notif.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
}

/* ─── Student Help Chat Drawer ─────────────────────────── */
export function StudentHelpChatDrawer({
  isOpen,
  onClose,
  messages,
  onMessageSent,
}: {
  isOpen: boolean;
  onClose: () => void;
  messages: HelpMessage[];
  onMessageSent: () => void;
}) {
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const QUICK_PROMPTS = [
    "Portal OTP is not being received",
    "Company application link expired",
    "Need confirmation on eligibility",
  ];

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    const res = await post("/api/command", {
      type: "SEND_CHAT_MESSAGE",
      message: inputText.trim(),
    });

    if (res.ok) {
      setInputText("");
      onMessageSent();
    }
    setSending(false);
  }

  function handleQuickPrompt(text: string) {
    setInputText(text);
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Contact Placement Officer" size="md">
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Support Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/40 via-surface-900/60 to-surface-900/40 border border-emerald-500/30 p-3.5 mb-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <p className="font-bold text-white">Direct Placement Cell Helpdesk</p>
            <p className="text-surface-400">
              Facing portal errors, OTP issues, or broken links? Message the officers directly.
            </p>
          </div>
        </div>

        {/* Message Transcript */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scroll">
          {messages.length === 0 ? (
            <div className="py-12 text-center text-surface-500 text-xs">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-surface-600" />
              <p>No messages yet. Send a query below if you are facing any troubles!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isOfficer = m.sender_role === "admin";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isOfficer ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow ${
                      isOfficer
                        ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tl-none border border-emerald-400/30 shadow-emerald-950/40"
                        : "bg-surface-800 text-surface-100 rounded-tr-none border border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                      <span className="font-bold">
                        {isOfficer ? "Placement Officer" : "You"}
                      </span>
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Prompt Chips */}
        <div className="py-2 flex gap-1.5 overflow-x-auto custom-scroll">
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(p)}
              className="rounded-lg bg-surface-800/80 border border-white/10 px-2.5 py-1 text-[11px] text-surface-300 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="pt-2 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to the placement officer..."
            className="flex-1 rounded-2xl glass-input px-4 py-3 text-xs sm:text-sm text-white placeholder-surface-500"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="flex items-center justify-center gap-1 rounded-2xl btn-vibrant-emerald px-4 py-3 text-xs sm:text-sm font-bold disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </Drawer>
  );
}
