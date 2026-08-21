"use client";

import { useEffect, useMemo, useState } from "react";
import { EXTRA_MEME_QUOTES } from "./extra-meme-quotes";

const WHOLESOME_QUOTES = [
  "Small steps still move you forward. Keep going. 🌱💚",
  "Feed your body with care, not fear. 🥗🫶",
  "One imperfect meal cannot erase weeks of consistency. 🌿✨",
  "Your next good choice matters more than your last messy one. 🌱➡️",
  "Build habits that make tomorrow easier. 🧱💚",
  "You are allowed to enjoy food while working toward your goals. 🍝🫶",
  "Movement is a celebration of what your body can do. 🚶💛",
  "Healthy progress can be quiet and still be real. 🌙✨",
  "Slow progress is still yours. Keep it. 🐢💚",
  "Celebrate better energy, sleep, and habits too. ⚡😴🌱",
  "You can change your habits without being cruel to yourself. 🫶🌿",
  "Today does not need to be perfect to be meaningful. ☀️💛",
  "Healthy choices become easier when they come from care. 🌱❤️",
  "Take your time. Sustainable change is allowed to be gentle. 🌸⏳",
  "Make room for nourishment, movement, rest, and joy. 🍎🚶😴🎉",
  "Your goals deserve consistency, and you deserve kindness. 🎯🤍",
  "Keep showing up in small, repeatable ways. 🌱🔁",
  "A healthier life is many kind choices, not one giant decision. 💚✨",
  "Take care of yourselves so you have more energy for life together. ☀️❤️",
  "Better health is nice. Building it together is even better. 💕🌿",
] as const;

const SAVAGE_QUOTES = [
  "‘We’ll start tomorrow’ has had enough seasons. Cancel the show. 📺✋",
  "The water bottle is full. You two are the bottleneck. 💧💀",
  "If there is time to doomscroll, there is time for a ten-minute walk. 📱🚶",
  "Motivation is on annual leave. Use routine. 🏖️😂",
  "Buying healthy groceries is not the workout. Nice try. 🛒🏋️",
  "That ‘tiny snack’ has had three sequels. We saw the franchise. 🍪🎬",
  "The plan is not ghosting you. You are ghosting the plan. 👻📋",
  "You cannot call it hydration if the bottle is still decorative. 🧴👀",
  "One bad day is normal. Turning it into a bad month is a creative choice. 📆😬",
  "The scale does not need a daily press conference. Please disperse. ⚖️🎤😂",
] as const;

const QUOTES = [...EXTRA_MEME_QUOTES, ...WHOLESOME_QUOTES, ...SAVAGE_QUOTES] as const;

function jakartaSlotKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = Number(get("hour"));
  const slot = Math.floor(hour / 6);
  return `${get("year")}-${get("month")}-${get("day")}-${slot}`;
}

function indexForKey(key: string) {
  let hash = 2166136261;
  for (const char of key) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % QUOTES.length;
}

export default function RotatingQuote() {
  const [slotKey, setSlotKey] = useState(() => jakartaSlotKey());

  useEffect(() => {
    const update = () => setSlotKey(jakartaSlotKey());
    const timer = window.setInterval(update, 60_000);
    update();
    return () => window.clearInterval(timer);
  }, []);

  const quote = useMemo(() => QUOTES[indexForKey(slotKey)], [slotKey]);

  return (
    <div className="daily-quote" aria-label="Six-hour healthy lifestyle quote">
      <span className="daily-quote-mark" aria-hidden="true">“</span>
      <span className="daily-quote-text"><strong>Elton &amp; Jessica 💕 — </strong>{quote}</span>
    </div>
  );
}
