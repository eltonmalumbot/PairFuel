import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import StoryShare from "./story-share";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

type Search = Promise<{ tab?: string; message?: string }>;

async function currentUser() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  return session.user;
}

async function ensureUser(user: { id: string; name?: string | null }) {
  const sql = db();
  await sql`INSERT INTO pairfuel_profiles(user_id,display_name) VALUES(${user.id},${user.name || "Friend"}) ON CONFLICT(user_id) DO NOTHING`;
  await sql`INSERT INTO pairfuel_partner_privacy(user_id) VALUES(${user.id}) ON CONFLICT(user_id) DO NOTHING`;
}

async function addFood(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  await ensureUser(user);
  const loggedAt = String(fd.get("loggedAt") || new Date().toISOString());
  await sql`INSERT INTO pairfuel_food_logs(user_id,logged_at,meal,food_name,calories,protein,carbs,fat) VALUES(${user.id},${loggedAt},${String(fd.get("meal") || "Meal")},${String(fd.get("food") || "Food")},${Number(fd.get("calories") || 0)},${Number(fd.get("protein") || 0)},${Number(fd.get("carbs") || 0)},${Number(fd.get("fat") || 0)}`;
  revalidatePath("/dashboard");
}

async function addWeight(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  await ensureUser(user);
  await sql`INSERT INTO pairfuel_weight_logs(user_id,logged_on,weight) VALUES(${user.id},${String(fd.get("date"))},${Number(fd.get("weight"))}) ON CONFLICT(user_id,logged_on) DO UPDATE SET weight=EXCLUDED.weight`;
  revalidatePath("/dashboard");
}

async function addWater(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  await ensureUser(user);
  const amount = Number(fd.get("amount") || 250);
  await sql`INSERT INTO pairfuel_water_logs(user_id,logged_on,amount_ml) VALUES(${user.id},CURRENT_DATE,${amount}) ON CONFLICT(user_id,logged_on) DO UPDATE SET amount_ml=pairfuel_water_logs.amount_ml+EXCLUDED.amount_ml,updated_at=now()`;
  revalidatePath("/dashboard");
}

async function startFast(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  await ensureUser(user);
  const target = Number(fd.get("target") || 16);
  await sql`UPDATE pairfuel_fasting_sessions SET ended_at=now() WHERE user_id=${user.id} AND ended_at IS NULL`;
  await sql`INSERT INTO pairfuel_fasting_sessions(user_id,started_at,target_hours) VALUES(${user.id},now(),${target})`;
  revalidatePath("/dashboard");
}

async function endFast() {
  "use server";
  const user = await currentUser();
  const sql = db();
  await sql`UPDATE pairfuel_fasting_sessions SET ended_at=now() WHERE user_id=${user.id} AND ended_at IS NULL`;
  revalidatePath("/dashboard");
}

async function createInvite() {
  "use server";
  const user = await currentUser();
  const sql = db();
  await ensureUser(user);
  const existing = await sql`SELECT 1 FROM pairfuel_partnerships WHERE user_a_id=${user.id} OR user_b_id=${user.id} LIMIT 1`;
  if (existing.length) return;
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  await sql`DELETE FROM pairfuel_partner_invites WHERE inviter_user_id=${user.id} AND accepted_at IS NULL`;
  await sql`INSERT INTO pairfuel_partner_invites(inviter_user_id,code,expires_at) VALUES(${user.id},${code},now()+interval '7 days')`;
  revalidatePath("/dashboard");
}

async function acceptInvite(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  await ensureUser(user);
  const code = String(fd.get("code") || "").trim().toUpperCase();
  const invites = await sql`SELECT id,inviter_user_id FROM pairfuel_partner_invites WHERE code=${code} AND accepted_at IS NULL AND expires_at>now() LIMIT 1`;
  if (!invites.length || invites[0].inviter_user_id === user.id) return;
  const mine = await sql`SELECT 1 FROM pairfuel_partnerships WHERE user_a_id=${user.id} OR user_b_id=${user.id} LIMIT 1`;
  const theirs = await sql`SELECT 1 FROM pairfuel_partnerships WHERE user_a_id=${invites[0].inviter_user_id} OR user_b_id=${invites[0].inviter_user_id} LIMIT 1`;
  if (mine.length || theirs.length) return;
  await sql`INSERT INTO pairfuel_partnerships(user_a_id,user_b_id) VALUES(${invites[0].inviter_user_id},${user.id})`;
  await sql`UPDATE pairfuel_partner_invites SET accepted_at=now() WHERE id=${invites[0].id}`;
  revalidatePath("/dashboard");
}

async function updatePrivacy(fd: FormData) {
  "use server";
  const user = await currentUser();
  const sql = db();
  const on = (key: string) => fd.get(key) === "on";
  await sql`INSERT INTO pairfuel_partner_privacy(user_id,share_calories,share_macros,share_meals,share_fasting,share_water,share_weight,share_weight_change) VALUES(${user.id},${on("calories")},${on("macros")},${on("meals")},${on("fasting")},${on("water")},${on("weight")},${on("weightChange")}) ON CONFLICT(user_id) DO UPDATE SET share_calories=EXCLUDED.share_calories,share_macros=EXCLUDED.share_macros,share_meals=EXCLUDED.share_meals,share_fasting=EXCLUDED.share_fasting,share_water=EXCLUDED.share_water,share_weight=EXCLUDED.share_weight,share_weight_change=EXCLUDED.share_weight_change,updated_at=now()`;
  revalidatePath("/dashboard");
}

