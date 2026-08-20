"use client";

import { FormEvent, useMemo, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Berapa kalori nasi goreng 1 porsi + telur?",
  "2 slice pizza pepperoni kira-kira berapa kalori?",
  "Ayam geprek + nasi + sambal berapa kalori?",
];

export default function AskAiPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Halo 👋 Sebutkan makanan dan porsinya. Aku bantu estimasi kalori + protein, carbs, dan fat untuk dicatat di PairFuel.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const history = useMemo(() => messages.slice(-8), [messages]);

  async function ask(text: string) {
    const clean = text.trim().slice(0, 800);
    if (!clean || busy) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: clean }];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/ai/calories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...history, { role: "user", content: clean }] }),
      });

      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || "AI tidak dapat menjawab saat ini.");

      setMessages((current) => [...current, { role: "assistant", content: data.answer! }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI tidak dapat menjawab saat ini.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await ask(input);
  }

  return <main className="shell">
    <header className="topbar">
      <div>
        <strong>PairFuel · Ask AI 🍽️</strong>
        <div className="muted">Estimasi kalori & makro dari deskripsi makanan.</div>
      </div>
      <a className="ghost" href="/dashboard">Back to dashboard</a>
    </header>

    <section className="dashboard">
      <div className="panel ai-chat-panel">
        <div className="notice" style={{ marginBottom: 16 }}>
          Estimasi AI bisa berbeda dari nilai sebenarnya. Untuk makanan kemasan, label nutrisi tetap menjadi referensi terbaik.
        </div>

        <div className="ai-starters">
          {STARTERS.map((starter) => <button key={starter} type="button" className="tab" onClick={() => ask(starter)} disabled={busy}>{starter}</button>)}
        </div>

        <div className="ai-chat-list" aria-live="polite">
          {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`ai-message ${message.role}`}>
            <div className="ai-message-label">{message.role === "assistant" ? "PairFuel AI" : "You"}</div>
            <div className="ai-message-body">{message.content}</div>
          </div>)}
          {busy && <div className="ai-message assistant"><div className="ai-message-label">PairFuel AI</div><div className="ai-message-body muted">Menghitung estimasi...</div></div>}
        </div>

        {error && <div className="error" style={{ padding: 12, borderRadius: 12, marginTop: 14 }}>{error}</div>}

        <form className="ai-chat-form" onSubmit={submit}>
          <label className="field" style={{ margin: 0 }}>
            <span className="muted">Contoh: “nasi putih 150g, ayam goreng 1 paha, sambal 1 sdm”</span>
            <textarea name="question" rows={3} maxLength={800} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya kalori makanan..." required />
          </label>
          <button className="button" disabled={busy || !input.trim()}>{busy ? "Thinking..." : "Ask AI"}</button>
        </form>
      </div>
    </section>
  </main>;
}
