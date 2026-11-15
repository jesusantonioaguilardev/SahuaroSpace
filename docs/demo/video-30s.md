# ELOISE · Video demo de 30 segundos

Requisitos de NASA Space Apps (Project Submission Guide):

- **30 segundos o menos.**
- Alojado en un sitio externo con enlace público (YouTube, Google Drive…).
- Se puede hablar en español, pero **con subtítulos en inglés obligatorios**.
- Se evalúa por **Impacto, Creatividad, Validez, Relevancia y Presentación**.

Alternativa: la presentación de 7 diapositivas en inglés (ver "Demo deck" abajo).

## Antes de grabar (lista de preparación)

1. Servidor encendido: `npm start` (el teléfono necesita `adb reverse tcp:3000 tcp:3000`).
2. App en **inglés** para que pantalla y subtítulos coincidan: *Settings → Language → English*.
3. *Health → Questionnaires → Delete questionnaire history* para que la oferta del cuestionario aparezca (INST-13).
4. Personaje: **Luma** (la oferta y la voz se ven y escuchan más claras).
5. Grabar pantalla del teléfono con audio del sistema; volumen al máximo.
6. Probar una vez la frase del paso 0:12 para confirmar que aparece la oferta del GAD.
7. **Marca de agua obligatoria (regla SI):** al editar, deja visible durante todo el video el texto "AI-generated character art · edited by SahuaroSpace" (por ejemplo, abajo a la derecha). Los personajes se hicieron con IA y la voz de los personajes es sintética (ElevenLabs); menciónalo en la descripción del video.

## Guion (tomas, voz y subtítulos)

| Tiempo | Toma (pantalla) | Voz en off (español) | Subtítulo (English) |
|---|---|---|---|
| 0:00–0:04 | Hoy con Luma saludando · logo ELOISE | Rumbo a Marte, la radiación y el aislamiento viajan con la tripulación. | On the way to Mars, radiation and isolation travel with the crew. |
| 0:04–0:09 | Tocar **Talk to Luma** → modo En vivo, Luma saluda con su voz | ELOISE le da a cada astronauta un compañero que escucha. | ELOISE gives every astronaut a companion that listens. |
| 0:09–0:15 | Chat: escribir *"I've been so anxious lately, I can't relax"* → respuesta + tarjeta de oferta | Si detecta ansiedad o ánimo bajo, ofrece un cuestionario clínico validado. | If it detects anxiety or low mood, it offers a validated clinical screening. |
| 0:15–0:21 | **Yes, let's go** → pregunta GAD‑2 con 4 botones → resultado | Se responde con un toque; la puntuación la calcula el código, no la IA. | One tap per answer; the score is computed by code, not by the AI. |
| 0:21–0:26 | Pantalla **Today**: radiación acumulada y oxígeno de cabina (o panel del médico) | Además vigila radiación y oxígeno, y alerta al médico de vuelo a tiempo. | It also watches radiation and oxygen, and alerts the flight surgeon in time. |
| 0:26–0:30 | Luma despidiéndose · texto final "ELOISE · Mission Care System" | Nadie debería cruzar el espacio sintiéndose solo. | No one should cross space feeling alone. |

**Duración de la voz:** unas 70 palabras, cabe en 30 s a ritmo tranquilo. Si sobra tiempo, quita la toma de 0:21.

## Archivo de subtítulos (SRT)

Guárdalo como `eloise-demo.en.srt` y súbelo junto al video en YouTube:

```
1
00:00:00,000 --> 00:00:04,000
On the way to Mars, radiation and isolation travel with the crew.

2
00:00:04,000 --> 00:00:09,000
ELOISE gives every astronaut a companion that listens.

3
00:00:09,000 --> 00:00:15,000
If it detects anxiety or low mood, it offers a validated clinical screening.

4
00:00:15,000 --> 00:00:21,000
One tap per answer; the score is computed by code, not by the AI.

5
00:00:21,000 --> 00:00:26,000
It also watches radiation and oxygen, and alerts the flight surgeon in time.

6
00:00:26,000 --> 00:00:30,000
No one should cross space feeling alone.
```

## Demo deck (alternativa de 7 diapositivas, en inglés)

| # | Diapositiva | Criterio |
|---|---|---|
| 1 | Título: ELOISE · Mission Care System | — |
| 2 | El problema: radiación + aislamiento, y dónde se cruzan | Relevance |
| 3 | La solución: 4 módulos y 3 personajes | Creativity |
| 4 | Demo: capturas reales de la app en inglés | Presentation |
| 5 | Validez: PHQ‑9/GAD‑7, protocolo de seguridad, pruebas | Validity |
| 6 | Privacidad y vista del médico | Impact |
| 7 | Impacto y siguientes pasos | Impact |

Equipo **SahuaroSpace** · Hermosillo, Sonora, México. Falta el enlace al repositorio (diapositiva 7).
