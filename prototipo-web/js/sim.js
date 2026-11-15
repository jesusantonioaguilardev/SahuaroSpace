// =====================================================================
// Simulador de la misión y motor de alertas (corre en el navegador).
// Imita la base de datos de supabase/schema.sql para la demo: lecturas,
// dosis acumulada, alertas, tormenta solar y refugio.
// ⚠️ Todos los valores son simulados y de referencia.
// =====================================================================
import { THRESHOLDS, TYPE_BY_METRIC } from './catalog.js';

export const MISSION = {
  name: 'Misión Horizonte',
  destination: { es: 'Marte', en: 'Mars' },
  start: Date.parse('2027-01-10T00:00:00Z'),
  end: Date.parse('2028-09-01T00:00:00Z'),
  commDelayS: 720,
};

export const ZONES = [
  { id: 'main', name: { es: 'Cabina principal', en: 'Main cabin' }, shielding: 1 },
  { id: 'lab', name: { es: 'Laboratorio', en: 'Laboratory' }, shielding: 1.2 },
  { id: 'dorm', name: { es: 'Dormitorios', en: 'Sleeping quarters' }, shielding: 2 },
  { id: 'shelter', name: { es: 'Refugio blindado', en: 'Storm shelter' }, shielding: 10, isShelter: true },
];

export const CREW = [
  { id: 'c1', name: 'Ana Ríos', role: { es: 'Comandante', en: 'Commander' }, lang: 'es', color: '#4F7CAC', priorDose: 120, doseFactor: 1.0, home: 'main', spo2: 97.5, hr: 62 },
  { id: 'c2', name: 'Leo Marín', role: { es: 'Ingeniero de vuelo', en: 'Flight engineer' }, lang: 'es', color: '#C0844A', priorDose: 45, doseFactor: 0.95, home: 'lab', spo2: 97, hr: 68 },
  { id: 'c3', name: 'Sam Okoro', role: { es: 'Médico a bordo', en: 'Crew medical officer' }, lang: 'en', color: '#5E9C76', priorDose: 0, doseFactor: 0.9, home: 'main', spo2: 98, hr: 58 },
  { id: 'c4', name: 'Mei Tanaka', role: { es: 'Científica', en: 'Scientist' }, lang: 'en', color: '#9A6FB0', priorDose: 30, doseFactor: 1.05, home: 'lab', spo2: 96.5, hr: 66 },
];

export const CAREER_LIMIT_MSV = 600; // ⚠️ NASA-STD-3001
const GCR_RATE = 40;                // µSv/h en la cabina principal ⚠️
const DAILY_DOSE_MSV = 0.75;        // dosis personal media por día en tránsito ⚠️
const SIM_START = Date.parse('2027-06-01T08:00:00Z');
const HIST = 240;
const HOUR = 3600e3;
const DAY = 24 * HOUR;

const RANK = { normal: 0, attention: 1, urgent: 2 };
const listeners = new Set();
let timer = null;
let alertSeq = 0;

export const sim = {};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(type, data) {
  for (const fn of listeners) fn(type, data);
}

const noise = (amp) => (Math.random() * 2 - 1) * amp;
const approach = (v, target, k) => v + (target - v) * k;
const dayKey = (t) => new Date(t).toISOString().slice(0, 10);

function pushHist(h, metric, t, v) {
  (h[metric] ||= []).push([t, v]);
  if (h[metric].length > HIST) h[metric].shift();
}

export function reset() {
  const now = SIM_START;
  const daysElapsed = (now - MISSION.start) / DAY;
  Object.assign(sim, {
    now,
    speed: 60,
    running: true,
    manualCrew: null,
    crew: {},
    zones: {},
    alerts: [],
    storm: null,
    shelter: null,
    overrides: { lowO2: false, highCO2: false, lowSpo2: {}, badSleep: {} },
    escalations: [],
    symptoms: [],
    trends: {},
    accessLog: [],
    events: [],
  });
  for (const z of ZONES) {
    sim.zones[z.id] = { ...z, o2: 34, pressure: 8.2, co2: 2.2, temp: 22, rate: GCR_RATE / z.shielding, hist: {} };
  }
  for (const c of CREW) {
    const missionDose = daysElapsed * DAILY_DOSE_MSV * c.doseFactor;
    sim.crew[c.id] = {
      ...c,
      zone: c.home,
      spo2: c.spo2,
      hrNow: c.hr,
      rr: 14,
      sleepMin: 400 + Math.round(Math.random() * 40),
      missionDose,
      doseByDay: { [dayKey(now)]: { total: 0, gcr: 0, spe: 0 } },
      hist: {},
    };
  }
  emit('reset');
}

