
# Project Terminal — Frontend v1

A mobile-first subscription web app that delivers daily pre-match football picks for a Nigerian audience. Built to spec v1.0. All data is mocked; a single typed API client layer makes swapping in the real REST backend a one-file change.

## Scope

All 7 routes from the spec:

- `/` → redirect to `/home` if "logged in", else `/record`
- `/record` — public 90-day track record
- `/signup` — 4-field signup form (mock auth)
- `/home` — daily picks board (auth)
- `/match/:id` — match reason card (auth)
- `/top-pick` — semi-public top pick, locked panel for visitors
- `/settings` — profile + bankroll (auth)

Plus the shared Stake Guide component used inside `/match/:id` and `/top-pick`.

## Mock data + API client

One file, `src/lib/api.ts`, exposes typed functions matching the spec endpoints exactly:

```text
api.getRecord()             → GET /record
api.signup(body)            → POST /auth/signup
api.login(body)             → POST /auth/login
api.logout()                → POST /auth/logout
api.getMe()                 → GET /user/me
api.updateMe(patch)         → PATCH /user/me
api.getTodayPicks()         → GET /picks/today
api.getTopPick()            → GET /picks/today/top
api.getPick(id)             → GET /picks/:id
api.markBacked(id, amount)  → POST /picks/:id/backed
```

Today each function returns hard-coded sample data (Premier League fixtures, realistic Nigerian names, sensible confidences). To go live, replace the function bodies with `fetch()` calls against the real base URL. Nothing else in the app changes.

A small `mockSession` helper in the same file simulates the JWT auth state via `localStorage` so route guards, login/logout, and "subscriber vs visitor" branching on `/top-pick` all work end-to-end.

## Design system

Tokens from spec §8 wired into `src/styles.css` as CSS variables and Tailwind theme:

- Brand green `#1A3A1A`, brand light green `#EAF3DE`
- Amber `#633806` / `#FAEEDA`, info blue `#0C447C` / `#E6F1FB`, danger `#A32D2D` / `#FCEBEB`
- Body `#444441`, subtle bg `#F1EFE8`, border `#D3D1C7`
- System font stack (no web font download — spec is explicit)
- Type scale: H1 24/500, H2 18/500, body 15/400, small 13/400, naira 18/500
- 56px minimum tap targets

## Screens

**`/record` (public)** — Title + subtitle, 3 stat cards (hit rate, ROI, total picks), by-market table with green/red/amber highlighting and paused-market notes, paginated history (20 rows/page) with market + result filters (client-side), Subscribe ₦3,000/month CTA at top and bottom. Skeleton loaders, empty/error states with retry.

**`/signup`** — 4 fields: name, email, WhatsApp (+234 prefilled), starting bankroll. Validation, single submit. On success store mock JWT and route to `/home`. Inline error messages from `response.message`.

**`/home` (auth)** — Date bar ("Tuesday 29 April · Picks live · 06:30 WAT"), Top Pick card (green border, "Best pick today"), then sections Bankers / Value Gems / Wildcards — each only rendered if it has picks. Pick card shows match, plain-English market, kick-off WAT, italic one-liner, confidence bar (green/amber/gray), tier pill. Mobile: tapping expands accordion inline. Desktop: navigates to `/match/:id`. States: pre-06:30 (grayed skeletons + 60s poll), live, no-picks, error. Polling implemented with `setInterval` cleared on `status === "live"`.

**`/match/:id` (auth)** — Match header with tier pill, recent form W/D/L chips for both teams, goals profile bullets, optional risk flag panel (only mounted when non-null), italic model verdict, Stake Guide table, "I backed this" + "Share this pick" buttons. "I backed this" calls `markBacked` then locks to "Backed ✓"; if `user_backed` true on load, render locked immediately. Settled state shows "Won +₦X" / "Lost −₦X". Share button generates a 1200×628 card via `html2canvas` client-side, uses Web Share API on mobile, clipboard fallback on desktop.

**`/top-pick` (semi-public)** — Branches on auth:
- Visitor: partial hero (match, market, confidence, kick-off only), solid opaque locked panel ("Full analysis and stake guide — subscribers only") with Subscribe CTA, link to `/record`. Locked panel is a real placeholder element, not blurred content.
- Subscriber: full hero + all match-card sections + Stake Guide + Share button.

Open Graph meta wired in `head()` so WhatsApp link previews work.

**`/settings` (auth)** — Pre-filled name, WhatsApp, bankroll (editable), email read-only with support note. Save button disabled until dirty, shows spinner while PATCHing, success toast on save. Bankroll change immediately updates Stake Guide everywhere (cached in a small auth/profile context that other screens subscribe to).

## Global

- `src/components/AppShell.tsx` — wraps auth routes with top bar (Terminal wordmark + date) and mobile bottom nav (Today / Top Pick / Record / Settings, 56px tap targets). Desktop gets horizontal top nav.
- `src/lib/auth.tsx` — context exposing `user`, `isAuthed`, `login`, `logout`, `refreshUser`. Loads `getMe()` once on mount when token present.
- `src/lib/stake.ts` — pure functions: `bankerStake`, `gemStake`, `wildcardStake`, `potentialWin(stake, odds)` with the spec's rounding rules (₦100 for stake, ₦10 for win).
- `src/lib/time.ts` — dayjs configured for `Africa/Lagos`, formatter for "19:45 WAT" and "Tuesday 29 April".
- Route guards live in each route's `beforeLoad` — auth routes redirect to `/record`, `/signup` redirects authed users to `/home`.

## Tech notes (for reference)

- TanStack Start + React 19 + Tailwind v4 (existing template)
- New deps: `dayjs`, `html2canvas`
- File-based routing under `src/routes/` — flat dot-separated names (`match.$id.tsx`, `top-pick.tsx`, etc.)
- No real DB / auth / payments. Lovable Cloud not enabled.
