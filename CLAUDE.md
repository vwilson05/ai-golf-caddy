# Caddy — AI Golf Caddy

## Tech Stack
- **Runtime**: Bun (bun.serve(), bun:sqlite, Bun.build())
- **Frontend**: React 19 + custom CSS (NO Tailwind)
- **Database**: SQLite with WAL mode
- **AI**: Claude API via @anthropic-ai/sdk
- **Voice**: Web Speech API (browser-native)
- **Port**: 3341

## Project Structure
- `index.ts` — Bun.serve() server with API routes
- `db.ts` — SQLite database schema and connection
- `parser.ts` — Regex-based golf input parser (no AI)
- `ai.ts` — Claude API integration for complex parsing
- `seed-demo.ts` — Demo data seeder (Torrey Pines North)
- `frontend/` — React components
  - `main.tsx` — Entry point
  - `components/App.tsx` — Router + tab navigation
  - `components/Landing.tsx` — Landing/marketing page
  - `components/Scorecard.tsx` — Live scorecard view
  - `components/Voice.tsx` — Voice/text input + parsing
  - `components/Stats.tsx` — Player statistics
  - `components/Bets.tsx` — Bet tracking & settlement
  - `components/Settings.tsx` — Player profile & prefs
- `styles.css` — Full custom CSS

## Commands
- `bun install` — Install dependencies
- `bun --hot index.ts` — Dev server with hot reload
- `bun seed-demo.ts` — Seed demo data manually

## Environment
- Copy `.env` from `~/Projects/homeschool-assistant/.env`
- Needs `ANTHROPIC_API_KEY` for AI features

## Design
- Golf-premium aesthetic (Augusta National meets modern app)
- Primary: #1B4332 (deep forest green)
- Accent: #D4A843 (gold)
- Mobile-first, bottom tab navigation
- Inter font from Google Fonts
