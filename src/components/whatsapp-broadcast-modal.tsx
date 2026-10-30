"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "./shared";
import { Copy, Check, ExternalLink, Send, MessageSquare } from "lucide-react";

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
  const [editedMessage, setEditedMessage] = useState(message);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEditedMessage(message);
  }, [message]);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(editedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = editedMessage;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const encodedMessage = encodeURIComponent(editedMessage);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-surface-300">
              <MessageSquare className="h-4 w-4 inline mr-1.5" />
              WhatsApp Message <span className="text-xs font-normal text-emerald-400/80">(Editable)</span>
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
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={8}
            className="w-full rounded-xl bg-[#0b1412] border border-emerald-900/40 p-4 text-sm text-emerald-100/90 font-sans leading-relaxed resize-y focus:outline-none focus:border-emerald-500/50 placeholder-emerald-800"
            placeholder="Edit your WhatsApp message here..."
          />
          <p className="text-[11px] text-surface-500 mt-1">
            ✏️ You can edit the text above. Copying and sharing will include your changes.
          </p>
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
                      href={`https://api.whatsapp.com/send?text=${encodedMessage}`}
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
            href={`https://wa.me/?text=${encodedMessage}`}
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
