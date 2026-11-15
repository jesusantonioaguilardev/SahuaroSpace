# 08 · Privacidad — `PRIV`

**Objetivo:** un compañero, no un vigilante. La persona sabe desde el primer día qué se comparte, con quién y por qué, y controla lo emocional.

**Código:** pantallas T1 y T8 (`StartScreens.kt`, `ShelterPrivacy.kt`), [`data/PrivateData.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/data/PrivateData.kt), políticas RLS y triggers de [`supabase/schema.sql`](../../supabase/schema.sql), [`server/config.mjs`](../../server/config.mjs).

## Reglas de datos

| Dato | Dónde vive | ¿Lo ve el médico? |
|---|---|---|
| Radiación, SpO2, O2/CO2/presión de cabina, alertas | Supabase | **Sí, siempre** (datos operativos) |
| Tendencia diaria de ánimo / sueño | Supabase | **Solo con permiso** |
| Síntomas físicos del check‑in | Supabase | Sí |
| Conversaciones, memoria, check‑in completo y nota | Teléfono, cifrado | **Nunca** |
| Aviso de emergencia (SAFE) | Supabase | Sí: solo tipo y hora, con confirmación |

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| PRIV-01 | Las reglas de la tabla DEBEN mostrarse y aceptarse en la bienvenida (T1) y verse siempre en Privacidad (T8). | 🟢 |
| PRIV-02 | Conversaciones, memoria, check‑ins y ajustes DEBEN guardarse cifrados (Android Keystore, AES‑GCM) y solo en el teléfono. | 🟢 |
| PRIV-03 | Compartir ánimo y sueño DEBEN ser permisos separados, apagados por defecto y revocables en cualquier momento. | 🟢 |
| PRIV-04 | La persona DEBE ver qué vio el médico y cuándo (registro de accesos). | 🟢 |
| PRIV-05 | La base de datos DEBE impedir guardar una tendencia sin permiso, y al revocar un permiso DEBE borrar lo ya compartido de ese tipo (ver DB-07, DB-08). | ✅ |
| PRIV-06 | Las claves de OpenAI, ElevenLabs y la clave secreta de Supabase DEBEN vivir solo en el servidor; la app y el panel solo reciben la clave pública. | 🟢 |
| PRIV-07 | Ningún texto visible (app en español e inglés, ni la forma en que la IA se presenta) DEBE usar el nombre provisional "Eco"/"Echo". Se nombra al **personaje elegido** cuando el texto es suyo, a **"tu compañero"** cuando aún no se eligió (reglas de T1), y a **ELOISE** cuando habla el sistema. | ✅ |

### Textos de PRIV-07

| Clave | Español | English |
|---|---|---|
| `rule3` | Lo que hablas con tu compañero nunca se comparte. Se queda cifrado en este dispositivo. | What you tell your companion is never shared. It stays encrypted on this device. |
| `rule_emergency` | Protocolo de emergencia: si tu compañero detecta un riesgo grave para ti, te lo dirá con claridad y te ofrecerá avisar al médico o a alguien de la tripulación. Tú decides. | Emergency protocol: if your companion detects a serious risk to you, they will say so clearly and offer to alert the surgeon or a crewmate. You decide. |
| `voice_replies` | Quiero que mi compañero responda en voz alta | I want my companion to reply out loud |
| `write_to_eco` | Escribe a {name}… | Write to {name}… |
| `esc_title` | {name} se preocupa por ti | {name} is worried about you |
| `rad_ok` | Vas dentro de lo planeado. ELOISE te avisará si algo cambia. | You're on plan. ELOISE will tell you if anything changes. |
| `voice` | {name} responde en voz alta | {name} replies out loud |
| `server` | Servidor de ELOISE | ELOISE server |
| `nav_eco`, `talk`, `thinking`, `llm_mode` | *(se eliminan: ya no se usan)* | |

La IA DEBE presentarse como el personaje dentro de ELOISE (CHAR-06), nunca como "Eco".

## Pruebas automáticas

- `supabase/test/schema.test.mjs` → PRIV-05.
- `StringsTest.kt` → PRIV-07 (ningún texto de la app dice "Eco"/"Echo"; los textos con `{name}` lo reciben).
- `server/test/eco.test.mjs` → PRIV-07 / CHAR-06 (las instrucciones de la IA no la llaman "Eco").
