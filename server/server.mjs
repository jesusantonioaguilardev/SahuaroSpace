// =====================================================================
// AstroHealth · Eco — servidor
//
//   /                 Dashboard web de monitoreo (carpeta dashboard/)
//   /prototipo/       Prototipo web anterior (carpeta prototipo-web/)
//   GET  /api/config  Datos públicos para conectarse a Supabase
//   POST /api/eco     Eco con OpenAI (para la app móvil y el prototipo)
//   *    /api/sim/*   Consola de simulación (solo médico, simulador o admin)
//
// Las claves de OpenAI y la clave secreta de Supabase viven solo aquí (.env).
// Uso:  npm install   →   completa .env (ver .env.example)   →   npm start
// =====================================================================
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT, config, hasSupabase } from './config.mjs';
import { hasLlm, askOpenAI, normalizeEcoRequest, ecoErrorCode } from './eco.mjs';
import { userFromRequest } from './db.mjs';
import { createSimulator } from './simulator.mjs';
import { CHARACTERS, hasTts, synthesize, ttsStatus } from './voice.mjs';

const STATIC = [
  { prefix: '/prototipo/', dir: path.join(ROOT, 'prototipo-web') },
  { prefix: '/', dir: path.join(ROOT, 'dashboard') },
];
const VENDOR = {
  '/vendor/supabase.js': path.join(ROOT, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js'),
};
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const sim = hasSupabase ? createSimulator({ missionId: config.missionId, tickMs: config.simTickMs }) : null;

// ---------------------------------------------------------------------
function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': MIME['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req, limit = 100_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const isLoopback = (req) => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);

// ---------------------------------------------------------------------
// Eco
// ---------------------------------------------------------------------
async function handleEco(req, res) {
  // La app móvil manda su sesión de Supabase. Sin sesión solo se acepta desde esta computadora (prototipo y emulador).
  const user = await userFromRequest(req);
  if (!user && !isLoopback(req)) return sendJson(res, 401, { error: 'unauthorized' });
  if (!hasLlm) return sendJson(res, 503, { error: 'no_api_key' });

  let body;
  try {
    body = normalizeEcoRequest(await readBody(req));
  } catch (err) {
    return sendJson(res, err.status || 400, { error: 'bad_request' });
  }
  if (!body.message) return sendJson(res, 400, { error: 'empty_message' });

  try {
    const result = await askOpenAI(body);
    return sendJson(res, 200, { ...result, model: config.openaiModel });
  } catch (err) {
    const [code, message] = ecoErrorCode(err);
    console.error(`[eco] ${message}`);
    return sendJson(res, code === 'server' ? 500 : 502, { error: code });
  }
}

// ---------------------------------------------------------------------
// Modo en vivo: respuesta + voz en una sola llamada (menos espera)
// ---------------------------------------------------------------------
async function handleLive(req, res) {
  const user = await userFromRequest(req);
  if (!user && !isLoopback(req)) return sendJson(res, 401, { error: 'unauthorized' });
  if (!hasLlm) return sendJson(res, 503, { error: 'no_api_key' });

  let body;
  try {
    body = normalizeEcoRequest({ ...(await readBody(req)), live: true });
  } catch (err) {
    return sendJson(res, err.status || 400, { error: 'bad_request' });
  }
  if (!body.message) return sendJson(res, 400, { error: 'empty_message' });

  let result;
  try {
    result = await askOpenAI(body);
  } catch (err) {
    const [code, message] = ecoErrorCode(err);
    console.error(`[vivo] ${message}`);
    return sendJson(res, code === 'server' ? 500 : 502, { error: code });
  }
  // Si la voz falla, la respuesta llega igual (la app usa la voz del sistema)
  let audio = null;
  if (hasTts) {
    try {
      audio = (await synthesize({ text: result.reply, character: body.character, lang: body.lang })).toString('base64');
    } catch (err) {
      console.error(`[vivo] voz: ${err.message}`);
    }
  }
  return sendJson(res, 200, { ...result, audio, model: config.openaiModel });
}

// ---------------------------------------------------------------------
// Voz de los personajes (ElevenLabs)
// ---------------------------------------------------------------------
async function handleTts(req, res) {
  const user = await userFromRequest(req);
  if (!user && !isLoopback(req)) return sendJson(res, 401, { error: 'unauthorized' });
  if (!hasTts) return sendJson(res, 503, { error: 'no_api_key' });

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return sendJson(res, err.status || 400, { error: 'bad_request' });
  }
  const text = String(body.text || '').trim();
  if (!text) return sendJson(res, 400, { error: 'empty_text' });
  const character = CHARACTERS.includes(body.character) ? body.character : 'luma';
  const lang = body.lang === 'en' ? 'en' : 'es';

  try {
    const audio = await synthesize({ text, character, lang });
    res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'no-store' });
    return res.end(audio);
  } catch (err) {
    console.error(`[voz] ${err.message}`);
    return sendJson(res, err.code === 'no_voice' ? 503 : 502, { error: err.code || 'tts_failed' });
  }
}

