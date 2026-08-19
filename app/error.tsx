"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("PairFuel route error", error);
  }, [error]);

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <p className="muted">PairFuel</p>
        <h1>Something went wrong</h1>
        <p className="muted">Your data is still safe. Try loading this page again.</p>
        {error.digest && <p className="muted">Error reference: {error.digest}</p>}
        <div className="hero-actions" style={{ justifyContent: "flex-start" }}>
          <button className="button" type="button" onClick={() => reset()}>Try again</button>
          <a className="ghost" href="/dashboard">Dashboard</a>
        </div>
      </div>
    </main>
  );
}
