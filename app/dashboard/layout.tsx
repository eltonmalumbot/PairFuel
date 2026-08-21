import type { ReactNode } from "react";
import DashboardTools from "./dashboard-tools";
import "./log-editor.css";
import "./dashboard-tools.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>
    {children}
    <DashboardTools />
  </>;
}
