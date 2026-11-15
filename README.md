# ELOISE · Mission Care System

**NASA Space Apps Challenge 2026 · *Create Health Monitoring Software for Astronauts on Space Missions***
**Team SahuaroSpace** · Hermosillo, Sonora, Mexico — Joana Mariana Miranda Lugo · Dania Paloma Vega Noriega · Jesús Antonio Aguilar Corrales

ELOISE gives every astronaut a **companion that listens** — Luma, Pipo or Nix, each with its own voice, personality and animated expressions — while the system **watches over the body**: radiation dose against the career limit, blood and cabin oxygen, CO2, heart rate, sleep and mood. It alerts the flight surgeon in time, opens a shelter mode during solar storms, and offers validated screening questionnaires (PHQ‑9, GAD‑7) when the conversation suggests low mood or anxiety. Conversations never leave the phone.

| What | Where |
|---|---|
| Crew Android app (Kotlin + Compose Multiplatform): text and live voice chat, check‑in, health, shelter, privacy | [`mobile/`](mobile/) |
| Flight surgeon web dashboard + demo console | [`dashboard/`](dashboard/) |
| Server: AI companion (OpenAI), character voices (ElevenLabs), sensor simulator | [`server/`](server/) |
| Database: Postgres on Supabase, alert/dose/shelter rules and row‑level security | [`supabase/`](supabase/) |
| Specifications (spec‑driven development) and API contract | [`specs/`](specs/README.md) |
| 30‑second video script with English subtitles | [`docs/demo/video-30s.md`](docs/demo/video-30s.md) |

**Quick start:** copy `.env.example` to `.env` and fill in your own keys → `npm install` → `npm start` → open http://localhost:3000. Android: `cd mobile && ./gradlew assembleDebug`. Tests: `npm test`, `npm run test:contract`, `npm run test:app`. Details below (Spanish/English).

> Screening questionnaires are a screening aid, not a diagnosis. Thresholds are reference values to be validated by health professionals.

---

**ES** · Análisis y propuestas para el reto de NASA Space Apps *Create Health Monitoring Software for Astronauts on Space Missions*.
**EN** · Analysis and proposals for the NASA Space Apps challenge *Create Health Monitoring Software for Astronauts on Space Missions*.

Riesgos foco / Focus risks: **cáncer por radiación / radiation-induced cancer** · **aislamiento y confinamiento / isolation & confinement** · **oxígeno (hipoxia) / oxygen (hypoxia)**.

| # | Español | English |
|---|---|---|
| 01 | [Investigación](docs/es/01-investigacion.md) | [Research](docs/en/01-research.md) |
| 02 | [Propuestas (A–J)](docs/es/02-propuestas.md) | [Proposals (A–J)](docs/en/02-proposals.md) |
| 03 | [Combinaciones y factibilidad](docs/es/03-combinaciones-factibilidad.md) | [Combinations & feasibility](docs/en/03-combinations-feasibility.md) |
| 04 | [Asistente que escucha](docs/es/04-asistente.md) | [An assistant that listens](docs/en/04-assistant.md) |
| 05 | **[Concepto final: Eco](docs/es/05-concepto-final.md)** | **[Final concept: Echo](docs/en/05-final-concept.md)** |
| 06 | [Ruta por fases](docs/es/06-ruta-por-fases.md) | [Phased roadmap](docs/en/06-roadmap.md) |
| 07 | [Pantallas](docs/es/07-pantallas.md) | [Screens](docs/en/07-screens.md) |
| 08 | [Arquitectura y base de datos](docs/es/08-arquitectura.md) | [Architecture & database](docs/en/08-architecture.md) |
| 09 | **[Diagrama de la BD por pantalla](docs/es/09-diagrama-bd.md)** | **[Database diagram by screen](docs/en/09-database-diagram.md)** |

**Base de datos / Database:** [supabase/schema.sql](supabase/schema.sql) (tablas, funciones, vistas y RLS / tables, functions, views and RLS) · [supabase/seed_demo.sql](supabase/seed_demo.sql) (datos de prueba / test data). Ejecutar en ese orden en el SQL Editor de Supabase. / Run in that order in the Supabase SQL Editor.

