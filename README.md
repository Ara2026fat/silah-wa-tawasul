# صلة وتواصل — Phase 1 (Foundation)

> **RC1** — see [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) for the
> real-device testing checklist and exactly how this build was verified
> (and not verified) before you got it.

PWA foundation for remembering the people who matter and reaching out to them
at the right time. This is **not** a messaging app — no chat, no feed, no
social graph. Just contacts, groups, reminder intervals, and one-tap
WhatsApp/call.

## Stack & why

| Concern | Choice | Why |
|---|---|---|
| App shell | React 18 + TypeScript + Vite | Fast dev loop, small prod bundle, one codebase for every platform below |
| Routing | react-router-dom (`createHashRouter`) | Hash routing needs zero server rewrite rules — works on any static host, important for a PWA users may side-load |
| Data | Dexie (IndexedDB) | Local-first by design (see project principle: *privacy by design*). No backend in Phase 1. |
| Data access pattern | `useLiveQuery` reads directly from Dexie; a thin Zustand store (`uiStore`) holds only ephemeral view state (search text, active filter) | One source of truth for data — no risk of a global store drifting out of sync with the DB |
| Styling | Tailwind, custom token set (olive/clay/ink/sand) | Simple, fast, no component library weight; deliberately avoids the generic cream+terracotta AI-demo look |
| Install/offline | `vite-plugin-pwa` | Generates the manifest + service worker; installs on Android, iOS, Windows, macOS, Linux from one build |
| Cloud sync (optional) | Supabase (Postgres + Auth) via `features/sync/syncEngine.ts` | Dexie stays the only thing the UI reads from; sync is a background push/pull layer on top. Fully optional — see Phase 5 section below. |

## Folder structure

```
src/
  db/            Dexie schema, DB instance, first-run seed (default groups)
  types/         Shared domain types (Contact, Group, Interaction)
  features/      One folder per domain: contacts, groups, reminders, notifications
                 (repo/data-access + feature-specific components live together)
  components/    Generic, feature-agnostic UI (Button, Input, Modal…) and layout shell
  hooks/         Live-query hooks that combine DB reads with derived state
  store/         Zustand — UI state only, not data
  pages/         Route-level screens, composed from features + components
```

## Setup

This sandbox has no network access, so dependencies could not be installed
or the build verified here. On your machine:

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
```

Requires Node 18+.

### Optional: enable cloud sync

The app works fully offline/local with zero setup. To turn on Supabase
sync (Phase 5):

```bash
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your
# Supabase project's Settings -> API page
```

Then run `supabase/schema.sql` once against that project (SQL editor or
`supabase db push`). See `SYNC_ARCHITECTURE.md` for the full design.

## Deploying

This is a static PWA (Vite build output in `dist/`) using hash-based
routing, so it needs **no server-side rewrite rules** — it works on any
static host.

1. Push this repo to GitHub.
2. Connect it to Vercel, Netlify, Cloudflare Pages, or GitHub Pages —
   build command `npm run build`, output directory `dist`.
3. If using cloud sync, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` as environment variables in the host's
   dashboard (same names as `.env.example`). Leave them unset for a
   fully-local deployment with zero backend.
4. `.github/workflows/ci.yml` runs a type-check + production build on
   every push/PR to `main` — set that as a required check before merging
   if you want a broken build blocked automatically.

**Before making the repo public:** this project doesn't currently include
a license file — that's a decision for you to make (MIT/Apache-2.0 for
open source, or none/"all rights reserved" to keep it proprietary), not
something to default silently. GitHub's "Add license" repo creation flow
covers the common choices in one click if you want one.

## What's implemented (Phase 3 — Premium User Experience)

Visual/UX polish only — no architecture or functional changes. Same routes,
same data layer, same components tree; every change below is a styling or
presentation-layer edit.

- **Dark mode**: `light` / `dark` / `system`, chosen in Settings → المظهر, or
  toggled instantly from the icon in every top bar. Persisted to
  `localStorage`; resolves live if you're on "system" and the OS theme
  changes while the app is open. Implemented via Tailwind's `class` strategy
  with a dedicated dark neutral scale (`night`/`mist`) so it stays in the
  same warm palette family instead of switching to generic slate/black.
- **Icon system**: every emoji glyph (📅💬📞⭐️→✕ etc.) replaced with
  `lucide-react` icons, sized and colored consistently through the existing
  design tokens.
- **Consistent spacing**: a single `PageContainer` component now owns page
  padding (tighter on phone, more breathing room from `sm`/`lg` up) instead
  of each page hand-rolling its own `px-4`.
