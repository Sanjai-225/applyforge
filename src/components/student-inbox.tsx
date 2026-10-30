"use client";

import React, { useState } from "react";
import { post } from "@/lib/client";
import type { StudentNotification, HelpMessage } from "@/lib/types";
import {
  Bell,
  MessageCircle,
  X,
  Check,
  Send,
  Loader2,
  Inbox,
  Clock,
} from "lucide-react";

/* ─── Notification Inbox Drawer ─────────────────────────── */
export function NotificationDrawer({
  notifications,
  onMarkRead,
  onClose,
}: {
  notifications: StudentNotification[];
  onMarkRead: (id: string) => void;
  onClose: () => void;
}) {
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 border-l border-surface-700 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-400" />
            <h2 className="text-lg font-bold text-white">Notifications</h2>
            {unread > 0 && (
              <span className="rounded-full bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 text-xs font-bold">
                {unread}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-500">
              <Inbox className="h-10 w-10 mb-2" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-800">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-4 transition-colors ${
                    n.is_read ? "opacity-60" : "bg-surface-800/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block h-2 w-2 rounded-full ${n.is_read ? "bg-surface-600" : "bg-primary-400"}`} />
                        <p className="text-sm font-semibold text-white truncate">{n.title}</p>
                      </div>
                      <p className="text-xs text-surface-400 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-surface-500 mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="shrink-0 rounded-lg bg-surface-700 p-1.5 text-surface-400 hover:bg-surface-600 hover:text-white transition-all"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Student Help Chat Drawer ──────────────────────────── */
export function StudentHelpChatDrawer({
  messages,
  onClose,
  onRefresh,
}: {
  messages: HelpMessage[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);
    const res = await post("/api/command", {
      type: "SEND_CHAT_MESSAGE",
      studentId: messages[0]?.student_id || "self",
      message: text.trim(),
    });
    if (res.ok) {
      setText("");
      onRefresh();
    }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 border-l border-surface-700 flex flex-col animate-slideInRight">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Contact Admin</h2>
          </div>
          <button onClick={onClose} className="text-surface-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-500">
              <MessageCircle className="h-10 w-10 mb-2" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Send a message to the placement officer</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender_role === "student" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    m.sender_role === "student"
                      ? "bg-primary-600/30 text-primary-100 rounded-br-md"
                      : "bg-surface-800 text-surface-200 rounded-bl-md"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{m.message}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
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
              placeholder="Type your message..."
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
      </div>
    </div>
  );
}