## Diseño / Design: ELOISE · Mission Care System

La app y el dashboard siguen el diseño "Diseñar plataforma espacial Eloise" (Figma Make): fondo azul muy oscuro, acentos cian, paneles con borde fino, pastillas de estado con punto y tarjetas de signos vitales con mini gráfica.
- **Dashboard:** usa la hoja de estilos original del diseño (`dashboard/eloise.css`) con datos reales; `dashboard/dashboard.css` solo ajusta detalles.
- **App:** la misma paleta y componentes en Compose (`ui/Theme.kt`); el asistente es el personaje elegido (Luma, Pipo o Nix) en lugar del orbe.
- Fuente del diseño y capturas: `design/eloise/`.

## Estructura / Structure

| Carpeta / Folder | Qué es / What it is |
|---|---|
| `mobile/` | **App Android de los astronautas** (Kotlin + Compose): Eco por voz y texto, Hoy, Mis datos, Check‑in, Refugio, Privacidad, alerta urgente. / **Crew Android app**. |
| `dashboard/` | **Dashboard web de monitoreo** (médico de vuelo): tripulación, alertas y emergencias, radiación y clima espacial, informe diario, consola de demo. / **Web monitoring dashboard**. |
| `server/` | Servidor local: Eco con OpenAI, simulador de sensores que escribe en Supabase, consola. Las claves secretas viven solo aquí. / Local server: Echo (OpenAI), sensor simulator writing to Supabase, console. |
| `supabase/` | Base de datos: `schema.sql` y `seed_demo.sql`. |
| `prototipo-web/` | Prototipo anterior (todo en el navegador, sin Supabase) en http://localhost:3000/prototipo/ |

```
App Android ──(sesión del tripulante, RLS)──► Supabase ◄──(sesión del médico, RLS)── Dashboard web
     │                                            ▲
     └── /api/eco ──► Servidor ──► OpenAI         └── Simulador (clave secreta, solo en el servidor)
```

## Cómo correrlo / How to run

**1 · Supabase** (una vez / once)
1. Crea un proyecto en Supabase. En el SQL Editor ejecuta `supabase/schema.sql` y luego `supabase/seed_demo.sql`.
2. En *Authentication → Users* crea: `tripulante1@astrohealth.test` … `tripulante4@astrohealth.test`, `medico@astrohealth.test`, `simulador@astrohealth.test`. Vuelve a ejecutar `seed_demo.sql` para enlazarlos.

**2 · `.env`** (copia `.env.example`): `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable), `SUPABASE_SERVICE_ROLE_KEY` (secret, solo servidor).

**3 · Servidor y dashboard** (Node 20+)
```
npm install
npm start
```
Abre http://localhost:3000 y entra como `medico@astrohealth.test`. En **Consola de demo** pulsa ▶ *Iniciar* para que el simulador empiece a generar datos.

**4 · App Android**
- Abre la carpeta `mobile/` en Android Studio y ejecuta en un emulador, o desde la terminal: `mobile/gradlew assembleDebug` → `mobile/composeApp/build/outputs/apk/debug/composeApp-debug.apk`.
- La URL y la clave pública de Supabase se toman del `.env` al compilar (la clave secreta nunca entra a la app).
- Emulador: la app se conecta sola a `http://10.0.2.2:3000` (tu computadora). Celular por USB: ejecuta `adb reverse tcp:3000 tcp:3000` (cada vez que conectes el cable) y la app usa `http://localhost:3000`. Por Wi‑Fi: `HOST=0.0.0.0` en `.env` y en la app (*Ajustes → Servidor*) `http://IP-de-tu-computadora:3000`.
- Entra como `tripulante1@astrohealth.test`.

## Especificaciones / Specs (Spec-Driven Development)

El comportamiento del sistema está definido en [`specs/`](specs/README.md): primero se cambia la spec, luego el código y luego la prueba.

