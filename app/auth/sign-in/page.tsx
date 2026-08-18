import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  await getAuth().signIn.email({ email, password });
  redirect("/dashboard");
}

export default function SignIn() {
  return <main className="auth-wrap">
    <form action={signIn} className="auth-card">
      <p className="muted">PairFuel</p>
      <h1>Welcome back</h1>
      <label className="field">Email<input name="email" type="email" required /></label>
      <label className="field">Password<input name="password" type="password" required /></label>
      <button className="button">Sign in</button>
      <p className="muted">New here? <Link href="/auth/sign-up">Create account</Link></p>
    </form>
  </main>;
}
