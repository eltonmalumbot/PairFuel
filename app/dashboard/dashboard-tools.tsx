"use client";

import { useEffect, useState } from "react";
import AiAssistant from "./ai-assistant";
import LogEditor from "./log-editor";
import PartnerChat from "./partner-chat";
import "./partner-chat.css";

const STORAGE_KEY = "pairfuel-dashboard-tools-minimized";

export default function DashboardTools() {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    try {
      setMinimized(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Keep tools expanded when storage is unavailable.
    }
  }, []);

  function toggle() {
    setMinimized((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // The UI still works even when storage is unavailable.
      }
      return next;
    });
  }

  return (
    <div className={`dashboard-tools ${minimized ? "minimized" : ""}`}>
      <button
        type="button"
        className="dashboard-tools-toggle"
        onClick={toggle}
        aria-expanded={!minimized}
        aria-label={minimized ? "Show dashboard tools" : "Minimize dashboard tools"}
        title={minimized ? "Show tools" : "Minimize tools"}
      >
        <span aria-hidden="true">{minimized ? "+" : "−"}</span>
      </button>

      {!minimized && (
        <div className="dashboard-tools-menu">
          <PartnerChat />
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
      )}
    </div>
  );
}
