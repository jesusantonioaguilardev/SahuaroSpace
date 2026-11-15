// =====================================================================
// AstroHealth · Eco — prototipo: pantallas simples, voz y texto
// =====================================================================
import * as S from './sim.js';
import { sim, CREW, ZONES } from './sim.js';
import { ALERT_TYPES } from './catalog.js';
import { t, setLang, getLang } from './i18n.js';
import { load, save, remove } from './store.js';
import * as voice from './voice.js';
import { askEco, llmStatus } from './eco.js';

const $ = (id) => document.getElementById(id);
const CREW_ROUTES = ['today', 'eco', 'data', 'checkin', 'shelter', 'privacy'];
const ROUTES = [...CREW_ROUTES, 'doctor', 'console'];
const FACES = ['😞', '🙁', '😐', '🙂', '😄'];
const SYMPTOMS = ['headache', 'confusion', 'vision', 'dizziness', 'shortness_of_breath', 'other'];

const state = {
  crewId: load('current', null),
  route: routeFromHash() || 'today',
  ecoMode: 'listen',
  listening: false,
  interim: '',
  pending: false,
  conv: [],
  llm: null,
  lastSource: null,
  lastReason: null,
  escalation: null,
  overlayAlertId: null,
  consoleCrew: 'c1',
  welcome: null,
};

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const me = () => sim.crew[state.crewId];
const L = () => getLang();
const clock = (ts) => new Date(ts).toISOString().slice(11, 16);
const dayKey = (ts) => new Date(ts).toISOString().slice(0, 10);

function routeFromHash() {
  const r = location.hash.replace('#/', '');
  return ROUTES.includes(r) ? r : null;
}

function duration(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60e3));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
}

