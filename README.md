# PairFuel

**Diet, fasting & calorie tracking — better together.**

PairFuel is a Next.js wellness tracker designed to work solo and become more useful when you connect one partner.

## MVP features

- Neon Auth email/password sign-up and sign-in
- Neon Postgres as the source of truth
- Calorie + macro logging with all-time history
- Backdated food and weight entries
- Water logging
- Intermittent fasting sessions (12:12 / 14:10 / 16:8 / 18:6)
- One-to-one partner invite codes
- Together dashboard
- Per-metric partner privacy controls
- Responsive UI

## Stack

- Next.js 16 / React 19 / TypeScript
- Neon Postgres (`@neondatabase/serverless`)
- Neon Auth (`@neondatabase/auth`)
- Vercel-ready

## Local setup

1. Create/provision a Neon project with Neon Auth.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and a stable `NEON_AUTH_COOKIE_SECRET` of at least 32 characters.
4. Apply `db/schema.sql` to the Neon database.
5. Run `npm install` and `npm run dev`.

## Product direction

PairFuel starts as a complete solo tracker, while **Together** is the differentiator: optional partner accountability with explicit privacy controls.

## Safety

PairFuel is a wellness tracking tool, not a medical diagnosis or treatment service. Targets remain user-controlled in this MVP.
