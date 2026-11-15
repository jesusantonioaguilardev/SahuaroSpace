# 03 · Modo en vivo con sprites — `LIVE`

**Objetivo:** una conversación por voz casi en tiempo real, con el personaje animado (24 poses por personaje) que escucha, piensa, habla y reacciona con emociones.

**Código:** [`ui/LiveScreen.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/LiveScreen.kt), [`ui/LiveSprites.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/LiveSprites.kt), `AppModel.openLive / liveSend / speakLive`, `POST /api/live`. **Sprites:** [`design/sprites/preparar_sprites.py`](../../design/sprites/preparar_sprites.py).

## Estados

```
Saludo ──(termina de hablar)──▶ Escuchando ──(pausa o ✓)──▶ Pensando ──(respuesta)──▶ Hablando
   ▲                                │  no se oyó nada                                      │
   │                                ▼                                                      │
   └──────────────────────────── Esperando ◀──────────────(termina de hablar)──────────────┘
                                 (toca 🎤)                (vuelve a Escuchando solo)
```

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| LIVE-01 | El modo en vivo DEBE abrirse desde "Hablar con …" en Hoy y desde el botón de ondas en el chat, a pantalla completa y con fondo opaco. | 🟢 |
| LIVE-02 | Al abrir, el personaje DEBE saludar con su voz (pose de saludo) y después empezar a escuchar sin que la persona toque nada. | 🟢 |
| LIVE-03 | Tras cada respuesta hablada, la app DEBE volver a escuchar automáticamente, excepto si hay un aviso de riesgo (SAFE) o una alerta urgente abiertos. | 🟢 |
| LIVE-04 | Cada turno DEBE resolverse en **una sola llamada** que trae respuesta, emoción y voz (objetivo: ≤ 3 s en red local). Si la voz falla, DEBE llegar la respuesta igual y usarse la voz del sistema. | 🟢 |
| LIVE-05 | En vivo, las respuestas DEBEN ser de 1–2 frases (< 30 palabras). | 🟢 |
| LIVE-06 | La persona DEBE poder **interrumpir** al personaje tocándolo o con el botón ■; la voz se detiene y empieza a escuchar. | 🟢 |
| LIVE-07 | Si no se escuchó nada, el ciclo DEBE pausarse con el mensaje "No te escuché…" y NO DEBE quedarse escuchando sin fin. | 🟢 |
| LIVE-08 | Animación: al **escuchar**, pose de escucha que crece con el volumen; al **pensar**, pose pensativa con balanceo; al **hablar**, pose de la emoción intercalada con cuadros de boca abierta (≈ 420 ms / 220 ms); en **espera** larga (9 s), una pose de su personalidad. Las poses DEBEN precargarse para no parpadear. | 🟢 |
| LIVE-09 | Los subtítulos DEBEN mostrar lo que la persona dice en vivo y la respuesta del personaje. Lo dicho DEBE guardarse en la conversación del personaje (CHAT-05) y alimentar la memoria (MEM). | 🟢 |
| LIVE-10 | **Toda emoción** que puede devolver el servidor (`Emotion` en OpenAPI) DEBE tener una pose en los tres personajes, y todo cuadro DEBE estar entre 1 y 24. | ✅ |
| LIVE-11 | El botón atrás del sistema y la ✕ DEBEN cerrar el modo y detener voz y micrófono. | 🟢 |

## Criterios de aceptación

- **LIVE-02/03** — *Dado* que abro el modo en vivo, *cuando* Luma termina de saludar, *entonces* el estado cambia a "Luma te escucha…" sin tocar nada. *(Verificado en teléfono 2026‑11‑15.)*
- **LIVE-07** — *Dado* que nadie habla, *cuando* el reconocimiento termina, *entonces* aparece "No te escuché…" y el botón vuelve a 🎤. *(Verificado.)*
- **LIVE-06** — *Dado* que Pipo está hablando, *cuando* toco a Pipo, *entonces* se calla y pasa a "Pipo te escucha…". *(Pendiente de verificar con voz real.)*
- **LIVE-10** — prueba automática.

## Pruebas automáticas

- `LiveSpritesTest.kt` → LIVE-10 (lado app).
- `server/test/eco.test.mjs` → la lista de emociones del servidor coincide con la que entiende la app (LIVE-10, lado contrato).
