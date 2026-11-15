# 05 · Seguridad emocional y aviso al médico — `SAFE`

**Objetivo:** si la persona expresa riesgo grave, el personaje responde con cuidado y ofrece avisar al médico de vuelo o a un compañero; **la persona decide**.

**Código:** `INSTRUCTIONS` (Safety) en [`server/eco.mjs`](../../server/eco.mjs), `LocalEco.detectRisk`, `EcoClient.ask` (red de seguridad), `AppModel.confirmEscalation`, diálogo en `App.kt`, `Repository.escalate`.

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| SAFE-01 | La app DEBE detectar por sí misma (sin IA) frases claras de **autolesión** ("no quiero vivir", "quitarme la vida", "hacerme daño", "suicid…", "kill myself"…) y de **pánico agudo** ("no puedo respirar", "ataque de pánico", "me ahogo"…), en español e inglés. Si la IA no marcó riesgo pero la frase lo muestra, la app DEBE marcarlo igual. | ✅ |
| SAFE-02 | Con riesgo, la respuesta DEBE decir con claridad que el personaje está preocupado, quedarse con la persona y ofrecer avisar al médico o a un compañero. NO DEBE minimizar. | 🟢 |
| SAFE-03 | La app DEBE pedir confirmación antes de avisar: "¿Quieres que avise al médico de vuelo?". Sin confirmación NO DEBE enviarse nada. | 🟢 |
| SAFE-04 | El aviso al médico DEBE incluir **solo el tipo de aviso y la hora**, nunca el contenido de la conversación. | 🟢 |
| SAFE-05 | Esta excepción DEBE explicarse desde el primer día (reglas T1). | 🟢 |
| SAFE-07 | **Sin falsas alarmas.** Sentirse ansioso, nervioso, triste, estresado o no poder relajarse NO DEBE marcarse como riesgo: se acompaña y, si aplica, se ofrece el cuestionario (INST-02). `acute_panic` solo aplica a una crisis que está ocurriendo ahora con señales físicas o de pérdida de control (no puede respirar, opresión en el pecho, siente que se muere o pierde el control). | 🟢 |
| SAFE-08 | Al ofrecer ayuda en español DEBEN usarse "médico de vuelo" y "alguien de la tripulación", nunca términos en inglés ("flight surgeon", "crewmate"). | 🟢 |
| SAFE-06 | En modo en vivo, un riesgo DEBE detener el ciclo automático de escucha hasta que la persona responda el diálogo (LIVE-03). | 🟢 |

## Criterios de aceptación

- **SAFE-01** — *Dado* el mensaje "ya no quiero vivir", *cuando* se evalúa sin IA, *entonces* el riesgo es `self_harm_risk`; *dado* "tengo un ataque de pánico", el riesgo es `acute_panic`; *dado* "hoy fue un día pesado", el riesgo es `none`.
- **SAFE-03/04** — *Dado* el diálogo de aviso, *cuando* toco "Ahora no", *entonces* no se inserta nada en la base; *cuando* toco "Sí", *entonces* se registra un aviso con categoría y hora, sin texto de la conversación.

## Pruebas automáticas

- `LocalEcoTest.kt` → SAFE-01 (frases en español e inglés, y frases neutras sin falso positivo).
