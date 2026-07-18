-- صلة وتواصل — Phase 5 cloud sync schema
-- Run this once in your Supabase project's SQL editor (or via the CLI:
-- `supabase db push`). Idempotent-ish: safe to re-run on a fresh project;
-- re-running on an already-migrated project will error on the CREATE
-- statements (expected — this isn't a migration tool, just the schema).

-- ============================================================
-- profiles — one row per user, mirrors auth.users
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row the moment someone signs up, so the client
-- never has to handle "profile doesn't exist yet" as a special case.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- groups
-- ============================================================
create table public.groups (
  id text primary key,             -- client-generated id, matches the local Dexie row
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  key text,                        -- semantic key for default groups (parents/siblings/...)
  color text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz           -- tombstone; null = active
);

create index groups_user_updated_idx on public.groups (user_id, updated_at);

-- ============================================================
-- contacts
-- ============================================================
create table public.contacts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text,
  group_ids text[] not null default '{}',
  interval_days int,
  last_contacted_at timestamptz,
  next_reminder_at timestamptz,
  notes text not null default '',
  favorite boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create index contacts_user_updated_idx on public.contacts (user_id, updated_at);

-- ============================================================
-- interactions — append-only communication history
-- ============================================================
create table public.interactions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_id text not null,
  channel text not null check (channel in ('whatsapp', 'call', 'manual')),
  occurred_at timestamptz not null,
  note text not null default ''
);

create index interactions_user_occurred_idx on public.interactions (user_id, occurred_at);

-- ============================================================
-- Row Level Security — every table, every operation, scoped to auth.uid()
-- ============================================================
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.contacts enable row level security;
alter table public.interactions enable row level security;

create policy "profiles: self only" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "groups: owner only" on public.groups
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "contacts: owner only" on public.contacts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "interactions: owner only" on public.interactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Notes
-- ============================================================
-- * Conflict resolution ("last updated wins") happens entirely client-side
--   by comparing `updated_at` on pull — this schema doesn't need triggers
--   or server-side logic for it, only RLS for security.
-- * `id` columns are `text`, not `uuid`, because ids are generated on the
--   client (crypto.randomUUID()) before a row ever reaches the server —
--   required for offline-first writes to work without a round trip.
-- * Enable Email auth under Authentication -> Providers (on by default).
--   Google and Apple both need their OAuth credentials configured in the
--   same screen; the app's sign-in buttons call the standard
--   `signInWithOAuth({ provider: 'google' | 'apple' })` and will work as
--   soon as those providers are turned on — no schema or code changes
--   needed on this end.
