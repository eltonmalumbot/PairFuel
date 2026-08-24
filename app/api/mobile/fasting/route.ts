import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { numberInRange } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const action = String(body.action || "");
    const sql = db();
    const userId = session.user.id;

    if (action === "start") {
      const target = numberInRange(body.target ?? 16, "Fasting target", 1, 24);
      await sql.transaction([
        sql`UPDATE pairfuel_fasting_sessions SET ended_at=now() WHERE user_id=${userId} AND ended_at IS NULL`,
        sql`INSERT INTO pairfuel_fasting_sessions(user_id,started_at,target_hours) VALUES(${userId},now(),${target})`,
      ]);
    } else if (action === "end") {
      await sql`UPDATE pairfuel_fasting_sessions SET ended_at=now() WHERE user_id=${userId} AND ended_at IS NULL`;
    } else {
      return Response.json({ error: "Unknown fasting action." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not update fasting." }, { status: 400 });
  }
}
