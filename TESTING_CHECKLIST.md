# RC1 — Testing Checklist

Before testing, run on a real machine (this build was verified statically —
see "How this RC1 was verified" below — but has not been through an actual
`npm install`/`vite build` yet):

```bash
npm install
npm run build     # must finish with zero errors
npm run preview   # serves the production build locally
```

Then install it on a real device (Chrome/Android → "Install app"; Safari/iOS
→ Share → "Add to Home Screen") and go through this list.

## Core flows
- [ ] App loads with no blank screen / no console errors on first launch
- [ ] Onboarding modal appears once, "إضافة أول جهة اتصال" opens the add-contact form
- [ ] Bottom nav: all 4 tabs (لوحتي / جهات الاتصال / المجموعات / الإعدادات) switch screens
- [ ] Add a contact → appears in the list and on the dashboard
- [ ] Edit a contact → changes persist after navigating away and back
- [ ] Delete a contact → confirmation shown, contact disappears, toast confirms
- [ ] Favorite toggle persists
- [ ] WhatsApp button opens WhatsApp (or wa.me in browser) with the right number
- [ ] Call button opens the phone dialer with the right number
- [ ] "Mark as contacted" updates last-contacted date and reminder status immediately

## Dashboard
- [ ] All 5 modes (نظرة عامة/العائلة/الأقارب/الأصدقاء/العمل) load without error
- [ ] Switching modes changes the data and accent color, not the layout
- [ ] Health score gauge renders a number (or "—" with zero contacts scheduled)
- [ ] Quick-action row buttons (WhatsApp/Call/Mark) work from the dashboard too

## Groups
- [ ] Add / rename / delete a custom group
- [ ] Default groups can be renamed but have no delete button
- [ ] Group counts on the Groups page match the actual contact counts

## Search & filters
- [ ] Search matches name, phone, and notes
- [ ] Group filter, status filter, and favorites filter all narrow the list
- [ ] "مسح الفلاتر" clears everything back to the full list
- [ ] Empty state differs when you have zero contacts vs. zero filter results

## Settings
- [ ] Theme: light / dark / system all apply immediately and survive an app restart
- [ ] Notification permission prompt appears and reflects granted/denied state
- [ ] Backup: "تنزيل نسخة احتياطية" downloads a `.json` file
- [ ] Restore: loading that file back in restores the data (test on a second device/browser profile if possible)
- [ ] Restoring an unrelated/garbage `.json` file shows an error, doesn't crash
- [ ] "حذف كل شيء" wipes data and leaves the app usable (default groups reappear)

## Persistence
- [ ] Force-close and reopen the app — all contacts/groups/history survived
- [ ] Airplane mode — app still opens and fully functions offline

