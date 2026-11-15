// =====================================================================
// Simulador de la misión: genera lecturas de sensores y las escribe en Supabase.
// La base de datos hace el resto (disparadores): dosis acumulada, alertas,
// apertura del refugio con una tormenta solar.
// (referencia) Todos los valores son simulados y de referencia.
// =====================================================================
import { admin, must } from './db.mjs';

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const GCR_RATE = 40;          // µSv/h en la cabina principal (referencia)
const SPE_PEAK = 1500;        // µSv/h en el pico de la tormenta (referencia)
const DAILY_DOSE_MSV = 0.75;  // dosis personal media por día en tránsito (referencia)
const DEMO_START = '2027-06-01T08:00:00Z';
const PERSONAL_BASE = [
  { spo2: 97.5, hr: 62, doseFactor: 1.0 },
  { spo2: 97, hr: 68, doseFactor: 0.95 },
  { spo2: 98, hr: 58, doseFactor: 0.9 },
  { spo2: 96.5, hr: 66, doseFactor: 1.05 },
];

const noise = (amp) => (Math.random() * 2 - 1) * amp;
const approach = (v, target, k) => v + (target - v) * k;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);
const r2 = (v) => Math.round(v * 100) / 100;

export function createSimulator({ missionId, tickMs = 3000, log = console.log }) {
  const st = {
    ready: false,
    mission: null,
    zones: {},
    crew: {},
    sensors: {},
    overrides: { lowO2: false, highCO2: false, lowSpo2: {}, badSleep: {} },
    storm: null,
    lastSleepDay: null,
    lastBaselineAt: 0,
    ticks: 0,
    timer: null,
    busy: false,
    lastError: null,
  };

  // -------------------------------------------------------------------
  // Carga inicial desde la base
  // -------------------------------------------------------------------
  async function load() {
    st.mission = must(await admin.from('missions').select('*').eq('id', missionId).single(), 'misión');
    const zones = must(await admin.from('vehicle_zones').select('*').eq('mission_id', missionId).order('shielding_factor'), 'zonas');
    const crew = must(await admin.from('crew_members').select('*').eq('mission_id', missionId).order('id'), 'tripulación');
    const sensors = must(await admin.from('sensors').select('*').eq('mission_id', missionId), 'sensores');
    const users = must(await admin.from('app_users').select('id, crew_member_id').eq('mission_id', missionId), 'usuarios');

    st.zones = {};
    for (const z of zones) {
      st.zones[z.id] = { ...z, o2: 34, co2: 2.2, pressure: 8.2, temp: 22, rate: GCR_RATE / Number(z.shielding_factor) };
    }
    const workZones = zones.filter((z) => !z.is_shelter && Number(z.shielding_factor) <= 1.5).map((z) => z.id);
    st.shelterZone = zones.find((z) => z.is_shelter)?.id || null;

    st.crew = {};
    crew.forEach((c, i) => {
      const base = PERSONAL_BASE[i % PERSONAL_BASE.length];
      st.crew[c.id] = {
        ...c,
        ...base,
        home: workZones[i % Math.max(1, workZones.length)] || zones[0]?.id,
        zone: null,
        spo2Now: base.spo2,
        hrNow: base.hr,
        rrNow: 14,
        userIds: users.filter((u) => u.crew_member_id === c.id).map((u) => u.id),
        autoArriveMin: 10 + Math.random() * 12,
      };
      st.crew[c.id].zone = st.crew[c.id].home;
    });

    st.sensors = {};
    for (const s of sensors) {
      const key = s.crew_member_id ? `${s.kind}:${s.crew_member_id}` : `${s.kind}:${s.zone_id}`;
      st.sensors[key] = s.id;
    }

    let state = must(await admin.from('simulation_state').select('*').eq('mission_id', missionId).maybeSingle(), 'reloj');
    if (!state) {
      state = must(await admin.from('simulation_state')
        .insert({ mission_id: missionId, sim_clock: DEMO_START, time_speed: 60, running: false })
        .select().single(), 'crear reloj');
    }
    await backfillDose(Date.parse(state.sim_clock));
    await restoreStorm();
    st.ready = true;
    log(`[sim] Misión "${st.mission.name}" cargada: ${crew.length} tripulantes, ${zones.length} zonas, ${sensors.length} sensores.`);
  }

  // Dosis de los días anteriores de la misión, para que la proyección tenga sentido
  async function backfillDose(nowMs) {
    const crewIds = Object.keys(st.crew);
    const { count } = await admin.from('dose_daily').select('*', { count: 'exact', head: true }).in('crew_member_id', crewIds);
    if (count) return;
    const start = Date.parse(st.mission.start_date);
    const rows = [];
    for (let t = start; t < nowMs - DAY; t += DAY) {
      for (const c of Object.values(st.crew)) {
        const total = DAILY_DOSE_MSV * c.doseFactor * (1 + noise(0.08));
        rows.push({ crew_member_id: c.id, day: dayKey(t), total_msv: r2(total), gcr_msv: r2(total), spe_msv: 0, neutron_msv: r2(total * 0.3) });
      }
    }
    for (let i = 0; i < rows.length; i += 500) must(await admin.from('dose_daily').insert(rows.slice(i, i + 500)), 'dosis previa');
    log(`[sim] Dosis de días anteriores cargada (${rows.length} filas).`);
  }

  async function restoreStorm() {
    const open = must(await admin.from('shelter_sessions').select('*, space_weather_events(*)')
      .eq('mission_id', missionId).is('ended_at', null).maybeSingle(), 'refugio abierto');
    if (!open) { st.storm = null; return; }
    const ev = open.space_weather_events;
    const start = Date.parse(ev?.starts_at || open.started_at);
    st.storm = makeStorm(open.id, ev?.id, start, Date.parse(ev?.ends_at || open.expected_end_at));
  }

  function makeStorm(sessionId, eventId, start, end) {
    const arrival = start + 30 * 60e3;
    return { sessionId, eventId, start, arrival, peak: arrival + 2 * HOUR, end };
  }

  function speRate(t) {
    const s = st.storm;
    if (!s || t < s.arrival || t >= s.end) return 0;
    if (t < s.peak) return (SPE_PEAK * (t - s.arrival)) / (s.peak - s.arrival);
    return SPE_PEAK * Math.exp(-(t - s.peak) / (8 * HOUR));
  }

  // -------------------------------------------------------------------
  // Paso de simulación
  // -------------------------------------------------------------------
  async function tick() {
    if (st.busy || !st.ready) return;
    st.busy = true;
    try {
      const state = must(await admin.from('simulation_state').select('*').eq('mission_id', missionId).single(), 'reloj');
      if (!state.running) return;
      const dtS = (state.time_speed * tickMs) / 1000;
      const prev = Date.parse(state.sim_clock);
      const now = prev + dtS * 1000;
      must(await admin.from('simulation_state').update({ sim_clock: new Date(now).toISOString(), updated_at: new Date().toISOString() }).eq('mission_id', missionId), 'avanzar reloj');

      if (st.storm && now >= st.storm.end) await allClear(now);
      if (st.storm) await updateShelterPositions(now);

      const rows = step(now, dtS);
      if (st.lastSleepDay !== dayKey(now)) {
        st.lastSleepDay = dayKey(now);
        rows.push(...sleepRows(now));
      }
      must(await admin.from('sensor_readings').insert(rows), 'lecturas');

      st.ticks++;
      if (now - st.lastBaselineAt > 6 * HOUR) {
        st.lastBaselineAt = now;
        must(await admin.rpc('refresh_baselines', { p_mission: missionId, p_window: '3 days' }), 'línea base');
      }
      if (st.ticks % 40 === 0) must(await admin.rpc('aggregate_hourly', { p_mission: missionId, p_keep: '6 hours' }), 'resumen por hora');
      st.lastError = null;
    } catch (err) {
      if (st.lastError !== err.message) log(`[sim] ${err.message}`);
      st.lastError = err.message;
    } finally {
      st.busy = false;
    }
  }

  function step(now, dtS) {
    const kAir = Math.min(1, dtS / 1200);
    const kBody = Math.min(1, dtS / 300);
    const spe = speRate(now);
    const at = new Date(now).toISOString();
    const rows = [];
    const occupants = (zid) => Object.values(st.crew).filter((c) => c.zone === zid).length;

    for (const z of Object.values(st.zones)) {
      const o2Target = st.overrides.lowO2 ? 29 : 34;
      const co2Target = 2.2 + (st.overrides.highCO2 ? 3 : 0) + (z.is_shelter ? 0.35 * occupants(z.id) : 0);
      z.o2 = approach(z.o2, o2Target, kAir) + noise(0.05);
      z.co2 = Math.max(0.5, approach(z.co2, co2Target, kAir) + noise(0.04));
      z.pressure = 8.2 + noise(0.02);
      z.temp = 22 + noise(0.2);
      z.rate = ((GCR_RATE + spe) / Number(z.shielding_factor)) * (1 + noise(0.04));
      const env = st.sensors[`cabin_env:${z.id}`];
      const area = st.sensors[`area_dosimeter:${z.id}`];
      if (env) {
        rows.push(
          { sensor_id: env, zone_id: z.id, metric: 'cabin_o2_pct', value: r2(z.o2), recorded_at: at },
          { sensor_id: env, zone_id: z.id, metric: 'cabin_co2_mmhg', value: r2(z.co2), recorded_at: at },
          { sensor_id: env, zone_id: z.id, metric: 'cabin_pressure_psia', value: r2(z.pressure), recorded_at: at },
          { sensor_id: env, zone_id: z.id, metric: 'cabin_temp_c', value: r2(z.temp), recorded_at: at },
        );
      }
      if (area) {
        rows.push(
          { sensor_id: area, zone_id: z.id, metric: 'dose_rate_usv_h', value: r2(z.rate), recorded_at: at },
          { sensor_id: area, zone_id: z.id, metric: 'neutron_dose_rate_usv_h', value: r2(z.rate * 0.3), recorded_at: at },
        );
      }
    }

    for (const c of Object.values(st.crew)) {
      const z = st.zones[c.zone];
      const target = c.spo2 - Math.max(0, 34 - z.o2) * 1.6 - (st.overrides.lowSpo2[c.id] ? 11 : 0);
      c.spo2Now = Math.min(100, approach(c.spo2Now, target, kBody) + noise(0.25));
      const hypoxic = c.spo2Now < 92;
      c.hrNow = approach(c.hrNow, c.hr + (st.storm ? 8 : 0) + (hypoxic ? 15 : 0), kBody) + noise(1.2);
      c.rrNow = approach(c.rrNow, 14 + (hypoxic ? 6 : 0), kBody) + noise(0.3);
      const wear = st.sensors[`wearable:${c.id}`];
      const dosi = st.sensors[`personal_dosimeter:${c.id}`];
      if (wear) {
        rows.push(
          { sensor_id: wear, crew_member_id: c.id, zone_id: c.zone, metric: 'spo2_pct', value: r2(c.spo2Now), recorded_at: at },
          { sensor_id: wear, crew_member_id: c.id, zone_id: c.zone, metric: 'heart_rate_bpm', value: r2(c.hrNow), recorded_at: at },
          { sensor_id: wear, crew_member_id: c.id, zone_id: c.zone, metric: 'resp_rate_bpm', value: r2(c.rrNow), recorded_at: at },
        );
      }
      if (dosi) {
        rows.push(
          { sensor_id: dosi, crew_member_id: c.id, zone_id: c.zone, metric: 'dose_rate_usv_h', value: r2(z.rate), recorded_at: at },
          { sensor_id: dosi, crew_member_id: c.id, zone_id: c.zone, metric: 'neutron_dose_rate_usv_h', value: r2(z.rate * 0.3), recorded_at: at },
        );
      }
    }
    return rows;
  }

  function sleepRows(now) {
    const at = new Date(now).toISOString();
    return Object.values(st.crew).flatMap((c) => {
      const wear = st.sensors[`wearable:${c.id}`];
      if (!wear) return [];
      const minutes = st.overrides.badSleep[c.id] ? 250 : 390 + Math.round(Math.random() * 60);
      return [
        { sensor_id: wear, crew_member_id: c.id, metric: 'sleep_minutes', value: minutes, recorded_at: at },
        { sensor_id: wear, crew_member_id: c.id, metric: 'sleep_interruptions', value: st.overrides.badSleep[c.id] ? 5 : Math.round(Math.random() * 2), recorded_at: at },
      ];
    });
  }

  // Quién está en el refugio. Quien no usa la app llega solo; quien reconoció la alerta lo confirma en su celular.
  async function updateShelterPositions(now) {
    const s = st.storm;
    const assignments = must(await admin.from('shelter_assignments').select('*').eq('session_id', s.sessionId), 'asignaciones');
    const stormAlert = must(await admin.from('alerts').select('id').eq('shelter_session_id', s.sessionId).eq('alert_type_id', 'solar_storm').maybeSingle(), 'alerta de tormenta');
    const acks = stormAlert
      ? must(await admin.from('alert_acknowledgements').select('user_id').eq('alert_id', stormAlert.id), 'reconocimientos').map((a) => a.user_id)
      : [];
    for (const a of assignments) {
      const c = st.crew[a.crew_member_id];
      if (!c) continue;
      if (a.arrived_at) { c.zone = a.zone_id; continue; }
      const usesApp = c.userIds.some((id) => acks.includes(id));
      if (!usesApp && now >= s.start + c.autoArriveMin * 60e3) {
        must(await admin.from('shelter_assignments').update({ arrived_at: new Date(now).toISOString() })
          .eq('session_id', s.sessionId).eq('crew_member_id', c.id), 'llegada');
        c.zone = a.zone_id;
      }
    }
  }

  // -------------------------------------------------------------------
  // Controles de la consola
  // -------------------------------------------------------------------
  async function simNow() {
    const s = must(await admin.from('simulation_state').select('sim_clock').eq('mission_id', missionId).single(), 'reloj');
    return Date.parse(s.sim_clock);
  }

  async function logEvent(kind, params, userId) {
    await admin.from('simulation_events').insert({ mission_id: missionId, kind, params, triggered_by: userId || null });
  }

  async function triggerStorm(userId) {
    if (st.storm) return { ok: false, reason: 'storm_active' };
    if (!st.shelterZone) return { ok: false, reason: 'no_shelter_zone' };
    const now = await simNow();
    const start = now;
    const end = start + 30 * 60e3 + 30 * HOUR;
    const ev = must(await admin.from('space_weather_events').insert({
      mission_id: missionId, source: 'SIM', external_id: `sim-${Date.now()}`, event_type: 'SEP', s_scale: 4,
      starts_at: new Date(start).toISOString(), peak_at: new Date(start + 30 * 60e3 + 2 * HOUR).toISOString(), ends_at: new Date(end).toISOString(),
      raw: { note: 'Evento simulado para la demo' },
    }).select().single(), 'evento solar');
    // El disparador start_shelter ya abrió el refugio, la alerta y las asignaciones
    const session = must(await admin.from('shelter_sessions').select('*').eq('event_id', ev.id).single(), 'refugio');
    st.storm = makeStorm(session.id, ev.id, start, end);

    const ids = Object.keys(st.crew);
    const half = Math.ceil(ids.length / 2);
    const groups = [ids.slice(0, half), ids.slice(half)];
    const shifts = [];
    let i = 0;
    for (let t = st.storm.arrival; t < end; t += 3 * HOUR, i++) {
      const tEnd = Math.min(t + 3 * HOUR, end);
      const rest = groups[i % 2];
      const watch = groups[(i + 1) % 2];
      for (const id of rest) shifts.push({ session_id: session.id, crew_member_id: id, kind: 'rest', starts_at: new Date(t).toISOString(), ends_at: new Date(tEnd).toISOString() });
      for (const id of watch) shifts.push({ session_id: session.id, crew_member_id: id, kind: 'watch', starts_at: new Date(t).toISOString(), ends_at: new Date(tEnd).toISOString() });
    }
    must(await admin.from('shelter_shifts').insert(shifts), 'turnos');
    for (const c of Object.values(st.crew)) c.autoArriveMin = 10 + Math.random() * 12;
    await logEvent('solar_storm', { s_scale: 4 }, userId);
    log('[sim] Tormenta solar lanzada.');
    return { ok: true };
  }

  async function allClear(nowArg, userId) {
    if (!st.storm) return { ok: false, reason: 'no_storm' };
    const now = nowArg ?? (await simNow());
    const avoided = must(await admin.rpc('close_shelter_session', { p_session: st.storm.sessionId }), 'cerrar refugio');
    if (st.storm.eventId) {
      await admin.from('space_weather_events').update({ ends_at: new Date(now).toISOString() }).eq('id', st.storm.eventId);
    }
    st.storm = null;
    for (const c of Object.values(st.crew)) c.zone = c.home;
    await logEvent('all_clear', { dose_avoided_msv: avoided }, userId);
    log(`[sim] Todo despejado. Dosis evitada: ${avoided} mSv.`);
    return { ok: true, doseAvoided: avoided };
  }

  async function setSpeed(n) {
    must(await admin.from('simulation_state').update({ time_speed: n }).eq('mission_id', missionId), 'velocidad');
  }
  async function setRunning(on) {
    must(await admin.from('simulation_state').update({ running: on }).eq('mission_id', missionId), 'pausa');
  }

  async function toggle(name, crewId, userId) {
    const o = st.overrides;
    if (name === 'lowO2') o.lowO2 = !o.lowO2;
    else if (name === 'highCO2') o.highCO2 = !o.highCO2;
    else if (name === 'lowSpo2' && st.crew[crewId]) o.lowSpo2[crewId] = !o.lowSpo2[crewId];
    else if (name === 'badSleep' && st.crew[crewId]) {
      o.badSleep[crewId] = !o.badSleep[crewId];
      st.lastSleepDay = null; // se vuelve a escribir el sueño en el siguiente paso
    } else return { ok: false, reason: 'unknown' };
    await logEvent(name, { crew_member_id: crewId || null }, userId);
    return { ok: true };
  }

  // Borra los datos de la demo de esta misión y vuelve al día inicial
  async function reset(userId) {
    const crewIds = Object.keys(st.crew);
    const zoneIds = Object.keys(st.zones);
    const sensorIds = Object.values(st.sensors);
    await setRunning(false);
    const steps = [
      ['sensor_readings', (q) => q.in('sensor_id', sensorIds)],
      ['sensor_readings_hourly', (q) => q.in('sensor_id', sensorIds)],
      ['alerts', (q) => q.eq('mission_id', missionId)],
      ['shelter_sessions', (q) => q.eq('mission_id', missionId)],
      ['space_weather_events', (q) => q.eq('mission_id', missionId)],
      ['dose_daily', (q) => q.in('crew_member_id', crewIds)],
      ['zone_dose_daily', (q) => q.in('zone_id', zoneIds)],
      ['baselines', (q) => q.in('crew_member_id', crewIds)],
      ['symptom_reports', (q) => q.in('crew_member_id', crewIds)],
      ['emergency_escalations', (q) => q.in('crew_member_id', crewIds)],
      ['surgeon_access_log', (q) => q.in('crew_member_id', crewIds)],
      ['daily_reports', (q) => q.eq('mission_id', missionId)],
      ['simulation_events', (q) => q.eq('mission_id', missionId)],
    ];
    for (const [table, filter] of steps) must(await filter(admin.from(table).delete()), `borrar ${table}`);
    must(await admin.from('simulation_state').update({ sim_clock: DEMO_START, time_speed: 60, running: false }).eq('mission_id', missionId), 'reloj inicial');
    st.overrides = { lowO2: false, highCO2: false, lowSpo2: {}, badSleep: {} };
    st.storm = null;
    st.lastSleepDay = null;
    st.lastBaselineAt = 0;
    await load();
    await logEvent('reset', {}, userId);
    log('[sim] Demo reiniciada.');
    return { ok: true };
  }

  function status() {
    return {
      ready: st.ready,
      overrides: st.overrides,
      storm: st.storm ? { start: st.storm.start, arrival: st.storm.arrival, end: st.storm.end, sessionId: st.storm.sessionId } : null,
      lastError: st.lastError,
    };
  }

  async function start() {
    await load();
    st.timer = setInterval(tick, tickMs);
  }

  return { start, triggerStorm, allClear, setSpeed, setRunning, toggle, reset, status };
}
