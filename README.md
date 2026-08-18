# PairFuel

**Diet, fasting & calorie tracking — better together.**

PairFuel is a Next.js wellness tracker designed to work solo and become more useful when you connect a partner.

## MVP features

- Neon Auth email/password sign-up and sign-in
- Neon Postgres as the source of truth
- Calorie + macro logging with all-time history
- Water logging
- Weight history with backdated entries
- Intermittent fasting sessions (12:12 / 14:10 / 16:8 / 18:6-ready)
- Partner invite codes and one-to-one pairing
- Partner dashboard
- Per-metric privacy controls (calories, macros, meals, fasting, water, weight, weight change)
- Indonesian-food quick-add starter list
- Responsive landing page and authenticated dashboard

## Stack

- Next.js 16 / React 19 / TypeScript
- Neon Postgres (`@neondatabase/serverless`)
- Neon Auth (`@neondatabase/auth`)
- Vercel-ready

## Local setup

1. Create a Neon project and provision Neon Auth.
2. Copy `.env.example` to `.env.local` and fill in the three environment variables.
3. Apply `db/schema.sql` to the application database.
4. Run `npm install` then `npm run dev`.

## Safety note

PairFuel is a wellness tracking tool, not a medical diagnosis or treatment service. Diet targets should remain user-controlled and future automated recommendations must include appropriate safeguards.
