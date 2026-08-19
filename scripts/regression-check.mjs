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
assert.match(schema, /share_weight_change boolean NOT NULL DEFAULT true/, "Weight-change-only sharing remains the privacy-friendly default");

for (const route of [
  "app/auth/forgot-password/page.tsx",
  "app/auth/reset-password/page.tsx",
  "app/auth/verify-email/page.tsx",
  "app/dashboard/analytics/page.tsx",
]) {
  await text(route);
}

console.log("PairFuel regression checks passed.");
