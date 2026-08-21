import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { jakartaLocalToIso } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LogType = "food" | "water" | "weight";

function numberValue(value: unknown, name: string, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}.`);
  }
  return parsed;
}

function textValue(value: unknown, name: string, maxLength: number) {
  const parsed = String(value ?? "").trim();
  if (!parsed || parsed.length > maxLength) throw new Error(`${name} is invalid.`);
  return parsed;
}

function dateValue(value: unknown) {
  const parsed = String(value ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed) || Number.isNaN(Date.parse(`${parsed}T00:00:00Z`))) {
    throw new Error("Date is invalid.");
  }
  return parsed;
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = db();
  const userId = session.user.id;
  const [food, water, weight] = await Promise.all([
    sql`SELECT id,logged_at,meal,food_name,calories,protein,carbs,fat
        FROM pairfuel_food_logs
        WHERE user_id=${userId}
        ORDER BY logged_at DESC
        LIMIT 100`,
    sql`SELECT id,logged_on,amount_ml
        FROM pairfuel_water_logs
        WHERE user_id=${userId}
        ORDER BY logged_on DESC
        LIMIT 90`,
    sql`SELECT id,logged_on,weight
        FROM pairfuel_weight_logs
        WHERE user_id=${userId}
        ORDER BY logged_on DESC
        LIMIT 90`,
  ]);

  return Response.json({ food, water, weight });
}

export async function PATCH(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const type = String(body.type || "") as LogType;
  const id = textValue(body.id, "Log id", 80);
  const sql = db();
  const userId = session.user.id;

  try {
    if (type === "food") {
      const foodName = textValue(body.foodName, "Food", 180);
      const meal = textValue(body.meal, "Meal", 40);
      const allowedMeals = ["Breakfast", "Lunch", "Dinner", "Snack", "First Meal"];
      if (!allowedMeals.includes(meal)) throw new Error("Meal is invalid.");
      const calories = numberValue(body.calories, "Calories", 0, 20_000);
      const protein = numberValue(body.protein, "Protein", 0, 1_000);
      const carbs = numberValue(body.carbs, "Carbs", 0, 2_000);
      const fat = numberValue(body.fat, "Fat", 0, 1_000);
      const loggedAt = jakartaLocalToIso(String(body.loggedAt || ""));

      const rows = await sql`UPDATE pairfuel_food_logs
        SET food_name=${foodName},meal=${meal},calories=${calories},protein=${protein},carbs=${carbs},fat=${fat},logged_at=${loggedAt}
        WHERE id=${id} AND user_id=${userId}
        RETURNING id`;
      if (!rows.length) return Response.json({ error: "Food log not found." }, { status: 404 });
    } else if (type === "water") {
      const amountMl = numberValue(body.amountMl, "Water", 0, 50_000);
      const loggedOn = dateValue(body.loggedOn);
      const rows = await sql`UPDATE pairfuel_water_logs
        SET logged_on=${loggedOn},amount_ml=${amountMl},updated_at=now()
        WHERE id=${id} AND user_id=${userId}
        RETURNING id`;
      if (!rows.length) return Response.json({ error: "Water log not found." }, { status: 404 });
    } else if (type === "weight") {
      const weight = numberValue(body.weight, "Weight", 1, 1_000);
      const loggedOn = dateValue(body.loggedOn);
      const rows = await sql`UPDATE pairfuel_weight_logs
        SET logged_on=${loggedOn},weight=${weight}
        WHERE id=${id} AND user_id=${userId}
        RETURNING id`;
      if (!rows.length) return Response.json({ error: "Weight log not found." }, { status: 404 });
    } else {
      return Response.json({ error: "Unknown log type." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update log.";
    if ((error as { code?: string })?.code === "23505") {
      return Response.json({ error: "A log already exists for that date." }, { status: 409 });
    }
    return Response.json({ error: message }, { status: 400 });
  }
}
