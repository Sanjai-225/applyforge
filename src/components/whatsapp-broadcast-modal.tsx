"use client";

import React, { useState } from "react";
import { Modal, Toast } from "./shared";
import { Copy, Check, ExternalLink, Send, MessageSquare } from "lucide-react";
import type { WhatsAppGroup } from "@/lib/types";

interface ShareLink {
  groupName: string;
  shareUrl: string;
  inviteLink: string | null;
}

export function WhatsAppBroadcastModal({
  isOpen,
  onClose,
  message,
  shareLinks,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  shareLinks: ShareLink[];
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Message Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-surface-300">
              <MessageSquare className="h-4 w-4 inline mr-1.5" />
              WhatsApp Message
            </h3>
            <button
              onClick={copyMessage}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                copied
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-primary-500/20 text-primary-300 border border-primary-500/30 hover:bg-primary-500/30"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Message
                </>
              )}
            </button>
          </div>
          <div className="rounded-xl bg-[#0b1412] border border-emerald-900/30 p-4 max-h-64 overflow-y-auto custom-scroll">
            <pre className="text-sm text-emerald-100/80 whitespace-pre-wrap font-sans leading-relaxed">
              {message}
            </pre>
          </div>
        </div>

        {/* Share Links */}
        {shareLinks.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-surface-300 mb-3">
              <Send className="h-4 w-4 inline mr-1.5" />
              Share to WhatsApp Groups
            </h3>
            <div className="space-y-2">
              {shareLinks.map((link, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl bg-surface-800 border border-surface-700 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{link.groupName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={link.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-600/30 transition-all"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Share via WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Direct wa.me link */}
        <div className="rounded-xl bg-surface-800/50 border border-surface-700 p-4">
          <p className="text-xs text-surface-400 mb-2">
            Or share directly via this link (opens WhatsApp with the message pre-filled):
          </p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open in WhatsApp
          </a>
        </div>
      </div>
    </Modal>
  );
}
