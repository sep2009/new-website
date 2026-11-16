-- LifeArchive · COMPLETE DATABASE SETUP for a NEW project (0001 to 0006)
-- Already ran an earlier version? Run supabase/apply_now.sql instead.
-- Paste ALL of this into Supabase > SQL Editor > New query, then click Run. Safe to re-run.

-- LifeArchive · Migration 0001 · profiles + onboarding preferences
-- Run once in: Supabase Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run.

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text check (char_length(display_name) <= 80),
  bio           text check (char_length(bio) <= 280),
  avatar_url    text,
  use_cases     text[] not null default '{}' check (cardinality(use_cases) <= 10),
  memory_kinds  text[] not null default '{}' check (cardinality(memory_kinds) <= 10),
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security: each user can only ever touch their own row.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No delete policy on purpose: rows are removed when the auth user is deleted.

-- Signed-out visitors get no access at all.
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- Keep updated_at honest.
create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 80), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: profile rows for any users created before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;


-- LifeArchive · Migration 0002 · memories, media, private storage
-- Run AFTER 0001_profiles.sql: Supabase Dashboard > SQL Editor > New query > paste > Run.
-- Safe to re-run.

-- ---------------------------------------------------------------- memories
create table if not exists public.memories (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title          text not null check (char_length(btrim(title)) between 1 and 120),
  memory_date    date not null,
  location_name  text check (char_length(location_name) <= 160),
  latitude       double precision check (latitude between -90 and 90),
  longitude      double precision check (longitude between -180 and 180),
  note           text check (char_length(note) <= 5000),
  tags           text[] not null default '{}' check (cardinality(tags) <= 20),
  is_favorite    boolean not null default false,
  in_journey     boolean not null default false,
  -- Private by default. 'shared' is reserved for the explicit sharing feature.
  visibility     text not null default 'private' check (visibility in ('private', 'shared')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists memories_user_date_idx on public.memories (user_id, memory_date desc);
create index if not exists memories_user_fav_idx on public.memories (user_id) where is_favorite;

-- ------------------------------------------------------------ memory_media
create table if not exists public.memory_media (
  id            uuid primary key default gen_random_uuid(),
  memory_id     uuid not null references public.memories (id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path  text not null unique,
  thumb_path    text,
  kind          text not null check (kind in ('image', 'video')),
  mime_type     text not null,
  size_bytes    bigint not null check (size_bytes > 0),
  width         integer,
  height        integer,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists memory_media_memory_idx on public.memory_media (memory_id, sort_order);
create index if not exists memory_media_user_idx on public.memory_media (user_id);

-- ------------------------------------------------------------ storage limit
-- Per-user storage allowance. Change the number here and re-run this function to adjust.
-- 1 GB = 1073741824 bytes (matches the Supabase free plan's total storage).
create or replace function public.storage_limit_bytes()
returns bigint
language sql
immutable
set search_path = ''
as $$ select 1073741824::bigint $$;

grant execute on function public.storage_limit_bytes() to authenticated;
revoke execute on function public.storage_limit_bytes() from anon;

-- Bytes stored by the signed-in user. Security definer so it can be used inside the
-- memory_media insert policy without recursing; it only ever reads the caller's own rows.
create or replace function public.current_user_storage_bytes()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(size_bytes), 0)::bigint
  from public.memory_media
  where user_id = (select auth.uid());
$$;

revoke execute on function public.current_user_storage_bytes() from public, anon;
grant  execute on function public.current_user_storage_bytes() to authenticated;

-- ------------------------------------------------------ Row Level Security
alter table public.memories enable row level security;
alter table public.memory_media enable row level security;

drop policy if exists "memories_select_own" on public.memories;
create policy "memories_select_own" on public.memories
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "memories_insert_own" on public.memories;
create policy "memories_insert_own" on public.memories
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "memories_update_own" on public.memories;
create policy "memories_update_own" on public.memories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "memories_delete_own" on public.memories;
create policy "memories_delete_own" on public.memories
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "media_select_own" on public.memory_media;
create policy "media_select_own" on public.memory_media
  for select to authenticated using ((select auth.uid()) = user_id);

-- Media may only be attached to a memory the same user owns.
drop policy if exists "media_insert_own" on public.memory_media;
create policy "media_insert_own" on public.memory_media
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.memories m
      where m.id = memory_id and m.user_id = (select auth.uid())
    )
    -- Enforced here, not just in the browser: total stored bytes may not exceed the limit.
    -- Uses a security-definer function: a policy must not query its own table directly
    -- (that causes "infinite recursion detected in policy").
    and public.current_user_storage_bytes() + size_bytes <= public.storage_limit_bytes()
  );

drop policy if exists "media_update_own" on public.memory_media;
create policy "media_update_own" on public.memory_media
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "media_delete_own" on public.memory_media;
create policy "media_delete_own" on public.memory_media
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.memories, public.memory_media from anon;
grant select, insert, update, delete on public.memories, public.memory_media to authenticated;

drop trigger if exists memories_set_updated_at on public.memories;
create trigger memories_set_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------- storage usage
-- security invoker: Row Level Security applies, so it only ever counts the caller's files.
create or replace function public.my_storage_used()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(size_bytes), 0)::bigint from public.memory_media;
$$;

grant execute on function public.my_storage_used() to authenticated;
revoke execute on function public.my_storage_used() from anon;

-- ---------------------------------------------------------- private bucket
-- Not public: files are only reachable through short-lived signed URLs.
-- 50 MB matches Supabase's default per-file cap on the free plan.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memories', 'memories', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif',
        'video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files live at  <user_id>/<memory_id>/<file>.  The first folder must be the caller's id.
drop policy if exists "memories_files_select_own" on storage.objects;
create policy "memories_files_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "memories_files_insert_own" on storage.objects;
create policy "memories_files_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'memories' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "memories_files_update_own" on storage.objects;
create policy "memories_files_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "memories_files_delete_own" on storage.objects;
create policy "memories_files_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'memories' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- LifeArchive · Migration 0003 · tighten function permissions
-- Run once on a project that already ran 0001 + 0002. Safe to re-run. Creates no tables.
--
-- Postgres grants EXECUTE on new functions to everyone (PUBLIC) by default, so the earlier
-- "revoke ... from anon" did not take effect. Close that gap.

revoke execute on function public.storage_limit_bytes() from public, anon;
revoke execute on function public.my_storage_used()     from public, anon;
grant  execute on function public.storage_limit_bytes() to authenticated;
grant  execute on function public.my_storage_used()     to authenticated;

-- Trigger helpers must never be callable through the API.
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;


-- LifeArchive · Migration 0005 · preferences, birth year, account deletion
-- Run AFTER 0001-0004. Safe to re-run. Does not touch existing data.

-- ------------------------------------------------------------ profile additions
-- Optional. Used only to apply stricter privacy defaults for people under 18.
alter table public.profiles
  add column if not exists birth_year smallint check (birth_year between 1900 and 2100);

-- ------------------------------------------------------------ user_preferences
create table if not exists public.user_preferences (
  user_id                 uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  notify_on_this_day      boolean not null default true,
  notify_future_messages  boolean not null default true,
  notify_account          boolean not null default true,
  -- Private by default: place names are left out when sharing unless the person opts in.
  share_location          boolean not null default false,
  default_view            text    not null default 'grid' check (default_view in ('grid', 'list')),
  reduce_motion           boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "prefs_select_own" on public.user_preferences;
create policy "prefs_select_own" on public.user_preferences
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prefs_insert_own" on public.user_preferences;
create policy "prefs_insert_own" on public.user_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "prefs_update_own" on public.user_preferences;
create policy "prefs_update_own" on public.user_preferences
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Rows are removed with the account (on delete cascade); no direct delete policy.
revoke all on public.user_preferences from anon;
grant select, insert, update on public.user_preferences to authenticated;

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ account deletion
-- Lets a signed-in person delete their OWN account without any service key in the app.
-- Deleting the auth user cascades to profile, memories, media records and preferences.
-- (Stored files are removed by the app first, through the Storage API.)
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant  execute on function public.delete_my_account() to authenticated;


-- LifeArchive · Migration 0006 · Mood Tracker, Future Messages, Life Recaps
-- Run AFTER 0001-0005. Safe to re-run. Does not touch existing data.

-- =============================================================== mood_entries
-- One optional entry per person per day. Private. No scores, no streaks.
create table if not exists public.mood_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_date  date not null,
  mood        text not null check (mood in ('happy', 'excited', 'calm', 'tired', 'stressed', 'sad')),
  note        text check (char_length(note) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);
create index if not exists mood_entries_user_date_idx on public.mood_entries (user_id, entry_date desc);

alter table public.mood_entries enable row level security;

drop policy if exists "mood_select_own" on public.mood_entries;
create policy "mood_select_own" on public.mood_entries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "mood_insert_own" on public.mood_entries;
create policy "mood_insert_own" on public.mood_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "mood_update_own" on public.mood_entries;
create policy "mood_update_own" on public.mood_entries
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "mood_delete_own" on public.mood_entries;
create policy "mood_delete_own" on public.mood_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.mood_entries from anon;
grant select, insert, update, delete on public.mood_entries to authenticated;

drop trigger if exists mood_entries_set_updated_at on public.mood_entries;
create trigger mood_entries_set_updated_at
  before update on public.mood_entries
  for each row execute function public.set_updated_at();

-- ========================================================== future_messages
-- A letter to your future self. The text, title and photo are NOT readable until the opening
-- time, even by the owner, even through the API: those columns have no SELECT privilege.
-- Reading goes through read_future_message(), which checks the date on the database server.
create table if not exists public.future_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text check (char_length(title) <= 120),
  body        text not null check (char_length(btrim(body)) between 1 and 10000),
  photo_path  text,
  open_at     timestamptz not null,
  opened_at   timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists future_messages_user_open_idx on public.future_messages (user_id, open_at);

alter table public.future_messages enable row level security;

-- Per-person cap on messages that are still sealed or waiting to be opened. Change the number to adjust.
create or replace function public.future_message_limit()
returns integer language sql immutable set search_path = '' as $$ select 20 $$;

-- Security definer so the insert policy can count without querying its own table (no recursion).
create or replace function public.active_future_messages()
returns integer
language sql stable security definer set search_path = ''
as $$
  select count(*)::integer from public.future_messages
  where user_id = (select auth.uid()) and opened_at is null;
$$;

drop policy if exists "fm_select_own" on public.future_messages;
create policy "fm_select_own" on public.future_messages
  for select to authenticated using ((select auth.uid()) = user_id);

-- The opening date is validated here, by the database: it must be in the future (and not absurdly far).
drop policy if exists "fm_insert_own" on public.future_messages;
create policy "fm_insert_own" on public.future_messages
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and open_at > now()
    and open_at < now() + interval '100 years'
    and opened_at is null
    and public.active_future_messages() < public.future_message_limit()
  );

drop policy if exists "fm_delete_own" on public.future_messages;
create policy "fm_delete_own" on public.future_messages
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Column-level privileges: the sensitive columns can never be selected directly.
revoke all on public.future_messages from anon, authenticated;
grant select (id, user_id, open_at, opened_at, created_at, photo_path) on public.future_messages to authenticated;
grant insert (title, body, photo_path, open_at) on public.future_messages to authenticated;
grant delete on public.future_messages to authenticated;
-- (No UPDATE: a sealed message cannot be edited or have its date moved. Delete and rewrite instead.)

-- Returns the message only if its opening time has passed. Marks it opened.
create or replace function public.read_future_message(p_id uuid)
returns table (title text, body text, photo_path text, open_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  m public.future_messages%rowtype;
begin
  select * into m from public.future_messages f
  where f.id = p_id and f.user_id = (select auth.uid());
  if not found then
    raise exception 'Message not found.' using errcode = 'P0002';
  end if;
  if m.open_at > now() then
    raise exception 'This message is still sealed.' using errcode = 'P0001';
  end if;
  if m.opened_at is null then
    update public.future_messages set opened_at = now() where id = m.id;
  end if;
  return query select m.title, m.body, m.photo_path, m.open_at, m.created_at;
end;
$$;

revoke execute on function public.read_future_message(uuid) from public, anon;
grant  execute on function public.read_future_message(uuid) to authenticated;
revoke execute on function public.active_future_messages() from public, anon;
grant  execute on function public.active_future_messages() to authenticated;
revoke execute on function public.future_message_limit() from public, anon;
grant  execute on function public.future_message_limit() to authenticated;

-- A photo attached to a future message can't be fetched early either:
-- files in <user>/future/ are only readable once the message's opening time has passed.
drop policy if exists "memories_files_select_own" on storage.objects;
create policy "memories_files_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (
      (storage.foldername(name))[2] is distinct from 'future'
      or exists (
        select 1 from public.future_messages m
        where m.photo_path = name and m.user_id = (select auth.uid()) and m.open_at <= now()
      )
    )
  );

-- ================================================================== recaps
-- Saved Life Recaps: a title, a date range, an editable narrative and the chosen memories.
create table if not exists public.recaps (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null check (char_length(btrim(title)) between 1 and 120),
  period_start  date not null,
  period_end    date not null,
  narrative     text check (char_length(narrative) <= 8000),
  memory_ids    uuid[] not null default '{}' check (cardinality(memory_ids) <= 300),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (period_end >= period_start)
);
create index if not exists recaps_user_idx on public.recaps (user_id, created_at desc);

alter table public.recaps enable row level security;

drop policy if exists "recaps_select_own" on public.recaps;
create policy "recaps_select_own" on public.recaps
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "recaps_insert_own" on public.recaps;
create policy "recaps_insert_own" on public.recaps
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "recaps_update_own" on public.recaps;
create policy "recaps_update_own" on public.recaps
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "recaps_delete_own" on public.recaps;
create policy "recaps_delete_own" on public.recaps
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.recaps from anon;
grant select, insert, update, delete on public.recaps to authenticated;

drop trigger if exists recaps_set_updated_at on public.recaps;
create trigger recaps_set_updated_at
  before update on public.recaps
  for each row execute function public.set_updated_at();


