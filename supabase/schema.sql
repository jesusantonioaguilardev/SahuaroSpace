-- =====================================================================
-- AstroHealth · Eco — Base de datos de la misión (Supabase / Postgres 15+)
-- Diseño: docs/es/09-diagrama-bd.md
--
-- Cómo usarlo: pega este archivo completo en el SQL Editor de Supabase y
-- ejecútalo. Es idempotente: se puede volver a ejecutar sin romper nada.
-- Después ejecuta seed_demo.sql para cargar la misión de prueba.
--
-- Regla principal: las conversaciones con Eco, el diario y las notas
-- NO están aquí. Viven cifradas en el dispositivo del tripulante.
--
-- Diferencias con el documento 09 (detalles que salieron al escribirlo):
--   * alerts.zone_id: las alertas de cabina necesitan saber de qué zona son.
--   * alert_types.metric: une cada dato con su tipo de alerta.
--   * space_weather_events.mission_id: misión que reproduce el evento
--     (nulo = aplica a todas las misiones).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enumeraciones
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('crew', 'surgeon', 'simulator', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'sensor_kind') then
    create type public.sensor_kind as enum ('wearable', 'personal_dosimeter', 'area_dosimeter', 'cabin_env');
  end if;
  if not exists (select 1 from pg_type where typname = 'metric') then
    create type public.metric as enum (
      'dose_rate_usv_h', 'neutron_dose_rate_usv_h',
      'spo2_pct', 'heart_rate_bpm', 'resp_rate_bpm',
      'sleep_minutes', 'sleep_interruptions',
      'cabin_o2_pct', 'cabin_pressure_psia', 'cabin_co2_mmhg', 'cabin_temp_c'
    );
  end if;
  -- El orden importa: normal < attention < urgent (se usa max() sobre el enum)
  if not exists (select 1 from pg_type where typname = 'alert_level') then
    create type public.alert_level as enum ('normal', 'attention', 'urgent');
  end if;
  if not exists (select 1 from pg_type where typname = 'alert_status') then
    create type public.alert_status as enum ('active', 'acknowledged', 'resolved');
  end if;
  if not exists (select 1 from pg_type where typname = 'symptom') then
    create type public.symptom as enum ('headache', 'confusion', 'vision', 'dizziness', 'shortness_of_breath', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'escalation_category') then
    create type public.escalation_category as enum ('self_harm_risk', 'acute_panic', 'other_serious');
  end if;
  if not exists (select 1 from pg_type where typname = 'consent_scope') then
    create type public.consent_scope as enum ('mood_trend', 'sleep_trend');
  end if;
  if not exists (select 1 from pg_type where typname = 'shift_kind') then
    create type public.shift_kind as enum ('rest', 'watch');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 2. Catálogos
-- ---------------------------------------------------------------------
create table if not exists public.missions (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  destination      text not null,
  start_date       date not null,
  end_date_planned date,
  comm_delay_s     int  not null default 0 check (comm_delay_s >= 0),
  created_at       timestamptz not null default now()
);

create table if not exists public.alert_types (
  code          text primary key,
  metric        public.metric unique,          -- nulo si no sale de un sensor
  default_level public.alert_level not null,
  title_es      text not null,
  title_en      text not null,
  steps_es      jsonb not null default '[]'::jsonb,   -- de 1 a 3 pasos
  steps_en      jsonb not null default '[]'::jsonb
);

-- Un nivel se dispara si value < min_value o value > max_value.
-- Solo hay filas para 'attention' y 'urgent'.
create table if not exists public.thresholds (
  metric     public.metric not null,
  level      public.alert_level not null check (level <> 'normal'),
  min_value  numeric,
  max_value  numeric,
  source_url text,
  verified   bool not null default false,   -- false = valor ⚠️ por comprobar
  primary key (metric, level)
);

-- ---------------------------------------------------------------------
-- 3. Personas
-- ---------------------------------------------------------------------
create table if not exists public.crew_members (
  id                    uuid primary key default gen_random_uuid(),
  mission_id            uuid not null references public.missions(id) on delete cascade,
  display_name          text not null,
  role_title            text,
  language              text not null default 'es' check (language in ('es', 'en')),
  avatar_color          text,
  prior_career_dose_msv numeric not null default 0 check (prior_career_dose_msv >= 0),
  career_limit_msv      numeric not null default 600 check (career_limit_msv > 0),  -- ⚠️ NASA-STD-3001
  created_at            timestamptz not null default now()
);

create table if not exists public.app_users (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           public.user_role not null,
  mission_id     uuid not null references public.missions(id) on delete cascade,
  crew_member_id uuid unique references public.crew_members(id) on delete set null,
  display_name   text,
  check ((role = 'crew') = (crew_member_id is not null))
);

create table if not exists public.rules_acceptance (
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  rules_version  text not null,
  accepted_at    timestamptz not null default now(),
  primary key (crew_member_id, rules_version)
);

-- ---------------------------------------------------------------------
-- 4. Nave y sensores
-- ---------------------------------------------------------------------
create table if not exists public.vehicle_zones (
  id               uuid primary key default gen_random_uuid(),
  mission_id       uuid not null references public.missions(id) on delete cascade,
  name             text not null,
  shielding_factor numeric not null default 1 check (shielding_factor >= 1),
  is_shelter       bool not null default false,
  capacity         int check (capacity > 0)
);

create table if not exists public.sensors (
  id             uuid primary key default gen_random_uuid(),
  mission_id     uuid not null references public.missions(id) on delete cascade,
  kind           public.sensor_kind not null,
  zone_id        uuid references public.vehicle_zones(id) on delete set null,
  crew_member_id uuid references public.crew_members(id) on delete cascade,
  active         bool not null default true,
  last_seen_at   timestamptz,
  -- personal (wearable, dosímetro personal) → tripulante; de área (dosímetro de área, cabina) → zona
  check (
    (kind in ('wearable', 'personal_dosimeter') and crew_member_id is not null)
    or (kind in ('area_dosimeter', 'cabin_env') and crew_member_id is null and zone_id is not null)
  )
);

-- ---------------------------------------------------------------------
-- 5. Datos
-- ---------------------------------------------------------------------
create table if not exists public.sensor_readings (
  id             bigint generated always as identity primary key,
  sensor_id      uuid not null references public.sensors(id) on delete cascade,
  crew_member_id uuid references public.crew_members(id) on delete cascade,
  zone_id        uuid references public.vehicle_zones(id) on delete set null,
  metric         public.metric not null,
  value          numeric not null,
  recorded_at    timestamptz not null     -- hora simulada (simulation_state.sim_clock)
);
create index if not exists sensor_readings_crew_idx   on public.sensor_readings (crew_member_id, metric, recorded_at desc);
create index if not exists sensor_readings_zone_idx   on public.sensor_readings (zone_id, metric, recorded_at desc);
create index if not exists sensor_readings_sensor_idx on public.sensor_readings (sensor_id, metric, recorded_at desc);

create table if not exists public.sensor_readings_hourly (
  sensor_id      uuid not null references public.sensors(id) on delete cascade,
  metric         public.metric not null,
  hour           timestamptz not null,
  crew_member_id uuid references public.crew_members(id) on delete cascade,
  zone_id        uuid references public.vehicle_zones(id) on delete set null,
  avg_value      numeric not null,
  min_value      numeric not null,
  max_value      numeric not null,
  samples        int not null,
  primary key (sensor_id, metric, hour)
);
create index if not exists sensor_readings_hourly_crew_idx on public.sensor_readings_hourly (crew_member_id, metric, hour desc);

