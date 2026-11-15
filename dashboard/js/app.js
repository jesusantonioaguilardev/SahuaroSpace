// =====================================================================
// ELOISE · Dashboard de monitoreo (médico de vuelo y consola de demo)
// Diseño: "Diseñar plataforma espacial Eloise" (Figma Make) → eloise.css
// Datos: Supabase con la sesión del médico; las reglas de acceso (RLS)
// deciden qué se ve. Las conversaciones con los personajes nunca están aquí.
// =====================================================================
import { icon } from './icons.js';

const $ = (id) => document.getElementById(id);
const NAV = [
  ['M1', 'crew', 'Tripulación', 'Crew'],
  ['M2', 'user', 'Expediente', 'Health record'],
  ['M3', 'alert', 'Alertas', 'Alerts'],
  ['M4', 'radiation', 'Radiación', 'Radiation'],
  ['M5', 'report', 'Informe a Tierra', 'Report to Earth'],
  ['D1', 'settings', 'Consola de simulación', 'Simulation console'],
];
const SCREENS = NAV.map((n) => n[0]);
const REFRESH_MS = 3000;

let lang = 'es';
try { lang = localStorage.getItem('eloise-lang') || 'es'; } catch { /* sin almacenamiento */ }
const tx = (es, en) => (lang === 'en' ? en : es);

const state = {
  sb: null,
  session: null,
  me: null,
  screen: SCREENS.includes(location.hash.slice(2)) ? location.hash.slice(2) : 'M1',
  crewId: null,
  alertId: null,
  alertTab: 'active',
  consoleCrew: null,
  data: {},
  simStatus: null,
  timer: null,
  loading: false,
  accessLogged: {},
};

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = (v, d = 1) => (v == null ? '—' : Number(v).toFixed(d));
const clock = (ts) => (ts ? new Date(ts).toISOString().slice(11, 16) : '—');
const clockS = (ts) => (ts ? new Date(ts).toISOString().slice(11, 19) : '—');
const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);
const initials = (name) => String(name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const TONE = { urgent: 'critical', attention: 'warn', normal: 'safe' };
const RANK = { normal: 0, attention: 1, urgent: 2 };
const LEVEL_TXT = { normal: ['Óptimo', 'Optimal'], attention: ['Atención', 'Attention'], urgent: ['Crítico', 'Critical'] };
const levelTxt = (l) => tx(...(LEVEL_TXT[l] || LEVEL_TXT.normal));

const pill = (text, tone = 'safe') => `<span class="pill ${tone}"><i></i>${esc(text)}</span>`;
const button = (text, { variant = 'primary', iconName, action, attrs = '' } = {}) =>
  `<button class="button ${variant}" ${action ? `data-action="${action}"` : ''} ${attrs}>${iconName ? icon(iconName, 18) : ''}${esc(text)}</button>`;
const panel = (inner, { title, action = '', cls = '' } = {}) =>
  `<section class="panel ${cls}">${title ? `<div class="panel-title"><h3>${esc(title)}</h3>${action}</div>` : ''}${inner}</section>`;
const screenHeader = ({ eyebrow, title, subtitle, action = '' }) => `
  <header class="screen-header"><div>
    ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
    <h1>${esc(title)}</h1>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
  </div>${action ? `<div>${action}</div>` : ''}</header>`;
const logo = (compact = false) => `<div class="logo"><span class="logo-mark"><span></span></span>${compact ? '' : '<div><strong>ELOISE</strong><small>MISSION CARE SYSTEM</small></div>'}</div>`;
const orb = (small = false) => `<div class="eco-orb ready ${small ? 'small' : ''}"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orb-core"><span></span></div></div>`;

/** Sparkline del diseño, con datos reales (y = 0 arriba). */
function sparkline(values, color = '#39D8E8', { min, max } = {}) {
  if (!values || values.length < 2) return '<svg class="sparkline" viewBox="0 0 160 40" preserveAspectRatio="none"><path d="M0 39H160M0 26H160M0 13H160" class="gridline"/></svg>';
  let lo = min ?? Math.min(...values);
  let hi = max ?? Math.max(...values);
  if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 160, 37 - ((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 32]);
  const last = pts[pts.length - 1];
  return `<svg class="sparkline" viewBox="0 0 160 40" preserveAspectRatio="none">
    <path d="M0 39H160M0 26H160M0 13H160" class="gridline"/>
    <polyline points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3" fill="${color}"/></svg>`;
}

function metricCard({ iconName, label, value, unit = '', detail, tone = 'cyan', values, min, max }) {
  const color = tone === 'green' ? '#35D39A' : tone === 'yellow' ? '#FFC857' : tone === 'red' ? '#FF4D5A' : '#39D8E8';
  const pillTone = tone === 'yellow' ? 'warn' : tone === 'red' ? 'critical' : 'safe';
  return panel(`
    <div class="metric-head"><span class="metric-icon">${icon(iconName)}</span>${pill(detail, pillTone)}</div>
    <div class="label">${esc(label)}</div>
    <div class="metric-value">${esc(value)} <small>${esc(unit)}</small></div>
    ${values ? sparkline(values, color, { min, max }) : ''}`, { cls: `metric-card ${tone === 'red' ? 'yellow' : tone}` });
}

function kpi(iconName, tone, label, value, unit, sub, subWarn = false) {
  return panel(`<span class="kpi-icon ${tone}">${icon(iconName)}</span>
    <div><small>${esc(label)}</small><strong>${esc(value)} ${unit ? `<em>${esc(unit)}</em>` : ''}</strong>
    <span class="${subWarn ? 'warn-text' : ''}">${esc(sub)}</span></div>`);
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, 4000);
}

