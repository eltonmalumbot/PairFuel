"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

type ChatState = {
  connected: boolean;
  partnerName?: string;
  currentUserId?: string;
  messages: ChatMessage[];
};

export default function PartnerChat() {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<ChatState>({ connected: false, messages: [] });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/partner-chat", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load chat.");
      const data = await response.json();
      setChat(data);
      setError("");
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Could not load chat.");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    void load();
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [open, chat.messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/partner-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send message.");
      setDraft("");
      setChat((current) => ({ ...current, messages: [...current.messages, data.message] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button type="button" className="ghost dashboard-tool-button" onClick={() => setOpen(true)}>
        Partner Chat 💬
      </button>

      {open && (
        <div className="partner-chat-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="partner-chat-modal" role="dialog" aria-modal="true" aria-label="Partner chat" onMouseDown={(event) => event.stopPropagation()}>
            <header className="partner-chat-head">
              <div>
                <strong>Partner Chat 💬</strong>
                <div className="muted">{chat.connected ? `Chat with ${chat.partnerName || "Partner"}` : "Private chat for connected partners"}</div>
              </div>
              <button type="button" className="ghost" onClick={() => setOpen(false)} aria-label="Close partner chat">✕</button>
            </header>

            <div className="partner-chat-list" ref={listRef}>
              {loading && <div className="partner-chat-empty">Loading chat…</div>}
              {!loading && !chat.connected && <div className="partner-chat-empty">Connect your partner first in Together ❤️</div>}
              {!loading && chat.connected && chat.messages.length === 0 && (
                <div className="partner-chat-empty">No messages yet. Say hi 👋</div>
              )}
              {chat.messages.map((message) => {
                const mine = message.sender_user_id === chat.currentUserId;
                return (
                  <div key={message.id} className={`partner-chat-row ${mine ? "mine" : "theirs"}`}>
                    <div className="partner-chat-bubble">
                      <div>{message.body}</div>
                      <time>{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(new Date(message.created_at))}</time>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <div className="partner-chat-error">{error}</div>}

            <form className="partner-chat-compose" onSubmit={send}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 1500))}
                placeholder={chat.connected ? `Message ${chat.partnerName || "your partner"}…` : "Connect a partner first"}
                disabled={!chat.connected || sending}
                rows={2}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button className="button small" type="submit" disabled={!chat.connected || sending || !draft.trim()}>
                {sending ? "Sending…" : "Send 💕"}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