create table if not exists public.baselines (
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  metric         public.metric not null,
  mean           numeric not null,
  stddev         numeric not null default 0,
  samples        int not null default 0,
  updated_at     timestamptz not null default now(),
  primary key (crew_member_id, metric)
);

create table if not exists public.dose_daily (
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  day            date not null,
  total_msv      numeric not null default 0,
  gcr_msv        numeric not null default 0,
  spe_msv        numeric not null default 0,
  neutron_msv    numeric not null default 0,   -- parte de total_msv; se muestra aparte
  primary key (crew_member_id, day)
);

create table if not exists public.zone_dose_daily (
  zone_id     uuid not null references public.vehicle_zones(id) on delete cascade,
  day         date not null,
  total_msv   numeric not null default 0,
  neutron_msv numeric not null default 0,
  primary key (zone_id, day)
);

-- ---------------------------------------------------------------------
-- 6. Clima espacial y refugio
-- ---------------------------------------------------------------------
create table if not exists public.space_weather_events (
  id          uuid primary key default gen_random_uuid(),
  mission_id  uuid references public.missions(id) on delete cascade,  -- nulo = todas
  source      text not null check (source in ('DONKI', 'SWPC', 'SIM')),
  external_id text not null,
  event_type  text not null,              -- p. ej. 'SEP'
  s_scale     int check (s_scale between 0 and 5),
  starts_at   timestamptz not null,
  peak_at     timestamptz,
  ends_at     timestamptz,
  raw         jsonb,
  unique (source, external_id, mission_id)
);

create table if not exists public.shelter_sessions (
  id                   uuid primary key default gen_random_uuid(),
  mission_id           uuid not null references public.missions(id) on delete cascade,
  event_id             uuid references public.space_weather_events(id) on delete set null,
  zone_id              uuid not null references public.vehicle_zones(id),
  started_at           timestamptz not null,
  expected_end_at      timestamptz,
  ended_at             timestamptz,
  dose_avoided_est_msv numeric
);
-- Solo un refugio abierto por misión
create unique index if not exists shelter_sessions_one_open on public.shelter_sessions (mission_id) where ended_at is null;

create table if not exists public.shelter_assignments (
  session_id     uuid not null references public.shelter_sessions(id) on delete cascade,
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  zone_id        uuid not null references public.vehicle_zones(id),
  arrived_at     timestamptz,
  primary key (session_id, crew_member_id)
);

create table if not exists public.shelter_shifts (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.shelter_sessions(id) on delete cascade,
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  kind           public.shift_kind not null,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  check (ends_at > starts_at)
);
create index if not exists shelter_shifts_session_idx on public.shelter_shifts (session_id, starts_at);

-- ---------------------------------------------------------------------
-- 7. Alertas
-- ---------------------------------------------------------------------
create table if not exists public.alerts (
  id                 uuid primary key default gen_random_uuid(),
  mission_id         uuid not null references public.missions(id) on delete cascade,
  crew_member_id     uuid references public.crew_members(id) on delete cascade,  -- nulo = toda la nave
  zone_id            uuid references public.vehicle_zones(id) on delete set null,
  alert_type_id      text not null references public.alert_types(code),
  shelter_session_id uuid references public.shelter_sessions(id) on delete set null,
  level              public.alert_level not null check (level <> 'normal'),
  status             public.alert_status not null default 'active',
  metric             public.metric,
  value              numeric,
  message_es         text not null,
  message_en         text not null,
  created_at         timestamptz not null default now(),
  spoken_at          timestamptz,
  acknowledged_at    timestamptz,
  acknowledged_by    uuid references public.app_users(id) on delete set null,
  resolved_at        timestamptz,
  resolved_by        uuid references public.app_users(id) on delete set null,
  note               text                 -- solo el médico
);
create index if not exists alerts_mission_status_idx on public.alerts (mission_id, status, created_at desc);
create index if not exists alerts_crew_idx on public.alerts (crew_member_id, created_at desc);

create table if not exists public.alert_acknowledgements (
  alert_id        uuid not null references public.alerts(id) on delete cascade,
  user_id         uuid not null references public.app_users(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  primary key (alert_id, user_id)
);

-- Decisión: los síntomas físicos se comparten siempre con el médico, sin nota.
create table if not exists public.symptom_reports (
  id             uuid primary key default gen_random_uuid(),
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  symptom        public.symptom not null,
  reported_at    timestamptz not null default now()
);
create index if not exists symptom_reports_crew_idx on public.symptom_reports (crew_member_id, reported_at desc);

-- Sin texto de la conversación: solo la categoría y la hora.
create table if not exists public.emergency_escalations (
  id              uuid primary key default gen_random_uuid(),
  crew_member_id  uuid not null references public.crew_members(id) on delete cascade,
  category        public.escalation_category not null,
  created_at      timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.app_users(id) on delete set null,
  resolved_at     timestamptz
);

-- ---------------------------------------------------------------------
-- 8. Privacidad
-- ---------------------------------------------------------------------
create table if not exists public.consents (
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  scope          public.consent_scope not null,
  granted        bool not null default false,
  updated_at     timestamptz not null default now(),
  primary key (crew_member_id, scope)
);

create table if not exists public.consent_log (
  id             uuid primary key default gen_random_uuid(),
  crew_member_id uuid not null references public.crew_members(id) on delete cascade,
  scope          public.consent_scope not null,
  granted        bool not null,
  changed_at     timestamptz not null default now()
);

-- Solo promedios diarios. Un disparador borra lo que no tenga permiso.
create table if not exists public.wellbeing_trends (
  crew_member_id    uuid not null references public.crew_members(id) on delete cascade,
  day               date not null,
  mood_avg          numeric check (mood_avg between 1 and 5),
  stress_avg        numeric check (stress_avg between 1 and 5),
  energy_avg        numeric check (energy_avg between 1 and 5),
  sleep_quality_avg numeric check (sleep_quality_avg between 1 and 5),
  primary key (crew_member_id, day)
);

create table if not exists public.surgeon_access_log (
  id              uuid primary key default gen_random_uuid(),
  surgeon_user_id uuid not null references public.app_users(id) on delete cascade,
  crew_member_id  uuid not null references public.crew_members(id) on delete cascade,
  resource        text not null,          -- p. ej. 'M2:radiation', 'M1:wellbeing'
  viewed_at       timestamptz not null default now()
);
create index if not exists surgeon_access_log_crew_idx on public.surgeon_access_log (crew_member_id, viewed_at desc);

-- ---------------------------------------------------------------------
-- 9. Informes y demo
-- ---------------------------------------------------------------------
create table if not exists public.daily_reports (
  id               uuid primary key default gen_random_uuid(),
  mission_id       uuid not null references public.missions(id) on delete cascade,
  day              date not null,
  summary          jsonb not null default '{}'::jsonb,
  created_by       uuid references public.app_users(id) on delete set null,
  created_at       timestamptz not null default now(),
  sent_to_earth_at timestamptz,
  unique (mission_id, day)
);

create table if not exists public.simulation_state (
  mission_id uuid primary key references public.missions(id) on delete cascade,
  sim_clock  timestamptz not null,
  time_speed int not null default 1 check (time_speed > 0),
  running    bool not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.simulation_events (
  id           uuid primary key default gen_random_uuid(),
  mission_id   uuid not null references public.missions(id) on delete cascade,
  kind         text not null,            -- 'solar_storm', 'lower_o2', 'raise_co2', 'bad_sleep', 'reset'...
  params       jsonb not null default '{}'::jsonb,
  triggered_by uuid references public.app_users(id) on delete set null,
  triggered_at timestamptz not null default now()
);

-- =====================================================================
-- 10. Funciones de apoyo (quién soy, hora simulada, niveles)
-- =====================================================================
create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.app_users where id = auth.uid()
$$;

create or replace function public.my_mission_id() returns uuid
language sql stable security definer set search_path = public as $$
  select mission_id from public.app_users where id = auth.uid()
$$;

create or replace function public.my_crew_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select crew_member_id from public.app_users where id = auth.uid()
$$;

create or replace function public.is_surgeon() returns bool
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('surgeon', 'admin'), false)
$$;

create or replace function public.is_simulator() returns bool
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('simulator', 'admin'), false)
$$;