// ---------------------------------------------------------------------
// Tormenta solar y refugio
// ---------------------------------------------------------------------
function speRate(t) {
  const s = sim.storm;
  if (!s || s.ended || t < s.arrival || t >= s.end) return 0;
  const PEAK = 1500; // µSv/h en la cabina principal en el pico ⚠️
  if (t < s.peak) return (PEAK * (t - s.arrival)) / (s.peak - s.arrival);
  return PEAK * Math.exp(-(t - s.peak) / (8 * HOUR));
}

function makeShifts(from, to) {
  const shifts = [];
  const a = ['c1', 'c3'];
  const b = ['c2', 'c4'];
  let i = 0;
  for (let t = from; t < to; t += 3 * HOUR, i++) {
    shifts.push({ start: t, end: Math.min(t + 3 * HOUR, to), rest: i % 2 ? b : a, watch: i % 2 ? a : b });
  }
  return shifts;
}

export function triggerStorm() {
  if (sim.storm && !sim.storm.ended) return;
  const t0 = sim.now;
  const arrival = t0 + 30 * 60e3;
  sim.storm = { warnedAt: t0, arrival, peak: arrival + 2 * HOUR, end: arrival + 30 * HOUR, ended: false, label: 'SEP · S4' };
  sim.shelter = {
    startedAt: t0,
    expectedEnd: sim.storm.end,
    endedAt: null,
    arrived: {},
    shifts: makeShifts(arrival, sim.storm.end),
    doseAvoided: 0,
  };
  // Las demás personas llegan solas entre 5 y 15 minutos simulados
  for (const id of Object.keys(sim.crew)) {
    sim.crew[id].autoArriveAt = t0 + (5 + Math.random() * 10) * 60e3;
  }
  createAlert({ type: 'solar_storm', level: 'urgent', crewId: null, zone: 'shelter', auto: false });
  log('solar_storm');
  emit('storm');
}

export function allClear() {
  if (!sim.storm || sim.storm.ended) return;
  sim.storm.ended = true;
  sim.storm.endedAt = sim.now;
  if (sim.shelter) sim.shelter.endedAt = sim.now;
  for (const c of Object.values(sim.crew)) c.zone = c.home;
  for (const a of sim.alerts) {
    if (a.type === 'solar_storm' && a.status !== 'resolved') {
      a.status = 'resolved';
      a.resolvedAt = sim.now;
      a.resolvedBy = 'all_clear';
    }
  }
  log('all_clear');
  emit('storm');
}

export function markArrived(crewId) {
  if (!sim.shelter || sim.shelter.endedAt) return;
  if (!sim.shelter.arrived[crewId]) sim.shelter.arrived[crewId] = sim.now;
  sim.crew[crewId].zone = 'shelter';
  emit('shelter');
}

export const stormActive = () => Boolean(sim.storm && !sim.storm.ended);

// ---------------------------------------------------------------------
// Alertas
// ---------------------------------------------------------------------
export function levelFor(metric, v) {
  let lvl = 'normal';
  for (const th of THRESHOLDS) {
    if (th.metric !== metric) continue;
    const out = (th.min != null && v < th.min) || (th.max != null && v > th.max);
    if (out && RANK[th.level] > RANK[lvl]) lvl = th.level;
  }
  return lvl;
}

function createAlert({ type, level, crewId, zone, metric = null, value = null, auto }) {
  const a = {
    id: `a${++alertSeq}`,
    type, level, crewId, zone, metric, value, auto,
    createdAt: sim.now,
    status: 'active',
    acks: {},
    spoken: {},
    note: '',
  };
  sim.alerts.push(a);
  emit('alert', a);
  return a;
}

function evaluate(metric, v, crewId, zoneId) {
  const type = TYPE_BY_METRIC[metric];
  if (!type) return;
  // Durante la tormenta, la alerta de tormenta ya cubre la radiación alta
  if (metric === 'dose_rate_usv_h' && stormActive()) return;
  const lvl = levelFor(metric, v);
  const open = sim.alerts.find((a) => a.type === type && a.status !== 'resolved'
    && a.crewId === crewId && (crewId || a.zone === zoneId));
  if (lvl === 'normal') {
    if (open?.auto) {
      open.status = 'resolved';
      open.resolvedAt = sim.now;
      open.resolvedBy = 'auto';
      emit('alert', open);
    }
    return;
  }
  if (open && RANK[open.level] >= RANK[lvl]) {
    open.value = v;
    return;
  }
  if (open) {
    open.status = 'resolved';
    open.resolvedAt = sim.now;
    open.resolvedBy = 'escalated';
  }
  createAlert({ type, level: lvl, crewId, zone: zoneId, metric, value: v, auto: true });
}

