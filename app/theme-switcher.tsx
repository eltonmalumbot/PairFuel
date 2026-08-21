"use client";

import { useEffect, useState } from "react";

type Theme = "green" | "pink" | "blue" | "midnight";

const themes: Array<{ key: Theme; label: string; emoji: string }> = [
  { key: "green", label: "Forest", emoji: "🌿" },
  { key: "pink", label: "Blossom", emoji: "🌸" },
  { key: "blue", label: "Sky", emoji: "☁️" },
  { key: "midnight", label: "Midnight", emoji: "🌙" },
];

function isTheme(value: string | null | undefined): value is Theme {
  return value === "green" || value === "pink" || value === "blue" || value === "midnight";
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("green");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (isTheme(current)) setTheme(current);
  }, []);

  function applyTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("pairfuel-theme", nextTheme);
    window.dispatchEvent(new CustomEvent("pairfuel-theme-change", { detail: nextTheme }));
  }

  return (
    <div className="theme-switcher" role="group" aria-label="PairFuel visual theme">
      {themes.map(({ key, label, emoji }) => (
        <button
          key={key}
          type="button"
          className={`theme-option ${theme === key ? "active" : ""}`}
          aria-pressed={theme === key}
          title={`${label} theme`}
          onClick={() => applyTheme(key)}
        >
          <span className="theme-emoji" aria-hidden="true">{emoji}</span>
          <span className="theme-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