| Qué | Dónde |
|---|---|
| Proceso, índice y matriz de trazabilidad | [`specs/README.md`](specs/README.md) |
| Contrato HTTP del servidor | [`specs/api/openapi.yaml`](specs/api/openapi.yaml) |
| Requisitos con criterios de aceptación | [`specs/features/`](specs/features/) |

```bash
npm test               # lógica del servidor + reglas de la base de datos (PGlite, sin tocar Supabase)
npm run test:contract  # contrato HTTP contra el servidor encendido
npm run test:app       # lógica de la app Kotlin (JVM)
```

## Personajes y voces / Characters and voices

| Personaje | Personalidad | Voz ElevenLabs | Variable en `.env` |
|---|---|---|---|
| **Luma** (verde) | Empática · Contenedora: nombra lo que sientes, da espacio, sin prisa | Matilda | `ELEVENLABS_VOICE_LUMA` |
| **Pipo** (amarillo) | Chistoso · Ligero: humor amable de la vida espacial; sin bromas en crisis o en el refugio | Jessica | `ELEVENLABS_VOICE_PIPO` |
| **Nix** (azul) | Serio · Analítico: conecta lo que sientes con tus datos y propone pasos concretos | Eric | `ELEVENLABS_VOICE_NIX` |

- El tripulante elige su personaje la primera vez (y lo puede cambiar en *Privacidad y ajustes*). La personalidad cambia el estilo de Eco, nunca las reglas de seguridad.
- Voz: la app pide el audio a `/api/tts` del servidor, que llama a ElevenLabs con la clave `ELEVENLABS_API_KEY` (nunca entra a la app). Si falla, usa la voz del sistema.
- Las **alertas urgentes** se leen con la voz del sistema: es inmediata y funciona sin internet.
- Las expresiones (75 PNG) se generan desde `design/personajes/` con `python design/recortar_personajes.py`.

**Memoria y conversación / Memory and conversation:**
- Cada personaje tiene **su propia conversación**, guardada cifrada en el teléfono; al cambiar de personaje se retoma la suya.
- **Memoria a largo plazo:** la IA devuelve hechos breves y duraderos sobre la persona (por ejemplo, "Su perro se llama Rocky."). La app los guarda cifrados en el teléfono, los comparten los tres personajes y se envían en cada mensaje. Se ven y se borran en *Privacidad y ajustes → Lo que recuerdan de ti*. Si se apaga "Recordar nuestras conversaciones", se borran conversaciones y recuerdos.
- **Sin ciclos:** el servidor manda el saludo y las últimas respuestas como contexto. Si una respuesta se parece demasiado a otra reciente o empieza igual, la pide de nuevo una vez. Sin IA, el modo local no repite frases recientes.

**Configurar ElevenLabs:** pon `ELEVENLABS_API_KEY` en `.env` (con el permiso *Text to Speech*). Las tres son voces gratuitas predeterminadas, que funcionan en el plan gratuito. Las voces de la biblioteca pública (como Fernanda, Silvara o Mauricio) requieren un plan de pago para usarse desde la API.

**Guion de demo / Demo script:** Dashboard → Consola → ▶ Iniciar → *Lanzar tormenta solar* → en el celular aparece la alerta y se lee en voz alta → *Ir al refugio* → *Ya llegué al refugio* → hablar con Eco (modo refugio) → en el dashboard se ven el refugio, la dosis y las alertas → *Todo despejado*.

**Concepto actual / Current concept:** Eco / Echo, un asistente a bordo que escucha y conversa, y además vigila la radiación, el oxígeno, el CO2, el pulso, el sueño y el ánimo. Avisa al médico con reglas de privacidad claras. / An onboard assistant that listens and converses, and also monitors radiation, oxygen, CO2, pulse, sleep and mood. It informs the surgeon under clear privacy rules.

> NASA no respalda a entidades que no sean del gobierno de EE. UU. / NASA does not endorse any non-U.S. Government entity.
