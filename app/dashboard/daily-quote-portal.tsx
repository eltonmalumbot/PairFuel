"use client";

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function DailyQuotePortal({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(document.querySelector(".topbar"));
  }, []);

  return target ? createPortal(children, target) : null;
}