## PWA install, update, uninstall
- [ ] **Android (Chrome)**: install prompt/menu option appears; installed app opens standalone; icon + name correct on home screen
- [ ] **Windows (Chrome/Edge)**: install icon appears in the address bar; installs as a standalone window; pinnable to Start/taskbar
- [ ] **iPhone (Safari)**: Share → "Add to Home Screen" produces a correctly-named icon (uses the new 180px `apple-touch-icon`, not a blurry scaled one) and opens standalone, no Safari chrome
- [ ] **Update**: bump the version string, deploy, reopen the already-installed app → new version loads without the user having to fully uninstall/reinstall (may need two loads — one to fetch the new service worker, one to activate it; the new `skipWaiting`/`clientsClaim` config should make this fast)
- [ ] **Uninstall**: removing the installed app doesn't affect the browser's own tab if you open the site there separately; reinstalling later restores full functionality (local data persists in the browser's storage, not the installed-app shell)
- [ ] Browser tab (not installed) shows the correct favicon, not a broken/missing icon

## Responsive
- [ ] Phone portrait: bottom tab bar, single-column layout, no horizontal scroll
- [ ] Tablet: layout adapts, dashboard gauge/content use the extra width sensibly
- [ ] Desktop (resize browser wide): side nav rail appears, content stays centered and readable, no stretched/empty giant gaps

## Error handling & resilience
- [ ] Trigger a render error in dev (e.g. temporarily throw inside a page component) → confirm the route-level error screen appears with a working "إعادة المحاولة" button, and the bottom nav/top bar are still usable — navigating away should recover automatically
- [ ] With very poor/throttled network (browser dev tools → Network → "Slow 3G" or similar) while signed in: sync status should settle to "error" within ~20s rather than staying on "جارٍ المزامنة" indefinitely, and a later sync attempt should still succeed once conditions improve

## Accessibility (quick pass)
- [ ] Tab through a modal (e.g. add group) — focus stays trapped inside, Escape closes it
- [ ] All icon-only buttons announce a label when using a screen reader / accessibility inspector

## Cloud sync (only if you've configured `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`)
- [ ] With no env vars set at all: app behaves identically to RC1, no console errors, no network calls to Supabase, Settings shows "cloud sync isn't set up"
- [ ] Sign up with email → confirmation email arrives (check Supabase auth settings if not) → sign in works
- [ ] Google sign-in works (after enabling the provider in Supabase)
- [ ] Sign out and back in → same data reappears
- [ ] Add a contact while offline → go back online → sync status indicator shows "syncing" then "متزامن" → check the row exists in Supabase's table editor
- [ ] Edit the same contact on two different browser profiles (or a second device) signed into the same account → the one saved more recently should win after both sync
- [ ] Delete a contact on device A → sync → open device B → contact disappears there too after its next sync
- [ ] Manual "مزامنة الآن" button triggers an immediate sync and updates "آخر مزامنة" time
- [ ] Turn off wifi mid-edit → contact CRUD still works with zero delay or error → turn wifi back on → sync catches up automatically
- [ ] "حذف كل شيء" (clear all data) while signed in → check Supabase table editor to confirm the cloud rows were also removed
- [ ] Restore a local JSON backup while signed in → confirm the restored contacts eventually appear in Supabase too
- [ ] Sign into the same account on a **fresh install / second device** with an internet connection → confirm you end up with exactly 5 default groups (الوالدان/الإخوة/الأقارب/الأصدقاء/العمل), not 10 — this exercises a fix made during review (see `SYNC_ARCHITECTURE.md` → "New-device default-group race")

---

## How this RC1 was verified (and what wasn't)

This sandbox has no network access, so the following was **not** possible
here and must be your first real check: `npm install`, `npm run build`,
and running the app in an actual browser.

What **was** done to compensate:
- Every `@/...` import in the project was checked to resolve to a real
  file — zero missing.
- Every route (`<Link>`/`navigate()` target) was checked against the
  routes actually registered in the router — zero mismatches.
- The TypeScript compiler was run for real (not simulated) against the
  full source tree, with ambient stub types standing in for the
  uninstalled dependencies (react, dexie, zustand, etc. — typed as `any`
  so tsc can still fully parse and check JSX structure, our own
  interfaces, and unused-import/variable rules). After filtering out the
  errors that are pure artifacts of that stubbing (roughly 100 of them —
  things like generic type arguments on an `any`-typed `forwardRef`),
  **zero real issues remained.** This does not catch bugs that depend on
  the real shape of a library's API, only on `npm install` will that be
  fully covered.
- Config files (`package.json`, `tsconfig.json`) were validated as
  syntactically correct JSON; `tailwind.config.js`/`postcss.config.js`
  were validated with Node's own parser.
- `index.html` tag balance was checked.
- PWA manifest was reviewed and one real issue was fixed: it was locked
  to `orientation: 'portrait'`, which would have fought tablet/desktop use
  of the installed app — removed.
- One real bug was found and fixed in this pass: `GroupsPage` referenced
  `EmptyState` without importing it, which would have been a compile
  error the first time that branch rendered.

None of this replaces an actual build and a real device. Treat this RC1 as
"as verified as it can be without a network-connected build machine," not
as "guaranteed to build."

### Phase 5 (Supabase Cloud Sync) addendum

Same no-network constraint, same verification approach, re-run against
the full codebase including the new `features/sync/`, `lib/supabaseClient.ts`,
and `features/auth`-adjacent code (stub types extended to cover
`@supabase/supabase-js`). Two real issues found and fixed:
- `AccountSection.tsx` imported `useLiveQuery` and `db` but never used
  either — removed.
- A genuine multi-device bug: a second device signing into an existing
  account could seed its own duplicate default groups before the first
  sync pull landed. Fixed with a bounded (4s) sync-before-seed check in
  `App.tsx` when a session already exists at boot. Full write-up in
  `SYNC_ARCHITECTURE.md`.

Additionally checked: every read path that lists contacts or groups
(`useAllContacts`, `useGroups`, `useGroupCounts`, `useDashboardData`)
correctly filters out soft-deleted (`deletedAt`) rows — verified by
reading each one directly, not just scanning for the pattern.

**What's still completely unverified:** the actual Supabase project side
— running `supabase/schema.sql`, RLS behaving as written, OAuth
providers, and a real two-device sync — none of it has ever touched a
real Supabase instance. The "Cloud sync" checklist section above is the
first place that happens.

### Phase 6 (Production-ready hardening) addendum

Same approach again, re-run after adding the error boundary and sync
timeout changes. One more real stub-artifact category was found and
confirmed harmless: TypeScript's class-component JSX checking needs
`JSX.ElementAttributesProperty`/`ElementChildrenAttribute`, which the
stub setup didn't originally define — this made the new `ErrorBoundary`
class component throw spurious errors purely because `Component` itself
comes from the stubbed (`any`-typed) `react` module. Added those two
interfaces to the stub and manually cross-checked `ErrorBoundary.tsx`'s
`this.props`/`this.state` usage against React's documented class
component API — it's the standard, textbook pattern
(`static getDerivedStateFromError`, `componentDidCatch`), so this is
recorded as verified-by-inspection rather than by a clean compiler run.

Two real fixes this pass (both described above, listed here for the
audit trail): removed genuinely dead code (`SYNC_TABLES`/`SyncTable`,
`sendPasswordReset` — both had zero references anywhere, confirmed with
a corrected same-file-aware usage scan after the first pass produced
false positives), and closed a real gap (no error boundaries existed at
all before this pass).
