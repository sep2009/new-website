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
