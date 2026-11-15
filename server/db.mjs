// Cliente de Supabase del servidor (clave secreta: salta las reglas de acceso).
// Solo lo usan el simulador y la verificación de usuarios. Nunca se envía al navegador ni a la app.
import { createClient } from '@supabase/supabase-js';
import { config, hasSupabase } from './config.mjs';

export const admin = hasSupabase
  ? createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

// Verifica el token de sesión que manda la app o el dashboard y devuelve su usuario de la app
export async function userFromRequest(req) {
  if (!admin) return null;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: appUser } = await admin.from('app_users').select('*').eq('id', data.user.id).maybeSingle();
  return appUser || null;
}

// Lanza un error si la consulta de Supabase falló
export function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}
