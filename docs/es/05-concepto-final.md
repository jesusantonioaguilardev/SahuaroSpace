# 05 · Concepto final: Eco, asistente que escucha y cuida

> Versión en inglés: [../en/05-final-concept.md](../en/05-final-concept.md) · Antes: [04-asistente.md](04-asistente.md) · Fuentes: [01-investigacion.md](01-investigacion.md)

## La idea
**Eco** es un asistente a bordo que hace dos cosas a la vez:
1. **Acompaña:** escucha o conversa con el tripulante **por texto o por voz**, sobre todo en confinamiento.
2. **Cuida el cuerpo:** vigila la radiación, el oxígeno y otros datos vitales, avisa cuando algo va mal y, con permiso, informa al médico de vuelo.

Combina tres propuestas del documento 04:
- **Oyente.**
- **Compañero.**
- **Señales para el médico.**

Además suma el **monitoreo de radiación**, para **reducir el riesgo de cáncer**, y el **monitoreo de oxígeno**.

> Eco no puede "evitar" el cáncer. Lo que sí hace es **bajar la dosis**: avisa a tiempo de las tormentas solares, indica dónde protegerse y lleva la cuenta de la dosis acumulada.

---

## Cómo se habla con Eco: texto y voz
El tripulante elige en cada momento cómo comunicarse, y puede cambiar a mitad de una conversación.

| Forma | Cuándo conviene | Cómo funciona |
|---|---|---|
| **Voz** | Manos ocupadas, cansancio, ganas de desahogarse hablando | El tripulante habla y Eco responde con voz calmada. Se activa con un botón o con una palabra clave ("Eco"). |
| **Texto** | Poca privacidad (otros cerca), de noche, temas difíciles de decir en voz alta | Chat escrito, como un diario que responde. |
| **Voz + texto** | Siempre disponible | Todo lo que se dice por voz también aparece escrito en pantalla, y el tripulante puede silenciar la voz de Eco. |

**Detalles de diseño:**
- **Privacidad en voz:** se recomienda usar audífonos. Eco puede bajar el volumen o pasar a texto si detecta que hay otras personas cerca.
- **Alertas 🔴:** Eco **habla en voz alta** aunque el tripulante esté en modo texto, porque es una emergencia. También muestra la alerta en pantalla.
- **Idioma:** reconoce y responde en español e inglés, y cambia si el tripulante cambia.
- **Tono de voz:** pausado y cálido, sin sonar robótico ni alarmista.
- **Sin la Tierra:** en la nave real, el reconocimiento de voz y la voz sintética corren a bordo, sin internet.

---

## Los 4 módulos

### 1 · Escucha (de Oyente)
- Es el modo por defecto. El tripulante habla y Eco acompaña sin aconsejar.
- Pregunta antes de opinar: "¿quieres que solo te escuche o prefieres ideas?".

### 2 · Compañero
- Conversa cuando se lo piden.
- Con permiso, recuerda lo que el tripulante le contó otros días.
- Sugiere contramedidas de NASA: descanso, ventana, plantas, luz y mensajes para la familia.
- **Puede contar al tripulante cómo están sus datos, explicado en palabras simples.** Por ejemplo: "tu oxígeno está bien y la dosis de esta semana fue baja".

### 3 · Monitoreo de bienestar
Lee los sensores y compara cada dato con la línea base del tripulante y con los límites de referencia.