export function acknowledge(alertId, who) {
  const a = sim.alerts.find((x) => x.id === alertId);
  if (!a) return;
  a.acks[who] = sim.now;
  if ((who === 'doctor' || who === a.crewId) && a.status === 'active') {
    a.status = 'acknowledged';
    a.acknowledgedAt = sim.now;
  }
  emit('alert', a);
}

export function resolve(alertId, note = '') {
  const a = sim.alerts.find((x) => x.id === alertId);
  if (!a) return;
  a.status = 'resolved';
  a.resolvedAt = sim.now;
  a.resolvedBy = 'doctor';
  a.note = note;
  emit('alert', a);
}

export function markSpoken(alertId, who) {
  const a = sim.alerts.find((x) => x.id === alertId);
  if (a) a.spoken[who] = sim.now;
}

export function openAlertsFor(crewId) {
  return sim.alerts.filter((a) => a.status !== 'resolved' && (a.crewId === crewId || a.crewId === null));
}

export function statusOf(crewId) {
  let lvl = 'normal';
  for (const a of openAlertsFor(crewId)) if (RANK[a.level] > RANK[lvl]) lvl = a.level;
  return lvl;
}

// ---------------------------------------------------------------------
// Datos derivados
// ---------------------------------------------------------------------
export function doseToday(crewId) {
  return sim.crew[crewId].doseByDay[dayKey(sim.now)] || { total: 0, gcr: 0, spe: 0 };
}

export function career(crewId) {
  const c = sim.crew[crewId];
  const careerDose = c.priorDose + c.missionDose;
  const daysLeft = Math.max(0, (MISSION.end - sim.now) / DAY);
  const projectedMission = c.missionDose + daysLeft * DAILY_DOSE_MSV * c.doseFactor;
  return {
    mission: c.missionDose,
    career: careerDose,
    limit: CAREER_LIMIT_MSV,
    pct: (100 * careerDose) / CAREER_LIMIT_MSV,
    projectedCareer: c.priorDose + projectedMission,
  };
}

export function missionDay() {
  return Math.floor((sim.now - MISSION.start) / DAY) + 1;
}

export function shiftNow() {
  return sim.shelter?.shifts.find((s) => sim.now >= s.start && sim.now < s.end) || null;
}

// ---------------------------------------------------------------------
// Controles de la consola de demo
// ---------------------------------------------------------------------
export function setSpeed(n) { sim.speed = n; emit('control'); }
export function setRunning(on) { sim.running = on; emit('control'); }
export function toggleLowO2() { sim.overrides.lowO2 = !sim.overrides.lowO2; log('lower_o2'); emit('control'); }
export function toggleHighCO2() { sim.overrides.highCO2 = !sim.overrides.highCO2; log('raise_co2'); emit('control'); }
export function toggleLowSpo2(id) { sim.overrides.lowSpo2[id] = !sim.overrides.lowSpo2[id]; log('lower_spo2'); emit('control'); }
export function badSleep(id) {
  sim.overrides.badSleep[id] = !sim.overrides.badSleep[id];
  sim.crew[id].sleepMin = sim.overrides.badSleep[id] ? 250 : 410;
  log('bad_sleep');
  emit('control');
}

function log(kind) {
  sim.events.push({ kind, at: sim.now });
}

// Ánimo y sueño compartidos (solo lo que el tripulante permite)
export function setTrend(crewId, day, values) {
  const t = ((sim.trends[crewId] ||= {})[day] ||= {});
  Object.assign(t, values);
  emit('trend');
}
export function clearTrend(crewId, fields) {
  for (const t of Object.values(sim.trends[crewId] || {})) for (const f of fields) delete t[f];
  emit('trend');
}
export function addSymptoms(crewId, list) {
  for (const s of list) sim.symptoms.push({ crewId, symptom: s, at: sim.now });
  emit('symptom');
}
export function addEscalation(crewId, category) {
  sim.escalations.push({ id: `e${sim.escalations.length + 1}`, crewId, category, at: sim.now, ack: false });
  emit('escalation');
}
export function logAccess(crewId, resource) {
  const last = sim.accessLog.findLast?.((x) => x.crewId === crewId && x.resource === resource);
  if (last && sim.now - last.at < 30 * 60e3) return;
  sim.accessLog.push({ crewId, resource, at: sim.now });
}

