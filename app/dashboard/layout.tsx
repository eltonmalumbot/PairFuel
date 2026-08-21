import type { ReactNode } from "react";
import AiAssistant from "./ai-assistant";
import LogEditor from "./log-editor";
import "./log-editor.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <div className="dashboard-tools">
      <AiAssistant />
      <LogEditor />
      <a
        href="/dashboard/analytics"
        className="ghost dashboard-tool-link"
        aria-label="Open nutrition analytics"
      >
        Analytics 📊
      </a>
      <a
        href="/dashboard/sins"
        className="button small dashboard-tool-link"
        aria-label="Open diet slip-up log"
      >
        Sin List 😈
      </a>
    </div>
  </>;
}