-- Llamadas desde el SQL Editor, tareas programadas o la clave de servicio
create or replace function public.is_backend() returns bool
language sql stable as $$
  select coalesce(auth.role(), '') = 'service_role' or session_user in ('postgres', 'supabase_admin')
$$;

-- Hora de la misión: la del reloj simulado si existe; si no, la real
create or replace function public.mission_now(p_mission uuid) returns timestamptz
language sql stable security definer set search_path = public as $$
  select coalesce((select sim_clock from public.simulation_state where mission_id = p_mission), now())
$$;

create or replace function public.has_consent(p_crew uuid, p_scope public.consent_scope) returns bool
language sql stable security definer set search_path = public as $$
  select coalesce((select granted from public.consents where crew_member_id = p_crew and scope = p_scope), false)
$$;

-- El sueño es dato de bienestar: el médico solo lo ve con el permiso sleep_trend del tripulante
create or replace function public.surgeon_may_see(p_crew uuid, p_metric public.metric) returns bool
language sql stable security definer set search_path = public as $$
  select p_metric not in ('sleep_minutes', 'sleep_interruptions') or public.has_consent(p_crew, 'sleep_trend')
$$;

-- Nivel de una lectura según thresholds
create or replace function public.reading_level(p_metric public.metric, p_value numeric) returns public.alert_level
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select max(t.level) from public.thresholds t
      where t.metric = p_metric
        and ((t.min_value is not null and p_value < t.min_value)
          or (t.max_value is not null and p_value > t.max_value))),
    'normal'::public.alert_level)
$$;

-- =====================================================================
-- 11. Disparadores
-- =====================================================================

-- 11.1 evaluar_lectura: última señal, dosis acumulada y alertas
create or replace function public.trg_evaluate_reading() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_mission  uuid;
  v_kind     public.sensor_kind;
  v_prev     timestamptz;
  v_hours    numeric;
  v_inc_msv  numeric;
  v_is_spe   bool;
  v_day      date := (new.recorded_at at time zone 'UTC')::date;
  v_level    public.alert_level;
  v_type     public.alert_types%rowtype;
  v_base     public.baselines%rowtype;
begin
  select s.mission_id, s.kind into v_mission, v_kind from public.sensors s where s.id = new.sensor_id;

  update public.sensors
     set last_seen_at = greatest(coalesce(last_seen_at, new.recorded_at), new.recorded_at)
   where id = new.sensor_id;

  -- Dosis: tasa (µSv/h) × horas desde la lectura anterior del mismo sensor (máx. 1 h)
  if new.metric in ('dose_rate_usv_h', 'neutron_dose_rate_usv_h') then
    select max(r.recorded_at) into v_prev
      from public.sensor_readings r
     where r.sensor_id = new.sensor_id and r.metric = new.metric and r.recorded_at < new.recorded_at;

    if v_prev is not null then
      v_hours   := least(extract(epoch from (new.recorded_at - v_prev)) / 3600.0, 1);
      v_inc_msv := new.value * v_hours / 1000.0;

      v_is_spe := exists (
        select 1 from public.space_weather_events e
         where (e.mission_id is null or e.mission_id = v_mission)
           and new.recorded_at between e.starts_at and coalesce(e.ends_at, e.starts_at + interval '3 days'));

      if v_kind = 'personal_dosimeter' and new.crew_member_id is not null then
        insert into public.dose_daily as d (crew_member_id, day, total_msv, gcr_msv, spe_msv, neutron_msv)
        values (
          new.crew_member_id, v_day,
          case when new.metric = 'dose_rate_usv_h' then v_inc_msv else 0 end,
          case when new.metric = 'dose_rate_usv_h' and not v_is_spe then v_inc_msv else 0 end,
          case when new.metric = 'dose_rate_usv_h' and v_is_spe then v_inc_msv else 0 end,
          case when new.metric = 'neutron_dose_rate_usv_h' then v_inc_msv else 0 end)
        on conflict (crew_member_id, day) do update set
          total_msv   = d.total_msv   + excluded.total_msv,
          gcr_msv     = d.gcr_msv     + excluded.gcr_msv,
          spe_msv     = d.spe_msv     + excluded.spe_msv,
          neutron_msv = d.neutron_msv + excluded.neutron_msv;
      elsif v_kind = 'area_dosimeter' and new.zone_id is not null then
        insert into public.zone_dose_daily as z (zone_id, day, total_msv, neutron_msv)
        values (
          new.zone_id, v_day,
          case when new.metric = 'dose_rate_usv_h' then v_inc_msv else 0 end,
          case when new.metric = 'neutron_dose_rate_usv_h' then v_inc_msv else 0 end)
        on conflict (zone_id, day) do update set
          total_msv   = z.total_msv   + excluded.total_msv,
          neutron_msv = z.neutron_msv + excluded.neutron_msv;
      end if;
    end if;
  end if;

  -- Nivel por umbral
  v_level := public.reading_level(new.metric, new.value);
  if v_level <> 'normal' then
    select * into v_type from public.alert_types where metric = new.metric;
  end if;

  -- Si no rompe un umbral: desviación de la línea base personal (> 3 desviaciones)
  if v_level = 'normal'
     and new.crew_member_id is not null
     and new.metric not in ('sleep_minutes', 'sleep_interruptions') then
    select * into v_base from public.baselines
     where crew_member_id = new.crew_member_id and metric = new.metric;
    if found and v_base.samples >= 30 and v_base.stddev > 0
       and abs(new.value - v_base.mean) / v_base.stddev > 3 then
      v_level := 'attention';
      select * into v_type from public.alert_types where code = 'baseline_deviation';
    end if;
  end if;

  -- Durante una tormenta (refugio abierto) la alerta de tormenta ya cubre la radiación alta
  if new.metric in ('dose_rate_usv_h', 'neutron_dose_rate_usv_h')
     and exists (select 1 from public.shelter_sessions sh where sh.mission_id = v_mission and sh.ended_at is null) then
    v_level := 'normal';
  end if;

  -- El dato volvió a la normalidad: se resuelven solas sus alertas abiertas de este dato
  if v_level = 'normal' then
    update public.alerts a
       set status = 'resolved', resolved_at = new.recorded_at, note = coalesce(a.note, 'auto')
     where a.mission_id = v_mission
       and a.status <> 'resolved'
       and a.metric = new.metric
       and a.alert_type_id in (select code from public.alert_types where metric = new.metric
                               union all select 'baseline_deviation')
       and a.crew_member_id is not distinct from new.crew_member_id
       and (new.crew_member_id is not null or a.zone_id is not distinct from new.zone_id);
  end if;

  if v_level <> 'normal' and v_type.code is not null then
    -- Si sube de nivel, la alerta anterior de menor nivel queda resuelta
    update public.alerts a
       set status = 'resolved', resolved_at = new.recorded_at, note = coalesce(a.note, 'escalated')
     where a.mission_id = v_mission
       and a.alert_type_id = v_type.code
       and a.status <> 'resolved'
       and a.level < v_level
       and a.crew_member_id is not distinct from new.crew_member_id
       and (new.crew_member_id is not null or a.zone_id is not distinct from new.zone_id);

    -- No repetir: si ya hay una alerta abierta del mismo tipo y de igual o mayor nivel
    if not exists (
      select 1 from public.alerts a
       where a.mission_id = v_mission
         and a.alert_type_id = v_type.code
         and a.status <> 'resolved'
         and a.level >= v_level
         and a.crew_member_id is not distinct from new.crew_member_id
         and (new.crew_member_id is not null or a.zone_id is not distinct from new.zone_id)
    ) then
      insert into public.alerts (mission_id, crew_member_id, zone_id, alert_type_id, level, metric, value,
                                 message_es, message_en, created_at)
      values (v_mission, new.crew_member_id,
              case when new.crew_member_id is null then new.zone_id end,
              v_type.code, v_level, new.metric, new.value,
              format('%s (%s)', v_type.title_es, round(new.value, 2)),
              format('%s (%s)', v_type.title_en, round(new.value, 2)),
              new.recorded_at);
    end if;
  end if;

  return null;
