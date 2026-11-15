// Voz: reconocimiento (voz → texto) y síntesis (texto → voz) del navegador.
// ⚠️ En Chrome y Edge el reconocimiento de voz usa un servicio en línea del navegador.
//    En la nave real se usaría un modelo de voz local (fase 9).
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const canListen = Boolean(Recognition);
export const canSpeak = 'speechSynthesis' in window;

let recognizer = null;
const locale = (lang) => (lang === 'en' ? 'en-US' : 'es-MX');

export function listen({ lang, onInterim, onFinal, onEnd, onError }) {
  if (!Recognition) {
    onError?.('unsupported');
    return;
  }
  stopListening();
  stopSpeaking();
  const rec = new Recognition();
  recognizer = rec;
  rec.lang = locale(lang);
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  rec.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const r = event.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onInterim?.((finalText + ' ' + interim).trim());
  };
  rec.onerror = (event) => onError?.(event.error);
  rec.onend = () => {
    if (recognizer === rec) recognizer = null;
    onEnd?.();
    const text = finalText.trim();
    if (text) onFinal?.(text);
  };
  try {
    rec.start();
  } catch (err) {
    recognizer = null;
    onError?.(err?.name || 'start_failed');
  }
}

export function stopListening() {
  if (recognizer) {
    try { recognizer.stop(); } catch { /* ya detenido */ }
  }
}

export const isListening = () => Boolean(recognizer);

export function speak(text, { lang, rate = 1 } = {}) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale(lang);
  u.rate = rate;
  const prefix = lang === 'en' ? 'en' : 'es';
  const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(prefix));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}

// Algunos navegadores cargan las voces tarde
if (canSpeak) speechSynthesis.onvoiceschanged = () => {};
