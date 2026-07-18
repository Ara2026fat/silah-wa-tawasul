# Phase 5 — Cloud Sync Architecture

Written before implementation, per the instruction to review architecture
first. This documents the decisions and why, so the "clean database
schema" and "scalability/maintainability" requirements are traceable.

## Layering (unchanged principle, extended)

Since Phase 1, the rule has been: **UI never touches the database
directly — it goes through a repository module** (`contactsRepo.ts`,
`groupsRepo.ts`), and reads happen via `useLiveQuery` hooks that wrap
Dexie. Phase 5 adds a cloud counterpart without breaking that rule:

```
UI (pages/features)
   |
   |  reads: useLiveQuery hooks (unchanged)
   |  writes: contactsRepo / groupsRepo (unchanged call sites)
   v
Dexie (IndexedDB) — still the only thing the UI's reads depend on
   ^
   |  read/write local rows directly (allowed — this IS the repository layer)
   |
features/sync/syncEngine.ts  <-->  Supabase (Postgres + Auth)
```

`syncEngine.ts` is the repository layer for the cloud side. It's the
**only** module in the codebase that imports `@supabase/supabase-js`.
UI components never import it directly; they only ever see:
- `useSyncStore()` (status, for the indicator)
- `syncNow()` (for the manual button)
- `features/sync/authRepo.ts` (for the sign-in form)

`contactsRepo`/`groupsRepo` call `scheduleSync()` after a local write —
a fire-and-forget, debounced nudge. They do not know whether sync
succeeds, is offline, or isn't configured. This keeps local writes
synchronous-feeling and 100% independent of network state, which is what
makes "the app must continue working perfectly offline" actually true
by construction rather than by discipline.

## Why last-write-wins by row, not by field

The brief specifies "last updated wins." Implementing field-level merge
(e.g. keep the newer `name` from device A and the newer `notes` from
device B on the same row) would need per-field timestamps, which the
brief didn't ask for and which meaningfully complicates the schema and
every write path. Whole-row LWW using the existing `updatedAt` field
that already exists on every write is simpler, predictable, and is what
"last updated wins" means literally. Trade-off, stated plainly: if two
devices edit different fields of the same contact while both offline,
one edit is silently lost. Documented as a known limitation, not hidden.

## Why soft deletes (tombstones)

Two-way sync needs a way to tell other devices "this was deleted," which
a hard `DELETE` can't do — a device that already pulled the row has no
way to learn it's gone. `Contact` and `Group` get an optional
`deletedAt: number | null`. Every read path that lists contacts/groups
now filters `!record.deletedAt`. Deletion still *feels* instant and
permanent to the user (the row disappears immediately, same as before);
the tombstone only matters to the sync layer. `Interaction` doesn't get
this — interactions are append-only in this app (never edited or
individually deleted by the user), so there is nothing to reconcile.

## Why a watermark, not a mutation queue

Two designs were considered for "what needs to be pushed":
1. **Mutation queue** — every write appends a `{table, id, op}` record;
   sync drains the queue.
2. **Watermark** — sync remembers `lastPushedAt`/`lastPulledAt` per
   table and asks "what changed since then?" using the `updatedAt`
   index that already exists.

Watermark was chosen: it's self-healing (a failed sync just retries the
same query next time — nothing to get stuck or duplicated), needs no new
write-time bookkeeping in `contactsRepo`/`groupsRepo` beyond the
`scheduleSync()` nudge, and reuses indexes the schema already has.

## Why env vars, and why sync degrades instead of failing

`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are read at build time. If
either is missing, `isSupabaseConfigured()` returns false and the
Supabase client is never constructed — the Account section shows "cloud
sync isn't set up" and nothing else in the app changes. This matters
because this exact codebase should keep working for anyone who doesn't
want cloud sync at all (the "local-only, privacy by design" user from
Phase 1 is still a fully supported configuration, not a degraded one).

## What was intentionally left out of scope

- **Field-level merge / operational transforms** — see above.
- **Realtime (Supabase Realtime subscriptions)** — "automatic sync when
  internet is available" is satisfied with online-event + interval +
  post-write triggers, which is simpler and cheaper than holding a
  realtime socket open. Can be added later without changing the schema.
- **Account-switch handling** — signing into a *different* account on a
  device that already has locally-synced data from another account isn't
  guarded against. Documented as a limitation, not solved here, since it
  needs a product decision (merge? wipe? block?) that isn't specified.

## New-device default-group race (found and fixed during review)

First boot on a *brand-new local database* always seeds 5 default groups
(`db/seed.ts`, unchanged since Phase 1). That's correct for a fresh
install — but on a **second device signing into an existing account**,
the local database is also empty at first boot, and would otherwise seed
its own 5 default groups (new ids) *before* the first sync pull has a
chance to bring down the real ones from the cloud. Result: two sets of
"default" groups after that first sync, not one.

Fix, in `App.tsx`: if a persisted session already exists at boot (i.e.
this might be a second device, not a fresh account), one bounded sync
attempt (`Promise.race([syncNow(), 4s timeout])`) runs *before*
`ensureDefaultGroups()`. If the cloud has groups, they land locally first
and seeding is skipped (the count-check in `db/seed.ts` already handles
that correctly — no change needed there). A device with no session (every
local-only user, and the overwhelming majority of first opens) is
completely unaffected — same instant boot as before.

Residual limitation, stated plainly: the 4s bound is a best-effort, not a
guarantee. A pull that's still in flight past 4 seconds (very slow or
flaky connection) will still seed locally, and duplicates can occur once
that slow pull eventually lands. This trades a small remaining risk
window for never blocking app boot indefinitely on the network — judged
the right side of that trade-off for an offline-first app.
