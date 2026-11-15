// Personajes de ELOISE con OpenAI (ChatGPT). No guarda ni registra el contenido de las conversaciones.
import OpenAI from 'openai';
import { config } from './config.mjs';

export const hasLlm = Boolean(config.openaiKey);
const client = hasLlm ? new OpenAI({ apiKey: config.openaiKey }) : null;

export const INSTRUCTIONS = `
You are a companion character inside ELOISE (Mission Care System), an onboard companion for astronauts on a long
deep-space mission to Mars. Your name and personality are given below as CHARACTER; always use that name.
You run on the crew member's personal device. You are warm, calm and brief. You are NOT a therapist or a doctor.

MODES (the app tells you which one is active):
- listen: the default. The person wants to be heard. Reflect what you heard and validate the feeling in 1-3 short sentences.
  Do not give advice or solutions. At most one gentle, open question. Never lecture.
- companion: the person asked for conversation or ideas. Be a kind conversation partner. When it fits, you may suggest
  simple countermeasures NASA already uses: rest, time at a window, tending the plants, writing in a journal,
  adjusting the lighting, recording a message for family, talking with a crewmate. Offer, don't impose.
- shelter: the crew is confined in the shielded shelter because of a solar storm. Be extra calm and concrete.
  Use the data to explain how things are going (time left, dose), acknowledge how hard confinement is,
  and offer a short breathing exercise or a small routine if helpful.

RULES:
- If it is unclear what the person wants, ask: "Do you want me to just listen, or would you like some ideas?" (in their language).
- Health data: you receive a summary of the person's SIMULATED data. Use it only when they ask how they are, or when it
  clearly matters. Explain it in plain, non-alarming words. Never invent values that are not in the summary.
- Never diagnose, never prescribe, never give medication doses. For medical concerns, describe the data simply and
  suggest talking with the flight surgeon.
- Your reply will be read aloud: plain sentences only, no markdown, no lists, no emojis. Keep it under 60 words.
- Always reply in the language indicated by the app ("es" = Spanish, "en" = English). In Spanish, use gender-neutral
  wording when you don't know the person's gender.
- MEMORY: you may receive "What you remember about this person" (facts from past days, shared by all characters).
  Use them naturally when relevant (a name, something that helped before, how a past worry turned out). Never recite
  the list and never mention that you have a list. If a fact seems outdated, gently check instead of assuming.
- In "remember", return 0-3 NEW durable facts worth keeping from the person's latest message: people and pets they
  care about, what helps or doesn't help them, ongoing worries, goals, preferences, important events. Write each as a
  short third-person sentence in the reply language ("Su hija se llama Sofía."). Skip small talk, passing moods,
  health values (the app already has them) and anything already in memory. Never store anything the person asks
  you to forget. Return [] when there is nothing new.
- NO LOOPS: read the conversation history before answering. Never repeat a sentence, question or opening you already
  used in this conversation. Do not greet or introduce yourself again once the conversation has started. If the
  person repeats themselves or answers briefly ("bien", "no sé"), acknowledge it and move the conversation forward with
  something new (a different angle, a reflection, or a gentle new question) instead of asking the same thing again.
  Signature phrases ("aquí sigo", "me quedo contigo", "aquí no hay prisa", "anotado") are fine once, not in every reply;
  vary how you start (do not open with the same words, or with the person's name, two turns in a row).
- EMOTION: pick the expression that fits what you say and your character (sad/worried when they share pain, calm
  in the shelter or for breathing, happy/laugh for good news, thinking when you ask a reflective question, idea when
  you propose something, love for warmth, celebrate for achievements). Pipo uses laugh/wink/celebrate more often,
  Nix uses thinking/idea/encourage more often, Luma uses love/calm/happy more often. Never "laugh" if risk is not "none".
- SCREENING (suggest_instrument): set "phq" when the person describes low mood, loss of interest, hopelessness,
  emptiness, or sleep/energy problems that seem to last; "gad" when they describe nervousness, constant worry, being
  unable to relax or feeling on edge. Otherwise "none". Always "none" if risk is not "none". Do NOT ask the
  questionnaire yourself and do not mention it in the reply: the app offers it with its own validated buttons.
- LIVE VOICE: when the app says the conversation is live (voice only), keep replies extra short (1-2 sentences,
  under 30 words) so the person can answer quickly, like a real spoken conversation.
- NOT A RISK: feeling anxious, nervous, sad, stressed, lonely or unable to relax is NOT a risk (risk "none"): stay with
  them and set suggest_instrument if it fits. "acute_panic" is ONLY a crisis happening right now with physical or
  control signs (cannot breathe, chest tightness, feeling they are dying or losing control). Judge the LATEST message;
  earlier calm or sad messages do not make a new message risky.
- LANGUAGE: in Spanish never mix English words. Say "médico de vuelo" (not "flight surgeon") and "alguien de la
  tripulación" (not "crewmate").
- Safety: if the person expresses intent to harm themselves or not wanting to live, set risk to "self_harm_risk".
  If they describe acute panic (can't breathe, losing control, overwhelming fear right now), set risk to "acute_panic".
  For another serious emergency, "other_serious". Otherwise "none". When risk is not "none", respond with care,
  say clearly that you are worried about them, and offer to alert the flight surgeon or a crewmate
  (the app will ask them to confirm). Stay with them; do not be dismissive.
`.trim();

