# 06 · Dictado por voz dentro de la app — `VOICE`

**Objetivo:** hablar con el personaje sin ventanas del sistema (sin el diálogo de Google), con un panel propio que muestra que se está escuchando.

**Código:** `VoiceInput` en [`platform/Platform.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/platform/Platform.kt), `AndroidVoiceInput` en [`Platform.android.kt`](../../mobile/composeApp/src/androidMain/kotlin/app/astrohealth/eco/platform/Platform.android.kt), `ListeningPanel` en `EcoScreen.kt`.

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| VOICE-01 | El dictado DEBE ocurrir dentro de la app con `SpeechRecognizer`; NO DEBE abrir la actividad de dictado de Google. | 🟢 |
| VOICE-02 | DEBE usarse el reconocimiento **en el dispositivo** cuando exista (funciona sin internet, como en la nave); si ese idioma no está instalado, DEBE caer al reconocimiento normal sin que la persona lo note. | 🟢 |
| VOICE-03 | La primera vez DEBE pedirse el permiso de micrófono; si se niega, DEBE explicarse cómo activarlo ("Para hablar con {nombre} por voz, permite el uso del micrófono"). | 🟢 |
| VOICE-04 | Mientras escucha, DEBE mostrarse: transcripción en vivo, barras que siguen el volumen, botón **✕ cancelar** (no envía nada) y botón **✓ terminar y enviar**. | 🟢 |
| VOICE-05 | Si no se entendió nada, DEBE mostrarse "No alcancé a escucharte…"; si se alcanzó a reconocer algo antes del error, DEBE enviarse lo reconocido. | 🟢 |
| VOICE-06 | Idioma del dictado = idioma de la app (`es-MX` / `en-US`). | 🟢 |

## Verificación manual

En un teléfono real: tocar 🎤 en el chat → aparece el panel (no la ventana de Google) → hablar → ver el texto en vivo → ✓ → el mensaje se envía marcado "por voz". En el emulador se verificó el panel y el cambio automático al reconocimiento normal (error 12 del reconocimiento en el dispositivo).