end $$;

drop trigger if exists evaluate_reading on public.sensor_readings;
create trigger evaluate_reading after insert on public.sensor_readings
  for each row execute function public.trg_evaluate_reading();

-- 11.2 iniciar_refugio: una tormenta solar S3 o mayor ⚠️ abre el refugio
create or replace function public.trg_start_shelter() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  m         record;
  v_zone    uuid;
  v_session uuid;
  v_type    public.alert_types%rowtype;
begin
  if coalesce(new.s_scale, 0) < 3 then
    return null;
  end if;

  select * into v_type from public.alert_types where code = 'solar_storm';

  for m in select id from public.missions where new.mission_id is null or id = new.mission_id loop
    select z.id into v_zone from public.vehicle_zones z
     where z.mission_id = m.id and z.is_shelter
     order by z.shielding_factor desc limit 1;

    continue when v_zone is null;
    continue when exists (select 1 from public.shelter_sessions s where s.mission_id = m.id and s.ended_at is null);

    insert into public.shelter_sessions (mission_id, event_id, zone_id, started_at, expected_end_at)
    values (m.id, new.id, v_zone, new.starts_at, coalesce(new.ends_at, new.starts_at + interval '24 hours'))
    returning id into v_session;

    insert into public.alerts (mission_id, alert_type_id, shelter_session_id, zone_id, level,
                               message_es, message_en, created_at)
    values (m.id, 'solar_storm', v_session, v_zone, 'urgent',
            v_type.title_es, v_type.title_en, new.starts_at);

    insert into public.shelter_assignments (session_id, crew_member_id, zone_id)
    select v_session, c.id, v_zone from public.crew_members c where c.mission_id = m.id;
  end loop;

  return null;
end $$;

drop trigger if exists start_shelter on public.space_weather_events;
create trigger start_shelter after insert on public.space_weather_events
  for each row execute function public.trg_start_shelter();

-- 11.3 registrar_permiso y limpiar_tendencias
create or replace function public.trg_consents_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists consents_touch on public.consents;
create trigger consents_touch before insert or update on public.consents
  for each row execute function public.trg_consents_touch();

create or replace function public.trg_consents_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.granted is distinct from old.granted then
    insert into public.consent_log (crew_member_id, scope, granted) values (new.crew_member_id, new.scope, new.granted);
  end if;

  if not new.granted then
    if new.scope = 'mood_trend' then
      update public.wellbeing_trends set mood_avg = null, stress_avg = null, energy_avg = null
       where crew_member_id = new.crew_member_id;
    elsif new.scope = 'sleep_trend' then
      update public.wellbeing_trends set sleep_quality_avg = null
       where crew_member_id = new.crew_member_id;
    end if;
    delete from public.wellbeing_trends
     where crew_member_id = new.crew_member_id
       and mood_avg is null and stress_avg is null and energy_avg is null and sleep_quality_avg is null;
  end if;
  return null;
end $$;

drop trigger if exists consents_after on public.consents;
create trigger consents_after after insert or update on public.consents
  for each row execute function public.trg_consents_after();

-- 11.4 Guardia: nunca se guarda una tendencia sin permiso
create or replace function public.trg_wellbeing_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_consent(new.crew_member_id, 'mood_trend') then
    new.mood_avg := null; new.stress_avg := null; new.energy_avg := null;
  end if;
  if not public.has_consent(new.crew_member_id, 'sleep_trend') then
    new.sleep_quality_avg := null;
  end if;
  -- Al insertar, si no queda nada con permiso, no se guarda la fila.
  -- (En una actualización se deja pasar; trg_consents_after borra las filas vacías.)
  if tg_op = 'INSERT' and new.mood_avg is null and new.stress_avg is null
     and new.energy_avg is null and new.sleep_quality_avg is null then
    return null;
  end if;
  return new;
end $$;

drop trigger if exists wellbeing_guard on public.wellbeing_trends;
create trigger wellbeing_guard before insert or update on public.wellbeing_trends
  for each row execute function public.trg_wellbeing_guard();

-- =====================================================================
-- 12. Tareas (se llaman desde la consola de demo o una tarea programada)
-- =====================================================================

-- agregar_por_hora: resume en sensor_readings_hourly y borra lo viejo
create or replace function public.aggregate_hourly(p_mission uuid, p_keep interval default interval '7 days')
returns int language plpgsql security definer set search_path = public as $$
declare
  v_cutoff timestamptz;
  v_rows   int;
begin
  if not (public.is_simulator() or public.is_surgeon() or public.is_backend()) then
    raise exception 'No autorizado';
  end if;
  v_cutoff := date_trunc('hour', public.mission_now(p_mission) - p_keep);

  insert into public.sensor_readings_hourly as h
    (sensor_id, metric, hour, crew_member_id, zone_id, avg_value, min_value, max_value, samples)
  select r.sensor_id, r.metric, date_trunc('hour', r.recorded_at),
         (array_agg(r.crew_member_id order by r.recorded_at desc))[1],
         (array_agg(r.zone_id order by r.recorded_at desc))[1],
         avg(r.value), min(r.value), max(r.value), count(*)
    from public.sensor_readings r
    join public.sensors s on s.id = r.sensor_id and s.mission_id = p_mission
   where r.recorded_at >= v_cutoff
   group by r.sensor_id, r.metric, date_trunc('hour', r.recorded_at)
  on conflict (sensor_id, metric, hour) do update set
    crew_member_id = excluded.crew_member_id, zone_id = excluded.zone_id,
    avg_value = excluded.avg_value, min_value = excluded.min_value,
    max_value = excluded.max_value, samples = excluded.samples;
  get diagnostics v_rows = row_count;

  delete from public.sensor_readings r
   using public.sensors s
   where s.id = r.sensor_id and s.mission_id = p_mission and r.recorded_at < v_cutoff;

  return v_rows;