- **Typography**: added `tracking-tight` on headings and `leading-relaxed`
  on body text for better readability; unchanged font pairing (Cairo/Tajawal).
- **Depth & feedback**: a shared `shadow-soft` token on cards, a subtle
  border-color hover on contact rows, and `active:scale-[0.98]` press
  feedback on buttons — all covered by the existing `prefers-reduced-motion`
  override, so nothing moves for people who've asked their OS not to animate.
- **Sticky, blurred top bar** on every screen for a native-app feel while
  scrolling.
- Reviewed every page for consistency: same card radius, same badge/icon
  sizing, same section-heading style, same button variants throughout.

No new dependency was added except `lucide-react` (icons only — no new
data, state, or routing).

## Phase 6 — Production-ready hardening pass (RC2)

No features, no redesign — same scope discipline as RC1. This pass
audited the whole project again (including everything Phase 5 added) and
fixed what it found.

- **Dead code removed**: `SYNC_TABLES`/`SyncTable` (defined, never
  referenced anywhere — not even internally) and `sendPasswordReset`
  (zero call sites, no UI ever wired it up).
- **Error boundaries added** (`src/components/ErrorBoundary.tsx`) — a
  real gap: the app previously had none, so any render error meant a
  blank white screen. Now there are two layers: one around the whole app
  (`main.tsx`, full-reload fallback — a last resort) and one around the
  routed page itself (`App.tsx`, keyed by pathname so navigating away
  from a crashed screen resets it automatically and the nav/theme
  toggle/sync indicator stay usable).
- **Sync timeout**: `syncNow()` previously had no bound — a very slow
  (not fully offline) connection could leave the sync status stuck on
  "syncing" indefinitely and block every later scheduled attempt. Now
  bounded at 20s; a slow pass fails cleanly and retries next cycle
  instead of hanging.
- **PWA install/update reliability**: added `cleanupOutdatedCaches`,
  `skipWaiting`, and `clientsClaim` to the service worker config — without
  these, a PWA that's rarely fully closed (the common case) can silently
  never pick up an update.
- **iOS/Windows PWA correctness**: Safari doesn't fully honor the Web App
  Manifest, so `apple-mobile-web-app-capable`,
  `apple-mobile-web-app-status-bar-style`, and a properly-sized
  180×180 `apple-touch-icon` were added directly to `index.html` (this
  was previously reusing the 192px icon, which works but isn't the size
  Apple actually asks for). Added a real favicon (16/32px) — previously
  absent, meaning every browser tab silently 404'd on `/favicon.ico`.
- **Bundle**: vendor code (`react`/`react-dom`/`react-router-dom`,
  `dexie`/`dexie-react-hooks`/`zustand`, `@supabase/supabase-js`) now
  splits into its own chunks via `manualChunks`, so a normal app update
  re-downloads app code only, not the libraries underneath it.
- **GitHub deployment**: added `.github/workflows/ci.yml` (type-check +
  build on every push/PR, including a build with no Supabase env vars set
  to verify the fully-local path also builds), pinned the Node engine in
  `package.json`, and added a `## Deploying` section to this README.
- **Stale docs fixed**: the RC1-era "Final project audit" section still
  said "No multi-device sync" after Phase 5 added exactly that — updated
  instead of left contradicting a real feature.
- Re-ran the full verification suite (unused-import scan, JSX-import
  cross-check, `@/` path resolution, stubbed-type `tsc` run) across the
  entire codebase including every Phase 5 file — see
  `TESTING_CHECKLIST.md` for the complete, current methodology and
  results.

Version bumped to `1.0.0-rc.2`.

## RC1 — Real-device readiness pass

No features, no redesign — this pass was pure verification and bug-fixing.

- **Real TypeScript compiler run** (not a heuristic script) against the
  full source tree using ambient stub types for the uninstalled
  dependencies. Full methodology and results in `TESTING_CHECKLIST.md`.
  Net result: zero real issues after filtering stub artifacts.
- **Fixed**: PWA manifest was locked to `orientation: 'portrait'`, which
  would have fought tablet/desktop use of the installed app — removed.
- **Fixed**: `GroupsPage` referenced `EmptyState` without importing it —
  would have been a compile error the first time that branch rendered.
  Found via a script checking every JSX tag against its imports.
- **Verified**: every `@/...` import resolves to a real file (zero
  mismatches); every navigation target (`<Link>`/`navigate()`) matches a
  route actually registered in the router (zero mismatches); config files
  are syntactically valid; `index.html` tags balance.
- Version bumped to `1.0.0-rc.1`, shown in Settings → حول التطبيق.

