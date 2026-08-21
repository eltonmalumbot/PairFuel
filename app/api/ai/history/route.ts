import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = db();
  const rows = await sql`
    SELECT id, role, content, estimate
    FROM pairfuel_ai_messages
    WHERE user_id=${session.user.id}
    ORDER BY created_at ASC
    LIMIT 200
  `;

  return Response.json({ messages: rows });
}

export async function DELETE() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sql = db();
  await sql`DELETE FROM pairfuel_ai_messages WHERE user_id=${session.user.id}`;
  return Response.json({ ok: true });
}
