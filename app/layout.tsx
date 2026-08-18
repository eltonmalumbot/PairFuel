import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PairFuel — Better together",
  description: "Diet, fasting and calorie tracking for you and your partner.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site-frame">
          <div className="site-content">{children}</div>
          <footer className="production-credit">© 2026 Elton Malumbot Production</footer>
        </div>
      </body>
    </html>
  );
}
