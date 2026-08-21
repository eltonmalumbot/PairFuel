"use client";

import { useEffect, useState } from "react";

type Theme = "green" | "pink" | "blue";

const themes: Array<{ key: Theme; label: string }> = [
  { key: "green", label: "Green" },
  { key: "pink", label: "Pink" },
  { key: "blue", label: "Blue" },
];

function isTheme(value: string | null | undefined): value is Theme {
  return value === "green" || value === "pink" || value === "blue";
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("green");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (isTheme(current)) {
      setTheme(current);
    }
  }, []);

  function applyTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("pairfuel-theme", nextTheme);
  }

  return (
    <div className="theme-switcher" role="group" aria-label="PairFuel color theme">
      {themes.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`theme-option ${theme === key ? "active" : ""}`}
          aria-pressed={theme === key}
          title={`${label} theme`}
          onClick={() => applyTheme(key)}
        >
          <span className={`theme-swatch ${key}`} aria-hidden="true" />
          <span className="theme-label">{label}</span>
        </button>
      ))}
    </div>
  );
}
