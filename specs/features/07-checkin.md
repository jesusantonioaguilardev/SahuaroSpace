# 07 · Check‑in diario — `CHK`

**Objetivo:** registrar en menos de un minuto ánimo, estrés, energía y síntomas, con opciones claras que no se respondan solas.

**Código:** `CheckInScreen` en [`ui/DataScreens.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/ui/DataScreens.kt), `AppModel.saveCheckIn`, `Repository.reportSymptoms / shareTrend`.

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| CHK-01 | Tres preguntas (ánimo, estrés, energía), cada una con 5 opciones con icono **y palabra** (Muy mal…Muy bien; Nada…Mucho; Agotado…Llena). Ninguna opción DEBE venir preseleccionada. | 🟢 |
| CHK-02 | La opción elegida DEBE distinguirse por relleno, borde grueso y su nombre junto a la pregunta (no solo por color). | 🟢 |
| CHK-03 | En estrés, "Nada" DEBE mostrar la cara tranquila y "Mucho" la tensa (escala invertida). | 🟢 |
| CHK-04 | Síntomas opcionales y múltiples, con la opción explícita "Ninguno" (excluyente con los demás). | 🟢 |
| CHK-05 | El botón Guardar DEBE estar siempre visible y desactivado hasta responder las 3 preguntas, explicando por qué ("Responde las 3 preguntas para guardar"); un contador muestra "n de 3". | 🟢 |
| CHK-06 | Al guardar: el check‑in completo (con nota) DEBE quedarse cifrado en el teléfono; **solo los síntomas físicos** se envían al médico; el promedio de ánimo/estrés/energía del día solo se comparte con permiso (PRIV-03). La nota NUNCA sale del teléfono. | 🟢 |

## Criterios de aceptación

- **CHK-01/05** — *Dado* que abro el check‑in, *entonces* el contador dice "0 de 3" y Guardar está desactivado; *cuando* respondo las tres, *entonces* dice "3 de 3" y Guardar se activa. *(Verificado en teléfono 2026‑11‑14.)*
- **CHK-04** — *Dado* que marqué "Dolor de cabeza", *cuando* marco "Ninguno", *entonces* se desmarca "Dolor de cabeza".