| Dato | Para qué | Fuente del dato | Referencia |
|---|---|---|---|
| **Dosis de radiación personal** (diaria y acumulada) | Riesgo de cáncer a largo plazo | Dosímetro personal | Límite de carrera: 600 mSv ⚠️ |
| **Dosis por zona y neutrones** | Elegir dónde dormir y trabajar | Dosímetros de área (tipo CANS de la CSA) | Neutrones ≈ 30 % de la dosis en la ISS ✅ |
| **Alerta de tormenta solar** | Ir al refugio a tiempo | Clima espacial (NOAA SWPC / NASA DONKI ⚠️) | Escala S de NOAA ⚠️ |
| **Saturación de oxígeno (SpO2)** | Detectar hipoxia | Oxímetro de pulso (wearable) | Normal ≥ 95 %; menos de 90 % es preocupante ⚠️ |
| **Oxígeno y presión de la cabina** | Las naves de espacio profundo tendrán cabina a baja presión y con riesgo de hipoxia leve ✅ | Sensores de la nave | Atmósfera de exploración ≈ 8.2 psia y 34 % de O2 ⚠️ |
| **CO2 de la cabina** | Causa dolor de cabeza y cansancio | Sensores de la nave | Límite de NASA ≈ 3 mmHg ⚠️ |
| **Frecuencia cardíaca y respiratoria** | Estrés, esfuerzo, hipoxia | Wearable | Comparar con la línea base personal |
| **Sueño** (horas e interrupciones) | El mal sueño afecta el rendimiento ✅ | Wearable | ≥ 7 h ⚠️ |
| **Ánimo y estrés** | Riesgo del aislamiento ✅ | Check‑in de 1 minuto o lo que el tripulante cuente | Tendencia personal |
| **Síntomas** (dolor de cabeza, confusión, visión) | Señales de hipoxia ✅ | Lo que el tripulante cuente | — |

