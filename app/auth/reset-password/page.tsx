"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const invalid = params.get("error");
  const [message, setMessage] = useState(invalid ? "This reset link is invalid or expired." : "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setMessage("This reset link is missing its token.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (!response.ok) throw new Error("Could not reset password. The link may have expired.");
      setDone(true);
      setMessage("Password updated. You can sign in with your new password.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-wrap">
    <form className="auth-card" onSubmit={submit}>
      <p className="muted">PairFuel</p>
      <h1>Choose a new password</h1>
      {message && <div className={done ? "notice" : "error"} style={{ padding: 12, borderRadius: 12 }}>{message}</div>}
      {!done && <>
        <label className="field">New password<input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
        <label className="field">Confirm password<input name="confirm" type="password" minLength={8} required autoComplete="new-password" /></label>
        <button className="button" disabled={busy || !token}>{busy ? "Saving..." : "Set new password"}</button>
      </>}
      <p className="muted"><Link href="/auth/sign-in">Back to sign in</Link></p>
    </form>
  </main>;
}
