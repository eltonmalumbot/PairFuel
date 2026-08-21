import type { ReactNode } from "react";
import DashboardTools from "./dashboard-tools";
import SmoothDashboardNavigation from "./smooth-navigation";
import RotatingQuote from "./rotating-quote";
import DailyQuotePortal from "./daily-quote-portal";
import "./log-editor.css";
import "./dashboard-tools.css";
import "./daily-quote.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>
    <SmoothDashboardNavigation />
    {children}
    <DailyQuotePortal><RotatingQuote /></DailyQuotePortal>
    <DashboardTools />
  </>;
}
