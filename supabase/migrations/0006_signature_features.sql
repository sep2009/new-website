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