Fuente del oxígeno: [NASA – Risk of Hypoxia](https://www.nasa.gov/reference/risk-of-hypoxia/) ✅. Las naves de espacio profundo usarán cabina a baja presión para preparar las caminatas espaciales, y eso sube el riesgo de hipoxia leve. Sus síntomas son confusión, dolor de cabeza, problemas de visión y mal sueño. NASA dice que está desarrollando nuevos protocolos para monitorearla.

### 4 · Señales para el médico
Hay dos tipos de información, con reglas distintas:

| Tipo | Ejemplos | ¿Se comparte con el médico? |
|---|---|---|
| **Datos de seguridad física** | Dosis de radiación, SpO2, O2 y CO2 de la cabina, alertas | **Sí, siempre.** Son datos operativos de la misión y el tripulante lo sabe desde el inicio. |
| **Bienestar emocional** | Tendencia de ánimo y de sueño | **Solo con permiso.** El tripulante puede activarlo o quitarlo cuando quiera. |
| **Conversaciones** | Lo que el tripulante le dice a Eco | **Nunca.** Se quedan cifradas en su dispositivo. |

**Excepción, conocida desde el primer día:** si hay un riesgo grave, como autolesión o pánico agudo, Eco lo dice con claridad y ofrece avisar al médico o a un compañero.

---

## Cómo se ordenan las alertas
Eco debe saber **cuándo interrumpir** una conversación:

| Nivel | Ejemplo | Qué hace Eco |
|---|---|---|
| 🔴 **Urgente** | Tormenta solar en camino, SpO2 baja, CO2 alto | Interrumpe aunque esté en modo escucha, explica con calma qué hacer y avisa al médico. |
| 🟡 **Atención** | Dosis semanal más alta de lo normal, tres noches de mal sueño | Lo menciona al terminar la conversación o en el resumen del día. |
| 🟢 **Normal** | Todo dentro de lo esperado | Solo lo cuenta si el tripulante pregunta. |

---

## Modo refugio (radiación + confinamiento)
Cuando llega una tormenta solar:
1. **Alerta 🔴:** Eco da la cuenta regresiva e indica quién va a qué zona blindada.
2. **Dentro del refugio:**
   - Muestra la dosis en vivo y el tiempo estimado de salida.
   - Organiza turnos de descanso.
   - Vigila el oxígeno y el CO2, porque hay muchas personas en un espacio pequeño ⚠️.
3. **Acompañamiento:** Eco escucha a quien lo necesite, con audífonos para tener privacidad.
4. **"Todo despejado":** Eco da un resumen con la dosis evitada y avisa al médico.

---

## Factibilidad de la combinación

| Criterio | Nota (1–5) | Comentario |
|---|---|---|
| Factibilidad en un fin de semana | 3 | Son muchas piezas, pero cada una es simple. Hay que limitar el alcance (ver el MVP). |
| Datos | 4 | Los sensores se simulan con los valores de NASA; el clima espacial es público. |
| Impacto | 5 | Cubre la salud física y la mental con una sola herramienta. |
| Originalidad | 5 | Une un asistente que escucha con el monitoreo de salud y respeta la privacidad. |
| Demo | 5 | La conversación interrumpida por una alerta real impacta mucho. |
| **Total** | **22 / 25** | |

**Riesgo principal:** que el asistente parezca un vigilante. Por eso la tabla de privacidad es central y se muestra en la demo.

---

## MVP para el hackathon
1. **Conversación con Eco por texto y por voz**, con los modos escucha y compañero, en español e inglés. La voz se transcribe en pantalla.
2. **Panel de datos simulados:** radiación (diaria y acumulada), SpO2, O2 y CO2 de la cabina, frecuencia cardíaca y sueño.
3. **Motor de alertas** con los tres niveles. Una alerta 🔴 interrumpe el chat.
4. **Modo refugio** con una tormenta solar histórica reproducida.
5. **Vista del médico:** solo datos de seguridad y, si hay permiso, la tendencia emocional.
6. **Pantalla de privacidad** donde el tripulante ve y controla qué se comparte.

**Si sobra tiempo:** palabra clave para activar la voz ("Eco"), mapa de dosis por zona y mensajes en cola para la familia.

### Arquitectura sugerida
- **Simulador de sensores:** genera días de misión con radiación, oxígeno, CO2, pulso y sueño.
- **Motor de reglas:** compara los datos con los límites y con la línea base, y decide el nivel de alerta.
- **Eco (modelo de lenguaje):** recibe un resumen de los datos y del nivel de alerta, junto con un *prompt* de sistema que fija la personalidad, los límites y el protocolo de emergencia.
  - En la demo puede usar un modelo en la nube, como la API de Claude.
  - En la nave real sería un modelo local pequeño.
- **Voz:**
  - Voz a texto: el tripulante habla y se convierte en texto para Eco.
  - Texto a voz: la respuesta de Eco se lee en voz alta.
  - En la demo se puede usar la Web Speech API del navegador ⚠️, que es gratuita pero puede necesitar internet según el navegador.
  - En la nave real: Whisper u otro modelo de voz local ⚠️ y una voz sintética local.
- **Frontend web:** chat con botón de micrófono, panel del tripulante, vista del médico y pantalla de privacidad.

---

## Guion de demo (2 minutos)
1. **Mañana normal, por voz:** el tripulante le cuenta a Eco en voz alta que extraña a su familia, y Eco solo escucha y responde con voz calmada.
2. **Pregunta por sus datos, por texto:** como hay compañeros cerca, escribe "¿cómo estoy?". Eco responde en palabras simples: oxígeno bien, dosis de la semana baja y dos noches de poco sueño.
3. **Interrupción 🔴:** llega una tormenta solar. Aunque el tripulante estaba en texto, Eco **habla en voz alta**, corta la conversación con calma y empieza la cuenta regresiva hacia el refugio.
4. **Dentro del refugio:** se ven la dosis en vivo, el CO2 subiendo un poco y los turnos. El tripulante dice que no aguanta el encierro, y Eco lo acompaña con un ejercicio de respiración.
5. **Vista del médico:** recibe la dosis y la alerta, pero **no** la conversación.
6. **Cierre:** "todo despejado" y el resumen con la dosis evitada.

---

## Decisiones abiertas para ti
- Nombre final ("Eco" es provisional).
- ¿Qué voz tendrá Eco (femenina, masculina o neutra) y si el tripulante puede elegirla?
- ¿Agregamos algún otro dato al monitoreo, como temperatura, presión arterial o hidratación?
