// Voz de los personajes con ElevenLabs (texto a voz).
// La clave vive solo aquí; la app recibe únicamente el audio.
//   Luma → Matilda · Pipo → Jessica · Nix → Eric   (voces gratuitas; IDs en .env)
import { config } from './config.mjs';

export const CHARACTERS = ['luma', 'pipo', 'nix'];

// Ajustes de voz por personalidad: Luma calmada, Pipo expresivo, Nix estable
const VOICE_SETTINGS = {
  luma: { stability: 0.6, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: 0.95 },
  pipo: { stability: 0.35, similarity_boost: 0.75, style: 0.55, use_speaker_boost: true, speed: 1.05 },
  nix: { stability: 0.75, similarity_boost: 0.8, style: 0.05, use_speaker_boost: true, speed: 1.0 },
};

export const hasTts = Boolean(config.elevenlabsKey);
export const voiceFor = (character) => config.voices[character] || '';

export function ttsStatus() {
  return {
    enabled: hasTts,
    model: config.elevenlabsModel,
    characters: Object.fromEntries(CHARACTERS.map((c) => [c, Boolean(voiceFor(c))])),
  };
}

/** Devuelve el audio (mp3) como Buffer. Lanza un error con .code si algo falla. */
export async function synthesize({ text, character, lang }) {
  const voiceId = voiceFor(character);
  if (!hasTts) throw Object.assign(new Error('Falta ELEVENLABS_API_KEY'), { code: 'no_api_key' });
  if (!voiceId) throw Object.assign(new Error(`Falta el ID de voz para ${character}`), { code: 'no_voice' });

  const body = {
    text: String(text).slice(0, 1200),
    model_id: config.elevenlabsModel,
    voice_settings: VOICE_SETTINGS[character] || VOICE_SETTINGS.luma,
  };
  // language_code no es compatible con eleven_multilingual_v2 (detecta el idioma solo); los modelos v2.5 sí lo usan
  if (!config.elevenlabsModel.startsWith('eleven_multilingual_v2')) body.language_code = lang === 'en' ? 'en' : 'es';

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_22050_32`,
    {
      method: 'POST',
      headers: { 'xi-api-key': config.elevenlabsKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const code = res.status === 401 ? 'auth' : res.status === 429 ? 'rate_limit' : res.status === 422 ? 'bad_request' : 'upstream';
    throw Object.assign(new Error(`ElevenLabs respondió ${res.status}`), { code, status: res.status });
  }
  return Buffer.from(await res.arrayBuffer());
}
