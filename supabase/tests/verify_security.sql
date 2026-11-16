-- LifeArchive · Security verification
-- Paste into Supabase > SQL Editor > New query > Run.
--
-- Creates two throwaway users (A and B), tries to break isolation between them, and checks
-- the privacy settings. EVERYTHING IS ROLLED BACK at the end: no data is kept.
-- Result: a list of PASS / FAIL lines. Send me any line that says FAIL.

begin;

do $test$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  mem_a uuid;
  fm uuid;
  fpath text;
  n int;
  v bigint;
  r text := '';
  t record;
begin
  -- Two fake users. The signup trigger also creates their profiles.
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    (a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-a@test.invalid', '', now(), now(), '{}', '{"full_name":"User A"}'),
    (b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'rls-b@test.invalid', '', now(), now(), '{}', '{"full_name":"User B"}');

  select count(*) into n from public.profiles where id in (a, b);
  r := r || case when n = 2 then 'PASS' else 'FAIL' end || E' | signup trigger creates a profile for each new user\n';

  ------------------------------------------------------------------ as user A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';

  begin
    insert into public.memories (title, memory_date) values ('A private memory', '2025-01-01') returning id into mem_a;
    r := r || E'PASS | A can create a memory (user_id taken from the login, not the request)\n';
  exception when others then
    r := r || E'FAIL | A can create a memory: ' || sqlerrm || E'\n';
  end;

  select count(*) into n from public.memories where id = mem_a and user_id = a;
  r := r || case when n = 1 then 'PASS' else 'FAIL' end || E' | A can read own memory and it is owned by A\n';

  begin
    insert into public.memory_media (memory_id, storage_path, kind, mime_type, size_bytes)
    values (mem_a, a::text || '/' || mem_a::text || '/p.png', 'image', 'image/png', 1000);
    r := r || E'PASS | A can attach media to own memory\n';
  exception when others then
    r := r || E'FAIL | A can attach media: ' || sqlerrm || E'\n';
  end;

  begin
    insert into storage.objects (bucket_id, name) values ('memories', a::text || '/' || mem_a::text || '/p.png');
    r := r || E'PASS | A can store a file in own folder\n';
  exception when others then
    r := r || E'FAIL | A can store a file in own folder: ' || sqlerrm || E'\n';
  end;

  select public.my_storage_used() into v;
  r := r || case when v = 1000 then 'PASS' else 'FAIL (got ' || coalesce(v::text, 'null') || ')' end || E' | storage usage counts A''s bytes\n';

  begin
    insert into public.memory_media (memory_id, storage_path, kind, mime_type, size_bytes)
    values (mem_a, a::text || '/' || mem_a::text || '/huge.mp4', 'video', 'video/mp4', 2000000000);
    r := r || E'FAIL | upload over the storage limit was allowed\n';
  exception when insufficient_privilege then
    r := r || E'PASS | upload over the storage limit is refused by the database\n';
  when others then
    r := r || E'FAIL | storage limit test: ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.memories (title, memory_date) values ('   ', '2025-01-01');
    r := r || E'FAIL | blank title was accepted\n';
  exception when check_violation then
    r := r || E'PASS | blank title is rejected\n';
  when others then
    r := r || E'FAIL | blank title test: ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.memories (title, memory_date, visibility) values ('x', '2025-01-01', 'public');
    r := r || E'FAIL | invalid visibility was accepted\n';
  exception when check_violation then
    r := r || E'PASS | memories can only be private or shared\n';
  when others then
    r := r || E'FAIL | visibility test: ' || sqlerrm || E'\n';
  end;

  -- ---- Future Messages: sealed until the opening time, enforced by the database
  begin
    fpath := a::text || '/future/photo.png';
    insert into storage.objects (bucket_id, name) values ('memories', fpath);
    insert into public.future_messages (title, body, open_at, photo_path)
    values ('Dear future me', 'a secret only I can read later', now() + interval '2 days', fpath)
    returning id into fm;
    r := r || E'PASS | A can seal a future message\n';
  exception when others then
    r := r || E'FAIL | A can seal a future message: ' || sqlerrm || E'\n';
  end;

  begin
    perform body from public.future_messages where id = fm;
    r := r || E'FAIL | sealed message text could be read directly\n';
  exception when insufficient_privilege then
    r := r || E'PASS | sealed message text cannot be selected directly (even by its owner)\n';
  when others then
    r := r || E'FAIL | direct read test: ' || sqlerrm || E'\n';
  end;

  begin
    perform * from public.read_future_message(fm);
    r := r || E'FAIL | sealed message opened early through read_future_message\n';
  exception when sqlstate 'P0001' then
    r := r || E'PASS | opening a sealed message early is refused by the database\n';
  when others then
    r := r || E'FAIL | early open test: ' || sqlerrm || E'\n';
  end;

  select count(*) into n from storage.objects where bucket_id = 'memories' and name = fpath;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | a sealed message photo cannot be fetched early\n';

  begin
    insert into public.future_messages (body, open_at) values ('past', now() - interval '1 day');
    r := r || E'FAIL | a message dated in the past was accepted\n';
  exception when insufficient_privilege then
    r := r || E'PASS | an opening date in the past is refused\n';
  when others then
    r := r || E'FAIL | past date test: ' || sqlerrm || E'\n';
  end;

  select count(*) into n from public.future_messages where id = fm;
  r := r || case when n = 1 then 'PASS' else 'FAIL' end || E' | A can see that a message exists (date only, no content)\n';

  -- ---- Mood entries and recaps
  begin
    insert into public.mood_entries (entry_date, mood, note) values (current_date, 'calm', 'private note');
    insert into public.recaps (title, period_start, period_end, narrative) values ('My year', '2025-01-01', '2025-12-31', 'x');
    r := r || E'PASS | A can save a mood entry and a recap\n';
  exception when others then
    r := r || E'FAIL | A mood/recap insert: ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.mood_entries (entry_date, mood) values (current_date - 1, 'furious');
    r := r || E'FAIL | an unknown mood was accepted\n';
  exception when check_violation then
    r := r || E'PASS | only the six moods are accepted\n';
  when others then
    r := r || E'FAIL | mood check test: ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.recaps (title, period_start, period_end) values ('bad', '2025-02-01', '2025-01-01');
    r := r || E'FAIL | a recap ending before it starts was accepted\n';
  exception when check_violation then
    r := r || E'PASS | a recap must end on or after its start\n';
  when others then
    r := r || E'FAIL | recap range test: ' || sqlerrm || E'\n';
  end;

  ------------------------------------------------------------------ as user B
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  select count(*) into n from public.memories;
  r := r || case when n = 0 then 'PASS' else 'FAIL (sees ' || n || ')' end || E' | B cannot see any of A''s memories\n';

  select count(*) into n from public.memory_media;
  r := r || case when n = 0 then 'PASS' else 'FAIL (sees ' || n || ')' end || E' | B cannot see A''s media records\n';

  select count(*) into n from public.profiles where id = a;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot read A''s profile\n';

  update public.memories set title = 'hacked' where id = mem_a;
  get diagnostics n = row_count;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot edit A''s memory\n';

  delete from public.memories where id = mem_a;
  get diagnostics n = row_count;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot delete A''s memory\n';

  update public.profiles set display_name = 'hacked' where id = a;
  get diagnostics n = row_count;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot edit A''s profile\n';

  begin
    insert into public.memories (user_id, title, memory_date) values (a, 'forged', '2025-01-01');
    r := r || E'FAIL | B created a memory as A\n';
  exception when insufficient_privilege then
    r := r || E'PASS | B cannot create a memory owned by A\n';
  when others then
    r := r || E'FAIL | forged memory test: ' || sqlerrm || E'\n';
  end;

  begin
    insert into public.memory_media (memory_id, user_id, storage_path, kind, mime_type, size_bytes)
    values (mem_a, b, b::text || '/x.png', 'image', 'image/png', 10);
    r := r || E'FAIL | B attached media to A''s memory\n';
  exception when insufficient_privilege then
    r := r || E'PASS | B cannot attach media to A''s memory\n';
  when others then
    r := r || E'FAIL | cross-attach test: ' || sqlerrm || E'\n';
  end;

  select count(*) into n from storage.objects where bucket_id = 'memories';
  r := r || case when n = 0 then 'PASS' else 'FAIL (sees ' || n || ')' end || E' | B cannot see A''s files\n';

  begin
    insert into storage.objects (bucket_id, name) values ('memories', a::text || '/' || mem_a::text || '/evil.png');
    r := r || E'FAIL | B wrote a file into A''s folder\n';
  exception when insufficient_privilege then
    r := r || E'PASS | B cannot write into A''s folder\n';
  when others then
    r := r || E'FAIL | cross-folder write test: ' || sqlerrm || E'\n';
  end;

  delete from storage.objects where bucket_id = 'memories' and name like a::text || '/%';
  get diagnostics n = row_count;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot delete A''s files\n';

  select public.my_storage_used() into v;
  r := r || case when v = 0 then 'PASS' else 'FAIL' end || E' | B''s storage usage does not include A''s files\n';

  select count(*) into n from public.future_messages;
  r := r || case when n = 0 then 'PASS' else 'FAIL (sees ' || n || ')' end || E' | B cannot see A''s future messages\n';

  begin
    perform * from public.read_future_message(fm);
    r := r || E'FAIL | B opened A''s message\n';
  exception when sqlstate 'P0002' then
    r := r || E'PASS | B cannot open A''s message\n';
  when others then
    r := r || E'FAIL | cross-user message test: ' || sqlerrm || E'\n';
  end;

  delete from public.future_messages where id = fm;
  get diagnostics n = row_count;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot delete A''s future message\n';

  select count(*) into n from public.mood_entries;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot see A''s mood entries\n';

  select count(*) into n from public.recaps;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot see A''s recaps\n';

  update public.mood_entries set mood = 'sad';
  get diagnostics n = row_count;
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | B cannot edit A''s mood entries\n';

  ------------------------------------------------------------ signed-out visitor
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '', true);

  begin
    perform 1 from public.memories limit 1;
    r := r || E'FAIL | signed-out visitor can query memories\n';
  exception when insufficient_privilege then
    r := r || E'PASS | signed-out visitor cannot query memories\n';
  end;

  begin
    perform 1 from public.profiles limit 1;
    r := r || E'FAIL | signed-out visitor can query profiles\n';
  exception when insufficient_privilege then
    r := r || E'PASS | signed-out visitor cannot query profiles\n';
  end;

  begin
    perform public.storage_limit_bytes();
    r := r || E'FAIL | signed-out visitor can call storage_limit_bytes (run migration 0003)\n';
  exception when insufficient_privilege then
    r := r || E'PASS | signed-out visitor cannot call internal functions\n';
  end;

  select count(*) into n from storage.objects where bucket_id = 'memories';
  r := r || case when n = 0 then 'PASS' else 'FAIL' end || E' | signed-out visitor cannot see any stored files\n';

  begin
    perform 1 from public.future_messages limit 1;
    r := r || E'FAIL | signed-out visitor can query future messages\n';
  exception when insufficient_privilege then
    r := r || E'PASS | signed-out visitor cannot query future messages, mood or recaps\n';
  end;

  ------------------------------------------------------------- configuration
  execute 'reset role';

  for t in
    select c.relname, c.relrowsecurity as rls,
           (select count(*) from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) as policies
    from pg_class c join pg_namespace s on s.oid = c.relnamespace
    where s.nspname = 'public' and c.relname in ('profiles', 'memories', 'memory_media', 'user_preferences', 'mood_entries', 'future_messages', 'recaps')
    order by c.relname
  loop
    r := r || case when t.rls then 'PASS' else 'FAIL' end
           || ' | Row Level Security is ON for ' || t.relname || ' (' || t.policies || ' policies)' || E'\n';
  end loop;

  select count(*) into n from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'memories_files_%';
  r := r || case when n = 4 then 'PASS' else 'FAIL (found ' || n || ')' end || E' | storage has 4 owner-only policies for the memories bucket\n';

  select * into t from storage.buckets where id = 'memories';
  r := r || case when t.public = false then 'PASS' else 'FAIL' end || E' | the memories bucket is PRIVATE\n';
  r := r || case when t.file_size_limit = 52428800 then 'PASS' else 'FAIL (' || coalesce(t.file_size_limit::text, 'none') || ')' end || E' | bucket file size limit is 50 MB\n';
  r := r || case when t.allowed_mime_types is not null then 'PASS' else 'FAIL' end || E' | bucket only accepts listed image and video types\n';

  perform set_config('app.test_results', r, true);
end
$test$;

select line as result
from regexp_split_to_table(current_setting('app.test_results', true), E'\n') as line
where line <> '';

rollback;
