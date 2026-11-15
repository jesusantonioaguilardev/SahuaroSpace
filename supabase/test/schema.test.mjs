// Pruebas de specs/features/09-base-de-datos.md (DB) y PRIV-05.
// Carga schema.sql + seed_demo.sql en PGlite (Postgres en memoria). No toca Supabase.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const sql = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
const STUBS = sql('./supabase-stubs.sql');
const SCHEMA = sql('../schema.sql');
const SEED = sql('../seed_demo.sql');

const MISSION = 'a0000000-0000-4000-8000-000000000001';
const ANA = 'c0000000-0000-4000-8000-000000000001';
const ANA_WEARABLE = 'd0000000-0000-4000-8000-000000000001';
const ANA_DOSIMETER = 'd0000000-0000-4000-8000-000000000002';

let db;
beforeEach(async () => {
  db = new PGlite();
  await db.exec(STUBS);
  await db.exec(SCHEMA);
  await db.exec(SEED);
});

let minute = 0;
const at = () => new Date(Date.UTC(2027, 5, 1, 12, minute++)).toISOString();
const reading = (metric, value, { sensor = ANA_WEARABLE, crew = ANA, time = at() } = {}) =>
  db.query('insert into public.sensor_readings (sensor_id, crew_member_id, metric, value, recorded_at) values ($1, $2, $3, $4, $5)',
    [sensor, crew, metric, value, time]);
const alerts = async (type) => (await db.query(
  'select level, status, note from public.alerts where alert_type_id = $1 and crew_member_id = $2 order by created_at', [type, ANA])).rows;
const open = async (type) => (await alerts(type)).filter((a) => a.status !== 'resolved');

test('DB-01: reading_level aplica los umbrales de referencia', async () => {
  const cases = [
    ['spo2_pct', 97, 'normal'], ['spo2_pct', 93, 'attention'], ['spo2_pct', 89, 'urgent'],
    ['cabin_co2_mmhg', 2, 'normal'], ['cabin_co2_mmhg', 4, 'attention'], ['cabin_co2_mmhg', 7, 'urgent'],
    ['heart_rate_bpm', 70, 'normal'], ['heart_rate_bpm', 120, 'attention'], ['heart_rate_bpm', 150, 'urgent'],
    ['dose_rate_usv_h', 20, 'normal'], ['dose_rate_usv_h', 300, 'attention'], ['dose_rate_usv_h', 1500, 'urgent'],
  ];
  for (const [metric, value, expected] of cases) {
    const r = await db.query('select public.reading_level($1, $2) as l', [metric, value]);
    assert.equal(r.rows[0].l, expected, `${metric}=${value}`);
  }
});

test('DB-02/03: una lectura fuera de umbral crea UNA alerta abierta (sin duplicados)', async () => {
  await reading('spo2_pct', 92);
  await reading('spo2_pct', 92);
  const a = await open('spo2_low');
  assert.equal(a.length, 1);
  assert.equal(a[0].level, 'attention');
  const msg = (await db.query("select message_es, message_en from public.alerts where alert_type_id = 'spo2_low'")).rows[0];
  assert.match(msg.message_es, /92/);
  assert.match(msg.message_en, /92/);
});

test('DB-04: si sube de nivel, la alerta anterior se resuelve como escalada', async () => {
  await reading('spo2_pct', 92);
  await reading('spo2_pct', 88);
  const all = await alerts('spo2_low');
  assert.deepEqual(all.map((a) => [a.level, a.status]), [['attention', 'resolved'], ['urgent', 'active']]);
  assert.equal(all[0].note, 'escalated');
});

test('DB-05: cuando el dato vuelve a la normalidad, la alerta se resuelve sola', async () => {
  await reading('spo2_pct', 88);
  await reading('spo2_pct', 97);
  assert.equal((await open('spo2_low')).length, 0);
  assert.equal((await alerts('spo2_low'))[0].note, 'auto');
});

