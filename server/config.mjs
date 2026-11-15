// Configuración del servidor (lee .env). Las claves secretas nunca salen de aquí.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// El .env del proyecto manda sobre las variables de Windows con el mismo nombre
// (process.loadEnvFile no las sobrescribe y se usaba una clave vieja).
try {
  const fromFile = parseEnv(readFileSync(path.join(ROOT, '.env'), 'utf8'));
  for (const [k, v] of Object.entries(fromFile)) if (v !== '') process.env[k] = v;
} catch { /* sin .env */ }

const env = process.env;

export const config = {
  port: Number(env.PORT || 3000),
  // 127.0.0.1 = solo esta computadora (y el emulador de Android vía 10.0.2.2).
  // Para usar un celular real en la misma red Wi‑Fi: HOST=0.0.0.0
  host: env.HOST || '127.0.0.1',
  openaiKey: env.OPENAI_API_KEY || '',
  openaiModel: env.OPENAI_MODEL || 'gpt-5.4-mini',
  supabaseUrl: env.SUPABASE_URL || '',
  supabaseAnonKey: env.SUPABASE_ANON_KEY || '',
  supabaseServiceKey: env.SUPABASE_SERVICE_ROLE_KEY || '',
  missionId: env.MISSION_ID || 'a0000000-0000-4000-8000-000000000001',
  elevenlabsKey: env.ELEVENLABS_API_KEY || '',
  elevenlabsModel: env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',  // el más rápido en español
  // Voz de cada personaje (ID de voz de ElevenLabs)
  voices: {
    luma: env.ELEVENLABS_VOICE_LUMA || '',  // Matilda
    pipo: env.ELEVENLABS_VOICE_PIPO || '',  // Jessica
    nix: env.ELEVENLABS_VOICE_NIX || '',    // Eric
  },
  simTickMs: Number(env.SIM_TICK_MS || 3000),
};

export const hasSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && config.supabaseServiceKey);
