// Eco: envía el mensaje al servidor local (OpenAI) y, si no hay IA disponible,
// responde en "modo local" con respuestas simples para que la demo siga funcionando.

export async function askEco({ message, mode, lang, summary, history, useLlm = true }) {
  if (!useLlm) return { ...localEco({ message, mode, lang, summary }), source: 'local', reason: 'no_api_key' };
  try {
    const res = await fetch('/api/eco', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode, lang, summary, history }),
    });
    if (res.ok) {
      const data = await res.json();
      // Red de seguridad: si la IA no marcó riesgo pero el texto lo muestra claramente, se marca igual
      const risk = data.risk && data.risk !== 'none' ? data.risk : detectRisk(message);
      return { reply: data.reply, risk, source: 'llm' };
    }
    const err = await res.json().catch(() => ({}));
    return { ...localEco({ message, mode, lang, summary }), source: 'local', reason: err.error || `http_${res.status}` };
  } catch {
    return { ...localEco({ message, mode, lang, summary }), source: 'local', reason: 'network' };
  }
}

export async function llmStatus() {
  try {
    const res = await fetch('/api/status');
    return await res.json();
  } catch {
    return { llm: false, model: null };
  }
}

// ---------------------------------------------------------------------
// Modo local (sin IA): respuestas sencillas y seguras
// ---------------------------------------------------------------------
const RISK_PATTERNS = {
  self_harm_risk: /(no quiero vivir|quitarme la vida|hacerme da[ñn]o|suicid|matarme|kill myself|end my life|hurt myself|don'?t want to live)/i,
  acute_panic: /(p[áa]nico|no puedo respirar|me ahogo|ataque de ansiedad|panic|can'?t breathe|losing control)/i,
};
function detectRisk(message) {
  for (const [risk, re] of Object.entries(RISK_PATTERNS)) if (re.test(message)) return risk;
  return 'none';
}
const ASK_DATA = /(c[óo]mo estoy|mis datos|c[óo]mo voy|how am i|my data|how are my)/i;
const ASK_IDEAS = /(qu[ée] hago|qu[ée] me recomiendas|ideas|consejo|ay[úu]dame|what should i do|any ideas|advice|help me)/i;

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function dataSentence(s, lang) {
  const es = lang !== 'en';
  const parts = [];
  if (s.spo2 != null) parts.push(es ? `tu oxígeno en sangre está en ${s.spo2} %` : `your blood oxygen is ${s.spo2}%`);
  if (s.heartRate != null) parts.push(es ? `tu pulso en ${s.heartRate}` : `your pulse is ${s.heartRate}`);
  if (s.doseTodayMsv != null) parts.push(es ? `hoy llevas ${s.doseTodayMsv} mSv de radiación` : `today's radiation dose is ${s.doseTodayMsv} mSv`);
  if (s.sleepHours != null) parts.push(es ? `anoche dormiste ${s.sleepHours} horas` : `you slept ${s.sleepHours} hours last night`);
  let text = (es ? 'Te cuento: ' : "Here's how you're doing: ") + parts.join(', ') + '.';
  if (s.activeAlerts?.length) {
    text += es ? ` Hay un aviso activo: ${s.activeAlerts[0]}.` : ` There is an active notice: ${s.activeAlerts[0]}.`;
  } else {
    text += es ? ' Todo está dentro de lo esperado.' : ' Everything is within the expected range.';
  }
  return text;
}

function localEco({ message, mode, lang, summary = {} }) {
  const es = lang !== 'en';
  for (const [risk, re] of Object.entries(RISK_PATTERNS)) {
    if (re.test(message)) {
      return {
        risk,
        reply: risk === 'acute_panic'
          ? (es ? 'Estoy aquí contigo. Respira conmigo: inhala contando hasta cuatro, sostén, y suelta despacio. Me preocupa cómo te sientes. ¿Quieres que avise al médico o a un compañero?'
                : "I'm here with you. Breathe with me: in for four, hold, and out slowly. I'm worried about how you feel. Do you want me to alert the surgeon or a crewmate?")
          : (es ? 'Gracias por decírmelo. Me importa lo que te pasa y me preocupa. No tienes por qué cargar esto en soledad. ¿Quieres que avise al médico de vuelo o a un compañero ahora?'
                : "Thank you for telling me. I care about what you're going through, and I'm worried. You don't have to carry this alone. Do you want me to alert the flight surgeon or a crewmate now?"),
      };
    }
  }
  if (ASK_DATA.test(message)) return { risk: 'none', reply: dataSentence(summary, lang) };

  if (mode === 'shelter') {
    const left = summary.shelter?.hoursLeft;
    return {
      risk: 'none',
      reply: es
        ? `Estás en el lugar más seguro de la nave${left != null ? ` y faltan unas ${left} horas` : ''}. Es normal que el encierro pese. Si quieres, hacemos juntos una respiración lenta o te cuento cómo va la tormenta.`
        : `You're in the safest place on the ship${left != null ? ` and about ${left} hours are left` : ''}. It's normal for the lockdown to feel heavy. If you like, we can do a slow breath together or I can tell you how the storm is going.`,
    };
  }
  if (mode === 'companion' || ASK_IDEAS.test(message)) {
    return {
      risk: 'none',
      reply: pick(es
        ? ['Una idea: un rato en la ventana o con las plantas suele ayudar a despejar. ¿Quieres probarlo?',
           '¿Y si grabas un mensaje para tu familia? Aunque tarde en llegar, decirlo en voz alta a veces alivia.',
           'Podrías escribir unas líneas en tu diario o hablar con alguien de la tripulación. ¿Cuál te suena mejor?']
        : ['One idea: some time at the window or with the plants often helps clear your head. Want to try?',
           'What about recording a message for your family? Even if it arrives later, saying it out loud can help.',
           'You could write a few lines in your journal or talk with a crewmate. Which sounds better?']),
    };
  }
  return {
    risk: 'none',
    reply: pick(es
      ? ['Te escucho. Suena a que eso pesa. ¿Quieres contarme un poco más?',
         'Entiendo. Gracias por compartirlo conmigo. Aquí sigo, sin prisa.',
         'Lo que sientes tiene sentido. ¿Qué es lo que más te pesa ahora?']
      : ["I'm listening. That sounds heavy. Do you want to tell me a bit more?",
         "I understand. Thank you for sharing it with me. I'm still here, no rush.",
         'What you feel makes sense. What weighs on you most right now?']),
  };
}