end $$;

-- actualizar_linea_base: promedio y variación de los últimos días
create or replace function public.refresh_baselines(p_mission uuid, p_window interval default interval '3 days')
returns int language plpgsql security definer set search_path = public as $$
declare v_rows int;
begin
  if not (public.is_simulator() or public.is_surgeon() or public.is_backend()) then
    raise exception 'No autorizado';
  end if;

  insert into public.baselines as b (crew_member_id, metric, mean, stddev, samples, updated_at)
  select r.crew_member_id, r.metric, avg(r.value), coalesce(stddev_samp(r.value), 0), count(*), now()
    from public.sensor_readings r
    join public.crew_members c on c.id = r.crew_member_id and c.mission_id = p_mission
   where r.recorded_at >= public.mission_now(p_mission) - p_window
     and r.metric in ('spo2_pct', 'heart_rate_bpm', 'resp_rate_bpm', 'sleep_minutes', 'sleep_interruptions')
   group by r.crew_member_id, r.metric
  on conflict (crew_member_id, metric) do update set
    mean = excluded.mean, stddev = excluded.stddev, samples = excluded.samples, updated_at = excluded.updated_at;
  get diagnostics v_rows = row_count;
  return v_rows;
end $$;

-- cerrar_refugio: "todo despejado" con la dosis evitada estimada
create or replace function public.close_shelter_session(p_session uuid) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  s        public.shelter_sessions%rowtype;
  v_end    timestamptz;
  v_out    numeric;
  v_in     numeric;
  v_hours  numeric;
  v_crew   int;
  v_avoid  numeric;
begin
  select * into s from public.shelter_sessions where id = p_session;
  if not found then raise exception 'Refugio no encontrado'; end if;
  if not (public.is_simulator() or public.is_backend()
          or (public.is_surgeon() and public.my_mission_id() = s.mission_id)) then
    raise exception 'No autorizado';
  end if;
  if s.ended_at is not null then return s.dose_avoided_est_msv; end if;

  v_end := public.mission_now(s.mission_id);

  -- Tasa media fuera del refugio y dentro, según los dosímetros de área
  select avg(r.value) into v_out
    from public.sensor_readings r join public.sensors se on se.id = r.sensor_id
   where se.mission_id = s.mission_id and se.kind = 'area_dosimeter'
     and r.metric = 'dose_rate_usv_h' and r.zone_id <> s.zone_id
     and r.recorded_at between s.started_at and v_end;
  select avg(r.value) into v_in
    from public.sensor_readings r join public.sensors se on se.id = r.sensor_id
   where se.mission_id = s.mission_id and se.kind = 'area_dosimeter'
     and r.metric = 'dose_rate_usv_h' and r.zone_id = s.zone_id
     and r.recorded_at between s.started_at and v_end;

  v_hours := extract(epoch from (v_end - s.started_at)) / 3600.0;
  select count(*) into v_crew from public.shelter_assignments where session_id = p_session;
  v_avoid := round(greatest(coalesce(v_out, 0) - coalesce(v_in, 0), 0) * v_hours * v_crew / 1000.0, 3);

  update public.shelter_sessions set ended_at = v_end, dose_avoided_est_msv = v_avoid where id = p_session;
  update public.alerts set status = 'resolved', resolved_at = v_end, resolved_by = auth.uid()
   where shelter_session_id = p_session and status <> 'resolved';

  return v_avoid;
end $$;

-- =====================================================================
-- 13. Acciones de la app (RPC) — el tripulante no edita tablas directo
-- =====================================================================

