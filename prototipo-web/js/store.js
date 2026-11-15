// Almacén privado del dispositivo (prototipo).
// Conversaciones, check-ins y ajustes se guardan SOLO en este navegador.
// ⚠️ Pendiente para la fase siguiente: cifrarlo con Web Crypto (AES-GCM) como dice el documento 08.
const PREFIX = 'astrohealth:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch { /* almacenamiento no disponible: la demo sigue en memoria */ }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch { /* nada */ }
}
