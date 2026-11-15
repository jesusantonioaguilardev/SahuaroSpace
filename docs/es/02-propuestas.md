# 02 · Propuestas

> Versión en inglés: [../en/02-proposals.md](../en/02-proposals.md) · Datos y fuentes: [01-investigacion.md](01-investigacion.md)

Hay **10 propuestas** centradas en **cáncer por radiación** y **aislamiento y confinamiento**:
- 3 de radiación.
- 3 de aislamiento.
- 3 que combinan ambos riesgos.
- 1 plataforma integrada.

Todas siguen dos reglas del reto:
- **Funcionan a bordo sin conexión con la Tierra.**
- Los datos de la demo son **simulados** a partir de valores publicados por NASA y la CSA.

| Código | Nombre | Riesgos |
|---|---|---|
| A | RadShield | Radiación |
| B | Alerta solar | Radiación |
| C | Mapa de dosis de la nave | Radiación |
| D | MindLink | Aislamiento |
| E | CrewSync | Aislamiento (equipo y horarios) |
| F | Puente con la Tierra | Aislamiento (retraso de comunicación) |
| G | Refugio inteligente | B + D + E |
| H | Centinela cognitivo | A + D |
| I | Lugar justo | C + D |
| J | RadMind Hub | Todo |

---

## Radiación

### A · RadShield — dosis personal y riesgo de carrera
- **Problema:** fuera de la magnetosfera la dosis sube, y el riesgo de cáncer depende de la dosis acumulada en toda la carrera.
- **Usuario:** tripulante, médico de vuelo y oficial de radiación.
- **Datos de entrada:** dosímetros personales y de área, incluidos los neutrones (~30 % de la dosis en la ISS según la CSA), y la dosis de misiones anteriores.
- **Funciones clave:**
  - Dosis acumulada por persona contra el límite de carrera (⚠️ 600 mSv), con proyección al final de la misión.
  - Desglose por tipo de radiación: GCR, SPE y neutrones.
  - **Mensajes claros sin alarmar**, porque la forma de mostrar el riesgo afecta el ánimo.
- **Demo:** una misión a Marte simulada en la que la barra de dosis avanza y la proyección cambia según el blindaje.

### B · Alerta solar — aviso de tormenta y orden de refugio
- **Problema:** un evento de partículas solares llega rápido, y la tripulación tiene poco tiempo para protegerse.
- **Datos de entrada:**
  - Clima espacial: datos públicos de NOAA SWPC y NASA DONKI ⚠️, con el retraso de la señal hasta la nave.
  - Dosímetros de la nave.
- **Funciones clave:**
  - Cuenta regresiva.
  - Lista de pasos: quién va a qué zona y qué tareas se pausan.
  - Seguimiento de la dosis durante el evento.
  - Aviso de "todo despejado".
- **Demo:** reproducir un evento solar histórico real y mostrar la alerta y el refugio.

### C · Mapa de dosis de la nave
- **Idea:** un plano de la nave coloreado según la dosis de cada módulo.
- **Funciones:**
  - Sugiere en qué zona dormir o trabajar para reducir la dosis.
  - Suma la dosis según el tiempo que cada persona pasa en cada zona.
- **Riesgo:** necesita un modelo de blindaje por módulo; en la demo los valores serían simulados.

---

## Aislamiento y confinamiento

### D · MindLink — bienestar mental y sueño
- **Problema:** el aislamiento, el retraso de comunicación y la poca privacidad causan ansiedad, depresión y mal sueño. NASA no describe cómo se vigila esto a bordo.
- **Usuario:** el tripulante y, solo con su permiso, el psicólogo o el médico de vuelo.
- **Datos de entrada:**
  - Check‑in diario de 1 minuto: ánimo, estrés y energía.
  - Sueño medido por un wearable.
  - Carga de trabajo y tiempo de descanso.
  - Diario personal (privado).
- **Funciones clave:**
  - Tendencia personal de ánimo y sueño, con un aviso suave si bajan varios días seguidos.
  - Sugerencias basadas en las contramedidas de NASA: descanso, ventana, plantas, diario y ajuste de la luz.
  - **Privacidad primero:** el tripulante decide qué ve el médico; el diario nunca se comparte.
