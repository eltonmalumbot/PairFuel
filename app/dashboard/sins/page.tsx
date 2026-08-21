import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { formatJakartaDateTime, jakartaLocalToIso } from "@/lib/time";
import { numberInRange, oneOf, requiredText } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MOTIVATIONS = [
  "One slip-up does not erase your progress. Learn the trigger, recommit, and continue.",
  "The goal is not perfection. The goal is to make the next decision better than the last one.",
  "Cravings pass. Your reason for starting is still here.",
  "Do not punish yourself with shame. Use the moment as data, then return to your plan.",
  "You and your partner are on the same team. Be honest, kind, and consistent.",
];

const SLIP_CATEGORIES = [
  "Broke fasting window",
  "Over calorie target",
  "Binge / overeating",
  "Unplanned snack",
  "Sugary drink",
  "Skipped planned meal",
  "Other",
] as const;

async function currentUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  return session.user;
}

async function addSlip(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  const happenedAt = jakartaLocalToIso(String(fd.get("happenedAt") || ""));
  const category = oneOf(fd.get("category"), SLIP_CATEGORIES, "Other");
  const title = requiredText(fd.get("title"), "Title", 180);
  const trigger = String(fd.get("trigger") || "").trim().slice(0, 500);
  const reflection = String(fd.get("reflection") || "").trim().slice(0, 3000);
  const recovery = String(fd.get("recovery") || "").trim().slice(0, 3000);
  const estimatedCaloriesRaw = String(fd.get("estimatedCalories") || "").trim();
  const estimatedCalories = estimatedCaloriesRaw
    ? numberInRange(fd.get("estimatedCalories"), "Estimated calories", 0, 20_000)
    : null;
  const shareWithPartner = fd.get("shareWithPartner") === "on";

  await sql`INSERT INTO pairfuel_slip_logs(user_id,happened_at,category,title,trigger,reflection,recovery_plan,estimated_calories,share_with_partner) VALUES(${user.id},${happenedAt},${category},${title},${trigger || null},${reflection || null},${recovery || null},${estimatedCalories},${shareWithPartner})`;
  revalidatePath("/dashboard/sins");
}

async function resolveSlip(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  const id = String(fd.get("id") || "");
  await sql`UPDATE pairfuel_slip_logs SET resolved_at=COALESCE(resolved_at,now()) WHERE id=${id} AND user_id=${user.id}`;
  revalidatePath("/dashboard/sins");
}