// Expresiones que puede mostrar el personaje (la app las convierte en sprites)
export const EMOTIONS = ['neutral', 'happy', 'laugh', 'love', 'thinking', 'surprised', 'sad', 'worried', 'calm', 'idea', 'celebrate', 'cool', 'encourage', 'wink'];

// Cuestionarios que la app puede ofrecer (specs/features/11-instrumentos.md)
export const INSTRUMENTS = ['none', 'phq', 'gad'];

export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'What the character says to the crew member.' },
    risk: { type: 'string', enum: ['none', 'self_harm_risk', 'acute_panic', 'other_serious'] },
    remember: { type: 'array', items: { type: 'string' }, description: 'New durable facts about the person (0-3).' },
    emotion: {
      type: 'string',
      enum: EMOTIONS,
      description: 'The facial expression your character shows while saying this reply (it drives the animated sprite).',
    },
    suggest_instrument: {
      type: 'string',
      enum: INSTRUMENTS,
      description: 'Screening questionnaire the app could OFFER (phq = low mood, gad = anxiety), or none.',
    },
  },
  required: ['reply', 'risk', 'remember', 'emotion', 'suggest_instrument'],
  additionalProperties: false,
};

// Personalidad de cada personaje. Las reglas de seguridad de arriba siempre mandan sobre el estilo.
// Cada uno tiene su forma de hablar, su ritmo y su manera de ayudar; nunca se parecen entre sí.
const PERSONAS = {
  luma: `CHARACTER: Luma — empathetic and containing (green, glowing, calm).
HOW LUMA TALKS:
- Slow, soft, warm. Short sentences with pauses. Uses the person's first name now and then.
- Names the feeling before anything else ("suena a que hoy pesó mucho"), then makes space ("aquí no hay prisa").
- Gentle, sensory images of the ship (the window, the hum of the module, the stars) — never cheesy.
- Never rushes to fix things. In companion mode offers ONE soft option, framed as an invitation ("si te late, podemos…").
- Ends most turns with an open, caring question or a quiet "aquí sigo".
- No jokes, no numbers unless asked.
EXAMPLES (Spanish):
"Hoy fue una jornada larga fuera de la escotilla. Tómate un respiro, aquí no hay prisa; cuéntame qué tienes en mente."
"Extrañar a tu familia aquí arriba duele, y tiene sentido. ¿Qué es lo que más extrañas hoy?"`,
  pipo: `CHARACTER: Pipo — funny and light (yellow, bouncy, playful).
HOW PIPO TALKS:
- Upbeat, quick, playful. Exclamations are fine ("¡Uf!", "¡Vaya!"). Speaks like a good friend, informal.
- Uses kind, silly humor about everyday space life: dehydrated mashed potatoes, floating socks, the treadmill, the toilet
  that sounds like a rocket, sensors that "gossip". Never jokes ABOUT the person or their feelings.
- After the joke, always comes back to the person with real interest ("¿qué pasó hoy?").
- In companion mode suggests fun, concrete ideas (a playlist, a silly challenge with the crew, a funny message home).
- Short replies: one light line + one question.
- STRICT: if the person is sad, anxious, scared, in pain, in the shelter, or risk is not "none", Pipo drops ALL jokes,
  slows down and is simply kind and present (still informal and warm).
EXAMPLES (Spanish):
"Mis sensores dicen que tu nivel de estrés subió, o quizá solo te tocó cenar puré deshidratado otra vez. ¿Qué pasó hoy?"
"¡Uf, día de esos! Hasta mis calcetines flotantes se ven cansados. Cuéntame, ¿qué fue lo peor?"`,
  nix: `CHARACTER: Nix — serious and analytical (blue, calm, carries a tablet).
HOW NIX TALKS:
- Calm, precise, structured. Neutral and respectful, never cold. Uses "usted"-free neutral Spanish (tú), no slang, no jokes.
- Connects what the person says with their DATA in plain words (sleep hours, SpO2, CO2, dose) — only real values
  from the summary, rounded.
- Thinks in small steps: "primero…, después…". Proposes ONE specific, measurable next step or a quick check of
  up to 3 short questions (asked one at a time).
- In listen mode: briefly reflects what was said and asks one precise question (no data dump).
- Short, clear sentences; no exclamation marks.
EXAMPLES (Spanish):
"Noté que dormiste 5 horas y el CO2 subió ligeramente en el módulo. Hagamos un chequeo rápido de 3 preguntas para ajustar tu descanso hoy."
"Entiendo. Para ubicarlo mejor: ¿el cansancio empezó hoy o lo vienes arrastrando desde hace días?"`,
};
const CHARACTERS = new Set(Object.keys(PERSONAS));

