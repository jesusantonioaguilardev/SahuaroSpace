# 04 · Personajes — `CHAR`

**Objetivo:** que cada tripulante elija quién lo acompaña, y que cada personaje se sienta distinto en lo que dice, cómo suena y cómo se mueve, sin cambiar nunca las reglas de seguridad.

**Código:** `PERSONAS` en [`server/eco.mjs`](../../server/eco.mjs), `VOICE_SETTINGS` en [`server/voice.mjs`](../../server/voice.mjs), [`ui/Characters.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/Characters.kt), [`ui/LiveSprites.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/LiveSprites.kt), frases locales en [`data/LocalEco.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/data/LocalEco.kt).

| | Luma | Pipo | Nix |
|---|---|---|---|
| Personalidad | Empática · contenedora | Chistoso · ligero | Serio · analítico |
| Cómo habla | Lento, cálido; nombra lo que sientes; "aquí no hay prisa" | Rápido, informal; humor amable de la vida espacial; luego vuelve a ti | Preciso, por pasos; conecta con tus datos; un paso concreto |
| Voz (ElevenLabs) | Matilda | Jessica | Eric |
| Emociones preferidas | love, calm, happy | laugh, wink, celebrate | thinking, idea, encourage |
| Pose al escuchar | audífonos (10) | audífonos (11) | tableta (3) |

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| CHAR-01 | La persona DEBE elegir su personaje la primera vez y PUEDE cambiarlo en Ajustes. | 🟢 |
| CHAR-02 | Cada personaje DEBE responder con su estilo (tabla de arriba). Las **reglas de seguridad mandan sobre el estilo**: Pipo NO DEBE bromear si la persona está triste, con miedo, con dolor, en el refugio o si hay riesgo. | 🟢 |
| CHAR-03 | Cada personaje DEBE tener **su propia voz**. Si la voz de ElevenLabs no está disponible, DEBE usarse la voz del sistema (nunca quedarse en silencio). | 🟢 |
| CHAR-04 | Sin IA, cada personaje DEBE responder con frases propias de su personalidad (CHAT-08). | ✅ |
| CHAR-05 | La IA DEBE elegir una emoción por respuesta según lo que dice y el personaje, y NO DEBE elegir `laugh` si hay riesgo. La app DEBE mostrar `worried` si hay riesgo, sin importar la emoción. | 🟢 |
| CHAR-06 | Si preguntan quién es, el personaje DEBE decir su nombre; la plataforma se llama ELOISE. | 🟢 |

## Pruebas automáticas

- `LocalEcoTest.kt` → CHAR-04 (cada personaje responde con su propio repertorio).
- `LiveSpritesTest.kt` → mapa emoción → pose de los tres personajes.
