-- STEP 1 of 3 · Fixes 'infinite recursion detected in policy' when saving photos (migrations 0003 + 0004).
-- Paste ALL into Supabase > SQL Editor > New query > Run. Safe to re-run.

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