function check({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

const D = () => state.data;
const simNow = () => (D().sim ? Date.parse(D().sim.sim_clock) : Date.now());
const crewById = (id) => D().crew?.find((c) => c.id === id);
const zoneName = (id) => D().zones?.find((z) => z.id === id)?.name || '—';
const latestFor = (crewId, metric) => D().latest?.find((r) => r.crew_member_id === crewId && r.metric === metric);
const latestZone = (zoneId, metric) => D().latest?.find((r) => r.crew_member_id == null && r.zone_id === zoneId && r.metric === metric);
const statusOf = (crewId) => D().status?.find((s) => s.crew_member_id === crewId)?.overall_level || 'normal';
const careerOf = (crewId) => D().career?.find((k) => k.crew_member_id === crewId);
const hasConsent = (crewId, scope) => Boolean(D().consents?.find((k) => k.crew_member_id === crewId && k.scope === scope && k.granted));
const alertTitle = (a) => (lang === 'en' ? a.message_en : a.message_es);
const mainZone = () => D().zones?.find((z) => !z.is_shelter && Number(z.shielding_factor) <= 1) || D().zones?.[0];
const shelterZone = () => D().zones?.find((z) => z.is_shelter);

function missionDay(ts = simNow()) {
  const start = D().mission?.start_date;
  return start ? Math.floor((ts - Date.parse(start)) / 86400e3) + 1 : 0;
}
function met() {
  const start = D().mission?.start_date;
  if (!start) return '—';
  const s = Math.max(0, Math.floor((simNow() - Date.parse(start)) / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${String(d).padStart(3, '0')}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function duration(ms) {
  const min = Math.max(0, Math.round(ms / 60e3));
  const h = Math.floor(min / 60);
  return h ? `${h}h ${String(min % 60).padStart(2, '0')}m` : `${min} min`;
}
const delayTxt = () => {
  const s = Number(D().mission?.comm_delay_s || 0);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------
// Arranque y sesión
// ---------------------------------------------------------------------
async function init() {
  let config = {};
  try { config = await (await fetch('/api/config')).json(); } catch { /* sin servidor */ }
  if (!config.supabaseUrl || !config.supabaseKey || !window.supabase) return renderSetup();
  state.sb = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
  const { data } = await state.sb.auth.getSession();
  state.session = data.session;
  state.sb.auth.onAuthStateChange((_e, session) => { state.session = session; });
  if (state.session) await afterLogin();
  else renderLogin();
}

async function afterLogin() {
  const { data: me } = await state.sb.from('app_users').select('*').eq('id', state.session.user.id).maybeSingle();
  if (!me || !['surgeon', 'admin'].includes(me.role)) {
    await state.sb.auth.signOut();
    return renderLogin(tx('Esta cuenta no es de personal médico.', 'This account is not a medical account.'));
  }
  state.me = me;
  await refresh();
  clearInterval(state.timer);
  state.timer = setInterval(refresh, REFRESH_MS);
}

function renderSetup() {
  $('root').innerHTML = `<div class="login-wrap"><div class="login-card">${panel(`${logo()}
    <h1>${tx('Falta conectar Supabase', 'Supabase is not connected')}</h1>
    <p>${tx('Agrega SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY al archivo .env y reinicia el servidor.', 'Add SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to .env and restart the server.')}</p>`)}</div></div>`;
}

function renderLogin(error = '') {
  $('root').innerHTML = `<div class="login-wrap"><div class="login-card">${panel(`${logo()}
    ${pill(tx('RED MÉDICA CIFRADA', 'ENCRYPTED MEDICAL NETWORK'), 'info')}
    <h1 style="margin-top:14px">${tx('Acceso del personal médico', 'Medical staff sign-in')}</h1>
    <p>${tx('Usa la cuenta del médico de vuelo creada en Supabase.', 'Use the flight surgeon account created in Supabase.')}</p>
    <form id="loginForm">
      <label class="field"><span>${tx('Correo', 'Email')}</span><input name="email" type="email" autocomplete="username" required value="medico@astrohealth.test"></label>
      <label class="field"><span>${tx('Contraseña', 'Password')}</span><input name="password" type="password" autocomplete="current-password" required></label>
      ${error ? `<p class="error-text" role="alert">${esc(error)}</p>` : ''}
      <button class="button primary" type="submit">${icon('lock', 18)}${tx('Entrar', 'Sign in')}</button>
    </form>
    <p style="margin:14px 0 0"><button class="lang-btn" data-action="lang" type="button">${lang === 'es' ? 'English' : 'Español'}</button></p>`)}</div></div>`;
}

// ---------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------
async function refresh() {
  if (state.loading || !state.me) return;
  state.loading = true;
  try {
    const sb = state.sb;
    const [mission, sim, zones, crew, status, career, latest, openAlerts, shelter, consents] = await Promise.all([
      sb.from('missions').select('*').eq('id', state.me.mission_id).single(),
      sb.from('simulation_state').select('*').eq('mission_id', state.me.mission_id).maybeSingle(),
      sb.from('vehicle_zones').select('*').order('shielding_factor'),
      sb.from('crew_members').select('*').order('id'),
      sb.from('crew_status').select('*'),
      sb.from('dose_career').select('*'),
      sb.from('latest_readings').select('*'),
      sb.from('alerts').select('*').neq('status', 'resolved').order('created_at', { ascending: false }),
      sb.from('shelter_sessions').select('*, space_weather_events(*)').is('ended_at', null).maybeSingle(),
      sb.from('consents').select('*'),
    ]);
    Object.assign(state.data, {
      mission: check(mission, 'misión'),
      sim: check(sim, 'reloj'),
      zones: check(zones, 'zonas'),
      crew: check(crew, 'tripulación'),
      status: check(status, 'estado'),
      career: check(career, 'dosis'),
      latest: check(latest, 'lecturas'),
      openAlerts: check(openAlerts, 'alertas'),
      shelter: check(shelter, 'refugio'),
      consents: check(consents, 'permisos'),
    });
    if (!state.crewId) state.crewId = D().crew[0]?.id;
    if (!state.consoleCrew) state.consoleCrew = D().crew[0]?.id;
    await loadScreen();
    render();
  } catch (err) {
    toast(err.message);
  } finally {
    state.loading = false;
  }
}

async function loadScreen() {
  const sb = state.sb;
  const d = D();
  const today = dayKey(simNow());
  if (state.screen === 'M1') {
    const [doseToday, symptoms, assignments] = await Promise.all([
      sb.from('dose_daily').select('*').eq('day', today),
      sb.from('symptom_reports').select('*').order('reported_at', { ascending: false }).limit(6),
      d.shelter ? sb.from('shelter_assignments').select('*').eq('session_id', d.shelter.id) : Promise.resolve({ data: [] }),
    ]);
    d.doseToday = check(doseToday, 'dosis de hoy');
    d.symptoms = check(symptoms, 'síntomas');
    d.assignments = check(assignments, 'refugio');
    await logAccess(d.crew.map((c) => c.id), 'M1');
  } else if (state.screen === 'M2') {
    const id = state.crewId;
    const [hist, doses, alerts, symptoms, trends] = await Promise.all([
      sb.from('sensor_readings').select('metric, value, recorded_at').eq('crew_member_id', id)
        .in('metric', ['spo2_pct', 'heart_rate_bpm', 'resp_rate_bpm', 'dose_rate_usv_h', 'sleep_minutes'])
        .order('recorded_at', { ascending: false }).limit(500),
      sb.from('dose_daily').select('*').eq('crew_member_id', id).order('day', { ascending: false }).limit(14),
      sb.from('alerts').select('*').eq('crew_member_id', id).order('created_at', { ascending: false }).limit(8),
      sb.from('symptom_reports').select('*').eq('crew_member_id', id).order('reported_at', { ascending: false }).limit(6),
      sb.from('wellbeing_trends').select('*').eq('crew_member_id', id).order('day', { ascending: false }).limit(7),
    ]);
    const byMetric = {};
    for (const r of check(hist, 'historial').reverse()) (byMetric[r.metric] ||= []).push(Number(r.value));
    d.detail = { byMetric, doses: check(doses, 'dosis').reverse(), alerts: check(alerts, 'alertas'), symptoms: check(symptoms, 'síntomas'), trends: check(trends, 'tendencias').reverse() };
    await logAccess([id], 'M2');
  } else if (state.screen === 'M3') {
    const [resolved, escalations, symptoms] = await Promise.all([
      sb.from('alerts').select('*').eq('status', 'resolved').order('resolved_at', { ascending: false }).limit(20),
      sb.from('emergency_escalations').select('*').order('created_at', { ascending: false }).limit(10),
      sb.from('symptom_reports').select('*').order('reported_at', { ascending: false }).limit(10),
    ]);
    d.resolved = check(resolved, 'resueltas');
    d.escalations = check(escalations, 'emergencias');
    d.symptoms = check(symptoms, 'síntomas');
  } else if (state.screen === 'M4') {
    const since = dayKey(simNow() - 6 * 86400e3);
    const [zoneDose, events, sessions] = await Promise.all([
      sb.from('zone_dose_daily').select('*').gte('day', since),
      sb.from('space_weather_events').select('*').order('starts_at', { ascending: false }).limit(4),
      sb.from('shelter_sessions').select('*').order('started_at', { ascending: false }).limit(5),
    ]);
    d.zoneDose = check(zoneDose, 'dosis por zona');
    d.events = check(events, 'clima espacial');
    d.sessions = check(sessions, 'refugios');
  } else if (state.screen === 'M5') {
    const [reports, doseDay, alertsDay, escalationsDay, trends] = await Promise.all([
      sb.from('daily_reports').select('*').order('day', { ascending: false }).limit(5),
      sb.from('dose_daily').select('*').eq('day', today),
      sb.from('alerts').select('level, alert_type_id, message_es, message_en, created_at').gte('created_at', `${today}T00:00:00Z`).lte('created_at', `${today}T23:59:59Z`).order('created_at', { ascending: false }),
      sb.from('emergency_escalations').select('category, created_at').gte('created_at', `${today}T00:00:00Z`),
      sb.from('wellbeing_trends').select('*').eq('day', today),
    ]);
    d.reports = check(reports, 'informes');
    d.reportInputs = { day: today, dose: check(doseDay, 'dosis'), alerts: check(alertsDay, 'alertas'), escalations: check(escalationsDay, 'emergencias'), trends: check(trends, 'tendencias') };
  } else if (state.screen === 'D1') {
    const [events, status] = await Promise.all([
      sb.from('simulation_events').select('*').order('triggered_at', { ascending: false }).limit(8),
      simApi('status', null, 'GET').catch(() => null),
    ]);
    d.simEvents = events.error ? [] : events.data;
    state.simStatus = status;
  }
}

// Cada consulta queda registrada; el tripulante la ve en su app (Privacidad)
async function logAccess(crewIds, screen) {
  const now = Date.now();
  const rows = [];
  for (const id of crewIds) {
    const resources = [`${screen}:safety`];
    if (hasConsent(id, 'mood_trend') || hasConsent(id, 'sleep_trend')) resources.push(`${screen}:wellbeing`);
    if (screen === 'M2') resources.push('M2:detail');
    for (const r of resources) {
      const key = `${id}:${r}`;
      if (now - (state.accessLogged[key] || 0) < 10 * 60e3) continue;
      state.accessLogged[key] = now;
      rows.push({ surgeon_user_id: state.me.id, crew_member_id: id, resource: r });
    }
  }
  if (rows.length) await state.sb.from('surgeon_access_log').insert(rows);
}

async function simApi(action, body, method = 'POST') {
  const res = await fetch(`/api/sim/${action}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.session?.access_token}` },
    body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`);
  return json;
}

// ---------------------------------------------------------------------
// Estructura (DesktopShell del diseño)
// ---------------------------------------------------------------------
function render() {
  if (!state.me) return;
  // No redibujar mientras alguien usa un control de formulario (se perdería el foco)
  const active = document.activeElement;
  if (active && ['SELECT', 'INPUT', 'TEXTAREA'].includes(active.tagName) && active.closest('main')) {
    renderHeaderOnly();
    return;
  }
  const scrollY = window.scrollY;
  const urgent = D().openAlerts.filter((a) => a.level === 'urgent').length;
  const screens = { M1: renderM1, M2: renderM2, M3: renderM3, M4: renderM4, M5: renderM5, D1: renderD1 };
  $('root').innerHTML = `
    <div class="desktop-shell">
      <aside>
        ${logo()}
        <div class="mission-id"><span>${esc(D().mission.name.toUpperCase())}</span><strong>${tx('Misión activa', 'Active mission')}</strong>${pill('ONLINE')}</div>
        <nav>${NAV.map(([id, ic, es, en]) => `
          <button class="${state.screen === id ? 'active' : ''}" data-action="nav" data-screen="${id}">
            ${icon(ic)}<span>${tx(es, en)}</span>${id === 'M3' && D().openAlerts.length ? `<b>${D().openAlerts.length}</b>` : ''}
          </button>`).join('')}</nav>
        <div class="aside-bottom">
          <button class="logout-btn" data-action="logout">${icon('logout', 16)} ${tx('Cerrar sesión', 'Sign out')}</button>
          <div class="user-card"><span>${esc(initials(state.me.display_name || 'MV'))}</span>
            <div><strong>${esc(state.me.display_name || tx('Médico de vuelo', 'Flight surgeon'))}</strong><small>${tx('Médico de vuelo', 'Flight surgeon')}</small></div></div>
        </div>
      </aside>
      <div class="desktop-main">
        <header id="topbar">${topbar(urgent)}</header>
        <main>${(screens[state.screen] || renderM1)()}</main>
      </div>
    </div>`;
  window.scrollTo(0, scrollY);
}

function topbar(urgent) {
  return `
    <div class="status-bar">
      <span><i class="status-dot"></i> ${tx('NAVE CONECTADA', 'SHIP CONNECTED')}</span>
      <span>${icon('comm', 14)} ${tx('TIERRA', 'EARTH')} · +${delayTxt()}</span>
      <span class="mono">MET ${met()}</span>
      <span class="mono">UTC ${clock(simNow())}${D().sim?.running ? '' : ` · ${tx('PAUSA', 'PAUSED')}`}</span>
    </div>
    <div class="header-actions">
      <button data-action="nav" data-screen="M3" aria-label="${tx('Alertas', 'Alerts')}">${icon('alert', 18)}${urgent ? '<i></i>' : ''}</button>
      <span>${tx('RED MÉDICA CIFRADA', 'ENCRYPTED MEDICAL NETWORK')}</span>
      <button class="lang-btn" data-action="lang">${lang === 'es' ? 'EN' : 'ES'}</button>
    </div>`;
}

function renderHeaderOnly() {
  const el = $('topbar');
  if (el) el.innerHTML = topbar(D().openAlerts.filter((a) => a.level === 'urgent').length);
}

// ---------------------------------------------------------------------
// M1 · Estado de la tripulación
// ---------------------------------------------------------------------
function renderM1() {
  const d = D();
  const crew = d.crew;
  const optimal = crew.filter((c) => statusOf(c.id) === 'normal').length;
  const avgDose = crew.reduce((a, c) => a + Number(careerOf(c.id)?.career_dose_msv || 0), 0) / Math.max(1, crew.length);
  const avgPct = crew.reduce((a, c) => a + Number(careerOf(c.id)?.pct_of_limit || 0), 0) / Math.max(1, crew.length);
  const z = mainZone();
  const storm = d.shelter;
  const total = d.mission.end_date_planned ? Math.round((Date.parse(d.mission.end_date_planned) - Date.parse(d.mission.start_date)) / 86400e3) : null;
  const day = missionDay();
  const attention = d.openAlerts.slice().sort((a, b) => RANK[b.level] - RANK[a.level]).slice(0, 4);

  const rows = crew.map((c) => {
    const lvl = statusOf(c.id);
    const hr = latestFor(c.id, 'heart_rate_bpm');
    const k = careerOf(c.id);
    return `<button class="table-row" data-action="crew" data-id="${c.id}">
      <span><i class="crew-avatar" style="color:${esc(c.avatar_color || '#39d8e8')}">${esc(initials(c.display_name))}</i>
        <span><strong>${esc(c.display_name)}</strong><small>${esc(c.role_title || '')}</small></span></span>
      <span>${pill(levelTxt(lvl), TONE[lvl])}</span>
      <span class="mono">${num(k?.career_dose_msv, 1)} mSv</span>
      <span class="mono">${hr ? Math.round(hr.value) : '—'} ${tx('lpm', 'bpm')}</span>
      <span>${hr ? `${tx('Día', 'Day')} ${missionDay(Date.parse(hr.recorded_at))} · ${clock(hr.recorded_at)}` : '—'}</span>
      ${icon('chevron', 17)}
    </button>`;
  }).join('');

  return `<div class="desktop-content">
    ${screenHeader({
      eyebrow: `${d.mission.name.toUpperCase()} · ${tx('DÍA', 'DAY')} ${day}`,
      title: tx('Estado de la tripulación', 'Crew status'),
      subtitle: tx('Vista consolidada de salud, bienestar y seguridad de la misión.', 'Consolidated view of mission health, wellbeing and safety.'),
      action: `${button(tx('Preparar informe', 'Prepare report'), { variant: 'secondary', iconName: 'report', action: 'nav', attrs: 'data-screen="M5"' })}
        ${button(`${d.openAlerts.length} ${tx('alertas activas', 'active alerts')}`, { iconName: 'alert', action: 'nav', attrs: 'data-screen="M3"' })}`,
    })}
    <div class="kpi-grid">
      ${kpi('crew', '', tx('TRIPULACIÓN', 'CREW'), crew.length, `/ ${crew.length} ${tx('activos', 'active')}`, storm ? `${(d.assignments || []).filter((a) => a.arrived_at).length} ${tx('en el refugio', 'in the shelter')}` : tx('Todos localizados', 'All located'))}
      ${kpi('shield', 'safe', tx('ESTADO GENERAL', 'OVERALL STATUS'), optimal, tx('óptimos', 'optimal'), crew.length - optimal ? `${crew.length - optimal} ${tx('requieren atención', 'need attention')}` : tx('Sin incidencias', 'No issues'), crew.length - optimal > 0)}
      ${kpi('radiation', 'warn', tx('DOSIS MEDIA', 'AVERAGE DOSE'), num(avgDose, 1), 'mSv', `${num(avgPct, 1)}% ${tx('del límite', 'of the limit')}`)}
      ${kpi('comm', '', tx('ENLACE TIERRA', 'EARTH LINK'), tx('Estable', 'Stable'), '', `${tx('Retraso', 'Delay')} ${delayTxt()} min`)}
    </div>
    <div class="mission-strip">
      <div><span class="pulse-dot"></span><strong>${storm ? tx('TORMENTA SOLAR · REFUGIO ACTIVO', 'SOLAR STORM · SHELTER ACTIVE') : tx('MISIÓN NOMINAL', 'MISSION NOMINAL')}</strong>
        <small>${tx('Última sincronización', 'Last sync')} · ${clockS(simNow())} UTC</small></div>
      <div>
        <span>O₂ ${tx('CABINA', 'CABIN')} <strong>${num(latestZone(z?.id, 'cabin_o2_pct')?.value, 1)}%</strong></span>
        <span>CO₂ <strong>${num(latestZone(z?.id, 'cabin_co2_mmhg')?.value, 1)} mmHg</strong></span>
        <span>${tx('PRESIÓN', 'PRESSURE')} <strong>${num(latestZone(z?.id, 'cabin_pressure_psia')?.value, 2)} psia</strong></span>
        <span>${tx('TEMP.', 'TEMP.')} <strong>${num(latestZone(z?.id, 'cabin_temp_c')?.value, 1)} °C</strong></span>
      </div>
    </div>
    ${panel(`<div class="crew-table">
      <div class="table-head"><span>${tx('TRIPULANTE', 'CREW MEMBER')}</span><span>${tx('ESTADO', 'STATUS')}</span><span>${tx('RADIACIÓN', 'RADIATION')}</span><span>${tx('FREC. CARDÍACA', 'HEART RATE')}</span><span>${tx('ÚLTIMO REGISTRO', 'LAST READING')}</span><span></span></div>
      ${rows}</div>`, { title: tx('Tripulación', 'Crew'), cls: 'table-panel', action: `<span class="muted">${tx('Las conversaciones nunca aparecen aquí', 'Conversations never appear here')}</span>` })}
    <div class="two-col unequal">
      ${panel(attention.length ? attention.map((a) => `
        <div class="attention-item ${a.level === 'urgent' ? 'warn' : 'info'}" >
          <span>${icon(a.metric?.includes('dose') || a.alert_type_id === 'solar_storm' ? 'radiation' : a.metric?.includes('heart') ? 'heart' : 'alert')}</span>
          <div><strong>${esc(a.crew_member_id ? crewById(a.crew_member_id)?.display_name : zoneName(a.zone_id))} · ${esc(alertTitle(a).replace(/\s*\(.*\)$/, ''))}</strong>
          <p>${a.value != null ? `${num(a.value, 1)} · ` : ''}${tx('Día', 'Day')} ${missionDay(Date.parse(a.created_at))} · ${clock(a.created_at)} UTC</p></div>
          ${pill(a.level === 'urgent' ? tx('CRÍTICA', 'CRITICAL') : tx('REVISAR', 'REVIEW'), a.level === 'urgent' ? 'critical' : 'warn')}
        </div>`).join('') : `<p class="empty-note">${tx('Sin alertas abiertas.', 'No open alerts.')}</p>`, { title: tx('Atención requerida', 'Attention required') })}
      ${panel(`
        <div class="mission-progress"><span>${tx('DÍA', 'DAY')} ${day}${total ? ` ${tx('DE', 'OF')} ${total}` : ''}</span><strong>${total ? num((100 * day) / total, 1) : '—'}%</strong>
          <div class="progress"><i style="width:${total ? Math.min(100, (100 * day) / total) : 0}%"></i></div></div>
        <div class="mission-stat"><span>${tx('Refugio', 'Shelter')}</span><strong>${storm ? `${tx('Activo · salida en', 'Active · exit in')} ${duration(Date.parse(storm.expected_end_at) - simNow())}` : tx('Sin uso', 'Not in use')}</strong></div>
        <div class="mission-stat"><span>${tx('Síntomas reportados (recientes)', 'Reported symptoms (recent)')}</span><strong>${(d.symptoms || []).length}</strong></div>`, { title: tx('Resumen de misión', 'Mission summary') })}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// M2 · Expediente del tripulante
// ---------------------------------------------------------------------
function renderM2() {
  const d = D();
  const c = crewById(state.crewId) || d.crew[0];
  const det = d.detail || { byMetric: {}, doses: [], alerts: [], symptoms: [], trends: [] };
  const m = det.byMetric;
  const lvl = statusOf(c.id);
  const k = careerOf(c.id);
  const hr = latestFor(c.id, 'heart_rate_bpm');
  const spo2 = latestFor(c.id, 'spo2_pct');
  const sleep = latestFor(c.id, 'sleep_minutes');
  const moodOk = hasConsent(c.id, 'mood_trend');
  const sleepOk = hasConsent(c.id, 'sleep_trend');
  const lastTrend = det.trends.filter((t) => t.mood_avg != null).at(-1);
  const wellbeing = lastTrend ? Math.round((Number(lastTrend.mood_avg) / 5) * 100) : null;
  const S = { headache: ['Dolor de cabeza', 'Headache'], confusion: ['Confusión', 'Confusion'], vision: ['Visión borrosa', 'Blurred vision'], dizziness: ['Mareo', 'Dizziness'], shortness_of_breath: ['Falta de aire', 'Shortness of breath'], other: ['Otro', 'Other'] };

  return `<div class="desktop-content">
    <div class="breadcrumb">${tx('TRIPULACIÓN', 'CREW')} ${icon('chevron', 13)} ${tx('EXPEDIENTE', 'RECORD')}</div>
    <div class="profile-header">
      <div class="profile-avatar" style="color:${esc(c.avatar_color || '#39d8e8')}">${esc(initials(c.display_name))}</div>
      <div>${pill(`${tx('ESTADO', 'STATUS')} ${levelTxt(lvl).toUpperCase()}`, TONE[lvl])}
        <h1>${esc(c.display_name)}</h1><p>${esc(c.role_title || '')} · ${tx('Zona', 'Zone')}: ${esc(zoneName(spo2?.zone_id))}</p></div>
      <div class="profile-meta">
        <span><small>${tx('ÚLTIMA SINCRONIZACIÓN', 'LAST SYNC')}</small><strong>${spo2 ? `${tx('Día', 'Day')} ${missionDay(Date.parse(spo2.recorded_at))} · ${clock(spo2.recorded_at)} UTC` : '—'}</strong></span>
        <select class="compact" data-change="crew" aria-label="${tx('Tripulante', 'Crew member')}">${d.crew.map((x) => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.display_name)}</option>`).join('')}</select>
      </div>
    </div>
    <div class="kpi-grid compact">
      ${metricCard({ iconName: 'heart', label: tx('Pulso actual', 'Current pulse'), value: hr ? Math.round(hr.value) : '—', unit: tx('lpm', 'bpm'), detail: hr ? (hr.level === 'normal' ? 'Normal' : levelTxt(hr.level)) : '—', tone: hr?.level === 'normal' || !hr ? 'green' : 'red', values: m.heart_rate_bpm })}
      ${metricCard({ iconName: 'radiation', label: tx('Radiación acumulada', 'Accumulated radiation'), value: num(k?.career_dose_msv, 1), unit: 'mSv', detail: `${num(k?.pct_of_limit, 0)}% ${tx('límite', 'limit')}`, tone: 'yellow', values: det.doses.map((x) => Number(x.total_msv)) })}
      ${metricCard({ iconName: 'moon', label: tx('Sueño anoche', 'Sleep last night'), value: sleepOk && sleep ? `${Math.floor(sleep.value / 60)}h ${String(Math.round(sleep.value % 60)).padStart(2, '0')}m` : tx('Privado', 'Private'), detail: sleepOk ? tx('Compartido', 'Shared') : tx('No compartido', 'Not shared'), tone: 'cyan' })}
      ${metricCard({ iconName: 'spark', label: tx('Bienestar', 'Wellbeing'), value: moodOk && wellbeing != null ? wellbeing : tx('Privado', 'Private'), unit: moodOk && wellbeing != null ? '/ 100' : '', detail: moodOk ? tx('Con permiso', 'With consent') : tx('No compartido', 'Not shared'), tone: 'green' })}
    </div>
    <div class="medical-grid">
      ${panel(`
        <div class="chart-legend"><span><i></i> ${tx('Pulso, lpm', 'Pulse, bpm')}</span><span><i></i> SpO₂, %</span></div>
        <div class="clinical-chart">
          <span class="limit-line">${tx('LÍMITE CONFIGURADO', 'CONFIGURED LIMIT')}</span>
          ${sparkline(m.heart_rate_bpm, '#39D8E8', { min: 40, max: 140 })}
          ${sparkline(m.spo2_pct, '#8B7CFF', { min: 84, max: 100 })}
          <div class="x-labels"><span>${tx('ANTES', 'EARLIER')}</span><span></span><span></span><span></span><span></span><span>${tx('AHORA', 'NOW')}</span></div>
        </div>`, { title: tx('Signos biométricos', 'Biometric signs'), cls: 'vitals-panel', action: `<span class="muted mono">SpO₂ ${spo2 ? Math.round(spo2.value) : '—'}%</span>` })}
      ${panel(moodOk ? `
        <div class="permission-banner">${icon('lock', 15)}<span>${tx('Visible con autorización del tripulante', 'Visible with the crew member’s consent')}</span></div>
        <div class="emotion-score">
          <div class="ring safe"><div><strong>${wellbeing ?? '—'}</strong><span>${tx('BIENESTAR', 'WELLBEING')}</span></div></div>
          <div><strong>${lastTrend ? '' : '—'}${lastTrend ? `${tx('Ánimo', 'Mood')} ${num(lastTrend.mood_avg, 1)} / 5` : tx('Sin check-ins compartidos', 'No shared check-ins')}</strong>
          <p>${lastTrend ? `${tx('Estrés', 'Stress')} ${num(lastTrend.stress_avg, 1)} · ${tx('Energía', 'Energy')} ${num(lastTrend.energy_avg, 1)}` : ''}</p></div>
        </div>
        <div class="mood-timeline">${Array.from({ length: 7 }, (_, i) => { const t = det.trends[det.trends.length - 7 + i]; return t?.mood_avg != null ? `<i style="height:${Number(t.mood_avg) * 20}%"></i>` : '<i class="empty" style="height:10%"></i>'; }).join('')}</div>`
        : `<div class="permission-banner">${icon('lock', 15)}<span>${tx('El tripulante no ha compartido su tendencia de ánimo.', 'The crew member hasn’t shared their mood trend.')}</span></div>
           <p class="empty-note">${tx('Las conversaciones con su personaje nunca se comparten.', 'Conversations with their character are never shared.')}</p>`, { title: tx('Tendencia emocional', 'Emotional trend') })}
    </div>
    <div class="two-col">
      ${panel(det.symptoms.length ? det.symptoms.map((s) => `
        <div class="history-row"><span class="mood-face">!</span><div><strong>${esc(tx(...(S[s.symptom] || [s.symptom, s.symptom])))}</strong><p>${tx('Síntoma físico reportado en el check-in (sin nota)', 'Physical symptom reported in the check-in (no note)')}</p></div>
        <span class="mono">${tx('Día', 'Day')} ${missionDay(Date.parse(s.reported_at))} · ${clock(s.reported_at)}</span></div>`).join('') : `<p class="empty-note">${tx('Sin síntomas reportados.', 'No reported symptoms.')}</p>`, { title: tx('Síntomas reportados', 'Reported symptoms') })}
      ${panel(det.alerts.length ? det.alerts.map((a) => `
        <div class="history-row"><span class="mood-face">${a.level === 'urgent' ? '●' : '○'}</span><div><strong>${esc(alertTitle(a))}</strong><p>${esc(a.status)}${a.note && a.note !== 'auto' ? ` · “${esc(a.note)}”` : ''}</p></div>
        <span class="mono">${tx('Día', 'Day')} ${missionDay(Date.parse(a.created_at))} · ${clock(a.created_at)}</span></div>`).join('') : `<p class="empty-note">${tx('Sin alertas.', 'No alerts.')}</p>`, { title: tx('Historial de alertas', 'Alert history') })}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// M3 · Alertas y emergencias
// ---------------------------------------------------------------------
function renderM3() {
  const d = D();
  const active = d.openAlerts.filter((a) => a.status === 'active').sort((a, b) => RANK[b.level] - RANK[a.level]);
  const followed = d.openAlerts.filter((a) => a.status === 'acknowledged');
  const resolved = d.resolved || [];
  const lists = { active, followed, resolved };
  const list = lists[state.alertTab] || active;
  const selected = list.find((a) => a.id === state.alertId) || list[0];
  if (selected) state.alertId = selected.id;
  const who = (a) => (a.crew_member_id ? crewById(a.crew_member_id)?.display_name : tx('Toda la nave', 'Whole vehicle'));

  const items = list.map((a) => `
    <div class="alert-item ${a.level === 'urgent' ? 'critical' : 'warn'} ${a.id === selected?.id ? 'selected' : ''}" data-action="alert" data-id="${a.id}" role="button" tabindex="0">
      <div class="alert-item-top">${pill(a.level === 'urgent' ? tx('CRÍTICA', 'CRITICAL') : tx('ALTA', 'HIGH'), a.level === 'urgent' ? 'critical' : 'warn')}<span class="mono">${clock(a.created_at)} UTC</span></div>
      <h3>${esc(alertTitle(a).replace(/\s*\(.*\)$/, ''))}</h3>
      <p>${esc(who(a))} · ${esc(zoneName(a.zone_id || latestFor(a.crew_member_id, 'spo2_pct')?.zone_id))}</p>
      ${a.value != null ? `<div class="alert-reading"><span>${tx('VALOR', 'VALUE')}</span><strong>${num(a.value, 1)}</strong></div>` : ''}
      <div class="alert-state"><i></i> ${a.status === 'active' ? tx('Sin reconocer', 'Not acknowledged') : a.status === 'acknowledged' ? tx('En seguimiento', 'In follow-up') : tx('Resuelta', 'Resolved')}</div>
    </div>`).join('') || `<p class="empty-note">${tx('Nada en esta lista.', 'Nothing in this list.')}</p>`;

  let detail = panel(`<p class="empty-note">${tx('Selecciona una alerta.', 'Select an alert.')}</p>`, { cls: 'alert-detail' });
  if (selected) {
    const crewId = selected.crew_member_id;
    const spo2 = crewId ? latestFor(crewId, 'spo2_pct') : null;
    const hr = crewId ? latestFor(crewId, 'heart_rate_bpm') : null;
    detail = panel(`
      <div class="detail-header"><div>${pill(`${selected.level === 'urgent' ? tx('PRIORIDAD CRÍTICA', 'CRITICAL PRIORITY') : tx('PRIORIDAD ALTA', 'HIGH PRIORITY')} · ${esc(selected.alert_type_id.toUpperCase())}`, selected.level === 'urgent' ? 'critical' : 'warn')}
        <h2>${esc(alertTitle(selected))}</h2><p>${tx('Alerta generada por ELOISE', 'Alert generated by ELOISE')} · ${tx('Día', 'Day')} ${missionDay(Date.parse(selected.created_at))} · ${clockS(selected.created_at)} UTC</p></div>${icon('alert', 34)}</div>
      <div class="incident-meta">
        <div><span>${tx('TRIPULANTE', 'CREW MEMBER')}</span><strong>${esc(who(selected))}</strong></div>
        <div><span>${tx('UBICACIÓN', 'LOCATION')}</span><strong>${esc(zoneName(selected.zone_id || spo2?.zone_id))}</strong></div>
        <div><span>${tx('ESTADO', 'STATUS')}</span><strong>${selected.status === 'active' ? tx('Sin reconocer', 'Not acknowledged') : selected.status === 'acknowledged' ? tx('En seguimiento', 'In follow-up') : tx('Resuelta', 'Resolved')}</strong></div>
      </div>
      <div class="eloise-report"><div>${orb(true)}<span><strong>${tx('Resumen proporcionado por ELOISE', 'Summary provided by ELOISE')}</strong>
        <p>${selected.alert_type_id === 'solar_storm' ? tx('Evento de partículas solares. La tripulación recibió la orden de refugio y la alerta se leyó en voz alta en sus dispositivos.', 'Solar particle event. The crew received the shelter order and the alert was read aloud on their devices.') : tx('Lectura fuera de rango detectada por los sensores. El tripulante recibió los pasos a seguir en su app.', 'Out-of-range reading detected by the sensors. The crew member received the steps in their app.')}</p></span></div>
        <span class="live-label"><i></i> ${tx('EN TIEMPO REAL', 'LIVE')}</span></div>
      <div class="telemetry-row">
        <div><span>${tx('VALOR', 'VALUE')}</span><strong class="${selected.level === 'urgent' ? 'critical-text' : ''}">${selected.value != null ? num(selected.value, 1) : '—'}</strong><small>${esc(selected.metric || '')}</small></div>
        <div><span>${tx('PULSO', 'PULSE')}</span><strong>${hr ? Math.round(hr.value) : '—'} ${tx('lpm', 'bpm')}</strong><small>${hr ? levelTxt(hr.level) : ''}</small></div>
        <div><span>SpO₂</span><strong>${spo2 ? Math.round(spo2.value) : '—'}%</strong><small>${spo2 ? levelTxt(spo2.level) : ''}</small></div>
        <div><span>${tx('REFUGIO', 'SHELTER')}</span><strong>${d.shelter ? tx('Activo', 'Active') : '—'}</strong><small></small></div>
      </div>
      <div class="response-timeline"><h3>${tx('Respuesta al incidente', 'Incident response')}</h3>
        <div><i class="done"></i><span><strong>${clockS(selected.created_at)} · ${tx('Alerta generada', 'Alert generated')}</strong><p>${tx('Se notificó al tripulante', 'The crew member was notified')}</p></span></div>
        <div><i class="${selected.spoken_at ? 'done' : ''}"></i><span><strong>${selected.spoken_at ? clockS(selected.spoken_at) : '—'} · ${tx('Leída en voz alta', 'Read aloud')}</strong></span></div>
        <div><i class="${selected.acknowledged_at ? 'done' : ''}"></i><span><strong>${selected.acknowledged_at ? clockS(selected.acknowledged_at) : '—'} · ${tx('Reconocida', 'Acknowledged')}</strong></span></div>
        <div><i class="${selected.resolved_at ? 'done' : ''}"></i><span><strong>${selected.resolved_at ? clockS(selected.resolved_at) : '—'} · ${tx('Resuelta', 'Resolved')}</strong>${selected.note ? `<p>${esc(selected.note === 'auto' ? tx('Se resolvió sola al normalizarse el dato', 'Resolved automatically when the reading normalized') : selected.note)}</p>` : ''}</span></div>
      </div>
      ${selected.status === 'resolved' ? '' : `<div class="detail-actions">
        ${selected.status === 'active' ? button(tx('Reconocer alerta', 'Acknowledge alert'), { variant: 'danger', iconName: 'check', action: 'ack', attrs: `data-id="${selected.id}"` }) : ''}
        ${button(tx('Marcar resuelta', 'Mark resolved'), { variant: 'ghost', action: 'resolve', attrs: `data-id="${selected.id}"` })}
      </div>`}`, { cls: 'alert-detail' });
  }

  const C = { self_harm_risk: ['Riesgo emocional grave', 'Serious emotional risk'], acute_panic: ['Pánico agudo', 'Acute panic'], other_serious: ['Otro riesgo grave', 'Other serious risk'] };
  return `<div class="desktop-content">
    ${screenHeader({
      eyebrow: tx('CENTRO DE OPERACIONES MÉDICAS', 'MEDICAL OPERATIONS CENTER'),
      title: tx('Alertas y emergencias', 'Alerts and emergencies'),
      subtitle: tx('Gestión coordinada de incidentes de salud y seguridad.', 'Coordinated management of health and safety incidents.'),
      action: pill(`${active.length} ${tx('ACTIVAS', 'ACTIVE')}`, active.length ? 'critical' : 'safe'),
    })}
    <div class="alert-tabs">${[['active', tx('Activas', 'Active'), active.length], ['followed', tx('En seguimiento', 'In follow-up'), followed.length], ['resolved', tx('Resueltas', 'Resolved'), resolved.length]].map(([k, l, n]) =>
      `<button class="${state.alertTab === k ? 'active' : ''}" data-action="alertTab" data-tab="${k}">${l}<span>${n}</span></button>`).join('')}</div>
    <div class="alerts-layout"><div class="alert-list">${items}</div>${detail}</div>
    <div class="two-col" style="margin-top:12px">
      ${panel((d.escalations || []).length ? d.escalations.map((e) => `
        <div class="attention-item warn"><span>${icon('heart')}</span><div><strong>🆘 ${esc(tx(...(C[e.category] || [e.category, e.category])))} · ${esc(crewById(e.crew_member_id)?.display_name)}</strong>
        <p>${tx('Solo tipo y hora; nunca el contenido de la conversación', 'Type and time only; never the conversation content')} · ${clock(e.created_at)}</p></div>
        ${e.acknowledged_at ? pill(tx('ATENDIDO', 'HANDLED'), 'safe') : button(tx('Atender', 'Handle'), { variant: 'danger', action: 'ackEsc', attrs: `data-id="${e.id}"` })}</div>`).join('') : `<p class="empty-note">${tx('Ningún aviso de emergencia.', 'No emergency notices.')}</p>`, { title: tx('Avisos de emergencia de los personajes', 'Character emergency notices') })}
      ${panel((d.symptoms || []).length ? d.symptoms.map((s) => `<div class="mission-stat"><span>${esc(crewById(s.crew_member_id)?.display_name)} · ${esc(s.symptom)}</span><strong>${clock(s.reported_at)}</strong></div>`).join('') : `<p class="empty-note">${tx('Sin síntomas reportados.', 'No reported symptoms.')}</p>`, { title: tx('Síntomas reportados', 'Reported symptoms') })}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// M4 · Radiación y clima espacial
// ---------------------------------------------------------------------
function renderM4() {
  const d = D();
  const crew = d.crew;
  const avgDose = crew.reduce((a, c) => a + Number(careerOf(c.id)?.career_dose_msv || 0), 0) / Math.max(1, crew.length);
  const avgPct = crew.reduce((a, c) => a + Number(careerOf(c.id)?.pct_of_limit || 0), 0) / Math.max(1, crew.length);
  const main = mainZone();
  const shelter = shelterZone();
  const outRate = Number(latestZone(main?.id, 'dose_rate_usv_h')?.value || 0);
  const inRate = Number(latestZone(shelter?.id, 'dose_rate_usv_h')?.value || 0);
  const protection = outRate ? Math.round(100 * (1 - inRate / outRate)) : null;
  const storm = d.shelter;
  const limit = Math.max(...crew.map((c) => Number(careerOf(c.id)?.career_limit_msv || 600)), 600);
  const slot = (z) => (z.is_shelter ? 'shelter' : Number(z.shielding_factor) <= 1 ? 'node' : Number(z.shielding_factor) < 1.5 ? 'lab' : 'habitat');
  const zoneCls = (z) => { const r = latestZone(z.id, 'dose_rate_usv_h'); return r?.level === 'urgent' ? 'risk' : r?.level === 'attention' ? 'warn' : ''; };

  return `<div class="desktop-content">
    ${screenHeader({
      eyebrow: tx('ANÁLISIS DE ENTORNO', 'ENVIRONMENT ANALYSIS'),
      title: tx('Radiación y clima espacial', 'Radiation and space weather'),
      subtitle: tx('Exposición de tripulación, zonas de nave y actividad solar.', 'Crew exposure, vehicle zones and solar activity.'),
      action: pill(storm ? tx('TORMENTA SOLAR ACTIVA', 'SOLAR STORM ACTIVE') : tx('ACTIVIDAD SOLAR BAJA', 'LOW SOLAR ACTIVITY'), storm ? 'critical' : 'safe'),
    })}
    <div class="kpi-grid">
      ${kpi('radiation', 'warn', tx('DOSIS MEDIA', 'AVERAGE DOSE'), num(avgDose, 1), 'mSv', `${num(avgPct, 1)}% ${tx('del límite', 'of the limit')}`)}
      ${kpi('activity', '', tx('TASA EN CABINA', 'CABIN RATE'), Math.round(outRate), 'µSv/h', storm ? tx('Evento SEP en curso', 'SEP event in progress') : tx('Fondo cósmico', 'Cosmic background'), Boolean(storm))}
      ${kpi('shield', 'safe', tx('REFUGIO', 'SHELTER'), Math.round(inRate), 'µSv/h', protection != null ? `${tx('Protección', 'Protection')} ${protection}%` : '—')}
      ${kpi('spark', '', tx('EVENTO SOLAR', 'SOLAR EVENT'), storm ? duration(Date.parse(storm.expected_end_at) - simNow()) : tx('Ninguno', 'None'), '', storm ? tx('para salir del refugio', 'until leaving the shelter') : tx('Clima espacial tranquilo', 'Quiet space weather'), Boolean(storm))}
    </div>
    <div class="radiation-grid">
      ${panel(`<div class="ship-map">
        ${d.zones.map((z) => `<div class="module ${slot(z)} ${zoneCls(z)}">${z.is_shelter ? icon('shield') : ''}<span>${esc(z.name.toUpperCase())}</span><strong>${Math.round(latestZone(z.id, 'dose_rate_usv_h')?.value || 0)}</strong></div>`).join('')}
        <div class="solar-side"><span>${tx('ORIENTACIÓN SOLAR', 'SOLAR ORIENTATION')}</span>${icon('spark', 28)}</div>
      </div>
      <div class="heat-legend"><span>${tx('BAJA', 'LOW')}</span><i></i><span>${tx('ALTA', 'HIGH')}</span></div>`, { title: tx('Exposición por zona', 'Exposure by zone'), cls: 'ship-panel', action: `<span class="muted">µSv/h · ${tx('TIEMPO REAL', 'LIVE')}</span>` })}
      ${panel(`<div class="space-weather">
        <div class="sun-index">${icon('spark', 34)}<span><small>${tx('ACTIVIDAD SOLAR', 'SOLAR ACTIVITY')}</small><strong>${storm ? `S${storm.space_weather_events?.s_scale ?? '—'}` : 'S0'}</strong><b>${storm ? tx('TORMENTA', 'STORM') : tx('TRANQUILA', 'QUIET')}</b></span></div>
        <div class="forecast">${(d.events || []).slice(0, 3).map((e) => `<div><span>${tx('DÍA', 'DAY')} ${missionDay(Date.parse(e.starts_at))}</span><strong>${esc(e.event_type)} S${e.s_scale ?? '—'}</strong>${pill(esc(e.source), e.s_scale >= 3 ? 'warn' : 'info')}</div>`).join('') || `<p class="empty-note">${tx('Sin eventos registrados.', 'No recorded events.')}</p>`}</div>
        ${(d.sessions || []).length ? `<div class="solar-event">${icon('shield')}<span><strong>${tx('Último refugio', 'Last shelter')}: ${tx('día', 'day')} ${missionDay(Date.parse(d.sessions[0].started_at))}</strong>
          <p>${d.sessions[0].ended_at ? `${duration(Date.parse(d.sessions[0].ended_at) - Date.parse(d.sessions[0].started_at))} · ${tx('dosis evitada', 'dose avoided')} ${num(d.sessions[0].dose_avoided_est_msv, 1)} mSv` : tx('En curso', 'In progress')}</p></span></div>` : ''}
      </div>`, { title: tx('Clima espacial', 'Space weather') })}
    </div>
    ${panel(`<div class="dose-bars">${crew.map((c) => {
      const k = careerOf(c.id);
      const dose = Number(k?.career_dose_msv || 0);
      const pct = (100 * dose) / limit;
      return `<div><span>${esc(c.display_name)}</span><div><i style="width:${Math.min(100, pct)}%"></i></div><strong>${num(dose, 1)} mSv</strong><small class="${pct > 90 ? 'over' : ''}">${Math.round(pct)}%</small></div>`;
    }).join('')}</div>
    <div class="dose-limit"><span>${tx('LÍMITE DE CARRERA CONFIGURADO', 'CONFIGURED CAREER LIMIT')}</span><strong>${limit} mSv</strong></div>`, { title: tx('Exposición acumulada por tripulante', 'Accumulated exposure by crew member') })}
  </div>`;
}

// ---------------------------------------------------------------------
// M5 · Informe diario para la Tierra
// ---------------------------------------------------------------------
function buildReport() {
  const d = D();
  const r = d.reportInputs;
  const byLevel = (lvl) => r.alerts.filter((a) => a.level === lvl).length;
  return {
    mission: d.mission.name,
    day: r.day,
    mission_day: missionDay(Date.parse(`${r.day}T12:00:00Z`)),
    crew_active: d.crew.length,
    alerts: { urgent: byLevel('urgent'), attention: byLevel('attention') },
    emergencies: r.escalations.map((e) => e.category),
    dose_today_msv: Object.fromEntries(d.crew.map((c) => [c.display_name, Number(r.dose.find((x) => x.crew_member_id === c.id)?.total_msv ?? 0).toFixed(2)])),
    career_pct: Object.fromEntries(d.crew.map((c) => [c.display_name, Math.round(careerOf(c.id)?.pct_of_limit ?? 0)])),
    shelter_active: Boolean(d.shelter),
    wellbeing_shared: r.trends.length,
    note: 'Sin contenido de conversaciones. Tendencias de ánimo solo con permiso.',
  };
}

function renderM5() {
  const d = D();
  if (!d.reportInputs) return '';
  const s = buildReport();
  const avgDose = d.crew.reduce((a, c) => a + Number(careerOf(c.id)?.career_dose_msv || 0), 0) / Math.max(1, d.crew.length);
  const delayMin = Math.round(Number(d.mission.comm_delay_s || 0) / 60);
  const saved = d.reports.find((rep) => rep.day === s.day);
  const sections = [
    [tx('Resumen de tripulación', 'Crew summary'), `${s.crew_active} ${tx('tripulantes', 'crew members')}`],
    [tx('Alertas e incidentes', 'Alerts and incidents'), `${s.alerts.urgent + s.alerts.attention}`],
    [tx('Avisos de emergencia', 'Emergency notices'), `${s.emergencies.length}`],
    [tx('Exposición a radiación', 'Radiation exposure'), `${num(avgDose, 1)} mSv ${tx('media', 'avg')}`],
    [tx('Indicadores de bienestar', 'Wellbeing indicators'), `${s.wellbeing_shared} ${tx('con permiso', 'with consent')}`],
    [tx('Refugio', 'Shelter'), s.shelter_active ? tx('activo', 'active') : tx('sin uso', 'not used')],
  ];
  const events = d.reportInputs.alerts.slice(0, 3);
  return `<div class="desktop-content">
    ${screenHeader({
      eyebrow: tx('COMUNICACIONES MÉDICAS', 'MEDICAL COMMUNICATIONS'),
      title: tx('Informe diario para la Tierra', 'Daily report for Earth'),
      subtitle: `${tx('Consolidado de salud y seguridad · Día de misión', 'Health and safety summary · Mission day')} ${s.mission_day}`,
      action: pill(`${tx('ENLACE ESTABLE', 'STABLE LINK')} · +${delayTxt()}`),
    })}
    <div class="report-layout">
      <div class="report-builder">
        ${panel(`<div class="report-sections">${sections.map(([t, v]) => `<div>${icon('check')}<span><strong>${esc(t)}</strong><small>${esc(v)} · ${tx('incluido', 'included')}</small></span></div>`).join('')}</div>`, { title: tx('Contenido del informe', 'Report content'), action: `<span class="muted">6 ${tx('SECCIONES', 'SECTIONS')}</span>` })}
        ${panel(`<div class="transmission-window">
          <div>${icon('earth', 28)}<span><small>${tx('INFORMES GUARDADOS', 'SAVED REPORTS')}</small><strong>${d.reports.length}</strong><p>${d.reports.filter((r) => r.sent_to_earth_at).length} ${tx('enviados', 'sent')}</p></span></div>
          <div>${icon('comm', 28)}<span><small>${tx('RETRASO ESTIMADO', 'ESTIMATED DELAY')}</small><strong>${delayMin} min</strong><p>${tx('por sentido', 'one way')}</p></span></div>
        </div>`, { title: tx('Ventana de transmisión', 'Transmission window') })}
        <div class="report-actions">
          ${button(saved ? tx('Actualizar informe', 'Update report') : tx('Guardar informe', 'Save report'), { variant: 'secondary', action: 'saveReport' })}
          ${saved && !saved.sent_to_earth_at ? button(tx('Marcar como enviado', 'Mark as sent'), { iconName: 'report', action: 'sendReport', attrs: `data-id="${saved.id}"` }) : saved ? pill(`${tx('ENVIADO', 'SENT')} · ${clock(saved.sent_to_earth_at)}`) : ''}
        </div>
      </div>
      ${panel(`<div class="report-paper">
        <div class="paper-head">${logo()}<div><strong>${tx('INFORME MÉDICO DIARIO', 'DAILY MEDICAL REPORT')}</strong><span>${esc(d.mission.name.toUpperCase())} · ${tx('DÍA', 'DAY')} ${s.mission_day}</span></div></div>
        <div class="paper-meta">
          <span>${tx('GENERADO', 'GENERATED')}<br><b>${saved ? `${tx('DÍA', 'DAY')} ${missionDay(Date.parse(saved.created_at))}` : tx('PENDIENTE', 'PENDING')}</b></span>
          <span>${tx('CLASIFICACIÓN', 'CLASSIFICATION')}<br><b>${tx('MÉDICO · MISIÓN', 'MEDICAL · MISSION')}</b></span>
          <span>${tx('DESTINO', 'DESTINATION')}<br><b>${tx('CONTROL TERRESTRE', 'GROUND CONTROL')}</b></span>
        </div>
        <h3>01 · ${tx('RESUMEN EJECUTIVO', 'EXECUTIVE SUMMARY')}</h3>
        <p>${d.crew.filter((c) => statusOf(c.id) === 'normal').length} ${tx('de', 'of')} ${d.crew.length} ${tx('integrantes con parámetros óptimos.', 'crew members with optimal readings.')} ${s.shelter_active ? tx('Refugio solar activo.', 'Solar shelter active.') : ''}</p>
        <div class="paper-kpis">
          <span><strong>${s.crew_active}/${s.crew_active}</strong>${tx('ACTIVOS', 'ACTIVE')}</span>
          <span><strong>${num(avgDose, 1)}</strong>mSv ${tx('MEDIA', 'AVG')}</span>
          <span><strong>${s.alerts.urgent + s.alerts.attention}</strong>${tx('ALERTAS', 'ALERTS')}</span>
          <span><strong>${s.emergencies.length}</strong>${tx('EMERGENCIAS', 'EMERGENCIES')}</span>
        </div>
        <h3>02 · ${tx('EVENTOS RELEVANTES', 'RELEVANT EVENTS')}</h3>
        ${events.length ? events.map((a) => `<div class="paper-event"><i></i><p><strong>${clock(a.created_at)} · ${esc(alertTitle(a))}</strong></p></div>`).join('') : `<p>${tx('Sin eventos.', 'No events.')}</p>`}
        <h3>03 · ${tx('PRIVACIDAD', 'PRIVACY')}</h3>
        <p>${tx('Este informe no incluye conversaciones. El ánimo solo aparece si el tripulante lo autorizó.', 'This report includes no conversations. Mood appears only if the crew member authorized it.')}</p>
        <div class="paper-footer">ELOISE MISSION CARE SYSTEM · ${tx('DATOS CIFRADOS', 'ENCRYPTED DATA')}</div>
      </div>`, { cls: 'report-preview' })}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// D1 · Consola de simulación
// ---------------------------------------------------------------------
function renderD1() {
  const d = D();
  const sim = d.sim;
  const o = state.simStatus?.overrides || { lowSpo2: {}, badSleep: {} };
  const target = state.consoleCrew;
  const risk = d.openAlerts.some((a) => a.level === 'urgent');
  const storm = d.shelter;
  const ev = (action, iconName, title, sub, active = false, attrs = '') => `
    <button class="${active ? 'active danger' : ''}" data-action="${action}" ${attrs}>${icon(iconName)}<span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span>${icon('chevron')}</button>`;
  const K = { solar_storm: tx('Tormenta solar', 'Solar storm'), all_clear: tx('Todo despejado', 'All clear'), lowO2: tx('O₂ de cabina', 'Cabin O₂'), highCO2: 'CO₂', lowSpo2: 'SpO₂', badSleep: tx('Sueño', 'Sleep'), reset: tx('Reinicio', 'Reset') };

  return `<div class="desktop-content simulation">
    <div class="simulation-banner">${icon('alert')}<strong>${tx('ENTORNO DE SIMULACIÓN', 'SIMULATION ENVIRONMENT')}</strong>
      <span>${tx('Todos los valores y eventos de esta consola son ficticios.', 'All values and events in this console are fictitious.')}</span><b>${tx('NO USAR PARA OPERACIONES REALES', 'NOT FOR REAL OPERATIONS')}</b></div>
    ${screenHeader({
      eyebrow: tx('ELOISE · CONTROL DE DEMO', 'ELOISE · DEMO CONTROL'),
      title: tx('Consola de simulación', 'Simulation console'),
      subtitle: tx('Manipula variables para validar las respuestas del sistema en tiempo real.', 'Change variables to validate system responses in real time.'),
      action: `${pill(sim?.running ? tx('SIMULACIÓN ACTIVA', 'SIMULATION RUNNING') : tx('PAUSADA', 'PAUSED'), sim?.running ? 'info' : 'neutral')}
        ${button(sim?.running ? tx('Pausar', 'Pause') : tx('Iniciar', 'Start'), { variant: sim?.running ? 'secondary' : 'primary', iconName: sim?.running ? 'pause' : 'play', action: 'run' })}
        ${button(tx('Restablecer', 'Reset'), { variant: 'ghost', iconName: 'reset', action: 'reset' })}`,
    })}
    ${state.simStatus?.lastError ? `<p class="error-text">${icon('alert', 15)} ${esc(state.simStatus.lastError)}</p>` : ''}
    <div class="sim-status">
      <div><span class="sim-pulse ${risk ? 'risk' : ''}"></span><span><small>${tx('ESTADO GENERAL', 'OVERALL STATUS')}</small><strong>${risk ? tx('ESCENARIO DE RIESGO', 'RISK SCENARIO') : tx('SISTEMAS NOMINALES', 'SYSTEMS NOMINAL')}</strong></span></div>
      <div><small>${tx('TIEMPO SIMULADO', 'SIMULATED TIME')}</small><strong class="mono">${tx('DÍA', 'DAY')} ${missionDay()} · ${clockS(simNow())}</strong></div>
      <div class="time-speed"><small>${tx('VELOCIDAD', 'SPEED')}</small>${[1, 60, 600].map((n) => `<button class="${sim?.time_speed === n ? 'active' : ''}" data-action="speed" data-n="${n}">${n}×</button>`).join('')}</div>
      <div><small>${tx('MISIÓN', 'MISSION')}</small><strong class="mono">${esc(d.mission.name.toUpperCase())}</strong></div>
    </div>
    <div class="sim-layout">
      <div class="sim-controls">
        ${panel(`<div class="event-buttons">
          ${storm ? ev('clear', 'shield', tx('Todo despejado', 'All clear'), tx('Cierra el refugio y calcula la dosis evitada', 'Closes the shelter and computes dose avoided'), true)
            : ev('storm', 'radiation', tx('Lanzar tormenta solar', 'Launch solar storm'), tx('Evento SEP · nivel S4 · abre el refugio', 'SEP event · S4 · opens the shelter'))}
          ${ev('toggle', 'air', o.lowO2 ? tx('Restaurar O₂ de cabina', 'Restore cabin O₂') : tx('Bajar O₂ de cabina', 'Lower cabin O₂'), tx('La SpO₂ de la tripulación baja con él', 'Crew SpO₂ drops with it'), o.lowO2, 'data-name="lowO2"')}
          ${ev('toggle', 'activity', o.highCO2 ? tx('Restaurar CO₂', 'Restore CO₂') : tx('Subir CO₂', 'Raise CO₂'), tx('Simula una falla del depurador', 'Simulates a scrubber failure'), o.highCO2, 'data-name="highCO2"')}
        </div>`, { title: tx('Eventos de misión', 'Mission events'), action: `<span class="sim-label">${tx('SIMULADO', 'SIMULATED')}</span>` })}
        ${panel(`<div class="bio-sim-row">
          <select class="compact" data-change="consoleCrew" aria-label="${tx('Tripulante', 'Crew member')}">${d.crew.map((c) => `<option value="${c.id}" ${c.id === target ? 'selected' : ''}>${esc(c.display_name)}</option>`).join('')}</select>
          ${button(o.lowSpo2?.[target] ? tx('Restaurar SpO₂', 'Restore SpO₂') : tx('Bajar SpO₂', 'Lower SpO₂'), { variant: o.lowSpo2?.[target] ? 'danger' : 'secondary', action: 'toggle', attrs: 'data-name="lowSpo2"' })}
          ${button(o.badSleep?.[target] ? tx('Restaurar sueño', 'Restore sleep') : tx('Mala noche', 'Bad night'), { variant: o.badSleep?.[target] ? 'danger' : 'secondary', action: 'toggle', attrs: 'data-name="badSleep"' })}
        </div>`, { title: tx('Cambios biométricos', 'Biometric changes') })}
      </div>
      <div class="sim-side">
        ${panel(`<div class="impact-preview">
          <div class="preview-head"><span>${tx('VISTA ASTRONAUTA', 'ASTRONAUT VIEW')}</span>${pill(risk ? tx('ALERTA', 'ALERT') : 'NOMINAL', risk ? 'critical' : 'safe')}</div>
          <div class="mini-dashboard ${risk ? 'risk' : ''}">${logo(true)}<div class="mini-cards"><i></i><i></i><i></i></div><strong>${risk ? tx('PROTOCOLO ACTIVO', 'PROTOCOL ACTIVE') : tx('Estado general óptimo', 'Overall status optimal')}</strong></div>
          <div class="preview-head"><span>${tx('VISTA MÉDICA', 'MEDICAL VIEW')}</span>${pill(d.openAlerts.length ? `${d.openAlerts.length} ${tx('EVENTOS', 'EVENTS')}` : tx('SIN ALERTAS', 'NO ALERTS'), d.openAlerts.length ? 'warn' : 'safe')}</div>
          <div class="mini-dashboard medical ${risk ? 'risk' : ''}"><div></div><div></div><div></div></div>
        </div>`, { title: tx('Impacto en sistemas', 'System impact'), action: `<span class="live-label"><i></i> ${tx('EN VIVO', 'LIVE')}</span>` })}
        ${panel(`<div class="event-log">${(d.simEvents || []).map((e) => `
          <div><i class="${['solar_storm', 'lowO2', 'highCO2', 'lowSpo2'].includes(e.kind) ? 'risk' : ''}"></i><span class="mono">${clockS(e.triggered_at)}</span>
          <p><strong>${esc(K[e.kind] || e.kind)}</strong><small>${tx('Día', 'Day')} ${missionDay(Date.parse(e.triggered_at))}</small></p></div>`).join('') || `<p class="empty-note">${tx('Sin eventos todavía.', 'No events yet.')}</p>`}</div>`, { title: tx('Registro de eventos', 'Event log') })}
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------
async function run(fn, okMsg) {
  try {
    await fn();
    if (okMsg) toast(okMsg);
  } catch (err) {
    toast(err.message);
  }
  await refresh();
}

function go(screen) {
  state.screen = screen;
  history.replaceState(null, '', `#/${screen}`);
  window.scrollTo(0, 0);
  refresh();
}

const actions = {
  nav: (el) => go(el.dataset.screen),
  crew: (el) => { state.crewId = el.dataset.id; state.data.detail = null; go('M2'); },
  alert: (el) => { state.alertId = el.dataset.id; render(); },
  alertTab: (el) => { state.alertTab = el.dataset.tab; state.alertId = null; render(); },
  lang: () => {
    lang = lang === 'es' ? 'en' : 'es';
    document.documentElement.lang = lang;
    try { localStorage.setItem('eloise-lang', lang); } catch { /* sin almacenamiento */ }
    if (state.me) render(); else renderLogin();
  },
  logout: async () => {
    clearInterval(state.timer);
    await state.sb.auth.signOut();
    state.me = null;
    renderLogin();
  },
  ack: (el) => run(async () => check(await state.sb.rpc('acknowledge_alert', { p_alert: el.dataset.id }), 'reconocer')),
  resolve: (el) => {
    const note = prompt(tx('Nota para cerrar la alerta (opcional):', 'Note to close the alert (optional):'));
    if (note === null) return;
    run(async () => check(await state.sb.rpc('resolve_alert', { p_alert: el.dataset.id, p_note: note || null }), 'resolver'));
  },
  ackEsc: (el) => run(async () => check(await state.sb.from('emergency_escalations')
    .update({ acknowledged_at: D().sim?.sim_clock || new Date().toISOString(), acknowledged_by: state.me.id }).eq('id', el.dataset.id), 'atender')),
  saveReport: () => run(async () => {
    const summary = buildReport();
    check(await state.sb.from('daily_reports').upsert({ mission_id: state.me.mission_id, day: summary.day, summary, created_by: state.me.id }, { onConflict: 'mission_id,day' }), 'guardar informe');
  }, tx('Informe guardado.', 'Report saved.')),
  sendReport: (el) => run(async () => check(await state.sb.from('daily_reports')
    .update({ sent_to_earth_at: D().sim?.sim_clock || new Date().toISOString() }).eq('id', el.dataset.id), 'enviar informe'), tx('Informe marcado como enviado.', 'Report marked as sent.')),
  storm: () => run(() => simApi('storm'), tx('Tormenta lanzada: la tripulación recibe la alerta.', 'Storm launched: the crew gets the alert.')),
  clear: () => run(() => simApi('clear')),
  speed: (el) => run(() => simApi('speed', { speed: Number(el.dataset.n) })),
  run: () => run(() => simApi('run', { running: !D().sim?.running })),
  toggle: (el) => run(() => simApi('toggle', { name: el.dataset.name, crewId: state.consoleCrew })),
  reset: () => {
    if (!confirm(tx('¿Borrar los datos de la demo (lecturas, alertas, refugios, informes) y volver al día inicial?', 'Delete the demo data (readings, alerts, shelters, reports) and go back to the first day?'))) return;
    run(() => simApi('reset'), tx('Demo reiniciada.', 'Demo reset.'));
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && actions[el.dataset.action]) {
    e.preventDefault();
    actions[el.dataset.action](el, e);
  }
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-action]')) {
    e.preventDefault();
    actions[e.target.dataset.action]?.(e.target, e);
  }
});
document.addEventListener('change', (e) => {
  const kind = e.target.dataset.change;
  if (kind === 'crew') { state.crewId = e.target.value; state.data.detail = null; e.target.blur(); refresh(); }
  if (kind === 'consoleCrew') { state.consoleCrew = e.target.value; e.target.blur(); render(); }
});
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'loginForm') return;
  e.preventDefault();
  const f = new FormData(e.target);
  const { data, error } = await state.sb.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('password')) });
  if (error) return renderLogin(tx('Correo o contraseña incorrectos.', 'Wrong email or password.'));
  state.session = data.session;
  await afterLogin();
});
window.addEventListener('hashchange', () => {
  const s = location.hash.slice(2);
  if (SCREENS.includes(s) && s !== state.screen) go(s);
});

document.documentElement.lang = lang;
init();
