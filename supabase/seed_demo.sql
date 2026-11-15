-- =====================================================================
-- AstroHealth · Eco — Datos de prueba de la demo
-- Ejecutar DESPUÉS de schema.sql. Se puede volver a ejecutar.
--
-- Carga: 1 misión rumbo a Marte, 4 zonas (incluido el refugio),
-- 4 tripulantes ficticios, sus sensores, los sensores de cada zona,
-- el reloj simulado y los permisos (todos apagados al inicio).
--
-- Usuarios: créalos primero en Supabase → Authentication → Users con
-- estos correos de prueba (o cambia los correos abajo). Si un usuario no
-- existe todavía, su fila simplemente no se crea.
--   tripulante1@astrohealth.test … tripulante4@astrohealth.test
--   medico@astrohealth.test
--   simulador@astrohealth.test
-- =====================================================================

-- Misión
insert into public.missions (id, name, destination, start_date, end_date_planned, comm_delay_s) values
  ('a0000000-0000-4000-8000-000000000001', 'Misión Horizonte', 'Marte', '2027-01-10', '2029-12-01', 720)
on conflict (id) do nothing;

-- Zonas de la nave (shielding_factor: cuántas veces menos radiación que la cabina principal ⚠️)
insert into public.vehicle_zones (id, mission_id, name, shielding_factor, is_shelter, capacity) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Cabina principal', 1.0,  false, 6),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Laboratorio',      1.2,  false, 3),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Dormitorios',      2.0,  false, 4),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Refugio blindado', 10.0, true,  4)
on conflict (id) do nothing;

-- Tripulación ficticia
insert into public.crew_members (id, mission_id, display_name, role_title, language, avatar_color, prior_career_dose_msv, career_limit_msv) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Ana Ríos',   'Comandante',         'es', '#4F7CAC', 120, 600),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Leo Marín',  'Ingeniero de vuelo', 'es', '#C0844A', 45,  600),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Sam Okoro',  'Médico a bordo',     'en', '#5E9C76', 0,   600),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Mei Tanaka', 'Científica',         'en', '#9A6FB0', 30,  600)
on conflict (id) do nothing;

-- Sensores personales: wearable y dosímetro de cada tripulante
insert into public.sensors (id, mission_id, kind, zone_id, crew_member_id) values
  ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'wearable',           null, 'c0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'personal_dosimeter', null, 'c0000000-0000-4000-8000-000000000001'),
  ('d0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'wearable',           null, 'c0000000-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'personal_dosimeter', null, 'c0000000-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'wearable',           null, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'personal_dosimeter', null, 'c0000000-0000-4000-8000-000000000003'),
  ('d0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'wearable',           null, 'c0000000-0000-4000-8000-000000000004'),
  ('d0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'personal_dosimeter', null, 'c0000000-0000-4000-8000-000000000004')
on conflict (id) do nothing;

-- Sensores de zona: ambiente de cabina y dosímetro de área en cada zona
insert into public.sensors (id, mission_id, kind, zone_id, crew_member_id) values
  ('d0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', 'cabin_env',      'b0000000-0000-4000-8000-000000000001', null),
  ('d0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000001', 'area_dosimeter', 'b0000000-0000-4000-8000-000000000001', null),
  ('d0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000001', 'cabin_env',      'b0000000-0000-4000-8000-000000000002', null),
  ('d0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000001', 'area_dosimeter', 'b0000000-0000-4000-8000-000000000002', null),
  ('d0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000001', 'cabin_env',      'b0000000-0000-4000-8000-000000000003', null),
  ('d0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000001', 'area_dosimeter', 'b0000000-0000-4000-8000-000000000003', null),
  ('d0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000001', 'cabin_env',      'b0000000-0000-4000-8000-000000000004', null),
  ('d0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000001', 'area_dosimeter', 'b0000000-0000-4000-8000-000000000004', null)
on conflict (id) do nothing;

-- Reloj simulado: día 142 de la misión, detenido; la consola D1 lo arranca
insert into public.simulation_state (mission_id, sim_clock, time_speed, running) values
  ('a0000000-0000-4000-8000-000000000001', '2027-06-01 08:00:00+00', 60, false)
on conflict (mission_id) do nothing;

-- Permisos: todos apagados al inicio (el tripulante los activa en T1 o T8)
insert into public.consents (crew_member_id, scope, granted)
select c.id, s.scope, false
  from public.crew_members c
 cross join (values ('mood_trend'::public.consent_scope), ('sleep_trend'::public.consent_scope)) as s(scope)
 where c.mission_id = 'a0000000-0000-4000-8000-000000000001'
on conflict (crew_member_id, scope) do nothing;

-- Usuarios de la app (solo si ya existen en Authentication)
insert into public.app_users (id, role, mission_id, crew_member_id, display_name)
select u.id, x.role::public.user_role, 'a0000000-0000-4000-8000-000000000001', x.crew_id::uuid, x.display_name
  from (values
    ('tripulante1@astrohealth.test', 'crew',      'c0000000-0000-4000-8000-000000000001', 'Ana Ríos'),
    ('tripulante2@astrohealth.test', 'crew',      'c0000000-0000-4000-8000-000000000002', 'Leo Marín'),
    ('tripulante3@astrohealth.test', 'crew',      'c0000000-0000-4000-8000-000000000003', 'Sam Okoro'),
    ('tripulante4@astrohealth.test', 'crew',      'c0000000-0000-4000-8000-000000000004', 'Mei Tanaka'),
    ('medico@astrohealth.test',      'surgeon',   null,                                   'Médico de vuelo'),
    ('simulador@astrohealth.test',   'simulator', null,                                   'Consola de demo')
  ) as x(email, role, crew_id, display_name)
  join auth.users u on lower(u.email) = x.email
on conflict (id) do update set
  role = excluded.role, mission_id = excluded.mission_id,
  crew_member_id = excluded.crew_member_id, display_name = excluded.display_name;