-- T6 / M3: reconocer una alerta
create or replace function public.acknowledge_alert(p_alert uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a public.alerts%rowtype; v_now timestamptz;
begin
  select * into a from public.alerts where id = p_alert;
  if not found or a.mission_id is distinct from public.my_mission_id()
     or not (public.is_surgeon() or a.crew_member_id is null or a.crew_member_id = public.my_crew_member_id()) then
    raise exception 'Alerta no disponible';
  end if;
  v_now := public.mission_now(a.mission_id);

  insert into public.alert_acknowledgements (alert_id, user_id, acknowledged_at)
  values (p_alert, auth.uid(), v_now) on conflict do nothing;

  -- La alerta pasa a "reconocida" si la reconoce el médico o el tripulante dueño de la alerta
  if public.is_surgeon() or a.crew_member_id = public.my_crew_member_id() then
    update public.alerts set status = 'acknowledged', acknowledged_at = v_now, acknowledged_by = auth.uid()
     where id = p_alert and status = 'active';
  end if;
end $$;

-- T6: Eco leyó la alerta en voz alta
create or replace function public.mark_alert_spoken(p_alert uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.alerts a set spoken_at = coalesce(a.spoken_at, public.mission_now(a.mission_id))
   where a.id = p_alert and a.mission_id = public.my_mission_id()
     and (a.crew_member_id is null or a.crew_member_id = public.my_crew_member_id());
end $$;

-- T7: llegué al refugio
create or replace function public.mark_shelter_arrival(p_session uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.shelter_assignments sa
     set arrived_at = coalesce(sa.arrived_at, public.mission_now(public.my_mission_id()))
   where sa.session_id = p_session and sa.crew_member_id = public.my_crew_member_id();
end $$;

-- T9: idioma de los mensajes de alerta
create or replace function public.set_my_language(p_language text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_language not in ('es', 'en') then raise exception 'Idioma no válido'; end if;
  update public.crew_members set language = p_language where id = public.my_crew_member_id();
end $$;

-- M3: resolver una alerta con nota
create or replace function public.resolve_alert(p_alert uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_surgeon() then raise exception 'Solo el médico'; end if;
  update public.alerts a
     set status = 'resolved',
         resolved_at = public.mission_now(a.mission_id),
         resolved_by = auth.uid(),
         note = coalesce(p_note, a.note)
   where a.id = p_alert and a.mission_id = public.my_mission_id();
end $$;

-- =====================================================================
-- 14. Vistas (security_invoker: respetan las reglas de acceso de quien consulta)
-- =====================================================================
create or replace view public.latest_readings with (security_invoker = true) as
select x.*, se.mission_id, public.reading_level(x.metric, x.value) as level
from (
  (select distinct on (r.crew_member_id, r.metric)
          r.sensor_id, r.crew_member_id, r.zone_id, r.metric, r.value, r.recorded_at
     from public.sensor_readings r
    where r.crew_member_id is not null
    order by r.crew_member_id, r.metric, r.recorded_at desc)
  union all
  (select distinct on (r.zone_id, r.metric)
          r.sensor_id, r.crew_member_id, r.zone_id, r.metric, r.value, r.recorded_at
     from public.sensor_readings r
    where r.crew_member_id is null and r.zone_id is not null
    order by r.zone_id, r.metric, r.recorded_at desc)
) x
join public.sensors se on se.id = x.sensor_id;

create or replace view public.crew_status with (security_invoker = true) as
select c.id as crew_member_id,
       c.mission_id,
       c.display_name,
       c.avatar_color,
       coalesce(max(a.level), 'normal'::public.alert_level) as overall_level,
       count(a.id) as active_alerts,
       (select max(s.last_seen_at) from public.sensors s where s.crew_member_id = c.id) as last_reading_at
  from public.crew_members c
  left join public.alerts a
    on a.mission_id = c.mission_id
   and a.status <> 'resolved'
   and (a.crew_member_id = c.id or a.crew_member_id is null)
 group by c.id;

create or replace view public.cabin_status with (security_invoker = true) as
select l.zone_id,
       z.name as zone_name,
       z.mission_id,
       max(l.value) filter (where l.metric = 'cabin_o2_pct')        as cabin_o2_pct,
       max(l.value) filter (where l.metric = 'cabin_pressure_psia') as cabin_pressure_psia,
       max(l.value) filter (where l.metric = 'cabin_co2_mmhg')      as cabin_co2_mmhg,
       max(l.value) filter (where l.metric = 'cabin_temp_c')        as cabin_temp_c,
       max(l.value) filter (where l.metric = 'dose_rate_usv_h')     as dose_rate_usv_h,
       max(l.level) as level,
       max(l.recorded_at) as recorded_at
  from public.latest_readings l
  join public.vehicle_zones z on z.id = l.zone_id
 where l.crew_member_id is null
 group by l.zone_id, z.name, z.mission_id;

create or replace view public.dose_career with (security_invoker = true) as
select c.id as crew_member_id,
       c.mission_id,
       coalesce(t.mission_dose, 0)                                  as mission_dose_msv,
       c.prior_career_dose_msv + coalesce(t.mission_dose, 0)        as career_dose_msv,
       c.career_limit_msv,
       round(100 * (c.prior_career_dose_msv + coalesce(t.mission_dose, 0)) / c.career_limit_msv, 1) as pct_of_limit,
       round(coalesce(t.mission_dose, 0)
             + coalesce(w.avg_7d, 0)
               * greatest(coalesce(m.end_date_planned - (public.mission_now(m.id) at time zone 'UTC')::date, 0), 0), 3)
                                                                    as projected_end_msv
  from public.crew_members c
  join public.missions m on m.id = c.mission_id
  left join lateral (
    select sum(d.total_msv) as mission_dose from public.dose_daily d where d.crew_member_id = c.id
  ) t on true
  left join lateral (
    select avg(d.total_msv) as avg_7d from public.dose_daily d
     where d.crew_member_id = c.id
       and d.day >= (public.mission_now(m.id) at time zone 'UTC')::date - 7
  ) w on true;

-- =====================================================================
-- 15. Reglas de acceso (RLS)
-- =====================================================================
alter table public.missions               enable row level security;
alter table public.alert_types            enable row level security;
alter table public.thresholds             enable row level security;
alter table public.crew_members           enable row level security;
alter table public.app_users              enable row level security;
alter table public.rules_acceptance       enable row level security;
alter table public.vehicle_zones          enable row level security;
alter table public.sensors                enable row level security;
alter table public.sensor_readings        enable row level security;
alter table public.sensor_readings_hourly enable row level security;
alter table public.baselines              enable row level security;
alter table public.dose_daily             enable row level security;
alter table public.zone_dose_daily        enable row level security;
alter table public.space_weather_events   enable row level security;
alter table public.shelter_sessions       enable row level security;
alter table public.shelter_assignments    enable row level security;
alter table public.shelter_shifts         enable row level security;
alter table public.alerts                 enable row level security;
alter table public.alert_acknowledgements enable row level security;
alter table public.symptom_reports        enable row level security;
alter table public.emergency_escalations  enable row level security;
alter table public.consents               enable row level security;
alter table public.consent_log            enable row level security;
alter table public.wellbeing_trends       enable row level security;
alter table public.surgeon_access_log     enable row level security;
alter table public.daily_reports          enable row level security;
alter table public.simulation_state       enable row level security;
alter table public.simulation_events      enable row level security;

-- Catálogos: cualquiera con sesión lee
drop policy if exists alert_types_read on public.alert_types;
create policy alert_types_read on public.alert_types for select to authenticated using (true);
drop policy if exists thresholds_read on public.thresholds;
create policy thresholds_read on public.thresholds for select to authenticated using (true);

-- Misión, zonas, sensores y tripulación: solo los de mi misión
drop policy if exists missions_read on public.missions;
create policy missions_read on public.missions for select to authenticated using (id = public.my_mission_id());
drop policy if exists zones_read on public.vehicle_zones;
create policy zones_read on public.vehicle_zones for select to authenticated using (mission_id = public.my_mission_id());
drop policy if exists sensors_read on public.sensors;
create policy sensors_read on public.sensors for select to authenticated using (mission_id = public.my_mission_id());
drop policy if exists crew_read on public.crew_members;
create policy crew_read on public.crew_members for select to authenticated using (mission_id = public.my_mission_id());

-- Usuarios: yo mismo; el médico ve a los de su misión
drop policy if exists app_users_read on public.app_users;
create policy app_users_read on public.app_users for select to authenticated
  using (id = auth.uid() or (public.is_surgeon() and mission_id = public.my_mission_id()));

-- Aceptación de reglas (T1)
drop policy if exists rules_rw_own on public.rules_acceptance;
create policy rules_rw_own on public.rules_acceptance for all to authenticated
  using (crew_member_id = public.my_crew_member_id())
  with check (crew_member_id = public.my_crew_member_id());
drop policy if exists rules_read_surgeon on public.rules_acceptance;
create policy rules_read_surgeon on public.rules_acceptance for select to authenticated
  using (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id()));

-- Lecturas: lo mío y la cabina; el médico todo lo de su misión; el simulador inserta
drop policy if exists readings_read on public.sensor_readings;
create policy readings_read on public.sensor_readings for select to authenticated
  using (exists (select 1 from public.sensors s where s.id = sensor_id and s.mission_id = public.my_mission_id())
         and (crew_member_id is null or crew_member_id = public.my_crew_member_id()
              or (public.is_surgeon() and public.surgeon_may_see(crew_member_id, metric))));
drop policy if exists readings_insert_sim on public.sensor_readings;
create policy readings_insert_sim on public.sensor_readings for insert to authenticated
  with check (public.is_simulator() and exists (select 1 from public.sensors s where s.id = sensor_id and s.mission_id = public.my_mission_id()));
drop policy if exists readings_delete_sim on public.sensor_readings;
create policy readings_delete_sim on public.sensor_readings for delete to authenticated
  using (public.is_simulator() and exists (select 1 from public.sensors s where s.id = sensor_id and s.mission_id = public.my_mission_id()));

drop policy if exists hourly_read on public.sensor_readings_hourly;
create policy hourly_read on public.sensor_readings_hourly for select to authenticated
  using (exists (select 1 from public.sensors s where s.id = sensor_id and s.mission_id = public.my_mission_id())
         and (crew_member_id is null or crew_member_id = public.my_crew_member_id()
              or (public.is_surgeon() and public.surgeon_may_see(crew_member_id, metric))));

drop policy if exists baselines_read on public.baselines;
create policy baselines_read on public.baselines for select to authenticated
  using (crew_member_id = public.my_crew_member_id()
         or (public.is_surgeon() and public.surgeon_may_see(crew_member_id, metric)
             and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id())));

drop policy if exists dose_read on public.dose_daily;
create policy dose_read on public.dose_daily for select to authenticated
  using (crew_member_id = public.my_crew_member_id()
         or (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id())));

drop policy if exists zone_dose_read on public.zone_dose_daily;
create policy zone_dose_read on public.zone_dose_daily for select to authenticated
  using (exists (select 1 from public.vehicle_zones z where z.id = zone_id and z.mission_id = public.my_mission_id()));

-- Clima espacial y refugio
drop policy if exists weather_read on public.space_weather_events;
create policy weather_read on public.space_weather_events for select to authenticated
  using (mission_id is null or mission_id = public.my_mission_id());
drop policy if exists weather_insert_sim on public.space_weather_events;
create policy weather_insert_sim on public.space_weather_events for insert to authenticated
  with check (public.is_simulator() and mission_id = public.my_mission_id());
drop policy if exists weather_delete_sim on public.space_weather_events;
create policy weather_delete_sim on public.space_weather_events for delete to authenticated
  using (public.is_simulator() and mission_id = public.my_mission_id());

drop policy if exists shelter_read on public.shelter_sessions;
create policy shelter_read on public.shelter_sessions for select to authenticated using (mission_id = public.my_mission_id());

drop policy if exists assignments_read on public.shelter_assignments;
create policy assignments_read on public.shelter_assignments for select to authenticated
  using (exists (select 1 from public.shelter_sessions s where s.id = session_id and s.mission_id = public.my_mission_id()));

drop policy if exists shifts_read on public.shelter_shifts;
create policy shifts_read on public.shelter_shifts for select to authenticated
  using (exists (select 1 from public.shelter_sessions s where s.id = session_id and s.mission_id = public.my_mission_id()));
drop policy if exists shifts_manage on public.shelter_shifts;
create policy shifts_manage on public.shelter_shifts for all to authenticated
  using ((public.is_surgeon() or public.is_simulator())
         and exists (select 1 from public.shelter_sessions s where s.id = session_id and s.mission_id = public.my_mission_id()))
  with check ((public.is_surgeon() or public.is_simulator())
         and exists (select 1 from public.shelter_sessions s where s.id = session_id and s.mission_id = public.my_mission_id()));

-- Alertas: las mías y las de toda la nave; el médico todas (cambios por RPC)
drop policy if exists alerts_read on public.alerts;
create policy alerts_read on public.alerts for select to authenticated
  using (mission_id = public.my_mission_id()
         and (public.is_surgeon() or crew_member_id is null or crew_member_id = public.my_crew_member_id()));

drop policy if exists acks_read on public.alert_acknowledgements;
create policy acks_read on public.alert_acknowledgements for select to authenticated
  using (user_id = auth.uid()
         or (public.is_surgeon() and exists (select 1 from public.alerts a where a.id = alert_id and a.mission_id = public.my_mission_id())));

-- Síntomas: el tripulante registra y ve los suyos; el médico ve todos
drop policy if exists symptoms_own on public.symptom_reports;
create policy symptoms_own on public.symptom_reports for all to authenticated
  using (crew_member_id = public.my_crew_member_id())
  with check (crew_member_id = public.my_crew_member_id());
drop policy if exists symptoms_surgeon on public.symptom_reports;
create policy symptoms_surgeon on public.symptom_reports for select to authenticated
  using (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id()));

-- Emergencias: el tripulante crea la suya; el médico ve y reconoce
drop policy if exists escalations_insert_own on public.emergency_escalations;
create policy escalations_insert_own on public.emergency_escalations for insert to authenticated
  with check (crew_member_id = public.my_crew_member_id());
drop policy if exists escalations_read on public.emergency_escalations;
create policy escalations_read on public.emergency_escalations for select to authenticated
  using (crew_member_id = public.my_crew_member_id()
         or (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id())));