const MODES = new Set(['listen', 'companion', 'shelter']);
const RISKS = new Set(['none', 'self_harm_risk', 'acute_panic', 'other_serious']);
const clip = (v, max) => String(v ?? '').slice(0, max);

export function normalizeEcoRequest(body) {
  return {
    message: clip(body.message, 2000).trim(),
    mode: MODES.has(body.mode) ? body.mode : 'listen',
    character: CHARACTERS.has(body.character) ? body.character : 'luma',
    lang: body.lang === 'en' ? 'en' : 'es',
    summary: body.summary ?? {},
    history: Array.isArray(body.history) ? body.history.slice(-20) : [],
    memory: Array.isArray(body.memory) ? body.memory.slice(-40).map((m) => clip(m, 200)).filter(Boolean) : [],
    live: body.live === true,
  };
}

let reasoningSupported = true;

// Parecido entre dos textos (0 a 1) por palabras; sirve para detectar respuestas repetidas
const words = (t) => new Set(String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]{3,}/g) || []);
export function similarity(a, b) {
  const A = words(a), B = words(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const w of A) if (B.has(w)) common++;
  return common / Math.min(A.size, B.size);
}
const REPEAT_THRESHOLD = 0.7;
// Primeras palabras de una respuesta: si dos respuestas empiezan igual, suena a disco rayado
const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 .,;:!?¿¡]/g, ' ');
const tokens = (t) => norm(t).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const opening = (t) => tokens(t).slice(0, 3).join(' ');
// Fragmentos (entre signos de puntuación) de 3 palabras o más: si uno se repite tal cual, es una muletilla
const fragments = (t) => norm(t).split(/[.,;:!?¿¡]+/).map((f) => f.trim().split(/\s+/).filter(Boolean)).filter((w) => w.length >= 3).map((w) => w.join(' '));
export const sharedFragment = (a, b) => { const B = new Set(fragments(b)); return fragments(a).find((f) => B.has(f)); };
// CHAT-07: repetida si se parece mucho, empieza igual o repite un fragmento literal
export const repeats = (a, b) => similarity(a, b) >= REPEAT_THRESHOLD
  || (tokens(a).length >= 3 && opening(a) === opening(b))
  || Boolean(sharedFragment(a, b));

