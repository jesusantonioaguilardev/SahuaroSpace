// Pruebas derivadas de specs/ (CHAT, MEM, LIVE, API). No llaman a OpenAI.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeEcoRequest, repeats, sharedFragment, similarity, EMOTIONS, OUTPUT_SCHEMA, INSTRUCTIONS, INSTRUMENTS } from '../eco.mjs';

// ---------------------------------------------------------------- PRIV-07 / CHAR-06
test('PRIV-07 / CHAR-06: la IA no se presenta como "Eco" y usa el nombre del personaje dentro de ELOISE', () => {
  assert.doesNotMatch(INSTRUCTIONS, /\b(Eco|Echo)\b/);
  assert.match(INSTRUCTIONS, /ELOISE/);
  assert.match(INSTRUCTIONS, /CHARACTER/);
  assert.doesNotMatch(JSON.stringify(OUTPUT_SCHEMA), /\b(Eco|Echo)\b/);
});

// ---------------------------------------------------------------- API-02
test('API-02: valores desconocidos caen a los de por defecto', () => {
  const r = normalizeEcoRequest({ message: '  hola  ', mode: 'xx', character: 'zz', lang: 'fr' });
  assert.equal(r.message, 'hola');
  assert.equal(r.mode, 'listen');
  assert.equal(r.character, 'luma');
  assert.equal(r.lang, 'es');
  assert.deepEqual(r.history, []);
  assert.deepEqual(r.memory, []);
  assert.equal(r.live, false);
});

test('API-02: el mensaje se recorta a 2000 caracteres', () => {
  assert.equal(normalizeEcoRequest({ message: 'a'.repeat(5000) }).message.length, 2000);
});

test('API-02: se aceptan los modos, personajes e idiomas del contrato', () => {
  for (const mode of ['listen', 'companion', 'shelter']) assert.equal(normalizeEcoRequest({ message: 'x', mode }).mode, mode);
  for (const character of ['luma', 'pipo', 'nix']) assert.equal(normalizeEcoRequest({ message: 'x', character }).character, character);
  assert.equal(normalizeEcoRequest({ message: 'x', lang: 'en' }).lang, 'en');
});

test('API-02 / CHAT-06: el historial conserva los últimos 20 turnos', () => {
  const history = Array.from({ length: 30 }, (_, i) => ({ role: 'user', text: `m${i}` }));
  const r = normalizeEcoRequest({ message: 'x', history });
  assert.equal(r.history.length, 20);
  assert.equal(r.history[0].text, 'm10');
});

test('MEM-03: la memoria conserva los últimos 40 recuerdos, cada uno ≤ 200 caracteres, sin vacíos', () => {
  const memory = [...Array.from({ length: 50 }, (_, i) => `recuerdo ${i}`), '', 'x'.repeat(500)];
  const r = normalizeEcoRequest({ message: 'x', memory });
  assert.ok(r.memory.length <= 40);
  assert.ok(r.memory.every((m) => m.length > 0 && m.length <= 200));
  assert.equal(r.memory.at(-1).length, 200);
});

test('LIVE-04: el flag live solo se activa con true', () => {
  assert.equal(normalizeEcoRequest({ message: 'x', live: true }).live, true);
  assert.equal(normalizeEcoRequest({ message: 'x', live: 'yes' }).live, false);
});

// ---------------------------------------------------------------- CHAT-07
test('CHAT-07a: respuestas casi iguales son repetidas', () => {
  const a = 'Suena a que hoy fue un día muy pesado para ti en la estación';
  const b = 'Suena a que hoy fue un día pesado para ti en la estación espacial';
  assert.ok(similarity(a, b) >= 0.7);
  assert.ok(repeats(a, b));
});

test('CHAT-07b: empezar con las mismas 3 palabras es repetir (sin importar acentos ni signos)', () => {
  assert.ok(repeats('Está bien, Ana. A veces no saber pesa.', 'Esta bien ana: no hace falta forzarlo.'));
});

test('CHAT-07c: un fragmento literal de 3+ palabras es una muletilla', () => {
  const a = 'Suena difícil. Me quedo contigo, despacio.';
  const b = 'Otra cosa distinta. Me quedo contigo; si quieres seguimos.';
  assert.equal(sharedFragment(a, b), 'me quedo contigo');
  assert.ok(repeats(a, b));
});

test('CHAT-07: respuestas distintas NO son repetidas', () => {
  assert.equal(repeats(
    'Vale, Ana. Cuando todo se queda en no sé, a veces basta con bajar la presión.',
    'Entiendo. Ese no sé también dice que algo está pasando por dentro.',
  ), false);
  assert.equal(repeats('Hola qué tal', 'Algo distinto por completo hoy'), false);
});

// ---------------------------------------------------------------- LIVE-10 / CHAR-05 (contrato)
test('LIVE-10: el esquema de salida usa exactamente la lista de emociones', () => {
  assert.deepEqual(OUTPUT_SCHEMA.properties.emotion.enum, EMOTIONS);
  for (const k of ['reply', 'risk', 'remember', 'emotion']) assert.ok(OUTPUT_SCHEMA.required.includes(k), k);
});

test('LIVE-10: el contrato OpenAPI y la app conocen todas las emociones del servidor', () => {
  const openapi = readFileSync(new URL('../../specs/api/openapi.yaml', import.meta.url), 'utf8');
  const enumLine = openapi.match(/Emotion:\s*\n\s*type: string\s*\n\s*enum: \[([^\]]+)\]/);
  assert.ok(enumLine, 'Emotion en openapi.yaml');
  assert.deepEqual(enumLine[1].split(',').map((s) => s.trim()), EMOTIONS);

  const sprites = readFileSync(new URL('../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/LiveSprites.kt', import.meta.url), 'utf8');
  for (const e of EMOTIONS.filter((e) => e !== 'neutral')) {
    assert.ok(sprites.includes(`"${e}" ->`), `poseFor de la app no maneja "${e}"`);
  }
});

// ---------------------------------------------------------------- INST-02 (contrato)
test('INST-02: la IA puede sugerir un cuestionario y la lista coincide con el contrato', () => {
  assert.deepEqual(OUTPUT_SCHEMA.properties.suggest_instrument.enum, INSTRUMENTS);
  assert.ok(OUTPUT_SCHEMA.required.includes('suggest_instrument'));
  const openapi = readFileSync(new URL('../../specs/api/openapi.yaml', import.meta.url), 'utf8');
  const m = openapi.match(/Instrument:\s*\n\s*type: string\s*\n\s*enum: \[([^\]]+)\]/);
  assert.ok(m, 'Instrument en openapi.yaml');
  assert.deepEqual(m[1].split(',').map((s) => s.trim()), INSTRUMENTS);
});

test('INST-01: la IA no debe aplicar el cuestionario por su cuenta', () => {
  assert.match(INSTRUCTIONS, /Do NOT ask the\s+questionnaire yourself/);
});
