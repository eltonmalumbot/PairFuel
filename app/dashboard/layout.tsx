import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <a
      href="/dashboard/sins"
      className="button small"
      style={{ position: "fixed", right: 22, bottom: 22, zIndex: 50, boxShadow: "0 10px 30px #0008" }}
      aria-label="Open diet slip-up log"
    >
      Sin List 😈
    </a>
  </>;
}
