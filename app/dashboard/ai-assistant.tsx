"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Estimate = {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Message = {
  id?: string;
  role: "user" | "assistant";
  content: string;
  estimate?: Estimate | null;
};

const GREETING: Message = {
  role: "assistant",
  content: "Halo 👋 Sebutkan makanan dan porsinya. Aku bantu estimasi kalori + protein, carbs, dan fat untuk langsung dicatat di PairFuel.",
};

const STARTERS = [
  "Berapa kalori nasi goreng 1 porsi + telur?",
  "2 slice pizza pepperoni kira-kira berapa kalori?",
  "Ayam geprek + nasi + sambal berapa kalori?",
];

function setInputValue(name: string, value: string | number) {
  const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
  if (!input) return false;
  input.value = String(value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function fillFoodForm(estimate: Estimate) {
  const food = document.querySelector<HTMLInputElement>('input[name="food"]');
  if (!food) return false;

  setInputValue("food", estimate.food);
  setInputValue("calories", Math.round(estimate.calories));
  setInputValue("protein", estimate.protein);
  setInputValue("carbs", estimate.carbs);
  setInputValue("fat", estimate.fat);

  food.closest("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => food.focus(), 350);
  return true;
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const apiHistory = useMemo(
    () => messages.filter((message) => message !== GREETING).slice(-8).map(({ role, content }) => ({ role, content })),
    [messages],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("ai") === "1") setOpen(true);

    const pending = sessionStorage.getItem("pairfuel-ai-estimate");
    if (pending) {
      try {
        const estimate = JSON.parse(pending) as Estimate;
        if (fillFoodForm(estimate)) {
          sessionStorage.removeItem("pairfuel-ai-estimate");
          setToast("AI estimate inserted into Food Log. Review the values before saving.");
        }
      } catch {
        sessionStorage.removeItem("pairfuel-ai-estimate");
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || historyLoaded || loadingHistory) return;
    setLoadingHistory(true);
    fetch("/api/ai/history", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load AI chat history.");
        return response.json() as Promise<{ messages?: Message[] }>;
      })
      .then((data) => {
        const saved = Array.isArray(data.messages) ? data.messages : [];
        setMessages(saved.length ? saved : [GREETING]);
        setHistoryLoaded(true);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load AI chat history."))
      .finally(() => setLoadingHistory(false));
  }, [open, historyLoaded, loadingHistory]);

  useEffect(() => {
    if (!open) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, busy]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function closeModal() {
    setOpen(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has("ai")) {
      url.searchParams.delete("ai");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  async function ask(text: string) {
    const clean = text.trim().slice(0, 800);
    if (!clean || busy) return;

    const context = apiHistory;
    setMessages((current) => [...current, { role: "user", content: clean }]);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const response = await fetch("/api/ai/calories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...context, { role: "user", content: clean }] }),
      });

      const data = await response.json() as { answer?: string; estimate?: Estimate | null; error?: string };
      if (!response.ok || !data.answer) throw new Error(data.error || "AI tidak dapat menjawab saat ini.");

      setMessages((current) => [...current, { role: "assistant", content: data.answer!, estimate: data.estimate }]);
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

  async function clearHistory() {
    if (busy) return;
    setError("");
    try {
      const response = await fetch("/api/ai/history", { method: "DELETE" });
      if (!response.ok) throw new Error("Could not clear AI chat history.");
      setMessages([GREETING]);
      setHistoryLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear AI chat history.");
    }
  }

  function useEstimate(estimate: Estimate) {
    if (fillFoodForm(estimate)) {
      setToast("AI estimate inserted into Food Log. Review the values before saving.");
      closeModal();
      return;
    }

    sessionStorage.setItem("pairfuel-ai-estimate", JSON.stringify(estimate));
    window.location.assign("/dashboard?tab=today&message=AI%20estimate%20ready%20in%20Food%20Log.");
  }

  return <>
    <button type="button" className="ghost dashboard-tool-button" onClick={() => setOpen(true)} aria-label="Ask AI about food calories">
      Ask AI 🍽️
    </button>

    {toast && <div className="ai-toast" role="status">{toast}</div>}

    {open && <div className="ai-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeModal();
    }}>
      <section className="ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
        <header className="ai-modal-head">
          <div>
            <div className="muted">PairFuel calorie assistant</div>
            <h2 id="ai-modal-title">Ask AI 🍽️</h2>
          </div>
          <div className="ai-modal-head-actions">
            <button type="button" className="ghost ai-clear-button" onClick={clearHistory} disabled={busy || loadingHistory}>Clear history</button>
            <button type="button" className="ghost ai-close-button" onClick={closeModal} aria-label="Close Ask AI">✕</button>
          </div>
        </header>

        <div className="notice ai-disclaimer">
          Estimasi AI bisa berbeda dari nilai sebenarnya. Untuk makanan kemasan, label nutrisi tetap menjadi referensi terbaik.
        </div>

        {!loadingHistory && messages.length <= 1 && <div className="ai-starters">
          {STARTERS.map((starter) => <button key={starter} type="button" className="tab" onClick={() => ask(starter)} disabled={busy}>{starter}</button>)}
        </div>}

        <div className="ai-chat-list ai-modal-chat" aria-live="polite">
          {loadingHistory && <div className="ai-message assistant"><div className="ai-message-label">PairFuel AI</div><div className="ai-message-body muted">Loading chat history...</div></div>}
          {!loadingHistory && messages.map((message, index) => <div key={message.id || `${message.role}-${index}`} className={`ai-message ${message.role}`}>
            <div className="ai-message-label">{message.role === "assistant" ? "PairFuel AI" : "You"}</div>
            <div className="ai-message-body">{message.content}</div>
            {message.role === "assistant" && message.estimate && <button type="button" className="button small ai-use-estimate" onClick={() => useEstimate(message.estimate!)}>
              Use in Food Log
            </button>}
          </div>)}
          {busy && <div className="ai-message assistant"><div className="ai-message-label">PairFuel AI</div><div className="ai-message-body muted">Menghitung estimasi...</div></div>}
          <div ref={chatEndRef} />
        </div>

        {error && <div className="error ai-error">{error}</div>}

        <form className="ai-chat-form ai-modal-form" onSubmit={submit}>
          <label className="field ai-question-field">
            <span className="muted">Contoh: “nasi putih 150g, ayam goreng 1 paha, sambal 1 sdm”</span>
            <textarea rows={2} maxLength={800} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tanya kalori makanan..." required autoFocus />
          </label>
          <button className="button" disabled={busy || !input.trim()}>{busy ? "Thinking..." : "Ask AI"}</button>
        </form>
      </section>
    </div>}
  </>;
}
