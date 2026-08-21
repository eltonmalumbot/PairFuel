import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Estimate = {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
};

const INSTRUCTIONS = `You are PairFuel Calorie AI, a concise food and nutrition estimation assistant inside a wellness tracker.

Your primary job is to estimate calories and macros (protein, carbohydrates, fat) for foods, drinks, meals, and portions described by the user.

Rules:
- Reply in the same language as the user.
- Make it clear that nutrition values are estimates, not laboratory measurements.
- If portion size, cooking method, brand, sauce, oil, or toppings are unclear, state a reasonable assumption and give a range when appropriate.
- Prefer practical household portions and Indonesian food context when relevant.
- Give the estimated total calories prominently, followed by protein, carbs, and fat when reasonably estimable.
- Keep answers concise and useful for logging in PairFuel.
- You may ask one short follow-up question when the missing portion detail would materially change the estimate.
- Do not diagnose or treat medical conditions.
- Do not encourage starvation, purging, compensatory exercise, or extreme fasting.
- Do not prescribe dangerously low calorie targets. PairFuel is a tracking tool, not medical advice.
- If the user asks something unrelated to food calories/nutrition, gently steer them back to calorie and nutrition estimation.

When you have enough information to produce a usable food-log estimate, append one final machine-readable line exactly in this format:
PAIRFUEL_ESTIMATE: {"food":"short food name","calories":123,"protein":12.3,"carbs":34.5,"fat":6.7}
Use one representative estimate for ranges. All numeric values must be numbers, not strings. Do not include this marker when the user's question is not a food estimate or when you need a follow-up question.`;

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is ChatMessage => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ChatMessage>;
      return (candidate.role === "user" || candidate.role === "assistant") && typeof candidate.content === "string";
    })
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 800) }))
    .filter((item) => item.content.length > 0)
    .slice(-8);
}

function responseText(data: GeminiResponse) {
  return (data.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();
}

function parseEstimate(rawAnswer: string): { answer: string; estimate: Estimate | null } {
  const marker = /(?:^|\n)PAIRFUEL_ESTIMATE:\s*(\{[^\n]+\})\s*$/;
  const match = rawAnswer.match(marker);
  if (!match) return { answer: rawAnswer, estimate: null };

  let estimate: Estimate | null = null;
  try {
    const parsed = JSON.parse(match[1]) as Partial<Estimate>;
    const food = typeof parsed.food === "string" ? parsed.food.trim().slice(0, 180) : "";
    const calories = Number(parsed.calories);
    const protein = Number(parsed.protein);
    const carbs = Number(parsed.carbs);
    const fat = Number(parsed.fat);

    if (
      food &&
      Number.isFinite(calories) && calories >= 0 && calories <= 20_000 &&
      Number.isFinite(protein) && protein >= 0 && protein <= 1_000 &&
      Number.isFinite(carbs) && carbs >= 0 && carbs <= 2_000 &&
      Number.isFinite(fat) && fat >= 0 && fat <= 1_000
    ) {
      estimate = { food, calories, protein, carbs, fat };
    }
  } catch {
    estimate = null;
  }

  return { answer: rawAnswer.replace(marker, "").trim(), estimate };
}

async function withinRateLimit(userId: string) {
  const sql = db();
  const [usage] = await sql`
    INSERT INTO pairfuel_ai_rate_limits(user_id,window_started_at,request_count,updated_at)
    VALUES(${userId},now(),1,now())
    ON CONFLICT(user_id) DO UPDATE SET
      window_started_at=CASE
        WHEN pairfuel_ai_rate_limits.window_started_at < now()-interval '1 minute' THEN now()
        ELSE pairfuel_ai_rate_limits.window_started_at
      END,
      request_count=CASE
        WHEN pairfuel_ai_rate_limits.window_started_at < now()-interval '1 minute' THEN 1
        ELSE pairfuel_ai_rate_limits.request_count+1
      END,
      updated_at=now()
    RETURNING request_count
  `;
  return Number(usage?.request_count ?? 1) <= 10;
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI Calorie Assistant is not configured yet. Add GEMINI_API_KEY to the PairFuel server environment." },
      { status: 503 },
    );
  }

  if (!(await withinRateLimit(session.user.id))) {
    return Response.json(
      { error: "Too many AI requests. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 20_000) {
      return Response.json({ error: "Request body is too large." }, { status: 413 });
    }
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = sanitizeMessages((body as { messages?: unknown })?.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Please send a food or calorie question." }, { status: 400 });
  }

  const contents = messages.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const models = Array.from(new Set([configuredModel, "gemini-3.5-flash-lite"].filter(Boolean))) as string[];
  const userMessage = messages[messages.length - 1].content;

  try {
    for (const [index, model] of models.entries()) {
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: INSTRUCTIONS }],
            },
            contents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 520,
            },
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );

      const data = (await upstream.json()) as GeminiResponse;
      if (upstream.ok) {
        const rawAnswer = responseText(data);
        if (!rawAnswer) {
          return Response.json({ error: "The calorie assistant returned an empty response." }, { status: 502 });
        }

        const { answer, estimate } = parseEstimate(rawAnswer);
        const sql = db();
        await sql.transaction([
          sql`INSERT INTO pairfuel_ai_messages(user_id,role,content) VALUES(${session.user.id},'user',${userMessage})`,
          sql`INSERT INTO pairfuel_ai_messages(user_id,role,content,estimate) VALUES(${session.user.id},'assistant',${answer},${estimate ? JSON.stringify(estimate) : null}::jsonb)`,
        ]);

        return Response.json({ answer, estimate });
      }

      const hasFallback = index < models.length - 1;
      if (upstream.status === 404 && hasFallback) {
        console.warn("PairFuel Gemini model unavailable; trying fallback", model);
        continue;
      }

      console.error("PairFuel Gemini calorie AI upstream error", upstream.status, data.error?.message || "Unknown error");
      return Response.json({ error: "The calorie assistant is temporarily unavailable." }, { status: 502 });
    }

    return Response.json({ error: "The calorie assistant is temporarily unavailable." }, { status: 502 });
  } catch (error) {
    console.error("PairFuel Gemini calorie AI request failed", error);
    return Response.json({ error: "The calorie assistant is temporarily unavailable." }, { status: 502 });
  }
}
