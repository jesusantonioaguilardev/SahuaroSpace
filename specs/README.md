# Especificaciones de ELOISE (Spec-Driven Development)

> **Regla del proyecto:** la especificación es la fuente de verdad. Primero se cambia la spec, después el código, y al final la prueba que demuestra que el código cumple la spec.

## Cómo trabajamos

```
1. Spec  →  2. Revisión  →  3. Código  →  4. Prueba  →  5. Trazabilidad
```

1. **Spec.** Escribe o modifica el requisito en `specs/` antes de tocar código. Cada requisito tiene un ID (`CHAT-03`), usa **DEBE** / **NO DEBE** / **PUEDE**, y trae criterios de aceptación en formato *Dado / Cuando / Entonces*.
2. **Revisión.** Si el cambio afecta a otra pieza (app ↔ servidor ↔ base de datos ↔ panel), se actualiza también su contrato: [`api/openapi.yaml`](api/openapi.yaml) o [`features/09-base-de-datos.md`](features/09-base-de-datos.md).
3. **Código.** Se implementa citando el ID en un comentario cuando la regla no es obvia (`// CHAT-07`).
4. **Prueba.** Cada criterio verificable automáticamente tiene una prueba que lleva el ID en su nombre (`CHAT-07: …`). Lo que solo se puede comprobar a mano (voz, animación) queda marcado como **manual** con los pasos para verificarlo.
5. **Trazabilidad.** Se actualiza la tabla de abajo: estado, código y prueba.

**Cambiar un comportamiento sin cambiar la spec es un error**, aunque el código funcione.

### Estados de un requisito

| Estado | Significado |
|---|---|
| ✅ Verificado | Implementado y con prueba automática que pasa |
| 🟢 Implementado | Implementado; verificación manual descrita |
| 🟡 Parcial | Implementado en parte; la spec dice qué falta |
| ⚪ Pendiente | Especificado, aún no implementado |

### Cómo correr las pruebas

```bash
npm test                    # servidor (lógica) + base de datos (PGlite, sin tocar Supabase)
npm run test:contract       # contrato HTTP contra el servidor encendido (npm start)
npm run test:app            # app Kotlin (lógica común, en la JVM)
```

## Índice

| Spec | Qué cubre | IDs |
|---|---|---|
| [api/openapi.yaml](api/openapi.yaml) | Contrato HTTP del servidor (`/api/*`) | API |
| [01-conversacion.md](features/01-conversacion.md) | Chat por texto y voz, modos, historial por personaje, sin ciclos, modo local | CHAT |
| [02-memoria.md](features/02-memoria.md) | Memoria a largo plazo compartida entre personajes | MEM |
| [03-en-vivo.md](features/03-en-vivo.md) | Conversación por voz casi en tiempo real con sprites | LIVE |
| [04-personajes.md](features/04-personajes.md) | Luma, Pipo y Nix: personalidad, voz, emociones y poses | CHAR |
| [05-seguridad.md](features/05-seguridad.md) | Detección de riesgo y aviso al médico con permiso | SAFE |
| [06-dictado.md](features/06-dictado.md) | Dictado por voz dentro de la app | VOICE |
| [07-checkin.md](features/07-checkin.md) | Check‑in diario de ánimo, estrés, energía y síntomas | CHK |
| [08-privacidad.md](features/08-privacidad.md) | Qué se guarda, qué se comparte y con quién | PRIV |
| [09-base-de-datos.md](features/09-base-de-datos.md) | Umbrales, alertas, dosis, refugio y permisos en Postgres | DB |
| [10-panel-medico.md](features/10-panel-medico.md) | Panel web del médico y consola de simulación | DASH |
| [11-instrumentos.md](features/11-instrumentos.md) | Cuestionarios PHQ‑9 y GAD‑7 con botones, detonados por la conversación | INST |

Documentos de diseño previos (contexto, no contrato): [`docs/es/`](../docs/es/).

## Matriz de trazabilidad

| ID | Requisito (resumen) | Estado | Código | Prueba |
|---|---|---|---|---|
| API-01 | Rutas, métodos y códigos de error del servidor | ✅ | `server/server.mjs` | `server/test/contract.test.mjs` |
| API-02 | Validación y recorte de la petición de chat | ✅ | `server/eco.mjs` `normalizeEcoRequest` | `server/test/eco.test.mjs` |
| CHAT-01..04 | Modos escucha / compañero / refugio, texto y voz | 🟢 | `ui/EcoScreen.kt`, `server/eco.mjs` | manual |
| CHAT-05 | Historial separado por personaje | 🟢 | `data/PrivateData.kt`, `AppModel.kt` | manual |
| CHAT-06 | No volver a presentarse (saludo en el historial) | 🟢 | `AppModel.greeting`, `server/eco.mjs` | manual |
| CHAT-07 | Filtro de repeticiones en el servidor | ✅ | `server/eco.mjs` `repeats` | `server/test/eco.test.mjs` |
| CHAT-08 | Modo local sin IA que no repite frases recientes | ✅ | `data/LocalEco.kt` | `LocalEcoTest.kt` |
| MEM-01..06 | Memoria a largo plazo | 🟢 | `PrivateData.kt`, `AppModel.remember`, `server/eco.mjs` | manual + `eco.test.mjs` (normalización) |
| LIVE-01..09 | Modo en vivo | 🟢 | `ui/LiveScreen.kt`, `AppModel.liveSend`, `server.mjs` `/api/live` | manual |
| LIVE-10 | Toda emoción del servidor tiene pose | ✅ | `ui/LiveSprites.kt` | `LiveSpritesTest.kt`, `server/test/eco.test.mjs` |
| CHAR-01..05 | Personalidad, voz y fallback de voz | 🟢 | `server/eco.mjs`, `server/voice.mjs` | manual |
| SAFE-01 | Detección local de riesgo (red de seguridad) | ✅ | `data/LocalEco.kt` `detectRisk` | `LocalEcoTest.kt` |
| SAFE-02..05 | Aviso al médico con confirmación | 🟢 | `AppModel.confirmEscalation`, `App.kt` | manual |
| VOICE-01..06 | Dictado dentro de la app | 🟢 | `platform/Platform.android.kt` | manual |
| CHK-01..06 | Check‑in | 🟢 | `ui/DataScreens.kt` | manual |
| PRIV-01..06 | Privacidad | 🟢 | varios | `supabase/test/schema.test.mjs` (PRIV-05) |
| PRIV-07 | Sin el nombre provisional "Eco" en textos ni en la IA | ✅ | `Strings.kt`, `server/eco.mjs` | `StringsTest.kt`, `server/test/eco.test.mjs` |
| DB-01..09 | Reglas en la base de datos | ✅ | `supabase/schema.sql` | `supabase/test/schema.test.mjs` |
| DASH-01..06 | Panel y consola | 🟢 | `dashboard/`, `server.mjs` `/api/sim` | manual + contrato (DASH-05) |
| INST-01,02,04,05,07,08 | Texto fijo, detonador, frecuencia, escalonado, puntuación, pregunta 9 → SAFE | ✅ | `data/Instruments.kt`, `server/eco.mjs` | `InstrumentsTest.kt`, `server/test/eco.test.mjs` |
| INST-03,06,09,10,11,13 | Oferta, botones, resultado, historial, modo en vivo, borrar historial | 🟢 | `ui/InstrumentScreen.kt`, `AppModel.kt` | manual |
| INST-12 | Compartir puntaje con permiso | ⚪ | — | — |