drop policy if exists escalations_update_surgeon on public.emergency_escalations;
create policy escalations_update_surgeon on public.emergency_escalations for update to authenticated
  using (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id()))
  with check (public.is_surgeon());

-- Permisos: solo el tripulante los cambia; el médico los lee
drop policy if exists consents_own on public.consents;
create policy consents_own on public.consents for all to authenticated
  using (crew_member_id = public.my_crew_member_id())
  with check (crew_member_id = public.my_crew_member_id());
drop policy if exists consents_surgeon on public.consents;
create policy consents_surgeon on public.consents for select to authenticated
  using (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id()));

drop policy if exists consent_log_read on public.consent_log;
create policy consent_log_read on public.consent_log for select to authenticated
  using (crew_member_id = public.my_crew_member_id()
         or (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id())));

-- Tendencias: el tripulante sube y borra las suyas; el médico lee (solo existen con permiso)
drop policy if exists trends_own on public.wellbeing_trends;
create policy trends_own on public.wellbeing_trends for all to authenticated
  using (crew_member_id = public.my_crew_member_id())
  with check (crew_member_id = public.my_crew_member_id());
drop policy if exists trends_surgeon on public.wellbeing_trends;
create policy trends_surgeon on public.wellbeing_trends for select to authenticated
  using (public.is_surgeon() and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id()));

-- Registro de vistas del médico (T8 lo muestra al tripulante)
drop policy if exists access_log_insert on public.surgeon_access_log;
create policy access_log_insert on public.surgeon_access_log for insert to authenticated
  with check (public.is_surgeon() and surgeon_user_id = auth.uid()
              and exists (select 1 from public.crew_members c where c.id = crew_member_id and c.mission_id = public.my_mission_id()));
drop policy if exists access_log_read on public.surgeon_access_log;
create policy access_log_read on public.surgeon_access_log for select to authenticated
  using (crew_member_id = public.my_crew_member_id() or surgeon_user_id = auth.uid());

-- Informes: solo el médico
drop policy if exists reports_surgeon on public.daily_reports;
create policy reports_surgeon on public.daily_reports for all to authenticated
  using (public.is_surgeon() and mission_id = public.my_mission_id())
  with check (public.is_surgeon() and mission_id = public.my_mission_id());

-- Simulación: todos leen el reloj; solo el simulador lo cambia
drop policy if exists sim_state_read on public.simulation_state;
create policy sim_state_read on public.simulation_state for select to authenticated using (mission_id = public.my_mission_id());
drop policy if exists sim_state_manage on public.simulation_state;
create policy sim_state_manage on public.simulation_state for all to authenticated
  using (public.is_simulator() and mission_id = public.my_mission_id())
  with check (public.is_simulator() and mission_id = public.my_mission_id());
drop policy if exists sim_events_manage on public.simulation_events;
create policy sim_events_manage on public.simulation_events for all to authenticated
  using (public.is_simulator() and mission_id = public.my_mission_id())
  with check (public.is_simulator() and mission_id = public.my_mission_id());

