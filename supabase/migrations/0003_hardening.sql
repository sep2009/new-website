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