## What's implemented (Phase 5 — Supabase Cloud Sync)

Optional, off by default. With no `VITE_SUPABASE_*` env vars set, the app
is byte-for-byte the same experience as RC1 — no network calls to
Supabase are ever made. Full design rationale in `SYNC_ARCHITECTURE.md`;
summary:

- **Repository layer**: `features/sync/syncEngine.ts` is the *only* file
  in the codebase that imports `@supabase/supabase-js`. UI components
  never touch Supabase directly — they see `useSyncStore()` (status),
  `syncNow()` (manual sync button), and `authRepo.ts` (sign-in form only).
- **Auth**: email/password, Google, and Apple (`features/sync/authRepo.ts`).
  Apple is code-complete but needs your own Apple Developer Services ID
  configured in Supabase's dashboard — that's the "(ready)" in the brief.
- **User profile**: a `profiles` table, one row per user, auto-created on
  sign-up via a Postgres trigger; editable display name in Settings.
- **Two-way sync with last-write-wins**: watermark-based (not a mutation
  queue) — each table remembers `lastPushedAt`/`lastPulledAt` and asks
  "what changed since then?" using the `updatedAt` field every row
  already had. On pull, a remote row only overwrites local if
  `remote.updatedAt > local.updatedAt`. Whole-row LWW, not field-level —
  see `SYNC_ARCHITECTURE.md` for why, and the one real trade-off that
  comes with it.
- **Deletes**: soft (`deletedAt` tombstone) instead of hard, so other
  devices learn about a deletion on their next pull. Every existing read
  path (`useAllContacts`, `useGroups`, `useDashboardData`, etc.) was
  updated to filter `!record.deletedAt` — deletion still looks and feels
  instant and permanent to the user.
- **Automatic sync**: on sign-in, on `online` event, every 5 minutes while
  the app is open, and debounced ~2.5s after any local write. Never blocks
  or delays the local write itself.
- **Sync status indicator**: a small icon in every top bar (idle/syncing/
  offline/error/signed-out/unconfigured), linking to Settings. Manual
  "مزامنة الآن" button in the new "الحساب والمزامنة السحابية" Settings
  section.
- **RLS**: every table scoped to `auth.uid() = user_id` (or `= id` for
  profiles), for all operations. See `supabase/schema.sql`.
- **Backward compatibility**: existing local data (no `deletedAt`,
  pre-Phase-5 installs) upgrades cleanly — Dexie's version-2 schema bump
  only adds new optional/indexed fields and two new local-only tables
  (`profile`, `syncMeta`); nothing existing is migrated or rewritten.
  Local JSON backup/restore (Phase 4) and cloud sync were also made to
  cooperate correctly: restoring a backup resets sync watermarks so the
  restored data gets pushed, and "Clear all data" wipes the cloud copy too
  (best-effort, never blocks the local clear).

## What's implemented (Phase 4 — Production Ready)

No UI redesign, no new screens beyond what quality/stability required. All
of this is either wiring existing pieces together properly, or genuinely
missing production plumbing.

