"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/auth/reset-password` }),
      });
      if (!response.ok) throw new Error("Could not start password reset. Please try again.");
      setMessage("If that email exists, a password-reset message has been sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start password reset.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-wrap">
    <form className="auth-card" onSubmit={submit}>
      <p className="muted">PairFuel</p>
      <h1>Reset password</h1>
      <p className="muted">Enter your account email and we&apos;ll send a secure reset link.</p>
      {message && <div className="notice">{message}</div>}
      <label className="field">Email<input name="email" type="email" required autoComplete="email" /></label>
      <button className="button" disabled={busy}>{busy ? "Sending..." : "Send reset link"}</button>
      <p className="muted"><Link href="/auth/sign-in">Back to sign in</Link></p>
    </form>
  </main>;
}
