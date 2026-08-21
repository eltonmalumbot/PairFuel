import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function text(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const dashboard = await text("app/dashboard/page.tsx");
const story = await text("lib/story.ts");
const time = await text("lib/time.ts");
const schema = await text("db/schema.sql");
const signIn = await text("app/auth/sign-in/page.tsx");
const errorBoundary = await text("app/error.tsx");
const calorieAi = await text("app/api/ai/calories/route.ts");
const aiHistory = await text("app/api/ai/history/route.ts");
const aiAssistant = await text("app/dashboard/ai-assistant.tsx");
const dashboardLayout = await text("app/dashboard/layout.tsx");
const dashboardTools = await text("app/dashboard/dashboard-tools.tsx");
const storyShare = await text("app/dashboard/story-share.tsx");
const dailyStoryRoute = await text("app/api/story/daily/route.tsx");
const togetherStoryRoute = await text("app/api/story/together/route.tsx");
const statIcons = await text("app/dashboard/stat-icons.tsx");

assert.match(time, /Asia\/Jakarta/, "Timezone helper must remain Asia/Jakarta");
assert.match(dashboard, /AT TIME ZONE 'Asia\/Jakarta'/, "Dashboard Today queries must remain WIB-safe");
assert.match(story, /AT TIME ZONE 'Asia\/Jakarta'/, "Story Today metrics must remain WIB-safe");
assert.match(dashboard, /water\s*:\s*pw\s*\?\?\s*\{\s*amount_ml\s*:\s*0\s*\}/, "Partner water must safely fall back to 0");
assert.match(dashboard, /randomBytes\(/, "Invite codes must use cryptographic randomness");
assert.match(dashboard, /sql\.transaction\(/, "Partner connection must use a transaction");
assert.match(dashboard, /isolationLevel\s*:\s*"Serializable"/, "Partner transaction must remain serializable");
assert.match(signIn, /\/auth\/forgot-password/, "Sign-in must expose password recovery");
assert.match(errorBoundary, /Something went wrong/, "Global route error boundary must remain present");
assert.match(schema, /share_calories boolean NOT NULL DEFAULT false/, "New users must not share calories by default");
assert.match(schema, /share_macros boolean NOT NULL DEFAULT false/, "New users must not share macros by default");
assert.match(schema, /share_weight boolean NOT NULL DEFAULT false/, "Absolute weight must remain private by default");
assert.match(schema, /share_weight_change boolean NOT NULL DEFAULT false/, "Partner metrics must require explicit opt-in");
assert.match(schema, /CREATE TABLE IF NOT EXISTS pairfuel_ai_messages/, "AI chat history must have persistent storage");
assert.match(calorieAi, /auth\.getSession\(\)/, "Calorie AI must require an authenticated PairFuel session");
assert.match(calorieAi, /process\.env\.GEMINI_API_KEY/, "Gemini key must remain server-side");
assert.match(calorieAi, /gemini-3\.5-flash-lite/, "Calorie AI must keep the current Gemini fallback model");
assert.doesNotMatch(calorieAi, /OPENAI_API_KEY|api\.openai\.com/, "Calorie AI must not depend on OpenAI");
assert.match(calorieAi, /pairfuel_ai_rate_limits/, "Calorie AI must enforce a persistent per-user rate limit");
assert.match(calorieAi, /AbortSignal\.timeout/, "Calorie AI upstream requests must have a timeout");
assert.match(calorieAi, /PAIRFUEL_ESTIMATE/, "Calorie AI must return a structured food-log estimate when available");
assert.match(calorieAi, /pairfuel_ai_messages/, "Calorie AI responses must be saved to chat history");
assert.match(aiHistory, /pairfuel_ai_messages/, "AI history route must read persistent chat messages");
assert.match(aiAssistant, /Use in Food Log/, "AI popup must support filling the food log from an estimate");
assert.match(aiAssistant, /Clear history/, "AI popup must expose chat history controls");
assert.match(dashboard, /Promise\.all\(/, "Dashboard queries must avoid sequential waterfalls");
assert.match(
  dashboard,
  /VALUES\(\$\{user\.id\},\$\{loggedAt\},\$\{meal\},\$\{food\},\$\{calories\},\$\{protein\},\$\{carbs\},\$\{fat\}\)/,
  "Food insert must keep its closing parenthesis",
);
assert.match(story, /Promise\.all\(/, "Story queries must avoid sequential waterfalls");
assert.match(schema, /pairfuel_one_active_fast_per_user_idx/, "Only one active fasting session is allowed per user");
assert.match(dashboardLayout, /DashboardTools/, "Dashboard must mount the dashboard tools container");
assert.match(dashboardTools, /AiAssistant/, "Dashboard tools must keep the popup AI calorie assistant mounted");
assert.match(dashboardTools, /dashboard-tools-minimized/, "Dashboard tools must persist minimized state");
assert.match(dashboard, /stat-icon-partner/, "Partner summary must show its red heart icon");
assert.match(statIcons, /StatIconKind/, "Dashboard summary icons must remain lightweight SVG components");
assert.match(storyShare, /theme=\$\{theme\}/, "Story requests must include the active visual theme");
assert.match(dailyStoryRoute, /getStoryTheme\(request\)/, "Daily Story must use the requested theme palette");
assert.match(togetherStoryRoute, /getStoryTheme\(request\)/, "Together Story must use the requested theme palette");

for (const route of [
  "app/auth/forgot-password/page.tsx",
  "app/auth/reset-password/page.tsx",
  "app/auth/verify-email/page.tsx",
  "app/dashboard/analytics/page.tsx",
  "app/dashboard/ask-ai/page.tsx",
  "app/dashboard/ai-assistant.tsx",
  "app/dashboard/dashboard-tools.tsx",
  "app/api/ai/calories/route.ts",
  "app/api/ai/history/route.ts",
]) {
  await text(route);
}

console.log("PairFuel regression checks passed.");