export default async function Dashboard({ searchParams }: { searchParams: Search }) {
  const user = await currentUser();
  await ensureUser(user);
  const sql = db();
  const params = await searchParams;
  const tab = params.tab || "today";

  const [profile] = await sql`SELECT * FROM pairfuel_profiles WHERE user_id=${user.id}`;
  const [today] = await sql`SELECT COALESCE(SUM(calories),0)::int calories,COALESCE(SUM(protein),0)::numeric protein,COALESCE(SUM(carbs),0)::numeric carbs,COALESCE(SUM(fat),0)::numeric fat FROM pairfuel_food_logs WHERE user_id=${user.id} AND logged_at::date=CURRENT_DATE`;
  const [water] = await sql`SELECT COALESCE(amount_ml,0)::int amount_ml FROM pairfuel_water_logs WHERE user_id=${user.id} AND logged_on=CURRENT_DATE`;
  const foodHistory = await sql`SELECT id,logged_at,meal,food_name,calories,protein,carbs,fat FROM pairfuel_food_logs WHERE user_id=${user.id} ORDER BY logged_at DESC LIMIT 100`;
  const weights = await sql`SELECT logged_on,weight FROM pairfuel_weight_logs WHERE user_id=${user.id} ORDER BY logged_on DESC LIMIT 30`;
  const fasts = await sql`SELECT id,started_at,ended_at,target_hours FROM pairfuel_fasting_sessions WHERE user_id=${user.id} ORDER BY started_at DESC LIMIT 20`;
  const [partnership] = await sql`SELECT *,CASE WHEN user_a_id=${user.id} THEN user_b_id ELSE user_a_id END partner_id FROM pairfuel_partnerships WHERE user_a_id=${user.id} OR user_b_id=${user.id} LIMIT 1`;
  const [invite] = await sql`SELECT code,expires_at FROM pairfuel_partner_invites WHERE inviter_user_id=${user.id} AND accepted_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1`;
  const [privacy] = await sql`SELECT * FROM pairfuel_partner_privacy WHERE user_id=${user.id}`;

  let partner: any = null;
  if (partnership) {
    const pid = partnership.partner_id;
    const [pp] = await sql`SELECT p.*,pr.* FROM pairfuel_profiles p LEFT JOIN pairfuel_partner_privacy pr ON pr.user_id=p.user_id WHERE p.user_id=${pid}`;
    const [pt] = await sql`SELECT COALESCE(SUM(calories),0)::int calories,COALESCE(SUM(protein),0)::numeric protein FROM pairfuel_food_logs WHERE user_id=${pid} AND logged_at::date=CURRENT_DATE`;
    const [pw] = await sql`SELECT COALESCE(amount_ml,0)::int amount_ml FROM pairfuel_water_logs WHERE user_id=${pid} AND logged_on=CURRENT_DATE`;
    const [pweight] = await sql`SELECT weight FROM pairfuel_weight_logs WHERE user_id=${pid} ORDER BY logged_on DESC LIMIT 1`;
    const [pfirst] = await sql`SELECT weight FROM pairfuel_weight_logs WHERE user_id=${pid} ORDER BY logged_on ASC LIMIT 1`;
    const [pfast] = await sql`SELECT started_at,ended_at,target_hours FROM pairfuel_fasting_sessions WHERE user_id=${pid} ORDER BY started_at DESC LIMIT 1`;
    partner = { ...pp, today: pt, water: pw ?? { amount_ml: 0 }, weight: pweight?.weight, weightChange: pweight && pfirst ? Number(pweight.weight) - Number(pfirst.weight) : null, fast: pfast };
  }

  const tabs = [["today","Today"],["history","All time"],["fasting","Fasting"],["weight","Weight"],["together","Together"],["settings","Privacy"]];

  return <main className="shell">
    <header className="topbar"><div><strong>PairFuel</strong><div className="muted">Hi, {profile.display_name || user.name || "Friend"}</div></div><LogoutButton /></header>
    <section className="dashboard">
      <div className="tabs">{tabs.map(([key,label]) => <a key={key} className={`tab ${tab === key ? "active" : ""}`} href={`/dashboard?tab=${key}`}>{label}</a>)}</div>

      {tab === "today" && <>
        <div className="stats"><div className="stat"><span className="muted">Calories</span><b>{today.calories} / {profile.calorie_target}</b></div><div className="stat"><span className="muted">Protein</span><b>{Math.round(Number(today.protein))}g</b></div><div className="stat"><span className="muted">Water</span><b>{water?.amount_ml || 0} ml</b></div><div className="stat"><span className="muted">Partner</span><b>{partner ? "Connected" : "Solo"}</b></div></div>
        <StoryShare showTogether={Boolean(partner)} />
        <div className="grid2">
          <form action={addFood} className="panel"><h2>Log food</h2><div className="form-row"><label className="field">Food<input name="food" placeholder="Chicken rice" required /></label><label className="field">Meal<select name="meal"><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>First Meal</option></select></label></div><div className="form-row"><label className="field">Calories<input name="calories" type="number" min="0" required /></label><label className="field">Date & time<input name="loggedAt" type="datetime-local" required /></label></div><div className="form-row"><label className="field">Protein (g)<input name="protein" type="number" step="0.1" defaultValue="0" /></label><label className="field">Carbs (g)<input name="carbs" type="number" step="0.1" defaultValue="0" /></label></div><label className="field">Fat (g)<input name="fat" type="number" step="0.1" defaultValue="0" /></label><button className="button">Add food</button></form>
          <div className="panel"><h2>Quick actions</h2><form action={addWater}><input type="hidden" name="amount" value="250" /><button className="button">+ 250 ml water</button></form><p className="muted">All logs are stored in Neon, not browser localStorage.</p></div>
        </div>
      </>}

      {tab === "history" && <div className="panel"><h2>All-time calorie log</h2><p className="muted">Latest 100 entries are shown here; database history is retained.</p><div className="list">{foodHistory.map((food: any) => <div className="row" key={food.id}><div><b>{food.food_name}</b><div className="muted">{food.meal} · {new Date(food.logged_at).toLocaleString()}</div></div><div>{food.calories} kcal</div></div>)}</div></div>}

      {tab === "fasting" && <div className="grid2"><form action={startFast} className="panel"><h2>Start a fast</h2><label className="field">Schedule<select name="target" defaultValue="16"><option value="12">12:12</option><option value="14">14:10</option><option value="16">16:8</option><option value="18">18:6</option></select></label><button className="button">Start fasting</button><br/><br/><button formAction={endFast} className="ghost">End current fast</button></form><div className="panel"><h2>Fasting history</h2><div className="list">{fasts.map((fast: any) => <div className="row" key={fast.id}><span>{fast.target_hours}h target</span><span>{fast.ended_at ? "Completed" : "Active"}</span></div>)}</div></div></div>}

      {tab === "weight" && <div className="grid2"><form action={addWeight} className="panel"><h2>Log weight</h2><label className="field">Date<input name="date" type="date" required /></label><label className="field">Weight (kg)<input name="weight" type="number" step="0.1" min="1" required /></label><button className="button">Save weight</button></form><div className="panel"><h2>History</h2><div className="list">{weights.map((weight: any) => <div className="row" key={String(weight.logged_on)}><span>{String(weight.logged_on).slice(0,10)}</span><b>{weight.weight} kg</b></div>)}</div></div></div>}

      {tab === "together" && <><StoryShare showTogether={Boolean(partner)} /><div className="grid2">{partner ? <><div className="panel"><h2>Your partner</h2><p className="muted">Only metrics your partner chose to share are shown.</p>{partner.share_calories && <div className="row"><span>Calories today</span><b>{partner.today.calories} kcal</b></div>}{partner.share_macros && <div className="row"><span>Protein today</span><b>{Math.round(Number(partner.today.protein))} g</b></div>}{partner.share_water && <div className="row"><span>Water</span><b>{partner.water.amount_ml || 0} ml</b></div>}{partner.share_weight && <div className="row"><span>Weight</span><b>{partner.weight || "—"} kg</b></div>}{partner.share_weight_change && <div className="row"><span>Weight change</span><b>{partner.weightChange == null ? "—" : `${partner.weightChange > 0 ? "+" : ""}${partner.weightChange.toFixed(1)} kg`}</b></div>}{partner.share_fasting && <div className="row"><span>Latest fast</span><b>{partner.fast ? `${partner.fast.target_hours}h ${partner.fast.ended_at ? "done" : "active"}` : "—"}</b></div>}</div><div className="panel"><h2>Together</h2><div className="notice">Connected. PairFuel keeps each person’s data separate and respects sharing controls.</div></div></> : <><div className="panel"><h2>Invite your partner</h2>{invite ? <><p>Your 7-day invite code:</p><div className="stat"><b>{invite.code}</b></div></> : <form action={createInvite}><button className="button">Generate invite code</button></form>}</div><form action={acceptInvite} className="panel"><h2>Join a partner</h2><label className="field">Invite code<input name="code" maxLength={6} required /></label><button className="button">Connect</button></form></>}</div></>}

      {tab === "settings" && <form action={updatePrivacy} className="panel"><h2>Partner privacy</h2><p className="muted">Choose exactly what your connected partner may see.</p>{[["calories","Calories",privacy.share_calories],["macros","Macros",privacy.share_macros],["meals","Meal details",privacy.share_meals],["fasting","Fasting",privacy.share_fasting],["water","Water",privacy.share_water],["weight","Absolute weight",privacy.share_weight],["weightChange","Weight change only",privacy.share_weight_change]].map(([key,label,value]: any) => <label className="row" key={key}><span>{label}</span><input type="checkbox" name={key} defaultChecked={Boolean(value)} /></label>)}<br/><button className="button">Save privacy</button></form>}
    </section>
  </main>;
}