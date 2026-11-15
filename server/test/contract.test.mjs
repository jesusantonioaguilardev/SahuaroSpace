// API-01: contrato HTTP contra el servidor encendido (npm start). Solo casos que no gastan IA ni voz.
// Uso: npm run test:contract   (ECO_URL=http://localhost:3000 por defecto)
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.ECO_URL || 'http://localhost:3000';
let up = false;

before(async () => {
  up = await fetch(`${BASE}/api/status`).then((r) => r.ok).catch(() => false);
  if (!up) console.warn(`Servidor no disponible en ${BASE}: se omiten las pruebas de contrato (corre npm start).`);
});

const post = (path, body) => fetch(`${BASE}${path}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('API-01: /api/status describe los servicios sin exponer claves', async (t) => {
  if (!up) return t.skip('servidor apagado');
  const r = await fetch(`${BASE}/api/status`);
  assert.equal(r.status, 200);
  const j = await r.json();
  for (const k of ['llm', 'model', 'supabase', 'tts']) assert.ok(k in j, k);
  assert.doesNotMatch(JSON.stringify(j), /sk-|eyJ/, 'no debe incluir claves');
});

test('API-01 / PRIV-06: /api/config solo entrega la clave pública', async (t) => {
  if (!up) return t.skip('servidor apagado');
  const j = await (await fetch(`${BASE}/api/config`)).json();
  for (const k of ['supabaseUrl', 'supabaseKey', 'missionId']) assert.ok(k in j, k);
  assert.ok(!('supabaseServiceKey' in j));
  if (j.supabaseKey?.startsWith('eyJ')) {
    const payload = JSON.parse(Buffer.from(j.supabaseKey.split('.')[1], 'base64url').toString());
    assert.notEqual(payload.role, 'service_role', 'nunca la clave secreta');
  }
});

test('API-01: mensaje vacío → 400 en /api/eco y /api/live', async (t) => {
  if (!up) return t.skip('servidor apagado');
  for (const path of ['/api/eco', '/api/live']) {
    const r = await post(path, { message: '   ' });
    assert.equal(r.status, 400, path);
    assert.equal((await r.json()).error, 'empty_message');
  }
});

test('API-01: texto vacío → 400 en /api/tts', async (t) => {
  if (!up) return t.skip('servidor apagado');
  const r = await post('/api/tts', { text: '' });
  assert.ok([400, 503].includes(r.status));
  if (r.status === 400) assert.equal((await r.json()).error, 'empty_text');
});

test('API-01 / DASH-05: la consola exige rol (sin sesión → 403, o 503 sin Supabase)', async (t) => {
  if (!up) return t.skip('servidor apagado');
  const r = await fetch(`${BASE}/api/sim/status`);
  assert.ok([403, 503].includes(r.status), String(r.status));
  const s = await post('/api/sim/storm', {});
  assert.ok([403, 503].includes(s.status), String(s.status));
});

test('API-01: rutas desconocidas de la API → 404 not_found', async (t) => {
  if (!up) return t.skip('servidor apagado');
  const r = await fetch(`${BASE}/api/no-existe`);
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, 'not_found');
});