test('DB-06: la dosis diaria suma tasa × horas (máx. 1 h) del dosímetro personal', async () => {
  const t0 = '2027-06-01T08:00:00Z', t1 = '2027-06-01T08:30:00Z', t2 = '2027-06-01T11:30:00Z';
  await reading('dose_rate_usv_h', 500, { sensor: ANA_DOSIMETER, time: t0 });
  await reading('dose_rate_usv_h', 500, { sensor: ANA_DOSIMETER, time: t1 }); // +0.25 mSv
  await reading('dose_rate_usv_h', 100, { sensor: ANA_DOSIMETER, time: t2 }); // 3 h → tope 1 h → +0.1 mSv
  const d = (await db.query("select total_msv, gcr_msv, spe_msv from public.dose_daily where crew_member_id = $1 and day = '2027-06-01'", [ANA])).rows[0];
  assert.equal(Number(d.total_msv).toFixed(3), '0.350');
  assert.equal(Number(d.gcr_msv).toFixed(3), '0.350');
  assert.equal(Number(d.spe_msv), 0);
});

test('DB-07 / PRIV-05: sin permiso, la tendencia de ánimo no se guarda', async () => {
  await db.query("insert into public.wellbeing_trends (crew_member_id, day, mood_avg, stress_avg, energy_avg) values ($1, '2027-06-01', 3, 2, 4)", [ANA]);
  const n = (await db.query('select count(*)::int n from public.wellbeing_trends where crew_member_id = $1', [ANA])).rows[0].n;
  assert.equal(n, 0);
});

test('DB-08 / PRIV-05: con permiso se guarda; al revocarlo se borra y queda registrado', async () => {
  // Los permisos empiezan apagados (PRIV-03); la app los enciende con un update
  const setConsent = (granted) => db.query("update public.consents set granted = $2 where crew_member_id = $1 and scope = 'mood_trend'", [ANA, granted]);
  await setConsent(true);
  await db.query("insert into public.wellbeing_trends (crew_member_id, day, mood_avg, stress_avg, energy_avg) values ($1, '2027-06-01', 3, 2, 4)", [ANA]);
  const count = async () => (await db.query('select count(*)::int n from public.wellbeing_trends where crew_member_id = $1', [ANA])).rows[0].n;
  assert.equal(await count(), 1);

  await setConsent(false);
  assert.equal(await count(), 0);
  // Registro: apagado inicial (seed), encendido, apagado
  const log = (await db.query("select granted from public.consent_log where crew_member_id = $1 and scope = 'mood_trend' order by changed_at", [ANA])).rows;
  assert.deepEqual(log.map((l) => l.granted).slice(-2), [true, false]);
  assert.equal(log[0].granted, false, 'PRIV-03: apagado por defecto');
});

const storm = (scale, id) => db.query(
  "insert into public.space_weather_events (mission_id, source, external_id, event_type, s_scale, starts_at) values ($1, 'SIM', $2, 'SEP', $3, '2027-06-01T12:00:00Z')",
  [MISSION, id, scale]);
const count = async (q) => (await db.query(q, [MISSION])).rows[0].n;

test('DB-09: S < 3 no abre refugio; S ≥ 3 abre uno solo, con alerta urgente y toda la tripulación', async () => {
  await storm(2, 'e1');
  assert.equal(await count('select count(*)::int n from public.shelter_sessions where mission_id = $1'), 0);

  await storm(4, 'e2');
  await storm(4, 'e3');
  assert.equal(await count('select count(*)::int n from public.shelter_sessions where mission_id = $1'), 1);
  assert.equal(await count("select count(*)::int n from public.alerts where mission_id = $1 and alert_type_id = 'solar_storm' and level = 'urgent'"), 1);
  assert.equal(await count('select count(*)::int n from public.shelter_assignments a join public.shelter_sessions s on s.id = a.session_id where s.mission_id = $1'), 4);
  const zone = (await db.query('select z.is_shelter from public.shelter_sessions s join public.vehicle_zones z on z.id = s.zone_id')).rows[0];
  assert.equal(zone.is_shelter, true);
});

test('DB-09: con el refugio abierto, la radiación alta no genera alertas propias', async () => {
  await storm(4, 'e4');
  await reading('dose_rate_usv_h', 1500, { sensor: ANA_DOSIMETER });
  assert.equal((await open('dose_rate_high')).length, 0);
});
