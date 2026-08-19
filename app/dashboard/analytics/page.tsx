import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { formatJakartaDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";

type RangeKey = "day" | "week" | "month" | "year" | "all";
type Search = Promise<{ range?: string }>;

function normalizeRange(value?: string): RangeKey {
  return ["day", "week", "month", "year", "all"].includes(value || "") ? value as RangeKey : "all";
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Search }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const range = normalizeRange((await searchParams).range);
  const sql = db();
  const userId = session.user.id;

  const [summary] = await sql`
    WITH filtered AS (
      SELECT *, (logged_at AT TIME ZONE 'Asia/Jakarta')::date AS local_day
      FROM pairfuel_food_logs
      WHERE user_id=${userId}
        AND (
          ${range}='all'
          OR (${range}='day' AND (logged_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date)
          OR (${range}='week' AND (logged_at AT TIME ZONE 'Asia/Jakarta')::date >= (now() AT TIME ZONE 'Asia/Jakarta')::date - 6)
          OR (${range}='month' AND date_trunc('month', logged_at AT TIME ZONE 'Asia/Jakarta') = date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta'))
          OR (${range}='year' AND date_trunc('year', logged_at AT TIME ZONE 'Asia/Jakarta') = date_trunc('year', now() AT TIME ZONE 'Asia/Jakarta'))
        )
    )
    SELECT
      COALESCE(SUM(calories),0)::int AS total_calories,
      COALESCE(SUM(protein),0)::numeric AS total_protein,
      COALESCE(SUM(carbs),0)::numeric AS total_carbs,
      COALESCE(SUM(fat),0)::numeric AS total_fat,
      COUNT(*)::int AS entries,
      COUNT(DISTINCT local_day)::int AS days_tracked,
      MIN(logged_at) AS first_log,
      MAX(logged_at) AS last_log
    FROM filtered`;

  const daily = await sql`
    SELECT
      (logged_at AT TIME ZONE 'Asia/Jakarta')::date AS day,
      SUM(calories)::int AS calories,
      ROUND(SUM(protein)::numeric,1) AS protein
    FROM pairfuel_food_logs
    WHERE user_id=${userId}
      AND (
        ${range}='all'
        OR (${range}='day' AND (logged_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date)
        OR (${range}='week' AND (logged_at AT TIME ZONE 'Asia/Jakarta')::date >= (now() AT TIME ZONE 'Asia/Jakarta')::date - 6)
        OR (${range}='month' AND date_trunc('month', logged_at AT TIME ZONE 'Asia/Jakarta') = date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta'))
        OR (${range}='year' AND date_trunc('year', logged_at AT TIME ZONE 'Asia/Jakarta') = date_trunc('year', now() AT TIME ZONE 'Asia/Jakarta'))
      )
    GROUP BY 1
    ORDER BY 1 DESC
    LIMIT 366`;

  const recent = await sql`
    SELECT id,logged_at,meal,food_name,calories,protein
    FROM pairfuel_food_logs
    WHERE user_id=${userId}
      AND (
        ${range}='all'
        OR (${range}='day' AND (logged_at AT TIME ZONE 'Asia/Jakarta')::date=(now() AT TIME ZONE 'Asia/Jakarta')::date)
        OR (${range}='week' AND (logged_at AT TIME ZONE 'Asia/Jakarta')::date >= (now() AT TIME ZONE 'Asia/Jakarta')::date - 6)
        OR (${range}='month' AND date_trunc('month', logged_at AT TIME ZONE 'Asia/Jakarta') = date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta'))
        OR (${range}='year' AND date_trunc('year', logged_at AT TIME ZONE 'Asia/Jakarta') = date_trunc('year', now() AT TIME ZONE 'Asia/Jakarta'))
      )
    ORDER BY logged_at DESC
    LIMIT 100`;

  const days = Math.max(1, Number(summary.days_tracked || 0));
  const averageCalories = Number(summary.days_tracked || 0) ? Math.round(Number(summary.total_calories || 0) / days) : 0;
  const averageProtein = Number(summary.days_tracked || 0) ? Math.round(Number(summary.total_protein || 0) / days) : 0;
  const labels: Record<RangeKey, string> = { day: "Today", week: "Last 7 days", month: "This month", year: "This year", all: "All time" };

  return <main className="shell">
    <header className="topbar"><div><strong>PairFuel · Analytics</strong><div className="muted">Nutrition history in Asia/Jakarta (WIB).</div></div><a className="ghost" href="/dashboard">Back to dashboard</a></header>
    <section className="dashboard">
      <div className="tabs">{(["day","week","month","year","all"] as RangeKey[]).map(key => <a key={key} href={`/dashboard/analytics?range=${key}`} className={`tab ${range===key?"active":""}`}>{labels[key]}</a>)}</div>

      <div className="stats">
        <div className="stat"><span className="muted">Total calories</span><b>{Number(summary.total_calories || 0).toLocaleString()} kcal</b></div>
        <div className="stat"><span className="muted">Average / tracked day</span><b>{averageCalories.toLocaleString()} kcal</b></div>
        <div className="stat"><span className="muted">Days tracked</span><b>{Number(summary.days_tracked || 0)}</b></div>
        <div className="stat"><span className="muted">Food entries</span><b>{Number(summary.entries || 0)}</b></div>
      </div>

      <div className="grid2">
        <div className="panel"><h2>{labels[range]} summary</h2><div className="row"><span>Protein total</span><b>{Math.round(Number(summary.total_protein || 0))} g</b></div><div className="row"><span>Average protein / tracked day</span><b>{averageProtein} g</b></div><div className="row"><span>Carbs total</span><b>{Math.round(Number(summary.total_carbs || 0))} g</b></div><div className="row"><span>Fat total</span><b>{Math.round(Number(summary.total_fat || 0))} g</b></div>{summary.first_log && <div className="row"><span>First entry</span><b>{formatJakartaDateTime(summary.first_log)} WIB</b></div>}{summary.last_log && <div className="row"><span>Latest entry</span><b>{formatJakartaDateTime(summary.last_log)} WIB</b></div>}</div>
        <div className="panel"><h2>Daily totals</h2><div className="list">{daily.length ? daily.slice(0,31).map((item:any)=><div className="row" key={String(item.day)}><span>{String(item.day).slice(0,10)}</span><span><b>{item.calories} kcal</b><span className="muted"> · {item.protein}g protein</span></span></div>) : <p className="muted">No nutrition logs in this period.</p>}</div>{daily.length>31 && <p className="muted">Showing the latest 31 tracked days. Summary totals still cover the full selected period.</p>}</div>
      </div>

      <div className="panel" style={{marginTop:16}}><h2>Recent entries</h2><p className="muted">Up to 100 recent entries are shown; summary statistics above use the full selected period.</p><div className="list">{recent.length ? recent.map((food:any)=><div className="row" key={food.id}><div><b>{food.food_name}</b><div className="muted">{food.meal} · {formatJakartaDateTime(food.logged_at)} WIB</div></div><div>{food.calories} kcal</div></div>) : <p className="muted">No food entries yet.</p>}</div></div>
    </section>
  </main>;
}
