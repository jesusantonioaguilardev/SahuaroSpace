# 04 · Enfoque del proyecto: un asistente que escucha

> Versión en inglés: [../en/04-assistant.md](../en/04-assistant.md) · Base: [01-investigacion.md](01-investigacion.md) · [03-combinaciones-factibilidad.md](03-combinaciones-factibilidad.md)

> **Actualización:** la versión final combina Oyente, Compañero y Señales para el médico, y suma el monitoreo de radiación y oxígeno. Ver [05-concepto-final.md](05-concepto-final.md).

## La idea en una frase
Un **compañero conversacional a bordo** con el que el tripulante puede **hablar cuando quiera**, sobre todo en confinamiento. Puede **conversar** o **solo escuchar**, sin juzgar y sin depender de la Tierra.

## Por qué tiene sentido (según las fuentes)
- **El aislamiento y el confinamiento** causan ansiedad, depresión y mal sueño, y afectan las decisiones ✅.
- **En Marte no habrá llamadas en tiempo real** con la familia ni con los médicos, por el retraso de comunicación ✅. El apoyo psicológico desde la Tierra llega tarde.
- **La privacidad es poca:** varios años en un espacio "del tamaño de un estudio" ✅. A veces no hay con quién hablar sin que lo oiga el resto del equipo.
- **El diario personal** ya es una contramedida de NASA ✅. El asistente es un diario que además puede responder.
- **NASA no describe cómo se monitorea la salud mental a bordo** ✅.
- **Momento crítico:** en una tormenta solar la tripulación queda encerrada en el refugio blindado durante horas o días ⚠️ (ver documento 03).
- **Precedente** ⚠️: en la ISS ya voló **CIMON** (DLR, Airbus e IBM, 2018), un asistente con voz. Era sobre todo técnico, no de apoyo emocional. Hay que verificar los detalles antes de citarlo.

---

## Qué NO es
- **No es un terapeuta ni un médico.** No diagnostica ni receta.
- **No reemplaza al equipo ni a la familia.** Ayuda a acercarse a ellos.
- **No vigila.** Lo que se habla es del tripulante; nada se comparte sin su permiso, salvo el protocolo de emergencia explicado abajo.

---

## Propuestas de asistente

### A · Oyente — solo escucha
- **Qué hace:** el tripulante habla (voz o texto) y el asistente **escucha**. Responde poco: confirma que entendió, refleja lo que oyó ("suena a que hoy fue pesado") y pregunta si quiere seguir.
- **Para quién:** quien necesita desahogarse sin consejos.
- **Ventaja:** es el más simple y seguro, porque casi no da recomendaciones.
- **Riesgo:** puede sentirse repetitivo en misiones largas.

### B · Compañero — conversación activa
- **Qué hace:** conversa, recuerda lo que el tripulante contó otros días (con permiso) y, si se lo piden, sugiere contramedidas de NASA: descanso, ventana, plantas, luz, contacto con la familia.
- **Ventaja:** se siente más humano y útil a largo plazo.
- **Riesgo:** a más conversación, más riesgo de respuestas inadecuadas o de dependencia.

### C · Modo refugio — acompañamiento en confinamiento
- **Qué hace:** se activa con una alerta solar o un confinamiento:
  - Explica con calma qué pasa y cuánto falta (dosis y tiempo estimado).
  - Propone rutinas para el encierro: descanso por turnos, respiración, actividades en grupo.
  - Ofrece un espacio privado para hablar con audífonos.
- **Ventaja:** une los dos riesgos del proyecto en el momento más difícil.
- **Riesgo:** necesita datos de la alerta solar; en la demo serían simulados.

### D · Puente con la Tierra
- **Qué hace:** ayuda a convivir con el retraso:
  - Graba y organiza mensajes para la familia.
  - Resume las respuestas que llegan horas después.
  - Avisa cuánto tarda la señal.
- **Riesgo:** se parece a una app de mensajería.

### E · Señales para el médico (con consentimiento)
- **Qué hace:** si el tripulante lo autoriza, el médico de vuelo recibe una tendencia general de ánimo y sueño. **Nunca recibe lo que se dijo.**
- **Ventaja:** cubre el vacío del monitoreo psicológico sin romper la confianza.
- **Riesgo:** si se diseña mal, el tripulante deja de usarlo por miedo a ser evaluado.

