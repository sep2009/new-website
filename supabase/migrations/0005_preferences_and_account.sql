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
