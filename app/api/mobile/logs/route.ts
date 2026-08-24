import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { jakartaLocalToIso } from "@/lib/time";
import { dateOnly, numberInRange, oneOf, requiredText } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const type = String(body.type || "");
    const sql = db();
    const userId = session.user.id;

    if (type === "food") {
      const loggedAt = jakartaLocalToIso(String(body.loggedAt || ""));
      const meal = oneOf(body.meal, ["Breakfast", "Lunch", "Dinner", "Snack", "First Meal"] as const, "Lunch");
      const food = requiredText(body.food, "Food", 180);
      const calories = numberInRange(body.calories, "Calories", 0, 20_000);
      const protein = numberInRange(body.protein ?? 0, "Protein", 0, 1_000);
      const carbs = numberInRange(body.carbs ?? 0, "Carbs", 0, 2_000);
      const fat = numberInRange(body.fat ?? 0, "Fat", 0, 1_000);
      await sql`INSERT INTO pairfuel_food_logs(user_id,logged_at,meal,food_name,calories,protein,carbs,fat)
        VALUES(${userId},${loggedAt},${meal},${food},${calories},${protein},${carbs},${fat})`;
    } else if (type === "water") {
      const amount = numberInRange(body.amount ?? 250, "Water", 1, 5_000);
      await sql`INSERT INTO pairfuel_water_logs(user_id,logged_on,amount_ml)
        VALUES(${userId},(now() AT TIME ZONE 'Asia/Jakarta')::date,${amount})
        ON CONFLICT(user_id,logged_on) DO UPDATE
        SET amount_ml=pairfuel_water_logs.amount_ml+EXCLUDED.amount_ml,updated_at=now()`;
    } else if (type === "weight") {
      const loggedOn = dateOnly(body.date);
      const weight = numberInRange(body.weight, "Weight", 1, 1_000);
      await sql`INSERT INTO pairfuel_weight_logs(user_id,logged_on,weight)
        VALUES(${userId},${loggedOn},${weight})
        ON CONFLICT(user_id,logged_on) DO UPDATE SET weight=EXCLUDED.weight`;
    } else {
      return Response.json({ error: "Unknown log type." }, { status: 400 });
    }

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save log." }, { status: 400 });
  }
}
