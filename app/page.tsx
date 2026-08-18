import Link from "next/link";

export default function Home() {
  return <main className="landing">
    <nav className="nav">
      <strong>PairFuel</strong>
      <div><Link href="/auth/sign-in">Sign in</Link><Link className="button small" href="/auth/sign-up">Start free</Link></div>
    </nav>
    <section className="hero">
      <div className="pill">Built for two. Works solo.</div>
      <h1>Eat better.<br/><span>Together.</span></h1>
      <p>Track calories, macros, fasting, water and weight. Connect a partner when you want accountability without giving up privacy.</p>
      <div className="hero-actions">
        <Link className="button" href="/auth/sign-up">Create your account</Link>
        <a className="ghost" href="#features">Explore features</a>
      </div>
    </section>
    <section id="features" className="feature-grid">
      {[
        ["Calories", "All-time food, calorie and macro history."],
        ["Fasting", "Flexible IF schedules and fasting history."],
        ["Together", "Invite one partner and see shared progress."],
        ["Private by design", "Choose which metrics your partner can see."],
        ["Weight", "Backdated weight logs and trend history."],
        ["Water", "Simple daily hydration tracking."],
      ].map(([title, description]) => <article className="card" key={title}><h3>{title}</h3><p>{description}</p></article>)}
    </section>
  </main>;
}
