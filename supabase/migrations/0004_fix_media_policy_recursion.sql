-- LifeArchive · Migration 0004 · fix "infinite recursion detected in policy for relation memory_media"
-- For a project that already ran 0001 + 0002. Safe to re-run. Creates no tables.

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

drop policy if exists "media_insert_own" on public.memory_media;
create policy "media_insert_own" on public.memory_media
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.memories m
      where m.id = memory_id and m.user_id = (select auth.uid())
    )
    and public.current_user_storage_bytes() + size_bytes <= public.storage_limit_bytes()
  );
