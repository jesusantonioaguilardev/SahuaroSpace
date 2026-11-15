# 03 · Combinaciones y factibilidad

> Versión en inglés: [../en/03-combinations-feasibility.md](../en/03-combinations-feasibility.md) · Propuestas: [02-propuestas.md](02-propuestas.md)

## 1. ¿Cómo se conectan radiación y aislamiento?

| Conexión | Fuerza | Por qué | Propuesta |
|---|---|---|---|
| Tormenta solar → refugio | **Muy fuerte** | Un evento solar obliga a encerrarse en la zona más pequeña y blindada durante horas o días ⚠️. Más radiación implica más confinamiento y más estrés. | G |
| Cognición | **Media** | La radiación puede afectar el rendimiento cognitivo ✅ y el aislamiento afecta el sueño y las decisiones ✅. Comparten síntomas, pero el efecto de la radiación es lento y difícil de separar. | H |
| Ansiedad por el riesgo de cáncer | **Media** | Ver subir la dosis acumulada puede generar estrés ⚠️. Influye en cómo se diseña RadShield, más que en una propuesta aparte. | A, D |
| Dónde dormir y convivir | **Media‑débil** | Las zonas blindadas no siempre son privadas o sociales ⚠️. Requiere un modelo de blindaje que no tenemos. | I |
| Retraso de comunicación | **Media** | Afecta a los dos riesgos: la alerta solar debe decidirse a bordo y el apoyo psicológico también. | B, F |

**Conclusión:** la combinación más clara y original es el **refugio por tormenta solar (G)**. Es el momento en que los dos riesgos ocurren al mismo tiempo y en el mismo lugar.

---

## 2. Puntuación de cada propuesta

Escala del 1 al 5 (5 = mejor). Criterios:
- **Fact.:** factibilidad técnica en un fin de semana.
- **Datos:** qué tan fácil es conseguir o simular datos creíbles.
- **Impacto:** qué tan útil sería para una misión real.
- **Orig.:** qué tan original es frente a lo que ya existe.
- **Demo:** qué tan fácil es mostrarlo en 2 minutos.

| Prop. | Nombre | Fact. | Datos | Impacto | Orig. | Demo | **Total /25** |
|---|---|---|---|---|---|---|---|
| A | RadShield | 4 | 5 | 4 | 2 | 5 | **20** |
| B | Alerta solar | 4 | 5 | 5 | 3 | 5 | **22** |
| C | Mapa de dosis | 3 | 3 | 4 | 4 | 5 | **19** |
| D | MindLink | 4 | 3 | 5 | 3 | 4 | **19** |
| E | CrewSync | 3 | 2 | 4 | 4 | 3 | **16** |
| F | Puente con la Tierra | 4 | 4 | 4 | 3 | 3 | **18** |
| G | Refugio inteligente | 4 | 4 | 5 | 5 | 5 | **23** |
| H | Centinela cognitivo | 3 | 2 | 4 | 5 | 4 | **18** |
| I | Lugar justo | 3 | 3 | 4 | 4 | 4 | **18** |
| J | RadMind Hub (todo) | 2 | 3 | 5 | 4 | 4 | **18** |

**Por qué estas notas:**
- **G** es la mejor:
  - Cruza los dos riesgos en un momento concreto que cualquier juez entiende.
  - Usa datos públicos reales de clima espacial.
  - No conocemos otra herramienta que trate el refugio también como un problema psicológico.
- **B** tiene los mejores datos (eventos solares históricos públicos) y es la base de G.
- **A** es necesaria pero poco original, porque ya existen paneles de dosis. Su diferencia está en mostrar la dosis sin alarmar.
- **D** responde a un vacío real (NASA no describe el monitoreo psicológico a bordo), pero ya hay muchas apps de ánimo.
- **E** tiene datos subjetivos y sensibles. **H** depende de efectos cognitivos de la radiación difíciles de separar.
- **J** completa es demasiado para un fin de semana, pero es el **destino** si se construye por partes.

---

## 3. Recomendación

> **Actualización:** el proyecto ahora se enfoca en un **asistente que escucha**. Ver [04-asistente.md](04-asistente.md). Esta sección queda como contexto: el refugio inteligente pasa a ser el "modo refugio" del asistente.

### Proyecto: "RadMind Hub", con el refugio inteligente como protagonista
Construir **J por etapas**, con una historia simple: **cuando llega una tormenta solar, los dos riesgos ocurren a la vez**.

**MVP del fin de semana:**
1. **A · RadShield:** dosis acumulada por tripulante y proyección a fin de misión, con mensajes claros.
2. **B · Alerta solar:** reproducir un evento solar histórico real, con cuenta regresiva y orden de refugio.
3. **G · Refugio inteligente:** dosis en vivo, turnos, espacio personal y check‑in de ánimo durante el evento.
4. **D ligero:** check‑in diario de ánimo y sueño de 1 minuto, con control de privacidad.
5. Vista **tripulante** y vista **médico**, en **español e inglés** (selector de idioma).

**Si sobra tiempo, en este orden:**
6. **C · Mapa de dosis** de la nave (muy visual en la demo).
7. **F · Puente con la Tierra:** indicador de retraso y mensajes en cola.
8. **H · Centinela cognitivo:** prueba de reacción de 60 s.

**Dejar fuera por ahora:** E (datos sensibles) e I (depende de C).

### Guion de demo (2 minutos)
1. Día normal en ruta a Marte: dosis y ánimo de 4 tripulantes.
2. Llega la alerta de un evento solar real reproducido; la cuenta regresiva empieza.
3. Entran al refugio; el sistema reparte turnos y muestra la dosis evitada.
4. A las 20 horas, el ánimo del equipo baja y el sistema sugiere actividades y descanso.
5. "Todo despejado": resumen para el médico y para la Tierra.

### Arquitectura sugerida (para cuando pases a código)
- **Frontend web** (HTML, CSS y JS, o React) que funcione sin internet.
- **Simulador** de días de misión con los valores del documento 01.
- **Datos públicos** de clima espacial (⚠️ NASA DONKI / NOAA SWPC) para reproducir un evento real.
- **Motor de reglas** simple: umbrales y desviación de la línea base de cada persona.

### Riesgos del proyecto
| Riesgo | Cómo reducirlo |
|---|---|
| Parecer un diagnóstico médico | Avisos claros: "estimación para apoyar al médico de vuelo". |
| Números inventados | Usar solo los valores con ✅; marcar los ⚠️ y verificarlos. |
| Datos de salud mental muy sensibles | El tripulante decide qué se comparte; el diario nunca sale del dispositivo. |
| Alcance demasiado grande | Respetar el orden del MVP; cada módulo funciona solo. |

### Decisiones abiertas para ti
- Nombre final del proyecto.
- Stack: HTML y JS puro (más rápido) o React.
- Qué evento solar histórico usar en la demo.
