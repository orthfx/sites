# orthfx/sites

Many Orthodox parishes — especially smaller or newer ones — have no web presence at all. Building even a basic website requires technical knowledge or money that a small parish may not have. orthfx/sites gives every Orthodox church a free, clean single page at `parish.orthfx.org` with just the essentials: who you are, where you are, when services are, and who to contact. No CMS, no blogging, no complexity. A clergy member or parishioner fills in a simple form, and the parish is online.

## Stack

- Vite + React + TypeScript
- Convex (database, auth, real-time sync)
- shadcn/ui + Tailwind CSS v4

## Development

```bash
npm install
npx convex dev
npm run dev
```

## Multi-tenant routing

All subdomains hit the same SPA. The app reads `window.location.hostname` to determine what to render:

- `orthfx.org` — Landing page
- `orthfx.org/admin` — Admin panel (auth-gated)
- `stmichael.orthfx.org` — Public parish page

For local dev, use `*.localhost` (e.g. `stmichael.localhost:5173`).
