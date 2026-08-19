import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type Search = Promise<{ error?: string }>;

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const result = await auth.signIn.email({ email, password });
  if (result?.error) {
    const message = result.error.message || "Sign in failed";
    redirect(`/auth/sign-in?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}

export default async function SignIn({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;

  return <main className="auth-wrap">
    <form action={signIn} className="auth-card">
      <p className="muted">PairFuel</p>
      <h1>Welcome back</h1>
      {params.error && <div className="error" style={{ padding: 12, borderRadius: 12, marginBottom: 12 }}>{params.error}</div>}
      <label className="field">Email<input name="email" type="email" autoComplete="email" required /></label>
      <label className="field">Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <div style={{ display: "flex", justifyContent: "flex-end", margin: "-4px 0 16px" }}><Link className="muted" href="/auth/forgot-password">Forgot password?</Link></div>
      <button className="button">Sign in</button>
      <p className="muted">New here? <Link href="/auth/sign-up">Create account</Link></p>
    </form>
  </main>;
}
