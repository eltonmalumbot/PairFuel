import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const secret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !secret) {
  throw new Error("Neon Auth runtime environment is not configured");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: { secret },
});