// ---------------------------------------------------------------------
// Consola de simulación
// ---------------------------------------------------------------------
async function handleSim(req, res, action) {
  if (!sim) return sendJson(res, 503, { error: 'no_supabase' });
  const user = await userFromRequest(req);
  if (!user || !['surgeon', 'simulator', 'admin'].includes(user.role)) return sendJson(res, 403, { error: 'forbidden' });

  if (req.method === 'GET' && action === 'status') return sendJson(res, 200, sim.status());
  if (req.method !== 'POST') return sendJson(res, 405, { error: 'method' });

  const body = await readBody(req).catch(() => ({}));
  try {
    let result;
    switch (action) {
      case 'storm': result = await sim.triggerStorm(user.id); break;
      case 'clear': result = await sim.allClear(undefined, user.id); break;
      case 'speed': await sim.setSpeed([1, 60, 600].includes(Number(body.speed)) ? Number(body.speed) : 60); result = { ok: true }; break;
      case 'run': await sim.setRunning(Boolean(body.running)); result = { ok: true }; break;
      case 'toggle': result = await sim.toggle(String(body.name), body.crewId, user.id); break;
      case 'reset': result = await sim.reset(user.id); break;
      default: return sendJson(res, 404, { error: 'unknown_action' });
    }
    return sendJson(res, 200, { ...result, status: sim.status() });
  } catch (err) {
    console.error(`[sim] ${err.message}`);
    return sendJson(res, 500, { error: 'sim_failed', message: err.message });
  }
}

// ---------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------
async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (VENDOR[pathname]) return sendFile(res, VENDOR[pathname]);
  if (pathname === '/prototipo') {
    res.writeHead(301, { Location: '/prototipo/' });
    return res.end();
  }
  const mount = STATIC.find((m) => pathname.startsWith(m.prefix));
  let rel = pathname.slice(mount.prefix.length);
  if (!rel || rel.endsWith('/')) rel += 'index.html';
  const filePath = path.normalize(path.join(mount.dir, rel));
  if (!filePath.startsWith(mount.dir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  return sendFile(res, filePath);
}

async function sendFile(res, filePath) {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('No encontrado');
  }
}

// ---------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname === '/api/status') {
      return sendJson(res, 200, { llm: hasLlm, model: hasLlm ? config.openaiModel : null, supabase: hasSupabase, tts: ttsStatus() });
    }
    if (pathname === '/api/tts' && req.method === 'POST') return await handleTts(req, res);
    if (pathname === '/api/live' && req.method === 'POST') return await handleLive(req, res);
    if (pathname === '/api/config') {
      return sendJson(res, 200, { supabaseUrl: config.supabaseUrl, supabaseKey: config.supabaseAnonKey, missionId: config.missionId });
    }
    if (pathname === '/api/eco' && req.method === 'POST') return await handleEco(req, res);
    if (pathname.startsWith('/api/sim/')) return await handleSim(req, res, pathname.slice('/api/sim/'.length));
    if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'not_found' });
    if (req.method === 'GET') return await serveStatic(req, res);
    res.writeHead(405);
    res.end();
  } catch (err) {
    console.error('[server]', err?.message || err);
    if (!res.headersSent) sendJson(res, 500, { error: 'server' });
  }
});

server.listen(config.port, config.host, async () => {
  console.log(`ELOISE  →  http://localhost:${config.port}  (dashboard)`);
  console.log(`Prototipo web     →  http://localhost:${config.port}/prototipo/`);
  console.log(hasLlm ? `Los personajes usan OpenAI (modelo ${config.openaiModel}).` : 'Sin OPENAI_API_KEY: los personajes responden en modo local.');
  const tts = ttsStatus();
  console.log(tts.enabled
    ? `Voces ElevenLabs (${tts.model}): Luma ${tts.characters.luma ? 'lista' : 'falta ID'} · Pipo ${tts.characters.pipo ? 'lista' : 'falta ID'} · Nix ${tts.characters.nix ? 'lista' : 'falta ID'}`
    : 'Sin ELEVENLABS_API_KEY: la app usa la voz del sistema.');
  if (!hasSupabase) {
    console.log('Sin datos de Supabase en .env: el dashboard y el simulador quedan apagados.');
    return;
  }
  try {
    await sim.start();
  } catch (err) {
    console.error(`[sim] No se pudo iniciar: ${err.message}`);
  }
});
