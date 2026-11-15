-- Lo mínimo de Supabase para cargar schema.sql en PGlite (Postgres en memoria) durante las pruebas.
-- No se usa en producción.
create schema if not exists auth;
create table if not exists auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
-- auth.uid() lee el usuario "conectado" de una variable de sesión que fijan las pruebas
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as
  $$ select coalesce(nullif(current_setting('test.role', true), ''), 'service_role') $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role; end if;
end $$;
create publication supabase_realtime;
