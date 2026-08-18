import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type Search = Promise<{ error?: string }>;

async function signUp(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const result = await auth.signUp.email({ name, email, password });
  if (result?.error) {
    const message = result.error.message || "Sign up failed";
    redirect(`/auth/sign-up?error=${encodeURIComponent(message)}`);
  }

  redirect("/dashboard");
}

export default async function SignUp({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;

  return <main className="auth-wrap">
    <form action={signUp} className="auth-card">
      <p className="muted">PairFuel</p>
      <h1>Create account</h1>
      <p className="muted">Start solo. Invite your partner anytime.</p>
      {params.error && <div className="error" style={{ padding: 12, borderRadius: 12, marginBottom: 12 }}>{params.error}</div>}
      <label className="field">Name<input name="name" required /></label>
      <label className="field">Email<input name="email" type="email" required /></label>
      <label className="field">Password<input name="password" type="password" minLength={8} required /></label>
      <button className="button">Create account</button>
      <p className="muted">Already have one? <Link href="/auth/sign-in">Sign in</Link></p>
    </form>
  </main>;
}
