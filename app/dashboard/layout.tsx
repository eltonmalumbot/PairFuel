import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <div style={{ position: "fixed", right: 22, bottom: 22, zIndex: 50, display: "grid", gap: 10 }}>
      <a
        href="/dashboard/ask-ai"
        className="ghost"
        style={{ boxShadow: "0 10px 30px #0008", background: "#0d1d15" }}
        aria-label="Ask AI about food calories"
      >
        Ask AI 🍽️
      </a>
      <a
        href="/dashboard/analytics"
        className="ghost"
        style={{ boxShadow: "0 10px 30px #0008", background: "#0d1d15" }}
        aria-label="Open nutrition analytics"
      >
        Analytics 📊
      </a>
      <a
        href="/dashboard/sins"
        className="button small"
        style={{ boxShadow: "0 10px 30px #0008" }}
        aria-label="Open diet slip-up log"
      >
        Sin List 😈
      </a>
    </div>
  </>;
}