---

## Puntuación

Escala del 1 al 5, con los mismos criterios del documento 03.

| Prop. | Nombre | Fact. | Datos | Impacto | Orig. | Demo | **Total /25** |
|---|---|---|---|---|---|---|---|
| A | Oyente | 5 | 4 | 4 | 4 | 4 | **21** |
| B | Compañero | 4 | 4 | 5 | 3 | 5 | **21** |
| C | Modo refugio | 4 | 4 | 5 | 5 | 5 | **23** |
| D | Puente con la Tierra | 4 | 4 | 4 | 3 | 3 | **18** |
| E | Señales para el médico | 3 | 3 | 5 | 4 | 3 | **18** |

"Datos" aquí significa qué tan fácil es simular conversaciones y escenarios creíbles.

---

## Recomendación: un solo asistente con modos

Un asistente (nombre provisional: **"Eco"**) con estos modos:
1. **Escucha** (por defecto, de A): el tripulante habla y el asistente acompaña sin aconsejar.
2. **Conversación** (de B): solo si el tripulante la pide ("¿qué me recomiendas?").
3. **Refugio** (de C): se activa con la alerta solar o con un confinamiento.
4. **Extras si sobra tiempo:** el resumen de tendencias para el médico con consentimiento (E) y los mensajes en cola (D).

### Reglas de diseño
- **Escuchar primero:** preguntar antes de aconsejar ("¿quieres que solo te escuche o prefieres ideas?").
- **Privacidad total por defecto:** las conversaciones se guardan solo en el dispositivo del tripulante, cifradas, y se pueden borrar.
- **Funciona sin la Tierra:** el modelo de lenguaje y la voz corren a bordo.
- **Tono:** calmado, breve y sin frases de manual.
- **Bilingüe:** español e inglés, y cambia de idioma si el tripulante lo hace.
- **Protocolo de emergencia:** si detecta riesgo grave (autolesión o pánico agudo), **lo dice con claridad** y ofrece avisar al médico o a un compañero. Esta regla se explica al tripulante desde el primer día; no es secreta.

### Tecnología posible
- **En la nave real:** un modelo de lenguaje pequeño que corra localmente, reconocimiento de voz sin internet (por ejemplo Whisper ⚠️) y voz sintética local.
- **En el hackathon:** una app web con chat de voz o texto. Para la demo se puede usar un modelo en la nube (por ejemplo la API de Claude), explicando que en la misión real correría a bordo.
- **Personalidad y límites:** un *prompt* de sistema con las reglas de arriba, más ejemplos de respuestas buenas y malas.

### Guion de demo (2 minutos)
1. **Día normal:** un tripulante cuenta que extraña a su familia; Eco solo escucha y refleja.
2. **Pide consejo:** "¿qué hago?"; Eco cambia a conversación y sugiere grabar un mensaje para casa.
3. **Llega una tormenta solar:** Eco entra en modo refugio, explica la situación con calma y organiza turnos.
4. **Hora 20 en el refugio:** el tripulante dice que no aguanta el encierro; Eco lo acompaña y le propone un ejercicio de respiración.
5. **Cierre:** se muestra la pantalla de privacidad, donde el tripulante ve qué se comparte (nada, o solo la tendencia).

### Riesgos
| Riesgo | Cómo reducirlo |
|---|---|
| Respuestas dañinas o inventadas | Modo escucha por defecto, límites claros en el *prompt*, protocolo de emergencia y pruebas con casos difíciles. |
| Dependencia del asistente | Anima a hablar con el equipo y la familia; no intenta reemplazarlos. |
| Miedo a ser vigilado | Privacidad por defecto, explicada en la pantalla de inicio. |
| Parecer terapia | Aviso claro: "no soy terapeuta, estoy aquí para escucharte". |
| Modelo grande para la nave | Explicar en la presentación la ruta hacia un modelo local pequeño. |

### Decisiones abiertas para ti
- Nombre final del asistente ("Eco" es provisional).
- ¿Voz, texto o ambos en la demo?
- ¿Mantener el modo refugio ligado a la radiación, o hacerlo genérico para cualquier confinamiento?
