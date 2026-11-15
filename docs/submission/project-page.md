# Space Apps 2026 · Project page (copy & paste)

Team **SahuaroSpace** · Challenge: *Create Health Monitoring Software for Astronauts on Space Missions*.
Every field must be in English. Deadline: **Sunday, November 15, 11:59 p.m. (local event time)**.

---

## Project Name

ELOISE · Mission Care System

## High-Level Project Summary

ELOISE is a mission care system that gives every astronaut a companion that listens and a system that watches over their body during long missions to the Moon and Mars. Each crew member chooses a character (Luma, Pipo or Nix) to talk to by text or live voice; the companion listens without judging, remembers what matters to them and, when the conversation suggests low mood or anxiety, offers validated screening questionnaires (PHQ-9, GAD-7). At the same time, ELOISE monitors radiation dose against the career limit, blood and cabin oxygen, CO2, heart rate, sleep and mood, raises alerts by urgency, opens a shelter mode during solar storms and keeps the flight surgeon informed through a live dashboard. It addresses two of NASA's biggest human-spaceflight hazards, radiation and isolation, which meet in the storm shelter. Conversations never leave the astronaut's phone: privacy is what makes a companion trustworthy instead of a watchdog.

## Link to Project Demo

7-slide presentation (PDF): https://github.com/jesusantonioaguilardev/SahuaroSpace/blob/main/docs/demo/ELOISE-demo-deck.pdf

## Link to Final Project

https://github.com/jesusantonioaguilardev/SahuaroSpace

## Detailed Project Description

**What it does**

- **Companion that listens.** Each astronaut chooses Luma (empathetic), Pipo (funny) or Nix (analytical). Each has its own voice, personality and 24 animated poses. The default mode only listens; companion mode talks back and suggests countermeasures NASA already uses (rest, a window, plants, a message home).
- **Live voice mode.** A near-real-time spoken conversation: the character listens, thinks, answers with its own voice and animated expressions chosen by the AI, then listens again on its own. The astronaut can interrupt at any time.
- **Long-term memory.** The companion remembers durable facts ("helps to listen to jazz before sleeping"), shared by the three characters, encrypted on the phone, visible and deletable by the astronaut.
- **Validated screening.** When the conversation suggests low mood or anxiety, the character offers (never forces) PHQ-2/PHQ-9 or GAD-2/GAD-7 with one-tap buttons. Questions are shown word for word and scoring uses the published cut-offs in code, never the AI. A positive answer on PHQ-9 item 9 starts the safety protocol.
- **Safety protocol.** Self-harm or acute-panic signals (from the AI, local keyword detection or item 9) trigger an offer to alert the flight surgeon; only the type and time are sent, and only after the astronaut confirms.
- **Health and radiation monitoring.** Radiation dose (daily, mission and career against the 600 mSv limit), SpO2, cabin O2, CO2 and pressure, heart and breathing rate, sleep, and a one-minute daily check-in of mood, stress, energy and symptoms.
- **Alerts and shelter mode.** Three alert levels with automatic escalation, de-duplication and auto-resolution. A solar storm of S3 or higher opens a shelter session in the most shielded zone, assigns the crew and pauses radiation alarms that the storm alert already covers.
- **Flight surgeon dashboard.** The whole crew in real time, alerts, radiation and space weather, a daily report for Earth, and a demo console that simulates sensors, solar storms and failures.

**How it works**

Android app (Kotlin + Compose Multiplatform) ↔ Supabase (Postgres with row-level security, triggers for alerts, dose and shelter) ↔ web dashboard. A Node.js server keeps all secret keys, runs the AI companion (OpenAI model with a strict JSON output: reply, risk, emotion, new memories and suggested questionnaire), the character voices (ElevenLabs) and the sensor simulator. On-device speech recognition is used when available. Without the AI, the app answers in a basic local mode. A future spacecraft version would run speech and language models on board, without internet.

**Privacy by design**

Physical safety data (radiation, oxygen, CO2, alerts) is always shared with the surgeon; mood and sleep trends only with permission, revocable at any time; conversations, memory and questionnaire answers never leave the phone.

**Benefits**

Lower radiation exposure through timely shelter alerts and dose tracking; earlier detection of mood, anxiety and sleep problems; a companion available when Earth is minutes away; and trust, because the astronaut controls what is shared.

**What we hope to achieve**

Test ELOISE in an analog mission (HERA or CHAPEA), move the AI and voice models on board, add per-zone dose maps, and have clinicians validate the screening protocol and thresholds.

**Tools and languages**

Kotlin, Compose Multiplatform, Ktor, kotlinx.serialization, Android SpeechRecognizer and Keystore (AES-GCM); JavaScript (Node.js) server; HTML/CSS/JavaScript dashboard; Supabase (Postgres, Auth, Realtime, RLS); OpenAI API; ElevenLabs text-to-speech; PGlite and node:test for database and server tests; Gradle. The project follows spec-driven development: 11 specifications, an OpenAPI contract and 60 automated tests.

## Use of Super Intelligence (SI)

Yes. (1) An AI coding assistant (Anthropic Claude) helped us summarize NASA research pages, write documentation and specifications, and write and test code; the project concept and design decisions were made by the team. (2) At runtime, an OpenAI language model generates the companion's replies, and ElevenLabs generates the characters' voices (synthetic audio, acknowledged in the app and in the repository README). (3) The character artwork (Luma, Pipo and Nix) was generated with an AI image tool and then edited by the team; every image, slide and video that shows the characters carries a visible "AI-generated character art · edited by SahuaroSpace" watermark, and the app shows the same note. AI use is acknowledged in the repository README and LICENSE.

## NASA Data

We used NASA Human Research Program evidence and standards to define the risks, thresholds and countermeasures:
- NASA, 5 Hazards of Human Spaceflight (RIDGE): https://www.nasa.gov/hrp/hazards/
- NASA HRP, Risk of Radiation-Induced Cancers: https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/
- NASA HRP, Risk of Hypoxia: https://www.nasa.gov/reference/risk-of-hypoxia/
- NASA HRP, Risk of Behavioral Conditions and Psychiatric Disorders: https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/
- NASA HRP, Risk of Inadequate Teamwork: https://www.nasa.gov/reference/risk-of-inadequate-teamwork/
- NASA HRP, Risk from Inadequate Sleep and Irregular Schedules: https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/
- NASA-STD-3001 reference values (600 mSv career limit; cabin atmosphere references) used for alert thresholds.
- NASA analog studies HERA and CHAPEA, proposed for future testing.

## Space Agency Partner Data and Other References

- CSA (Canadian Space Agency), Monitoring radiation for astronaut health (neutron contribution, continuous dosimetry): https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp
- NOAA SWPC space weather scales (S-scale used for the shelter trigger): https://www.swpc.noaa.gov/noaa-scales-explanation
- PHQ-9 and GAD-7 questionnaires © Spitzer, Williams, Kroenke and colleagues (free to reproduce and display): https://www.phqscreeners.com
- OpenAI API (language model), ElevenLabs (text-to-speech, free premade voices Matilda, Jessica and Eric).
- Supabase, supabase-js, openai (Node SDK), Ktor, kotlinx libraries, Compose Multiplatform, Material Icons, PGlite.
- Google Fonts: Space Grotesk and Inter (presentation).
- Character artwork (Luma, Pipo, Nix): generated with an AI image tool and edited by the team (watermarked).
- Source code: MIT License. All sensor data in the demo is simulated.
