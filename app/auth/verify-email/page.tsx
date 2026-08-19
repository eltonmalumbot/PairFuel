"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [message, setMessage] = useState("Check your email for the 6-digit verification code.");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const otp = String(form.get("otp") || "").trim();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/email-otp/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (!response.ok) throw new Error("Verification code is invalid or expired.");
      setVerified(true);
      setMessage("Email verified. You can now sign in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not verify email.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/email-otp/send-verification-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, type: "email-verification" }),
      });
      if (!response.ok) throw new Error("Could not resend verification code.");
      setMessage("A new verification code was sent.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not resend verification code.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-wrap">
    <form className="auth-card" onSubmit={verify}>
      <p className="muted">PairFuel</p>
      <h1>Verify your email</h1>
      <p className="muted">{email || "Email address missing."}</p>
      {message && <div className={verified ? "notice" : "muted"}>{message}</div>}
      {!verified && <>
        <label className="field">Verification code<input name="otp" inputMode="numeric" maxLength={8} required /></label>
        <button className="button" disabled={busy || !email}>{busy ? "Checking..." : "Verify email"}</button>
        <button className="ghost" type="button" onClick={resend} disabled={busy || !email} style={{ marginLeft: 10 }}>Resend code</button>
      </>}
      <p className="muted"><Link href="/auth/sign-in">Back to sign in</Link></p>
    </form>
  </main>;
}
