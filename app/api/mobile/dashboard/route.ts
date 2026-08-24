import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = db();
  const userId = session.user.id;
  await sql.transaction([
    sql`INSERT INTO pairfuel_profiles(user_id,display_name) VALUES(${userId},${session.user.name || "Friend"}) ON CONFLICT(user_id) DO NOTHING`,
    sql`INSERT INTO pairfuel_partner_privacy(user_id) VALUES(${userId}) ON CONFLICT(user_id) DO NOTHING`,
  ]);

  const [profiles, todayRows, waterRows, food, weights, fasts, partnershipRows] = await Promise.all([
    sql`SELECT display_name,calorie_target,protein_target,carb_target,fat_target,water_target,goal_weight,fasting_preset
        FROM pairfuel_profiles WHERE user_id=${userId}`,
    sql`SELECT COALESCE(SUM(calories),0)::int calories,COALESCE(SUM(protein),0)::numeric protein,
        COALESCE(SUM(carbs),0)::numeric carbs,COALESCE(SUM(fat),0)::numeric fat
        FROM pairfuel_food_logs WHERE user_id=${userId}
        AND logged_at >= (date_trunc('day',now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta')
        AND logged_at < ((date_trunc('day',now() AT TIME ZONE 'Asia/Jakarta')+interval '1 day') AT TIME ZONE 'Asia/Jakarta')`,
    sql`SELECT COALESCE(amount_ml,0)::int amount_ml FROM pairfuel_water_logs
        WHERE user_id=${userId} AND logged_on=(now() AT TIME ZONE 'Asia/Jakarta')::date`,
    sql`SELECT id,logged_at,meal,food_name,calories,protein,carbs,fat FROM pairfuel_food_logs
        WHERE user_id=${userId} ORDER BY logged_at DESC LIMIT 50`,
    sql`SELECT id,logged_on,weight FROM pairfuel_weight_logs WHERE user_id=${userId} ORDER BY logged_on DESC LIMIT 30`,
    sql`SELECT id,started_at,ended_at,target_hours FROM pairfuel_fasting_sessions
        WHERE user_id=${userId} ORDER BY started_at DESC LIMIT 20`,
    sql`SELECT CASE WHEN user_a_id=${userId} THEN user_b_id ELSE user_a_id END partner_id
        FROM pairfuel_partnerships WHERE user_a_id=${userId} OR user_b_id=${userId} LIMIT 1`,
  ]);

  return Response.json({
    user: { id: userId, email: session.user.email, name: session.user.name },
    profile: profiles[0],
    today: todayRows[0] ?? { calories: 0, protein: 0, carbs: 0, fat: 0 },
    water: waterRows[0] ?? { amount_ml: 0 },
    food,
    weights,
    fasts,
    activeFast: fasts.find((item) => item.ended_at == null) ?? null,
    connectedToPartner: partnershipRows.length > 0,
  });
}
