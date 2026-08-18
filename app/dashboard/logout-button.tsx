"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
    } finally {
      window.location.assign("/");
    }
  }

  return (
    <button className="ghost dashboard-client-logout" type="button" onClick={logout} disabled={busy}>
      {busy ? "Signing out..." : "Sign out"}
    </button>
  );
}
