import type { ReactNode } from "react";
import DashboardTools from "./dashboard-tools";
import "./log-editor.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <DashboardTools />
  </>;
}