export default async function SinListPage() {
  const user = await currentUser();
  const sql = db();
  const [logs, partnershipRows] = await Promise.all([
    sql`SELECT id,happened_at,category,title,trigger,reflection,recovery_plan,estimated_calories,share_with_partner,resolved_at FROM pairfuel_slip_logs WHERE user_id=${user.id} ORDER BY happened_at DESC LIMIT 100`,
    sql`SELECT CASE WHEN user_a_id=${user.id} THEN user_b_id ELSE user_a_id END partner_id FROM pairfuel_partnerships WHERE user_a_id=${user.id} OR user_b_id=${user.id} LIMIT 1`,
  ]);
  const [partnership] = partnershipRows;
  let partnerLogs: any[] = [];
  if (partnership) {
    partnerLogs = await sql`SELECT id,happened_at,category,title,trigger,reflection,recovery_plan,estimated_calories,resolved_at FROM pairfuel_slip_logs WHERE user_id=${partnership.partner_id} AND share_with_partner=true ORDER BY happened_at DESC LIMIT 30`;
  }

  const motivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];

  return <main className="shell">
    <header className="topbar"><div><strong>PairFuel · Sin List 😈</strong><div className="muted">A diet slip-up log for honesty, reflection, and recovery.</div></div><a className="ghost" href="/dashboard">Back to dashboard</a></header>
    <section className="dashboard">
      <div className="notice" style={{ marginBottom: 16 }}><b>Today&apos;s reminder:</b> {motivation}</div>
      <div className="grid2">
        <form action={addSlip} className="panel">
          <h2>Log a slip-up</h2>
          <p className="muted">Private by default. Share it only if you want your connected partner to see it.</p>
          <label className="field">What happened?<input name="title" placeholder="Broke my fast with snacks" required /></label>
          <div className="form-row">
            <label className="field">Category<select name="category"><option>Broke fasting window</option><option>Over calorie target</option><option>Binge / overeating</option><option>Unplanned snack</option><option>Sugary drink</option><option>Skipped planned meal</option><option>Other</option></select></label>
            <label className="field">When (WIB)<input name="happenedAt" type="datetime-local" required /></label>
          </div>
          <label className="field">Estimated extra calories (optional)<input name="estimatedCalories" type="number" min="0" /></label>
          <label className="field">What triggered it?<input name="trigger" placeholder="Stress, boredom, seeing food, partner invited me..." /></label>
          <label className="field">Reflection<textarea name="reflection" rows={4} placeholder="What do I regret or want to understand from this moment?" /></label>
          <label className="field">Recovery plan<textarea name="recovery" rows={4} placeholder="Example: return to normal meals, drink water, avoid compensating, prepare a snack for tomorrow." /></label>
          <label className="row"><span>Share this entry with my partner</span><input type="checkbox" name="shareWithPartner" /></label>
          <button className="button">Save reflection</button>
        </form>

        <div className="panel">
          <h2>Why this exists</h2>
          <p className="muted">The point is not to collect guilt. It is to notice patterns and make the next choice easier.</p>
          <div className="notice">A difficult meal or broken fast does not require punishment. Resume your normal plan at the next opportunity instead of trying to “make up” for it with extreme restriction.</div>
          <h3 style={{ marginTop: 24 }}>A better reset</h3>
          <div className="list">
            <div className="row"><span>1</span><span>Write the trigger honestly.</span></div>
            <div className="row"><span>2</span><span>Choose one practical change for next time.</span></div>
            <div className="row"><span>3</span><span>Return to the plan without self-punishment.</span></div>
            <div className="row"><span>4</span><span>Support each other instead of blaming.</span></div>
          </div>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="panel"><h2>My Sin List</h2><div className="list">{logs.length ? logs.map((item: any) => <div key={item.id} className="row" style={{ alignItems: "flex-start" }}><div><b>{item.title}</b><div className="muted">{item.category} · {formatJakartaDateTime(item.happened_at)} WIB</div>{item.trigger && <div><b>Trigger:</b> {item.trigger}</div>}{item.reflection && <div><b>Reflection:</b> {item.reflection}</div>}{item.recovery_plan && <div><b>Next time:</b> {item.recovery_plan}</div>}{item.estimated_calories != null && <div className="muted">Estimated extra: {item.estimated_calories} kcal</div>}<div className="muted">{item.share_with_partner ? "Shared with partner" : "Private"}</div></div>{item.resolved_at ? <span className="pill">Recommitted ✓</span> : <form action={resolveSlip}><input type="hidden" name="id" value={item.id} /><button className="ghost">I&apos;m back on track</button></form>}</div>) : <p className="muted">No entries yet. That is a nice empty list to keep.</p>}</div></div>
        <div className="panel"><h2>Partner reflections</h2><p className="muted">Only entries your partner explicitly chose to share appear here.</p><div className="list">{partnerLogs.length ? partnerLogs.map((item: any) => <div key={item.id} className="row" style={{ alignItems: "flex-start" }}><div><b>{item.title}</b><div className="muted">{item.category} · {formatJakartaDateTime(item.happened_at)} WIB</div>{item.trigger && <div><b>Trigger:</b> {item.trigger}</div>}{item.recovery_plan && <div><b>Recovery:</b> {item.recovery_plan}</div>}</div><span>{item.resolved_at ? "✓" : "♡"}</span></div>) : <p className="muted">Nothing shared yet.</p>}</div></div>
      </div>
    </section>
  </main>;
}