-- Funciones: solo usuarios con sesión
revoke execute on function public.aggregate_hourly(uuid, interval)      from public, anon;
revoke execute on function public.refresh_baselines(uuid, interval)     from public, anon;
revoke execute on function public.close_shelter_session(uuid)           from public, anon;
revoke execute on function public.acknowledge_alert(uuid)               from public, anon;
revoke execute on function public.mark_alert_spoken(uuid)               from public, anon;
revoke execute on function public.mark_shelter_arrival(uuid)            from public, anon;
revoke execute on function public.set_my_language(text)                 from public, anon;
revoke execute on function public.resolve_alert(uuid, text)             from public, anon;
grant  execute on function public.aggregate_hourly(uuid, interval)      to authenticated;
grant  execute on function public.refresh_baselines(uuid, interval)     to authenticated;
grant  execute on function public.close_shelter_session(uuid)           to authenticated;
grant  execute on function public.acknowledge_alert(uuid)               to authenticated;
grant  execute on function public.mark_alert_spoken(uuid)               to authenticated;
grant  execute on function public.mark_shelter_arrival(uuid)            to authenticated;
grant  execute on function public.set_my_language(text)                 to authenticated;
grant  execute on function public.resolve_alert(uuid, text)             to authenticated;

-- =====================================================================
-- 16. Tiempo real (Supabase Realtime)
-- =====================================================================
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['alerts', 'shelter_sessions', 'shelter_assignments', 'shelter_shifts', 'sensor_readings'] loop
      if not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;

-- =====================================================================
-- 17. Catálogo inicial: tipos de alerta y umbrales
--     ⚠️ Todos los umbrales quedan verified = false hasta comprobarlos (fase 0).
-- =====================================================================
insert into public.alert_types (code, metric, default_level, title_es, title_en, steps_es, steps_en) values
  ('spo2_low', 'spo2_pct', 'urgent', 'Oxígeno en sangre bajo', 'Low blood oxygen',
   '["Detén la actividad y respira con calma", "Usa el oxígeno de emergencia si está indicado", "Avisa a un compañero: el médico ya fue notificado"]',
   '["Stop what you are doing and breathe calmly", "Use emergency oxygen if indicated", "Tell a crewmate: the surgeon has been notified"]'),
  ('cabin_o2_low', 'cabin_o2_pct', 'urgent', 'Oxígeno de la cabina bajo', 'Low cabin oxygen',
   '["Revisa el sistema de soporte vital", "Reduce el esfuerzo físico", "Sigue el procedimiento de la tripulación"]',
   '["Check the life support system", "Reduce physical effort", "Follow the crew procedure"]'),
  ('cabin_pressure_out_of_range', 'cabin_pressure_psia', 'urgent', 'Presión de la cabina fuera de rango', 'Cabin pressure out of range',
   '["Revisa el panel de presión", "Prepárate para el procedimiento de emergencia", "Mantente con tu equipo"]',
   '["Check the pressure panel", "Get ready for the emergency procedure", "Stay with your team"]'),
  ('cabin_co2_high', 'cabin_co2_mmhg', 'attention', 'CO2 alto en la cabina', 'High cabin CO2',
   '["Revisa el depurador de CO2", "Si te duele la cabeza, avísalo", "Muévete a una zona con mejor ventilación"]',
   '["Check the CO2 scrubber", "If you have a headache, report it", "Move to a better ventilated area"]'),
  ('heart_rate_out_of_range', 'heart_rate_bpm', 'attention', 'Frecuencia cardíaca fuera de rango', 'Heart rate out of range',
   '["Detente y descansa", "Respira despacio", "Si no mejora, avisa al médico"]',
   '["Stop and rest", "Breathe slowly", "If it does not improve, tell the surgeon"]'),
  ('resp_rate_out_of_range', 'resp_rate_bpm', 'attention', 'Respiración fuera de rango', 'Breathing rate out of range',
   '["Detente y descansa", "Respira despacio por la nariz", "Si no mejora, avisa al médico"]',
   '["Stop and rest", "Breathe slowly through your nose", "If it does not improve, tell the surgeon"]'),
  ('dose_rate_high', 'dose_rate_usv_h', 'attention', 'Radiación alta en la zona', 'High radiation in this area',
   '["Ve a una zona más blindada", "Limita el tiempo en esta zona", "Sigue las indicaciones de Eco"]',
   '["Move to a better shielded area", "Limit your time in this area", "Follow Echo''s guidance"]'),
  ('cabin_temp_out_of_range', 'cabin_temp_c', 'attention', 'Temperatura de la cabina fuera de rango', 'Cabin temperature out of range',
   '["Revisa el control térmico", "Abrígate o refréscate según el caso"]',
   '["Check thermal control", "Warm up or cool down as needed"]'),
  ('baseline_deviation', null, 'attention', 'Un dato está fuera de tu normal', 'A reading is outside your normal range',
   '["Eco te preguntará cómo te sientes", "Repite la medición en unos minutos"]',
   '["Echo will ask how you feel", "Repeat the measurement in a few minutes"]'),
  ('solar_storm', null, 'urgent', 'Tormenta solar: ve al refugio', 'Solar storm: go to the shelter',
   '["Deja lo que estás haciendo de forma segura", "Ve al refugio blindado asignado", "Confirma tu llegada en la pantalla"]',
   '["Safely stop what you are doing", "Go to your assigned shielded shelter", "Confirm your arrival on screen"]'),
  ('sensor_offline', null, 'attention', 'Un sensor dejó de enviar datos', 'A sensor stopped sending data',
   '["Revisa que el sensor esté puesto y encendido"]',
   '["Check that the sensor is worn and switched on"]')
on conflict (code) do update set
  metric = excluded.metric, default_level = excluded.default_level,
  title_es = excluded.title_es, title_en = excluded.title_en,
  steps_es = excluded.steps_es, steps_en = excluded.steps_en;

-- Umbrales de referencia ⚠️ (atmósfera de exploración ≈ 8.2 psia y 34 % de O2)
insert into public.thresholds (metric, level, min_value, max_value, source_url, verified) values
  ('spo2_pct',            'attention', 94,   null, 'https://www.nasa.gov/reference/risk-of-hypoxia/', false),
  ('spo2_pct',            'urgent',    90,   null, 'https://www.nasa.gov/reference/risk-of-hypoxia/', false),
  ('cabin_o2_pct',        'attention', 32,   null, 'https://www.nasa.gov/reference/risk-of-hypoxia/', false),
  ('cabin_o2_pct',        'urgent',    30,   null, 'https://www.nasa.gov/reference/risk-of-hypoxia/', false),
  ('cabin_pressure_psia', 'attention', 7.9,  8.6,  null, false),
  ('cabin_pressure_psia', 'urgent',    7.5,  9.0,  null, false),
  ('cabin_co2_mmhg',      'attention', null, 3,    null, false),
  ('cabin_co2_mmhg',      'urgent',    null, 6,    null, false),
  ('heart_rate_bpm',      'attention', 45,   110,  null, false),
  ('heart_rate_bpm',      'urgent',    38,   140,  null, false),
  ('resp_rate_bpm',       'attention', 10,   24,   null, false),
  ('resp_rate_bpm',       'urgent',    8,    30,   null, false),
  ('dose_rate_usv_h',     'attention', null, 200,  'https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/', false),
  ('dose_rate_usv_h',     'urgent',    null, 1000, 'https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/', false),
  ('cabin_temp_c',        'attention', 18,   27,   null, false),
  ('cabin_temp_c',        'urgent',    15,   30,   null, false)
on conflict (metric, level) do nothing;
