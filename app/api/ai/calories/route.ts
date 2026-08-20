import { auth } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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
- If the user asks something unrelated to food calories/nutrition, gently steer them back to calorie and nutrition estimation.`;

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

  let body: unknown;
  try {
    body = await request.json();
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
              maxOutputTokens: 450,
            },
          }),
        },
      );

      const data = (await upstream.json()) as GeminiResponse;
      if (upstream.ok) {
        const answer = responseText(data);
        if (!answer) {
          return Response.json({ error: "The calorie assistant returned an empty response." }, { status: 502 });
        }
        return Response.json({ answer });
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
