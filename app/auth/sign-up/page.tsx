import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

async function signUp(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  await getAuth().signUp.email({ name, email, password });
  redirect("/dashboard");
}

export default function SignUp() {
  return <main className="auth-wrap">
    <form action={signUp} className="auth-card">
      <p className="muted">PairFuel</p>
      <h1>Create account</h1>
      <p className="muted">Start solo. Invite your partner anytime.</p>
      <label className="field">Name<input name="name" required /></label>
      <label className="field">Email<input name="email" type="email" required /></label>
      <label className="field">Password<input name="password" type="password" minLength={8} required /></label>
      <button className="button">Create account</button>
      <p className="muted">Already have one? <Link href="/auth/sign-in">Sign in</Link></p>
    </form>
  </main>;
}