function countdown(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function fmtVal(metric, v) {
  switch (metric) {
    case 'spo2_pct': return `${Math.round(v)} %`;
    case 'cabin_o2_pct': return `${v.toFixed(1)} %`;
    case 'cabin_co2_mmhg': return `${v.toFixed(1)} mmHg`;
    case 'cabin_pressure_psia': return `${v.toFixed(2)} psia`;
    case 'cabin_temp_c': return `${v.toFixed(1)} °C`;
    case 'heart_rate_bpm': return `${Math.round(v)} ${t('unit_bpm')}`;
    case 'resp_rate_bpm': return `${Math.round(v)} ${t('unit_rpm')}`;
    case 'dose_rate_usv_h': return `${Math.round(v)} µSv/h`;
    default: return String(Math.round(v * 10) / 10);
  }
}

const worst = (...lvls) => (lvls.includes('urgent') ? 'urgent' : lvls.includes('attention') ? 'attention' : 'normal');

function spark(hist, { w = 240, h = 40, min, max } = {}) {
  if (!hist || hist.length < 2) return '';
  const vs = hist.map((p) => p[1]);
  let lo = min ?? Math.min(...vs);
  let hi = max ?? Math.max(...vs);
  if (hi - lo < 1e-6) { hi += 1; lo -= 1; }
  const pts = hist.map((p, i) => `${((i / (hist.length - 1)) * w).toFixed(1)},${(h - ((p[1] - lo) / (hi - lo)) * h).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function toast(msg) {
  const $t = $('toast');
  $t.textContent = msg;
  $t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { $t.hidden = true; }, 4000);
}

// ---------------------------------------------------------------------
// Datos del dispositivo (privados)
// ---------------------------------------------------------------------
function defaultSettings(id = state.crewId) {
  const c = CREW.find((x) => x.id === id);
  return { lang: c?.lang || 'es', speak: true, rate: 1, memory: true, accepted: false };
}
const settings = (id = state.crewId) => ({ ...defaultSettings(id), ...load(`settings:${id}`, {}) });
const saveSettings = (patch, id = state.crewId) => save(`settings:${id}`, { ...settings(id), ...patch });
const consents = (id = state.crewId) => load(`consents:${id}`, { mood: false, sleep: false });
const checkins = (id = state.crewId) => load(`private:${id}:checkins`, []);

function loadConv() {
  state.conv = settings().memory ? load(`private:${state.crewId}:conversation`, []) : [];
}
function persistConv() {
  if (settings().memory) save(`private:${state.crewId}:conversation`, state.conv.slice(-200));
}

// Solo se comparte el promedio diario de ánimo, y solo con permiso
function syncTrends(id) {
  S.clearTrend(id, ['mood', 'stress', 'energy']);
  if (!consents(id).mood) return;
  const byDay = {};
  for (const k of checkins(id)) (byDay[k.day] ||= []).push(k);
  for (const [day, list] of Object.entries(byDay)) {
    const avg = (f) => Math.round((list.reduce((a, b) => a + b[f], 0) / list.length) * 10) / 10;
    S.setTrend(id, day, { mood: avg('mood'), stress: avg('stress'), energy: avg('energy') });
  }
}

function ecoMode() {
  return S.stormActive() && me()?.zone === 'shelter' ? 'shelter' : state.ecoMode;
}

function buildSummary() {
  const c = me();
  const z = sim.zones[c.zone];
  const d = S.doseToday(c.id);
  const k = S.career(c.id);
  const lastCheckin = checkins().at(-1);
  return {
    name: c.name,
    missionDay: S.missionDay(),
    location: z.name[L()],
    overallStatus: S.statusOf(c.id),
    spo2: Math.round(c.spo2),
    heartRate: Math.round(c.hrNow),
    respRate: Math.round(c.rr),
    sleepHours: Math.round((c.sleepMin / 60) * 10) / 10,
    doseTodayMsv: Math.round(d.total * 100) / 100,
    careerDoseMsv: Math.round(k.career),
    careerLimitMsv: k.limit,
    careerPct: Math.round(k.pct),
    cabinO2Pct: Math.round(z.o2 * 10) / 10,
    cabinCo2Mmhg: Math.round(z.co2 * 10) / 10,
    activeAlerts: S.openAlertsFor(c.id).map((a) => ALERT_TYPES[a.type].title[L()]),
    shelter: S.stormActive()
      ? { active: true, inShelter: c.zone === 'shelter', hoursLeft: Math.max(0, Math.round((sim.storm.end - sim.now) / 3600e3)), doseRateHereUsvH: Math.round(z.rate) }
      : { active: false },
    lastCheckinMood: lastCheckin ? lastCheckin.mood : null,
  };
}

// ---------------------------------------------------------------------
// Render principal
// ---------------------------------------------------------------------
function go(route) {
  state.route = ROUTES.includes(route) ? route : 'today';
  if (location.hash !== `#/${state.route}`) history.replaceState(null, '', `#/${state.route}`);
  render();
  window.scrollTo(0, 0);
}

function render() {
  if (!state.crewId || !settings().accepted) return renderWelcome();
  setLang(settings().lang);
  document.body.dataset.route = state.route;
  renderHeader();
  renderNav();
  renderMain();
  renderOverlay();
}

function renderMain() {
  const screens = { today: renderToday, eco: renderEco, data: renderData, checkin: renderCheckin, shelter: renderShelter, privacy: renderPrivacy, doctor: renderDoctor, console: renderConsole };
  (screens[state.route] || renderToday)();
}

function renderHeader() {
  const c = me();
  const lvl = S.statusOf(c.id);
  $('header').innerHTML = `
    <div class="brand"><span class="orb" aria-hidden="true"></span>${esc(t('app'))}</div>
    <div class="clock">${t('day', { n: S.missionDay() })} · ${clock(sim.now)} UTC</div>
    <div class="who">
      <span class="dot" style="background:${c.color}"></span>${esc(c.name)}
      <span class="pill lvl-${lvl}">${t(`lvl_${lvl}`)}</span>
    </div>
    <nav class="demo-links" aria-label="${t('demo')}">
      <span class="tag">${t('demo')}</span>
      <button class="link ${state.route === 'doctor' ? 'active' : ''}" data-action="go" data-route="doctor">${t('nav_doctor')}</button>
      <button class="link ${state.route === 'console' ? 'active' : ''}" data-action="go" data-route="console">${t('nav_console')}</button>
    </nav>`;
}

function renderNav() {
  const items = [['today', '🏠'], ['eco', '💬'], ['data', '📈'], ['privacy', '🔒']];
  if (S.stormActive() || sim.shelter?.endedAt) items.splice(2, 0, ['shelter', '🛡️']);
  $('nav').innerHTML = items.map(([r, icon]) => `
    <button class="${state.route === r ? 'active' : ''} ${r === 'shelter' && S.stormActive() ? 'alarm' : ''}" data-action="go" data-route="${r}" aria-current="${state.route === r ? 'page' : 'false'}">
      <span aria-hidden="true">${icon}</span>${t(`nav_${r}`)}
    </button>`).join('');
  $('nav').hidden = !CREW_ROUTES.includes(state.route);
}

// ---------------------------------------------------------------------
// T1 · Bienvenida y reglas de privacidad
// ---------------------------------------------------------------------
function renderWelcome() {
  const w = (state.welcome ||= { id: state.crewId || 'c1', lang: settings(state.crewId || 'c1').lang, speak: true });
  setLang(w.lang);
  document.body.dataset.route = 'welcome';
  $('header').innerHTML = `<div class="brand"><span class="orb" aria-hidden="true"></span>${esc(t('app'))}</div>`;
  $('nav').hidden = true;
  $('overlay').hidden = true;
  $('main').innerHTML = `
    <section class="welcome">
      <div class="big-orb" aria-hidden="true"></div>
      <h1>${t('w_title')}</h1>
      <p class="lead">${t('w_intro')}</p>
      <h2>${t('w_who')}</h2>
      <div class="crew-pick">
        ${CREW.map((c) => `
          <button class="crew-btn" data-action="pickCrew" data-id="${c.id}" aria-pressed="${w.id === c.id}">
            <span class="dot" style="background:${c.color}"></span>
            <strong>${esc(c.name)}</strong><span class="muted">${esc(c.role[w.lang])}</span>
          </button>`).join('')}
      </div>
      <div class="row">
        <label>${t('w_lang')}
          <select data-change="welcomeLang">
            <option value="es" ${w.lang === 'es' ? 'selected' : ''}>Español</option>
            <option value="en" ${w.lang === 'en' ? 'selected' : ''}>English</option>
          </select>
        </label>
        <label class="check"><input type="checkbox" data-change="welcomeVoice" ${w.speak ? 'checked' : ''}> ${t('w_voice')}</label>
      </div>
      <div class="card rules">
        <h2>${t('w_rules')}</h2>
        <ol><li>${t('w_rule1')}</li><li>${t('w_rule2')}</li><li>${t('w_rule3')}</li></ol>
        <p class="muted">${t('w_emergency')}</p>
      </div>
      <button class="btn primary big" data-action="start">${t('w_start')}</button>
    </section>`;
}

// ---------------------------------------------------------------------
// T2 · Hoy
// ---------------------------------------------------------------------
function stat(title, value, sub, lvl = 'normal', extra = '') {
  return `<article class="card stat lvl-${lvl}"><h3>${title}</h3><p class="value">${value}</p>${sub ? `<p class="sub">${sub}</p>` : ''}${extra}</article>`;
}

function renderToday() {
  const c = me();
  const z = sim.zones[c.zone];
  const d = S.doseToday(c.id);
  const k = S.career(c.id);
  const lvl = S.statusOf(c.id);
  const hasCheckin = checkins().some((x) => x.day === dayKey(sim.now));
  const notices = S.openAlertsFor(c.id).filter((a) => a.level === 'attention');
  const airLvl = worst(S.levelFor('cabin_o2_pct', z.o2), S.levelFor('cabin_co2_mmhg', z.co2));

  $('main').innerHTML = `
    <section class="today">
      <div class="hello"><h1>${t('t_hello', { name: esc(c.name.split(' ')[0]) })}</h1><span class="pill lvl-${lvl}">${t(`lvl_${lvl}`)}</span></div>
      ${S.stormActive() && c.zone !== 'shelter' ? `<button class="banner danger" data-action="go" data-route="shelter">🛡️ ${t('t_storm_banner')}</button>` : ''}
      <div class="talk">
        <button class="btn primary big" data-action="go" data-route="eco" data-voice="1">🎙️ ${t('t_talk')}</button>
        <button class="btn big" data-action="go" data-route="eco">⌨️ ${t('t_write')}</button>
      </div>
      ${hasCheckin ? '' : `<div class="card note"><p>${t('t_checkin_missing')}</p><button class="btn" data-action="go" data-route="checkin">${t('t_checkin_go')}</button></div>`}
      <div class="grid">
        ${stat(t('t_dose_today'), `${d.total.toFixed(2)} mSv`, t('t_career', { pct: Math.round(k.pct) }), k.pct >= 90 ? 'attention' : 'normal',
          `<div class="bar"><span style="width:${Math.min(100, k.pct)}%"></span></div>`)}
        ${stat(t('t_spo2'), fmtVal('spo2_pct', c.spo2), '', S.levelFor('spo2_pct', c.spo2), spark(c.hist.spo2_pct))}
        ${stat(t('t_cabin'), `O2 ${fmtVal('cabin_o2_pct', z.o2)}`, `CO2 ${fmtVal('cabin_co2_mmhg', z.co2)}`, airLvl)}
        ${stat(t('t_pulse'), fmtVal('heart_rate_bpm', c.hrNow), '', S.levelFor('heart_rate_bpm', c.hrNow), spark(c.hist.heart_rate_bpm))}
        ${stat(t('t_sleep'), `${(c.sleepMin / 60).toFixed(1)} ${t('unit_h')}`, '', c.sleepMin < 360 ? 'attention' : 'normal')}
      </div>
      ${notices.length ? `<h2>${t('t_notices')}</h2><ul class="notices">${notices.map((a) => `<li class="lvl-attention">🟡 ${esc(ALERT_TYPES[a.type].title[L()])}${a.value != null ? ` · ${fmtVal(a.metric, a.value)}` : ''}</li>`).join('')}</ul>` : ''}
    </section>`;
}

// ---------------------------------------------------------------------
// T3 · Conversación con Eco por voz y texto
// ---------------------------------------------------------------------
function ecoBarHtml() {
  const mode = ecoMode();
  if (mode === 'shelter') {
    return `<span class="pill lvl-urgent">🛡️ ${t('e_shelter')}</span><span class="muted">${t('sh_exit')} ${duration(sim.storm.end - sim.now)}</span>`;
  }
  return `<div class="seg" role="group">
      <button data-action="mode" data-mode="listen" aria-pressed="${mode === 'listen'}">👂 ${t('e_listen')}</button>
      <button data-action="mode" data-mode="companion" aria-pressed="${mode === 'companion'}">🤝 ${t('e_companion')}</button>
    </div>`;
}

function chatHtml() {
  const c = me();
  const hello = { role: 'eco', text: t(ecoMode() === 'shelter' ? 'e_hello_shelter' : 'e_hello', { name: c.name.split(' ')[0] }) };
  return [hello, ...state.conv].map((m) => `
    <div class="msg ${m.role === 'eco' ? 'bot' : 'me'}">
      <p>${esc(m.text)}</p>
      ${m.role !== 'eco' && m.input === 'voice' ? `<span class="meta">🎙️ ${t('e_via_voice')}</span>` : ''}
    </div>`).join('');
}

function sourceLine() {
  if (state.lastSource === 'local' || state.llm?.llm === false) {
    const es = L() !== 'en';
    const reasons = {
      no_api_key: es ? 'falta la clave de OpenAI en .env' : 'OpenAI key missing in .env',
      auth: es ? 'OpenAI rechazó la clave' : 'OpenAI rejected the key',
      rate_limit: es ? 'sin créditos o límite de uso' : 'no credits or rate limit',
      model: es ? 'modelo no disponible' : 'model not available',
      network: es ? 'sin conexión con el servidor' : 'no connection to the server',
    };
    return t('e_local', { reason: reasons[state.lastReason || 'no_api_key'] || state.lastReason });
  }
  if (state.llm?.model) return t('e_llm', { model: state.llm.model });
  return '';
}

function renderEco() {
  const s = settings();
  $('main').innerHTML = `
    <section class="eco">
      <div class="eco-bar" id="ecoBar">${ecoBarHtml()}</div>
      <div class="chat" id="chat" aria-live="polite">${chatHtml()}</div>
      <p class="interim" id="interim"></p>
      <form class="composer" id="composer">
        <button type="button" id="micBtn" class="mic" data-action="mic" aria-pressed="false"><span aria-hidden="true">🎙️</span><span class="lbl">${t('e_mic')}</span></button>
        <input id="msgInput" name="msg" autocomplete="off" placeholder="${t('e_placeholder')}" aria-label="${t('e_placeholder')}">
        <button class="btn primary" type="submit">${t('e_send')}</button>
      </form>
      <div class="eco-foot">
        <span>${t('e_private')}</span>
        <button class="link" data-action="toggleVoice">${s.speak ? t('e_voice_on') : t('e_voice_off')}</button>
        <button class="link" data-action="clearConv">${t('e_clear')}</button>
      </div>
      <p class="muted small" id="ecoSource">${esc(sourceLine())}</p>
    </section>`;
  updateChat();
}

function updateChat() {
  if (state.route !== 'eco' || !$('chat')) return;
  $('chat').innerHTML = chatHtml();
  $('chat').scrollTop = $('chat').scrollHeight;
  $('ecoBar').innerHTML = ecoBarHtml();
  $('ecoSource').textContent = sourceLine();
  updateInterim();
  const mic = $('micBtn');
  mic.classList.toggle('on', state.listening);
  mic.setAttribute('aria-pressed', String(state.listening));
  mic.querySelector('.lbl').textContent = state.listening ? t('e_mic_stop') : t('e_mic');
}

function updateInterim() {
  const el = $('interim');
  if (!el) return;
  el.textContent = state.listening ? (state.interim || t('e_listening')) : state.pending ? t('e_thinking') : '';
}

function toggleMic() {
  if (state.listening) {
    voice.stopListening();
    return;
  }
  if (!voice.canListen) {
    toast(t('e_no_mic'));
    return;
  }
  state.listening = true;
  state.interim = '';
  updateChat();
  voice.listen({
    lang: L(),
    onInterim: (text) => { state.interim = text; updateInterim(); },
    onEnd: () => { state.listening = false; updateChat(); },
    onFinal: (text) => sendToEco(text, 'voice'),
    onError: (err) => {
      state.listening = false;
      if (err === 'not-allowed' || err === 'service-not-allowed') toast(t('e_mic_denied'));
      else if (err === 'unsupported') toast(t('e_no_mic'));
      updateChat();
    },
  });
}

async function sendToEco(text, input = 'text') {
  text = text.trim();
  if (!text || state.pending) return;
  const who = state.crewId;
  state.conv.push({ role: 'me', text, input, at: sim.now });
  persistConv();
  state.pending = true;
  updateChat();
  const history = state.conv.slice(-13, -1).map((m) => ({ role: m.role === 'eco' ? 'assistant' : 'user', text: m.text }));
  const res = await askEco({ message: text, mode: ecoMode(), lang: L(), summary: buildSummary(), history, useLlm: state.llm?.llm !== false });
  if (state.crewId !== who) return;
  state.pending = false;
  state.conv.push({ role: 'eco', text: res.reply, at: sim.now });
  persistConv();
  state.lastSource = res.source;
  state.lastReason = res.reason || null;
  updateChat();
  if (settings().speak) voice.speak(res.reply, { lang: L(), rate: settings().rate });
  if (res.risk && res.risk !== 'none') {
    state.escalation = res.risk;
    renderOverlay();
  }
}

// ---------------------------------------------------------------------
// T4 · Mis datos de salud y radiación
// ---------------------------------------------------------------------
function renderData() {
  const c = me();
  const z = sim.zones[c.zone];
  const d = S.doseToday(c.id);
  const k = S.career(c.id);
  const mine = checkins().slice(-7);
  $('main').innerHTML = `
    <section class="data">
      <h1>${t('d_title')}</h1>
      <article class="card">
        <h2>☢️ ${t('d_radiation')}</h2>
        <dl class="kv">
          <div><dt>${t('d_today')}</dt><dd>${d.total.toFixed(2)} mSv</dd></div>
          <div><dt>${t('d_mission')}</dt><dd>${k.mission.toFixed(1)} mSv</dd></div>
          <div><dt>${t('d_career')}</dt><dd>${k.career.toFixed(0)} / ${k.limit} mSv</dd></div>
          <div><dt>${t('d_projection')}</dt><dd>${k.projectedCareer.toFixed(0)} mSv</dd></div>
        </dl>
        <div class="bar big"><span style="width:${Math.min(100, k.pct)}%"></span></div>
        <p class="sub">${Math.round(k.pct)} % · ${k.projectedCareer > k.limit * 0.9 ? t('d_rad_high') : t('d_rad_ok')}</p>
        <dl class="kv small">
          <div><dt>${t('d_bg')}</dt><dd>${d.gcr.toFixed(3)} mSv</dd></div>
          <div><dt>${t('d_spe')}</dt><dd>${d.spe.toFixed(3)} mSv</dd></div>
        </dl>
        <div class="trend">${spark(c.hist.dose_rate_usv_h)}<span>${fmtVal('dose_rate_usv_h', z.rate)}</span></div>
      </article>
      <article class="card lvl-${S.levelFor('spo2_pct', c.spo2)}">
        <h2>🫁 ${t('d_oxygen')}</h2>
        <div class="trend">${spark(c.hist.spo2_pct, { min: 85, max: 100 })}<span>SpO2 ${fmtVal('spo2_pct', c.spo2)}</span></div>
        <div class="trend">${spark(z.hist.cabin_o2_pct, { min: 28, max: 35 })}<span>${t('d_cabin_o2')} ${fmtVal('cabin_o2_pct', z.o2)}</span></div>
        <p class="sub">${t('d_pressure')}: ${fmtVal('cabin_pressure_psia', z.pressure)}</p>
      </article>
      <article class="card lvl-${S.levelFor('cabin_co2_mmhg', z.co2)}">
        <h2>🌬️ ${t('d_air')}</h2>
        <div class="trend">${spark(z.hist.cabin_co2_mmhg, { min: 0, max: 7 })}<span>${t('d_co2')} ${fmtVal('cabin_co2_mmhg', z.co2)}</span></div>
      </article>
      <article class="card lvl-${worst(S.levelFor('heart_rate_bpm', c.hrNow), S.levelFor('resp_rate_bpm', c.rr))}">
        <h2>❤️ ${t('d_heart')}</h2>
        <div class="trend">${spark(c.hist.heart_rate_bpm)}<span>${t('t_pulse')} ${fmtVal('heart_rate_bpm', c.hrNow)}</span></div>
        <div class="trend">${spark(c.hist.resp_rate_bpm)}<span>${t('d_resp')} ${fmtVal('resp_rate_bpm', c.rr)}</span></div>
      </article>
      <article class="card">
        <h2>😴 ${t('d_sleep')}</h2>
        <p class="value">${(c.sleepMin / 60).toFixed(1)} ${t('unit_h')}</p>
      </article>
      <article class="card">
        <h2>🙂 ${t('d_mood')}</h2>
        ${mine.length ? `<p class="faces">${mine.map((x) => `<span title="${x.day}">${FACES[x.mood - 1]}</span>`).join('')}</p>` : `<p class="muted">${t('d_mood_empty')}</p>`}
        <p class="muted small">${t('d_mood_private')}</p>
      </article>
    </section>`;
}

// ---------------------------------------------------------------------
// T5 · Check-in diario de ánimo y síntomas
// ---------------------------------------------------------------------
function scale(name, label) {
  return `<fieldset class="scale"><legend>${label}</legend>
    ${FACES.map((f, i) => `<label><input type="radio" name="${name}" value="${i + 1}" ${i === 2 ? 'checked' : ''}><span>${f}</span><small>${i + 1}</small></label>`).join('')}
  </fieldset>`;
}

function renderCheckin() {
  $('main').innerHTML = `
    <section class="checkin">
      <h1>${t('c_title')}</h1>
      <form id="checkinForm" class="card">
        ${scale('mood', t('c_mood'))}
        ${scale('stress', t('c_stress'))}
        ${scale('energy', t('c_energy'))}
        <fieldset class="chips"><legend>${t('c_symptoms')}</legend>
          ${SYMPTOMS.map((s) => `<label><input type="checkbox" name="symptoms" value="${s}"><span>${t(`s_${s}`)}</span></label>`).join('')}
        </fieldset>
        <p class="muted small">${t('c_symptom_note')}</p>
        <label class="block">${t('c_note')}<textarea name="note" rows="3"></textarea></label>
        <button class="btn primary big" type="submit">${t('c_save')}</button>
      </form>
    </section>`;
}

function saveCheckin(form) {
  const f = new FormData(form);
  const entry = {
    day: dayKey(sim.now),
    at: sim.now,
    mood: Number(f.get('mood')),
    stress: Number(f.get('stress')),
    energy: Number(f.get('energy')),
    symptoms: f.getAll('symptoms'),
    note: String(f.get('note') || '').slice(0, 1000),
  };
  const list = checkins();
  list.push(entry);
  save(`private:${state.crewId}:checkins`, list.slice(-60));
  if (entry.symptoms.length) S.addSymptoms(state.crewId, entry.symptoms); // sin la nota
  syncTrends(state.crewId);
  toast(t('c_saved'));
  go('today');
}

// ---------------------------------------------------------------------
// T7 · Modo refugio por tormenta solar
// ---------------------------------------------------------------------
function renderShelter() {
  const c = me();
  const sh = sim.shelter;
  if (!sh) {
    $('main').innerHTML = `<section><h1>${t('sh_title')}</h1><p class="muted">${t('sh_none')}</p></section>`;
    return;
  }
  if (sh.endedAt) {
    const h = ((sh.endedAt - sh.startedAt) / 3600e3).toFixed(1);
    $('main').innerHTML = `
      <section class="shelter">
        <h1>✅ ${t('sh_clear')}</h1>
        <div class="card"><p>${t('sh_clear_text', { h, dose: sh.doseAvoided.toFixed(1) })}</p></div>
        <button class="btn primary big" data-action="go" data-route="eco">${t('sh_talk')}</button>
      </section>`;
    return;
  }
  const inside = c.zone === 'shelter';
  const shelterZone = sim.zones.shelter;
  const outside = sim.zones[c.home];
  const now = S.shiftNow();
  const next = sh.shifts.find((s) => s.start >= (now?.end ?? sim.now));
  const names = (ids) => ids.map((id) => esc(sim.crew[id].name.split(' ')[0])).join(', ');
  const people = Object.keys(sh.arrived).length;
  const toArrival = sim.storm.arrival - sim.now;

  $('main').innerHTML = `
    <section class="shelter">
      <h1>🛡️ ${t('sh_title')}</h1>
      ${inside ? `<div class="banner ok">✅ ${t('sh_inside')}</div>` : `
        <div class="card big-count lvl-urgent">
          ${toArrival > 0 ? `<p>${t('sh_arrive_in')}</p><p class="count">${countdown(toArrival)}</p>` : `<p class="count-text">${t('sh_arrived_already')}</p>`}
          <p>${t('sh_zone', { zone: esc(shelterZone.name[L()]) })}</p>
          <button class="btn danger big" data-action="arrive">${t('sh_arrive')}</button>
        </div>`}
      <div class="grid">
        ${stat(t('sh_dose_in'), fmtVal('dose_rate_usv_h', shelterZone.rate), '', 'normal')}
        ${stat(t('sh_dose_out'), fmtVal('dose_rate_usv_h', outside.rate), '', S.levelFor('dose_rate_usv_h', outside.rate))}
        ${stat(t('sh_avoided'), `${sh.doseAvoided.toFixed(1)} mSv`, '', 'normal')}
        ${stat(t('sh_exit'), duration(sim.storm.end - sim.now), '', 'normal')}
        ${stat(t('sh_air'), `CO2 ${fmtVal('cabin_co2_mmhg', shelterZone.co2)}`, `O2 ${fmtVal('cabin_o2_pct', shelterZone.o2)}`, worst(S.levelFor('cabin_o2_pct', shelterZone.o2), S.levelFor('cabin_co2_mmhg', shelterZone.co2)))}
        ${stat(t('sh_people'), `${people} / ${CREW.length}`, '', 'normal')}
      </div>
      <article class="card">
        <h2>${t('sh_shifts')}</h2>
        <table class="table">
          <thead><tr><th></th><th>${t('sh_rest')}</th><th>${t('sh_watch')}</th></tr></thead>
          <tbody>
            ${now ? `<tr><th>${t('sh_now')} · ${clock(now.start)}–${clock(now.end)}</th><td>${names(now.rest)}</td><td>${names(now.watch)}</td></tr>` : ''}
            ${next ? `<tr><th>${t('sh_next')} · ${clock(next.start)}–${clock(next.end)}</th><td>${names(next.rest)}</td><td>${names(next.watch)}</td></tr>` : ''}
          </tbody>
        </table>
      </article>
      <button class="btn primary big" data-action="go" data-route="eco">💬 ${t('sh_talk')}</button>
    </section>`;
}

// ---------------------------------------------------------------------
// T8 · Privacidad y permisos (con ajustes)
// ---------------------------------------------------------------------
function renderPrivacy() {
  const s = settings();
  const k = consents();
  const viewed = sim.accessLog.filter((x) => x.crewId === state.crewId).slice(-8).reverse();
  $('main').innerHTML = `
    <section class="privacy">
      <h1>${t('p_title')}</h1>
      <article class="card">
        <h2>${t('p_rules')}</h2>
        <ol><li>${t('w_rule1')}</li><li>${t('w_rule2')}</li><li>${t('w_rule3')}</li></ol>
      </article>
      <article class="card toggles">
        <label class="switch"><input type="checkbox" data-change="consentMood" ${k.mood ? 'checked' : ''}><span>${t('p_share_mood')}</span></label>
        <label class="switch"><input type="checkbox" data-change="consentSleep" ${k.sleep ? 'checked' : ''}><span>${t('p_share_sleep')}</span></label>
        <label class="switch"><input type="checkbox" data-change="memory" ${s.memory ? 'checked' : ''}><span>${t('p_memory')}</span></label>
      </article>
      <article class="card">
        <h2>${t('p_viewed')}</h2>
        ${viewed.length ? `<ul class="log">${viewed.map((v) => `<li>${t('day', { n: Math.floor((v.at - S.MISSION.start) / 86400e3) + 1 })} · ${clock(v.at)} — ${esc(v.resource === 'wellbeing' ? t('d_mood') : t('p_res_safety'))}</li>`).join('')}</ul>` : `<p class="muted">${t('p_viewed_none')}</p>`}
      </article>
      <button class="btn danger" data-action="deleteAll">${t('p_delete')}</button>
      <article class="card">
        <h2>${t('p_settings')}</h2>
        <label class="block">${t('p_lang')}
          <select data-change="lang">
            <option value="es" ${s.lang === 'es' ? 'selected' : ''}>Español</option>
            <option value="en" ${s.lang === 'en' ? 'selected' : ''}>English</option>
          </select>
        </label>
        <label class="switch"><input type="checkbox" data-change="speak" ${s.speak ? 'checked' : ''}><span>${t('p_voice')}</span></label>
        <label class="block">${t('p_rate')} <input type="range" min="0.7" max="1.3" step="0.1" value="${s.rate}" data-change="rate"></label>
        <button class="btn" data-action="switchCrew">${t('p_switch')}</button>
      </article>
    </section>`;
}

// ---------------------------------------------------------------------
// M1 · Panel del médico de vuelo (con centro de alertas)
// ---------------------------------------------------------------------
function renderDoctor() {
  const lang = L();
  const open = sim.alerts.filter((a) => a.status !== 'resolved').slice().reverse();
  for (const c of CREW) S.logAccess(c.id, 'safety');
  $('main').innerHTML = `
    <section class="doctor">
      <h1>🩺 ${t('m_title')}</h1>
      <p class="muted">${t('m_never')}</p>
      <div class="banner ${S.stormActive() ? 'danger' : 'ok'}">${S.stormActive() ? `☀️ ${t('m_storm')} · ${sim.storm.label} · ${t('sh_exit')} ${duration(sim.storm.end - sim.now)}` : `🌌 ${t('m_space_ok')}`}</div>
      <h2>${t('m_cabin')}</h2>
      <table class="table">
        <thead><tr><th>${t('k_zone')}</th><th>O2</th><th>CO2</th><th>${t('d_pressure')}</th><th>☢️</th></tr></thead>
        <tbody>${Object.values(sim.zones).map((z) => `<tr>
          <th>${esc(z.name[lang])}</th>
          <td class="lvl-${S.levelFor('cabin_o2_pct', z.o2)}">${fmtVal('cabin_o2_pct', z.o2)}</td>
          <td class="lvl-${S.levelFor('cabin_co2_mmhg', z.co2)}">${fmtVal('cabin_co2_mmhg', z.co2)}</td>
          <td>${fmtVal('cabin_pressure_psia', z.pressure)}</td>
          <td class="lvl-${S.levelFor('dose_rate_usv_h', z.rate)}">${fmtVal('dose_rate_usv_h', z.rate)}</td></tr>`).join('')}</tbody>
      </table>
      <h2>${t('m_crew')}</h2>
      <div class="grid wide">
        ${CREW.map((cc) => {
          const c = sim.crew[cc.id];
          const k = S.career(c.id);
          const lvl = S.statusOf(c.id);
          const cons = consents(c.id);
          const trend = Object.entries(sim.trends[c.id] || {}).sort().at(-1)?.[1];
          if (cons.mood || cons.sleep) S.logAccess(c.id, 'wellbeing');
          return `<article class="card lvl-${lvl}">
            <h3><span class="dot" style="background:${c.color}"></span>${esc(c.name)} <span class="pill lvl-${lvl}">${t(`lvl_${lvl}`)}</span></h3>
            <p class="muted small">${esc(c.role[lang])} · ${esc(sim.zones[c.zone].name[lang])}</p>
            <dl class="kv small">
              <div><dt>SpO2</dt><dd class="lvl-${S.levelFor('spo2_pct', c.spo2)}">${fmtVal('spo2_pct', c.spo2)}</dd></div>
              <div><dt>${t('t_pulse')}</dt><dd>${fmtVal('heart_rate_bpm', c.hrNow)}</dd></div>
              <div><dt>${t('d_career')}</dt><dd>${Math.round(k.pct)} %</dd></div>
              <div><dt>${t('d_today')}</dt><dd>${S.doseToday(c.id).total.toFixed(2)} mSv</dd></div>
              <div><dt>${t('m_mood')}</dt><dd>${cons.mood ? (trend?.mood != null ? `${FACES[Math.round(trend.mood) - 1]} ${trend.mood}` : '—') : t('m_not_shared')}</dd></div>
              <div><dt>${t('m_sleep_q')}</dt><dd>${cons.sleep ? `${(c.sleepMin / 60).toFixed(1)} ${t('unit_h')}` : t('m_not_shared')}</dd></div>
            </dl>
          </article>`;
        }).join('')}
      </div>
      <h2>${t('m_alerts')}</h2>
      ${open.length ? `<ul class="alerts">${open.map((a) => `
        <li class="lvl-${a.level}">
          <span>${a.level === 'urgent' ? '🔴' : '🟡'} <strong>${esc(ALERT_TYPES[a.type].title[lang])}</strong>
            · ${a.crewId ? esc(sim.crew[a.crewId].name) : esc(sim.zones[a.zone]?.name[lang] || '')}
            ${a.value != null ? ` · ${fmtVal(a.metric, a.value)}` : ''} · ${clock(a.createdAt)} · ${t(`st_${a.status}`)}</span>
          <span class="actions">
            ${a.status === 'active' ? `<button class="btn small" data-action="docAck" data-id="${a.id}">${t('m_ack')}</button>` : ''}
            <button class="btn small" data-action="docResolve" data-id="${a.id}">${t('m_resolve')}</button>
          </span>
        </li>`).join('')}</ul>` : `<p class="muted">${t('m_no_alerts')}</p>`}
      <h2>${t('m_emergencies')}</h2>
      ${sim.escalations.length ? `<ul class="alerts">${sim.escalations.slice().reverse().map((e) => `<li class="lvl-urgent"><span>🆘 <strong>${t(`cat_${e.category}`)}</strong> · ${esc(sim.crew[e.crewId].name)} · ${clock(e.at)}</span></li>`).join('')}</ul>` : `<p class="muted">${t('m_no_emergencies')}</p>`}
      <h2>${t('m_symptoms')}</h2>
      ${sim.symptoms.length ? `<ul class="log">${sim.symptoms.slice(-8).reverse().map((s) => `<li>${esc(sim.crew[s.crewId].name)} · ${t(`s_${s.symptom}`)} · ${clock(s.at)}</li>`).join('')}</ul>` : `<p class="muted">${t('m_no_symptoms')}</p>`}
    </section>`;
}

// ---------------------------------------------------------------------
// D1 · Consola de simulación de la demo
// ---------------------------------------------------------------------
function renderConsole() {
  const o = sim.overrides;
  const id = state.consoleCrew;
  const on = (b) => (b ? ` (${t('k_on')})` : '');
  $('main').innerHTML = `
    <section class="console">
      <h1>🎛️ ${t('k_title')}</h1>
      <p class="muted">${t('k_note')}</p>
      <article class="card">
        <h2>${t('k_clock')}</h2>
        <p class="value" id="consoleClock">${t('day', { n: S.missionDay() })} · ${clock(sim.now)} UTC</p>
        <div class="row">
          <span>${t('k_speed')}:</span>
          ${[1, 60, 600].map((n) => `<button class="btn small" data-action="speed" data-n="${n}" aria-pressed="${sim.speed === n}">${n}×</button>`).join('')}
          <button class="btn small" data-action="pause">${sim.running ? t('k_pause') : t('k_resume')}</button>
        </div>
      </article>
      <article class="card">
        <h2>${t('k_events')}</h2>
        <div class="row">
          ${S.stormActive()
            ? `<button class="btn" data-action="allClear">✅ ${t('k_clear')}</button>`
            : `<button class="btn danger" data-action="storm">☀️ ${t('k_storm')}</button>`}
          <button class="btn" data-action="lowO2" aria-pressed="${o.lowO2}">🫁 ${t('k_low_o2')}${on(o.lowO2)}</button>
          <button class="btn" data-action="highCO2" aria-pressed="${o.highCO2}">🌬️ ${t('k_high_co2')}${on(o.highCO2)}</button>
        </div>
        <div class="row">
          <label>${t('k_target')}
            <select data-change="consoleCrew">${CREW.map((c) => `<option value="${c.id}" ${c.id === id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
          </label>
          <button class="btn" data-action="lowSpo2" aria-pressed="${Boolean(o.lowSpo2[id])}">${t('k_low_spo2')}${on(o.lowSpo2[id])}</button>
          <button class="btn" data-action="badSleep" aria-pressed="${Boolean(o.badSleep[id])}">${t('k_bad_sleep')}${on(o.badSleep[id])}</button>
        </div>
        <button class="btn danger" data-action="resetDemo">${t('k_reset')}</button>
      </article>
      <article class="card">
        <h2>${t('k_live')}</h2>
        <div id="live">${liveHtml()}</div>
      </article>
    </section>`;
}

function liveHtml() {
  const lang = L();
  return `<table class="table">
    <thead><tr><th></th><th>SpO2</th><th>${t('t_pulse')}</th><th>${t('d_resp')}</th><th>${t('k_zone')}</th><th>${t('d_today')}</th></tr></thead>
    <tbody>${Object.values(sim.crew).map((c) => `<tr>
      <th>${esc(c.name)}</th>
      <td class="lvl-${S.levelFor('spo2_pct', c.spo2)}">${fmtVal('spo2_pct', c.spo2)}</td>
      <td>${fmtVal('heart_rate_bpm', c.hrNow)}</td>
      <td>${fmtVal('resp_rate_bpm', c.rr)}</td>
      <td>${esc(sim.zones[c.zone].name[lang])}</td>
      <td>${S.doseToday(c.id).total.toFixed(3)} mSv</td></tr>`).join('')}</tbody>
  </table>`;
}

// ---------------------------------------------------------------------
// T6 · Alerta urgente en pantalla completa  +  aviso de emergencia
// ---------------------------------------------------------------------
function pendingUrgent() {
  if (!CREW_ROUTES.includes(state.route)) return null;
  const id = state.crewId;
  return sim.alerts.find((a) => a.level === 'urgent' && a.status !== 'resolved' && (a.crewId === id || a.crewId === null) && !a.acks[id]) || null;
}

function renderOverlay() {
  const $o = $('overlay');
  if (state.escalation) {
    if (state.overlayAlertId === 'esc') return;
    state.overlayAlertId = 'esc';
    $o.hidden = false;
    $o.innerHTML = `
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="escTitle">
        <h2 id="escTitle">💙 ${t('esc_title')}</h2>
        <p>${t('esc_text')}</p>
        <div class="row">
          <button class="btn primary big" data-action="escYes">${t('esc_yes')}</button>
          <button class="btn big" data-action="escNo">${t('esc_no')}</button>
        </div>
      </div>`;
    $o.querySelector('button').focus();
    return;
  }
  const a = pendingUrgent();
  if (!a) {
    if (state.overlayAlertId) {
      state.overlayAlertId = null;
      $o.hidden = true;
      $o.innerHTML = '';
    }
    return;
  }
  if (state.overlayAlertId === a.id) return;
  state.overlayAlertId = a.id;
  const type = ALERT_TYPES[a.type];
  const lang = L();
  $o.hidden = false;
  $o.innerHTML = `
    <div class="alert-full" role="alertdialog" aria-modal="true" aria-labelledby="alertTitle">
      <p class="kicker">🔴 ${t('lvl_urgent')}</p>
      <h1 id="alertTitle">${esc(type.title[lang])}</h1>
      ${a.value != null ? `<p class="alert-value">${fmtVal(a.metric, a.value)}</p>` : ''}
      <ol>${type.steps[lang].map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <div class="row">
        ${a.type === 'solar_storm' ? `<button class="btn light big" data-action="ackAlert" data-id="${a.id}" data-then="shelter">🛡️ ${t('a_go_shelter')}</button>` : ''}
        <button class="btn light big" data-action="ackAlert" data-id="${a.id}">${t('a_ok')}</button>
      </div>
    </div>`;
  $o.querySelector('button').focus();
  // Las alertas urgentes se leen en voz alta aunque la voz de Eco esté apagada
  if (!a.spoken[state.crewId]) {
    S.markSpoken(a.id, state.crewId);
    voice.stopListening();
    voice.speak(`${type.title[lang]}. ${type.steps[lang].join('. ')}.`, { lang, rate: settings().rate });
  }
}

// ---------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------
const actions = {
  go: (el) => {
    go(el.dataset.route);
    if (el.dataset.voice) setTimeout(toggleMic, 150);
    else if (el.dataset.route === 'eco') $('msgInput')?.focus();
  },
  pickCrew: (el) => {
    state.welcome.id = el.dataset.id;
    state.welcome.lang = settings(el.dataset.id).lang;
    renderWelcome();
  },
  start: () => {
    const w = state.welcome;
    state.crewId = w.id;
    save('current', w.id);
    saveSettings({ lang: w.lang, speak: w.speak, accepted: true }, w.id);
    sim.manualCrew = w.id;
    state.welcome = null;
    loadConv();
    go('today');
  },
  mode: (el) => { state.ecoMode = el.dataset.mode; updateChat(); },
  mic: () => toggleMic(),
  toggleVoice: () => {
    saveSettings({ speak: !settings().speak });
    if (!settings().speak) voice.stopSpeaking();
    renderEco();
  },
  clearConv: () => {
    if (!confirm(t('e_clear_confirm'))) return;
    state.conv = [];
    remove(`private:${state.crewId}:conversation`);
    updateChat();
  },
  ackAlert: (el) => {
    S.acknowledge(el.dataset.id, state.crewId);
    voice.stopSpeaking();
    state.overlayAlertId = null;
    $('overlay').hidden = true;
    if (el.dataset.then) go(el.dataset.then);
    else renderOverlay();
  },
  arrive: () => { S.markArrived(state.crewId); render(); },
  escYes: () => {
    S.addEscalation(state.crewId, state.escalation);
    state.escalation = null;
    state.overlayAlertId = null;
    $('overlay').hidden = true;
    state.conv.push({ role: 'eco', text: t('esc_sent'), at: sim.now });
    persistConv();
    updateChat();
    if (settings().speak) voice.speak(t('esc_sent'), { lang: L(), rate: settings().rate });
    renderOverlay();
  },
  escNo: () => {
    state.escalation = null;
    state.overlayAlertId = null;
    $('overlay').hidden = true;
    renderOverlay();
  },
  deleteAll: () => {
    if (!confirm(t('p_delete_confirm'))) return;
    state.conv = [];
    remove(`private:${state.crewId}:conversation`);
    toast(t('p_deleted'));
  },
  switchCrew: () => {
    voice.stopSpeaking();
    voice.stopListening();
    state.crewId = null;
    save('current', null);
    state.welcome = null;
    render();
  },
  docAck: (el) => { S.acknowledge(el.dataset.id, 'doctor'); renderDoctor(); },
  docResolve: (el) => { S.resolve(el.dataset.id); renderDoctor(); },
  speed: (el) => S.setSpeed(Number(el.dataset.n)),
  pause: () => S.setRunning(!sim.running),
  storm: () => S.triggerStorm(),
  allClear: () => S.allClear(),
  lowO2: () => S.toggleLowO2(),
  highCO2: () => S.toggleHighCO2(),
  lowSpo2: () => S.toggleLowSpo2(state.consoleCrew),
  badSleep: () => S.badSleep(state.consoleCrew),
  resetDemo: () => {
    S.reset();
    sim.manualCrew = state.crewId;
    for (const c of CREW) syncTrends(c.id);
    state.overlayAlertId = null;
    renderConsole();
  },
};

const changes = {
  welcomeLang: (el) => { state.welcome.lang = el.value; renderWelcome(); },
  welcomeVoice: (el) => { state.welcome.speak = el.checked; },
  consentMood: (el) => {
    save(`consents:${state.crewId}`, { ...consents(), mood: el.checked });
    syncTrends(state.crewId); // al quitar el permiso, la tendencia compartida se borra
  },
  consentSleep: (el) => save(`consents:${state.crewId}`, { ...consents(), sleep: el.checked }),
  memory: (el) => {
    saveSettings({ memory: el.checked });
    if (el.checked) persistConv();
    else remove(`private:${state.crewId}:conversation`);
  },
  lang: (el) => { saveSettings({ lang: el.value }); render(); },
  speak: (el) => saveSettings({ speak: el.checked }),
  rate: (el) => saveSettings({ rate: Number(el.value) }),
  consoleCrew: (el) => { state.consoleCrew = el.value; renderConsole(); },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && actions[el.dataset.action]) {
    e.preventDefault();
    actions[el.dataset.action](el, e);
  }
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el && changes[el.dataset.change]) changes[el.dataset.change](el, e);
});
document.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'composer') {
    const input = $('msgInput');
    const text = input.value;
    input.value = '';
    sendToEco(text, 'text');
  } else if (e.target.id === 'checkinForm') {
    saveCheckin(e.target);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.listening) voice.stopListening();
});
window.addEventListener('hashchange', () => {
  const r = routeFromHash();
  if (r && r !== state.route) go(r);
});

// ---------------------------------------------------------------------
// Actualización con el simulador
// ---------------------------------------------------------------------
S.subscribe((type) => {
  if (!state.crewId || !settings().accepted) return;
  if (type === 'tick') {
    renderHeader();
    if (['today', 'data', 'shelter', 'doctor'].includes(state.route)) renderMain();
    else if (state.route === 'console') {
      $('live') && ($('live').innerHTML = liveHtml());
      $('consoleClock') && ($('consoleClock').textContent = `${t('day', { n: S.missionDay() })} · ${clock(sim.now)} UTC`);
    } else if (state.route === 'eco' && $('ecoBar')) $('ecoBar').innerHTML = ecoBarHtml();
    renderOverlay();
    return;
  }
  if (['storm', 'shelter', 'control', 'reset'].includes(type)) {
    renderNav();
    if (state.route === 'eco') updateChat();
    else if (!['checkin', 'privacy'].includes(state.route)) renderMain();
  }
  if (type === 'alert' || type === 'storm') renderOverlay();
});

async function init() {
  if (state.crewId) {
    sim.manualCrew = state.crewId;
    loadConv();
  }
  for (const c of CREW) syncTrends(c.id);
  S.start();
  render();
  state.llm = await llmStatus();
  if (state.route === 'eco') updateChat();
}

init();