- **Backup & Restore**: Settings → النسخ الاحتياطي والاستعادة. Exports all
  contacts/groups/interactions to a downloadable JSON file
  (`features/backup/backupService.ts`); restoring **replaces** all local
  data after an explicit confirmation (same model as WhatsApp/Telegram
  backup restore — merging would require arbitrary conflict resolution
  the data model doesn't define). A malformed/foreign JSON file is
  rejected with a clear error instead of partially importing.
- **Clear all data**: a danger-zone action in Settings, also confirmed,
  that wipes the database and reseeds the default groups so the app isn't
  left broken afterward.
- **App preferences**: a default reminder interval for new contacts,
  persisted and applied to the "add contact" form.
- **Search**: now debounced (200ms) instead of re-filtering on every
  keystroke, and matches phone/notes in addition to name.
- **Filters**: added a reminder-status filter (متأخر / اقترب / على الموعد /
  بلا تذكير) alongside the existing group/favorites filters, plus a
  one-tap "clear filters."
- **Empty states**: now distinguish "you have no contacts yet" from "your
  filters matched nothing" — the second offers to clear filters instead of
  repeating the "add your first contact" message that wouldn't apply.
- **Loading states**: a real spinner component everywhere the app is
  waiting on IndexedDB, replacing plain "loading..." text.
- **Error handling**: every write (save contact, save/delete group,
  backup/restore) is wrapped in try/catch with a user-facing message
  instead of failing silently or leaving a stuck button.
- **Success messages**: a toast system (`store/toastStore.ts`,
  `components/ui/Toast.tsx`), `aria-live` announced, for every meaningful
  action — save, delete, import, export, restore.
- **First-time onboarding**: a single welcome modal shown once (not a
  multi-step wizard), explaining what the app is *not* and prompting to
  add the first contact.
- **Help & About**: expanded into a short FAQ (how reminder status is
  computed, why notifications aren't background-guaranteed, where data
  lives) plus a version line.
- **Accessibility**: modal now has a real focus trap and returns focus to
  the trigger on close; the health-score gauge has an `aria-label`
  summarizing the score for screen readers; the search input has an
  explicit `aria-label`; toggle buttons expose `aria-pressed`.
- **Performance**: route-level code splitting (`React.lazy` per page, one
  `Suspense` boundary in the shell) so the initial bundle is just the app
  shell; `ContactCard`/`StatCard`/`QuickActionRow` are memoized since
  they're the components most likely to appear in long lists.
- **Final responsive review**: forms (`AddEditContactPage`,
  `ContactDetailPage`) are now capped at a readable max-width on desktop
  instead of stretching edge-to-edge.
- **Code cleanup**: removed a dead, never-called export
  (`daysSince`); extracted the WhatsApp/Call/Mark-as-contacted/Favorite
  logic that had been copy-pasted across `ContactCard`,
  `ContactDetailPage`, and `QuickActionRow` into one
  `features/contacts/useContactActions.ts`; extracted the repeated
  avatar-initial expression into `utils/text.ts`. Also fixed a real bug
  found during this pass: `GroupsPage` referenced `EmptyState` without
  importing it — would have been a compile error the moment the empty
  branch rendered.

## Final project audit

**What's solid:**
- Data layer (Dexie) is the single source of truth everywhere; no
  duplicated state to drift out of sync.
- Every write path now has error handling and user feedback.
- Dark mode, icons, spacing, and now empty/loading/error states are
  consistent across all six screens.
- Backup/restore gives users a real way to not lose their data, and an
  escape hatch (clear all data) that doesn't leave the app broken.

**Known limitations (by design or by platform, not oversights):**
- **Notifications are foreground-only.** No browser lets a PWA wake itself
  at an exact background time without a push server. This was true since
  Phase 1 and remains the single biggest gap between this and a "real"
  reminder app — closing it fully requires a backend.
- **Contact Picker import is Chrome/Android only.** Everyone else uses
  manual entry or the JSON backup/restore path.
- **Backup restore is all-or-nothing**, not a merge. Restoring on top of
  existing data will replace it, not combine it.
- **No automated tests, and no real build has been run.** Given this
  sandbox has no network access to install dependencies, `npm install &&
  npm run build` has still never actually executed against this code. The
  RC1 pass ran the real TypeScript compiler with stubbed dependency types
  to catch structural/logic errors (see `TESTING_CHECKLIST.md` for exactly
  what that did and didn't cover) and fixed what it found, but that is
  not a substitute for a real build and a real device — both are still
  the first things to do with this RC.
- **Multi-device sync is optional and unverified end-to-end.** Phase 5
  added Supabase-based two-way sync (see the Phase 5 section below) —
  this bullet originally said sync didn't exist at all, which Phase 5
  superseded. What's still true: sync has never been exercised against a
  real Supabase project in this sandbox, and is off by default with zero
  behavior change unless explicitly configured.
- **Single language (Arabic, RTL).** No language switcher; not asked for,
  not added.

## What's implemented (Phase 1 scope)

- Contacts: create/edit/delete, phone, notes, favorite, multi-group assignment
- Default groups (الوالدان، الإخوة، الأقارب، الأصدقاء، العمل) seeded on first run, renamable, non-default groups deletable
- Custom groups
- Communication interval per contact → derived "next reminder" + status (متأخر / اقترب / على الموعد / بلا تذكير)
- Last-contacted tracking with a full interaction history (WhatsApp / call / manual)
- One-tap WhatsApp (`wa.me`) and phone (`tel:`) actions from the list and the detail page
- Contact import via the browser Contact Picker API where supported (Chrome/Android only — feature-detected, hidden elsewhere)
- Local notifications: permission request + a foreground/on-open check for due contacts
- IndexedDB storage, fully offline after first load
- Installable PWA manifest + service worker, responsive from phone to desktop

## What's implemented (Phase 2 — Smart Relationship Dashboard)

One dashboard (`src/pages/DashboardPage.tsx`), one layout, five modes
(نظرة عامة / العائلة / الأقارب / الأصدقاء / العمل). Switching modes never
changes the skeleton — only the data, accent color, and which groups feed
the stats change. All numbers come from the real Dexie tables; nothing is
mocked.

- **Mode → data mapping** (`features/dashboard/modes.ts`): each default
  group carries a stable `key` (e.g. `parents`, `work`) set at seed time,
  so a mode still resolves correctly even if the user renames the group.
  Family mode = الوالدان + الإخوة combined; Overview = no filter.
- **Health score** (signature element, `HealthScoreGauge.tsx`): an SVG arc
  gauge, 0–100, averaged only over contacts that actually have a reminder
  interval set (overdue = 0, due soon = 60, on track = 100). Contacts with
  no schedule are excluded from the score rather than counted against it.
  Gradient and label recolor per mode.
- **Weekly / monthly progress** (`ProgressComparisonBar.tsx`): real
  interaction counts for the last 7/30 days vs. the previous 7/30 days —
  a trend, not an invented target, since no target exists in the data model.
- **Status cards**: Today, Overdue, Recently contacted (7-day window),
  Upcoming (next 7 days, excluding today/overdue to avoid double-counting).
- **"Needs your attention now"**: overdue + due-today contacts (favorites
  first, capped at 6) with inline WhatsApp / Call / Mark-as-contacted —
  these write directly to the same `logInteraction` used everywhere else.
- **Group statistics**: per-group total vs. overdue, as a bar list; links
  through to the filtered contacts list via `/contacts?group=<id>`.
- Layout: single-column on phone, `280px` gauge rail + content grid from
  the `lg` breakpoint up. No animation beyond default color transitions.

New nav: Dashboard is now the app's home route (`/`); the contacts list
moved to `/contacts`.

## Known limitations, by design (not bugs)

- **Notifications are not true background alarms.** No browser lets a PWA
  wake itself at an exact future time without a push server. The app checks
  for due contacts on load, on tab focus, and every 30 minutes while open.
  If you need guaranteed background delivery later, that requires adding a
  push service (Phase 2+ decision, out of scope here).
- **Contact import** only works where the Contact Picker API exists today
  (Chrome on Android). iOS/desktop show manual entry instead of a dead button.
- No dashboard, animations, or AI features — intentionally deferred to
  Phases 2–4 per the roadmap.
- **Conflict resolution is whole-row, not per-field.** If two devices edit
  different fields of the same contact while both offline, the older
  edit is silently overwritten on next sync — not merged. Documented in
  `SYNC_ARCHITECTURE.md`, not solved, since field-level merge wasn't
  asked for and meaningfully complicates the schema.
- **Signing into a different account on a device that already has
  locally-synced data from another account isn't guarded against** —
  both accounts' data would mix locally. Needs a product decision (merge/
  wipe/block) that wasn't specified; not implemented.
- **New-device default-group race — mitigated, not fully guaranteed.**
  Found during this review: a second device signing into an existing
  account could seed its own duplicate default groups before the first
  sync pull landed. Fixed by giving one bounded (4s) sync attempt a head
  start on boot when a session already exists. On a very slow connection
  that window can still be missed; see `SYNC_ARCHITECTURE.md` for the
  full write-up.
- **No Realtime.** Sync runs on an interval + online-event + post-write
  debounce, not a live socket — a change on device A can take up to a
  few minutes to reach device B if B is idle and offline events don't fire.
- **Apple sign-in is code-complete but untested** — it needs your own
  Apple Developer Services ID configured in Supabase's dashboard, which
  wasn't available to set up here.

## Project status

Five build phases are complete: Foundation, Smart Dashboard, Premium UX,
Production Ready, and Supabase Cloud Sync. The codebase is
production-shaped: local-first data layer, consistent design system, dark
mode, error handling with user feedback, a backup/restore path, and
optional two-way cloud sync that degrades to fully-local with zero code
changes when not configured.

Note: the original project brief's own Phase 4 ("Intelligence &
Continuous Improvement" — relationship insights, monthly/yearly reports,
Islamic occasion greetings) is **not** what was built here; this Phase 4
was redirected to "Production Ready" per the latest instructions. If the
original Phase 4 is still wanted, it remains open and can build on the
existing `features/dashboard/dashboardMetrics.ts` metrics layer without
rework.

The one gap that can't be closed without new infrastructure is background
push notifications — everything else in "known limitations" above is a
deliberate scope boundary or a platform constraint, not unfinished work.
Cloud sync has never been exercised against a real Supabase project in
this sandbox (no network access) — see `TESTING_CHECKLIST.md` for what
was and wasn't verified, and test sign-in/sync end-to-end before relying
on it.