- **Demo:** 30 días simulados en los que la sobrecarga baja el sueño y el ánimo, y el sistema sugiere ajustar el horario.

### E · CrewSync — equipo y horarios
- **Idea:** cuidar la dinámica del grupo.
- **Funciones:**
  - Carga de trabajo programada vs. real por persona, con aviso si alguien acumula sobrecarga.
  - Protección de las horas de sueño.
  - Autorreporte **anónimo** del clima del equipo.
  - Sugerencias de actividades en grupo.
- **Riesgo:** los datos de conflicto son subjetivos y sensibles; puede sentirse como vigilancia.

### F · Puente con la Tierra — convivir con el retraso
- **Idea:** como en Marte no hay conversaciones en tiempo real, el sistema hace que la comunicación con la familia y con los médicos funcione bien aunque tarde.
- **Funciones:**
  - Indicador del retraso actual.
  - Mensajes y videos en cola.
  - "Preguntas al médico" con respuestas que se reciben después.
  - Biblioteca local de guías de autocuidado para no depender de la Tierra.
- **Riesgo:** se parece a una app de mensajería; su valor depende de cómo se cuente.

---

## Combinadas (radiación + aislamiento)

### G · Refugio inteligente (B + D + E)
- **Idea:** cuando llega una tormenta solar, la tripulación queda **confinada en el lugar más pequeño y blindado** durante horas o días. El sistema gestiona ese momento en lo físico y en lo emocional.
- **Por qué combinar:** es el punto exacto donde **más radiación significa más confinamiento**.
- **Funciones:**
  - Alerta y orden de refugio (de B).
  - Dosis en vivo dentro del refugio y tiempo estimado de salida.
  - Turnos de descanso y espacio personal dentro del refugio.
  - Actividades y tareas que se pueden hacer ahí dentro.
  - Check‑in de ánimo antes, durante y después del evento (de D).
  - Reparto justo de tareas (de E).
- **Demo:** un evento solar de 30 horas simulado. Se ven la alerta, la entrada al refugio, la dosis que se evitó, los turnos y el ánimo del equipo, y se cierra con un resumen.

### H · Centinela cognitivo (A + D)
- **Idea:** una prueba cognitiva diaria de 60 s que, cruzada con otros datos, sugiere la **causa probable** de un mal resultado.
- **Por qué combinar:** tanto la radiación como el estrés del aislamiento pueden bajar el rendimiento cognitivo ✅. Distinguir la causa cambia la acción: revisar la dosis o tomar descanso.
- **Funciones:**
  - Prueba de reacción y memoria, comparada con la línea base de cada persona.
  - Tarjeta de "posible causa" según la dosis reciente, el sueño y el ánimo.
  - Siempre es una **sugerencia para el médico**, nunca un diagnóstico.
- **Riesgo:** los efectos cognitivos de la radiación son lentos y difíciles de aislar; en la demo se apoyaría sobre todo en el sueño y el estrés.

### I · Lugar justo (C + D)
- **Idea:** equilibrar la dosis y el bienestar al decidir dónde dormir, trabajar y convivir.
- **Funciones:**
  - Recomienda horarios y zonas que bajan la dosis sin quitar privacidad ni tiempo social.
  - Muestra el costo en dosis de cada opción.
- **Riesgo:** depende del mapa de dosis (C), que es simulado.

---

## Plataforma integrada

### J · RadMind Hub (todo)
- **Idea:** un panel único con dos vistas:
  - **Tripulante:** simple, "cómo estoy y qué hago hoy".
  - **Médico:** dosis, ánimo y tendencias de todo el equipo.
- **Partes:**
  1. Datos simulados: dosímetros, clima espacial, wearables y check‑in diario.
  2. Motor de reglas y detección de cambios contra la línea base de cada persona.
  3. Módulos: dosis (A), alerta solar (B), bienestar (D) y refugio inteligente (G).
  4. Informe diario resumido para enviar a la Tierra por un enlace lento, con el permiso de cada tripulante.
- **Ventaja:** cubre la R y la I de RIDGE y muestra cómo se afectan entre sí.
- **Riesgo:** mucho alcance para un fin de semana; hay que construirlo **por módulos** (ver el documento 03).
