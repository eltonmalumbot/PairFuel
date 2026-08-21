import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./theme.css";
import ThemeSwitcher from "./theme-switcher";

export const metadata: Metadata = {
  title: "PairFuel — Better together",
  description: "Diet, fasting and calorie tracking for you and your partner.",
};

const themeBootstrap = `
  try {
    var savedTheme = localStorage.getItem("pairfuel-theme");
    var theme = savedTheme === "pink" || savedTheme === "blue" || savedTheme === "green" ? savedTheme : "green";
    document.documentElement.dataset.theme = theme;
  } catch (_) {
    document.documentElement.dataset.theme = "green";
  }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="green" suppressHydrationWarning>
      <body>
        <Script id="pairfuel-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
        <ThemeSwitcher />
        <div className="site-frame">
          <div className="site-content">{children}</div>
          <footer className="production-credit">© 2026 Elton Malumbot Production</footer>
        </div>
      </body>
    </html>
  );
}
