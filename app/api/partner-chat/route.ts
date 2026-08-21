import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentPartnership(userId: string) {
  const sql = db();
  const rows = await sql`
    SELECT id,
      CASE WHEN user_a_id=${userId} THEN user_b_id ELSE user_a_id END AS partner_id
    FROM pairfuel_partnerships
    WHERE user_a_id=${userId} OR user_b_id=${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const partnership = await currentPartnership(session.user.id);
  if (!partnership) return Response.json({ connected: false, messages: [] });

  const sql = db();
  const [partnerRows, messages] = await Promise.all([
    sql`SELECT display_name FROM pairfuel_profiles WHERE user_id=${partnership.partner_id} LIMIT 1`,
    sql`
      SELECT id, sender_user_id, body, created_at
      FROM pairfuel_partner_messages
      WHERE partnership_id=${partnership.id}
      ORDER BY created_at ASC
      LIMIT 300
    `,
  ]);

  return Response.json({
    connected: true,
    partnerName: partnerRows[0]?.display_name || "Partner",
    currentUserId: session.user.id,
    messages,
  });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const partnership = await currentPartnership(session.user.id);
  if (!partnership) return Response.json({ error: "Connect a partner first." }, { status: 400 });

  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const body = String(payload.body ?? "").trim();
  if (!body) return Response.json({ error: "Message cannot be empty." }, { status: 400 });
  if (body.length > 1500) return Response.json({ error: "Message is too long." }, { status: 400 });

  const sql = db();
  const rows = await sql`
    INSERT INTO pairfuel_partner_messages(partnership_id, sender_user_id, body)
    SELECT ${partnership.id}, ${session.user.id}, ${body}
    WHERE EXISTS (
      SELECT 1 FROM pairfuel_partnerships
      WHERE id=${partnership.id}
        AND (user_a_id=${session.user.id} OR user_b_id=${session.user.id})
    )
    RETURNING id, sender_user_id, body, created_at
  `;

  if (!rows.length) return Response.json({ error: "Partnership is no longer active." }, { status: 409 });
  return Response.json({ message: rows[0] }, { status: 201 });
}