// ---------------------------------------------------------------------
// Paso de simulación (1 s real = `speed` s simulados)
// ---------------------------------------------------------------------
function step() {
  if (!sim.running) return;
  const dtS = sim.speed;
  const dtH = dtS / 3600;
  const prevDay = dayKey(sim.now);
  sim.now += dtS * 1000;
  const today = dayKey(sim.now);
  if (today !== prevDay) {
    for (const c of Object.values(sim.crew)) {
      c.doseByDay[today] = { total: 0, gcr: 0, spe: 0 };
      if (!sim.overrides.badSleep[c.id]) c.sleepMin = 390 + Math.round(Math.random() * 60);
    }
  }

  if (sim.storm && !sim.storm.ended && sim.now >= sim.storm.end) allClear();

  const spe = speRate(sim.now);
  const kAir = Math.min(1, dtS / 1200);
  const kBody = Math.min(1, dtS / 300);
  const occupants = (zid) => Object.values(sim.crew).filter((c) => c.zone === zid).length;

  // Llegadas automáticas al refugio
  if (sim.shelter && !sim.shelter.endedAt) {
    for (const c of Object.values(sim.crew)) {
      if (c.id !== sim.manualCrew && !sim.shelter.arrived[c.id] && sim.now >= c.autoArriveAt) markArrived(c.id);
    }
  }

  for (const z of Object.values(sim.zones)) {
    const o2Target = sim.overrides.lowO2 ? 29 : 34;
    const co2Target = 2.2 + (sim.overrides.highCO2 ? 3 : 0) + (z.isShelter ? 0.35 * occupants(z.id) : 0);
    z.o2 = approach(z.o2, o2Target, kAir) + noise(0.05);
    z.co2 = Math.max(0.5, approach(z.co2, co2Target, kAir) + noise(0.04));
    z.pressure = 8.2 + noise(0.02);
    z.temp = 22 + noise(0.2);
    z.rate = ((GCR_RATE + spe) / z.shielding) * (1 + noise(0.04));
    for (const [m, v] of [['cabin_o2_pct', z.o2], ['cabin_co2_mmhg', z.co2], ['cabin_pressure_psia', z.pressure], ['cabin_temp_c', z.temp], ['dose_rate_usv_h', z.rate]]) {
      pushHist(z.hist, m, sim.now, v);
      evaluate(m, v, null, z.id);
    }
  }

  for (const c of Object.values(sim.crew)) {
    const z = sim.zones[c.zone];
    const spo2Target = c.spo2Base ?? (c.spo2Base = c.spo2);
    let target = spo2Target - Math.max(0, 34 - z.o2) * 1.6 - (sim.overrides.lowSpo2[c.id] ? 11 : 0);
    c.spo2 = Math.min(100, approach(c.spo2, target, kBody) + noise(0.25));
    const hypoxic = c.spo2 < 92;
    c.hrNow = approach(c.hrNow, c.hr + (stormActive() ? 8 : 0) + (hypoxic ? 15 : 0), kBody) + noise(1.2);
    c.rr = approach(c.rr, 14 + (hypoxic ? 6 : 0), kBody) + noise(0.3);

    // Dosis personal según la zona donde está
    const inc = (z.rate * dtH) / 1000;
    const incSpe = ((spe / z.shielding) * dtH) / 1000;
    const d = (c.doseByDay[today] ||= { total: 0, gcr: 0, spe: 0 });
    d.total += inc;
    d.spe += incSpe;
    d.gcr += inc - incSpe;
    c.missionDose += inc;

    // Dosis evitada por estar en el refugio
    if (sim.shelter && !sim.shelter.endedAt && c.zone === 'shelter') {
      const homeRate = sim.zones[c.home].rate;
      sim.shelter.doseAvoided += Math.max(0, homeRate - z.rate) * dtH / 1000;
    }

    for (const [m, v] of [['spo2_pct', c.spo2], ['heart_rate_bpm', c.hrNow], ['resp_rate_bpm', c.rr], ['dose_rate_usv_h', z.rate]]) {
      pushHist(c.hist, m, sim.now, v);
      if (m !== 'dose_rate_usv_h') evaluate(m, v, c.id, null);
    }
  }

  emit('tick');
}

export function start() {
  if (!sim.crew || !Object.keys(sim.crew).length) reset();
  if (!timer) timer = setInterval(step, 1000);
}

reset();