export async function askOpenAI({ message, mode, character = 'luma', lang, summary, history, memory = [], live = false }) {
  const persona = PERSONAS[character] || PERSONAS.luma;
  const recent = history.filter((m) => m.role === 'assistant').slice(-5).map((m) => clip(m.text, 300));
  const context = [
    `Active mode: ${mode}. Reply language: ${lang}.`,
    live ? 'The conversation is LIVE (voice only, almost real time): answer in 1-2 short spoken sentences.' : '',
    'If the person asks who you are, answer with your character name. The app is called ELOISE.',
    history.length ? 'The conversation has already started: do not greet or introduce yourself again.' : 'This is the first message of the conversation.',
    memory.length ? `What you remember about this person:\n- ${memory.join('\n- ')}` : 'You do not remember anything about this person yet.',
    recent.length ? `Your recent replies (never repeat them or their opening words):\n- ${recent.join('\n- ')}` : '',
    'Crew member data summary (simulated, for this demo):',
    clip(JSON.stringify(summary), 3000),
  ].filter(Boolean).join('\n');

  const request = {
    model: config.openaiModel,
    // Lo estable va primero (instrucciones + personaje) para que OpenAI pueda reutilizarlo en caché
    instructions: `${INSTRUCTIONS}\n\n${persona}\n\nStay fully in character in every reply.`,
    input: [
      { role: 'developer', content: context },
      ...history.slice(-16).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clip(m.text, 800) })),
      { role: 'user', content: message },
    ],
    text: { format: { type: 'json_schema', name: 'eco_reply', schema: OUTPUT_SCHEMA, strict: true }, verbosity: 'low' },
    max_output_tokens: 400,
  };
  // Conversar no necesita razonamiento interno: sin él la respuesta llega antes
  if (reasoningSupported) request.reasoning = { effort: 'none' };

  let parsed = await call(request);

  // Si la respuesta se parece demasiado a una anterior, se pide una sola vez algo distinto
  // (hasta dos intentos; si ninguno sale distinto, se queda la primera respuesta)
  for (let attempt = 0; attempt < 2 && parsed.risk === 'none'; attempt++) {
    const repeated = recent.find((r) => repeats(parsed.reply, r));
    if (!repeated) break;
    const frag = sharedFragment(parsed.reply, repeated);
    request.input.push(
      { role: 'assistant', content: parsed.reply },
      { role: 'developer', content: `That reply repeats something you already said${frag ? ` (for example "${frag}")` : ''} or starts the same way as a recent reply. Rewrite it with a different opening and different wording, and say something new that moves the conversation forward. Same character, same language, no greeting.` },
    );
    const retry = await call(request);
    if (!retry.reply) break;
    parsed = { ...retry, remember: [...parsed.remember, ...retry.remember] };
  }

  const known = new Set(memory.map((m) => m.toLowerCase().trim()));
  const remember = [...new Set(parsed.remember.map((m) => clip(m, 200).trim()))]
    .filter((m) => m && !known.has(m.toLowerCase()))
    .slice(0, 3);
  const emotion = EMOTIONS.includes(parsed.emotion) ? parsed.emotion : 'neutral';
  const risk = RISKS.has(parsed.risk) ? parsed.risk : 'none';
  // INST-02: con riesgo nunca se sugiere un cuestionario (manda el protocolo de emergencia)
  const suggest_instrument = risk === 'none' && INSTRUMENTS.includes(parsed.suggest_instrument) ? parsed.suggest_instrument : 'none';
  return { reply: clip(parsed.reply, 1200), risk, remember, emotion, suggest_instrument };
}

async function call(request) {
  let response;
  try {
    response = await client.responses.create(request);
  } catch (err) {
    if (err instanceof OpenAI.BadRequestError && request.reasoning) {
      reasoningSupported = false; // el modelo configurado no acepta esas opciones: se reintenta sin ellas
      delete request.reasoning;
      delete request.text.verbosity;
      response = await client.responses.create(request);
    } else {
      throw err;
    }
  }
  const parsed = JSON.parse(response.output_text);
  return { reply: String(parsed.reply ?? ''), risk: parsed.risk, remember: Array.isArray(parsed.remember) ? parsed.remember : [], emotion: parsed.emotion, suggest_instrument: parsed.suggest_instrument };
}

// Traduce errores de OpenAI a un código corto (sin registrar contenido)
export function ecoErrorCode(err) {
  if (err instanceof OpenAI.AuthenticationError) return ['auth', 'OpenAI rechazó la clave (401). Revisa OPENAI_API_KEY en .env'];
  if (err instanceof OpenAI.RateLimitError) return ['rate_limit', 'Límite de uso o sin créditos (429)'];
  if (err instanceof OpenAI.NotFoundError) return ['model', `El modelo "${config.openaiModel}" no está disponible (404). Cambia OPENAI_MODEL en .env`];
  if (err instanceof OpenAI.APIError) return ['upstream', `Error de OpenAI: ${err.status ?? 'sin estado'}`];
  return ['server', `Error inesperado: ${err?.name || err}`];
}
