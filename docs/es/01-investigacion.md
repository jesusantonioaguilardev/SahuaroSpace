# 01 · Investigación de los riesgos

> Versión en inglés: [../en/01-research.md](../en/01-research.md)

Reto: **Create Health Monitoring Software for Astronauts on Space Missions** (NASA Space Apps).
El proyecto se centra en **dos riesgos**:
1. **Cáncer inducido por radiación**
2. **Aislamiento y confinamiento**, que agrupa los riesgos de conducta, trabajo en equipo y sueño del Human Research Program (HRP) de NASA.

Leyenda: ✅ = dato tomado de la fuente oficial citada · ⚠️ = dato de conocimiento general (normas NASA-STD-3001 y literatura); **hay que verificarlo** antes de usarlo en la presentación.

---

## Contexto: los 5 peligros (RIDGE)
Fuente: [NASA – 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)

Nuestros dos riesgos son la **R** y la **I** de RIDGE. La **D** (distancia) condiciona todo el diseño.

| Peligro | Qué significa para el software |
|---|---|
| **R**adiación | Invisible; NASA la considera uno de los aspectos más peligrosos del vuelo espacial ✅. Hay que medir la dosis y llevar la cuenta acumulada. |
| **I**slamiento y confinamiento | Grupos lejos de la Tierra, aislados en un espacio pequeño por mucho tiempo, muestran cambios de conducta ✅. |
| **D**istancia a la Tierra | Marte está a ~140 millones de millas en promedio; una misión dura ~3 años ✅. **La autosuficiencia es clave** ✅ → el sistema debe funcionar **sin control de misión** (retraso de comunicación de hasta ~20 min por sentido ⚠️). |

---

## Riesgo 1 · Cáncer inducido por radiación
Fuentes: [NASA – Risk of Radiation-Induced Cancers](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/) · [CSA – Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)

- **Riesgo** ✅: en el espacio hay más radiación que en la Tierra. La ISS está dentro de la magnetosfera, pero las misiones a la Luna y Marte salen de ella.
- **Otros efectos** ✅: corazón, vasos sanguíneos, ojos y **rendimiento cognitivo** durante la misión.
- **Contramedidas** ✅:
  - Vigilancia de salud.
  - Medicamentos contra los efectos de la radiación.
  - Blindaje (Artemis y Gateway).
  - **Evaluación personalizada del riesgo de cáncer** según dosis y genética (en investigación).
- **Monitoreo (CSA)** ✅:
  - Los **neutrones** son ~**30 %** de la radiación total en la ISS y son especialmente dañinos.
  - Canadá ha usado MOSFET, EVARM, Radi‑N y Radi‑N2.
  - Financia (5.5 M CAD) el instrumento **CANS**, que mide neutrones de forma **continua y autónoma**.
- **Valores de referencia** ⚠️:
  - Límite de carrera de NASA: **600 mSv** (NASA‑STD‑3001, 2022).
  - En la ISS: ≈ 0.5–1 mSv/día.
  - Una misión a Marte podría sumar cientos de mSv.
- **Fuentes de radiación** ⚠️:
  - Rayos cósmicos galácticos (GCR): constantes, difíciles de blindar.
  - Eventos de partículas solares (SPE): repentinos e intensos, exigen ir a un **refugio blindado** durante horas o días.
- **Vacíos** ✅: NASA aún estudia el blindaje para Marte y cuáles son las mejores intervenciones.

**Qué se puede medir:** dosis por tripulante (dosímetros personales), dosis de área por módulo, flujo de neutrones, alertas de clima espacial (datos públicos de NOAA SWPC / NASA DONKI ⚠️), tiempo en zonas blindadas.

---

## Riesgo 2 · Aislamiento y confinamiento
Fuentes: [Risk of Behavioral Conditions and Psychiatric Disorders](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/) · [Risk of Inadequate Teamwork](https://www.nasa.gov/reference/risk-of-inadequate-teamwork/) · [Risk from Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/)

- **Conducta y salud mental** ✅:
  - Puede haber ansiedad y depresión, que afectan el sueño, la moral y la toma de decisiones.
  - Causas:
    - El aislamiento.
    - Los **retrasos de comunicación**: en Marte no habrá llamadas en tiempo real con la familia ni con los médicos.
    - La **poca privacidad**: vivir varios años en un espacio "del tamaño de un estudio".
- **Trabajo en equipo** ✅:
  - El riesgo es que el rendimiento y la salud bajen por mala cooperación, coordinación o comunicación.
  - Rumbo a Marte no hay reabastecimiento y el espacio es menor que en la ISS, así que los conflictos se deben resolver a bordo.
- **Sueño y horarios** ✅:
  - La sobrecarga de trabajo, los ciclos de luz irregulares (en la ISS se ven unos **16 amaneceres al día**) y el sueño interrumpido bajan el rendimiento.
  - Contramedidas: iluminación LED que imita el día terrestre y tiempo de descanso programado.
- **Contramedidas** ✅:
  - Diario personal.
  - Cultivar vegetales frescos.
  - Ventanas.
  - Más privacidad.
  - Tripulación compatible y entrenamiento de equipo antes de la misión.
  - Apoyo médico durante la misión, que será más difícil por el retraso.
- **Estudios análogos** ✅: HERA (misión simulada de 45 días), CHAPEA (Marte simulado de un año) y estudios en la Antártida.
- **Vacío clave** ✅: **NASA no describe cómo se monitorea la salud psicológica a bordo** → oportunidad clara para el reto.

**Qué se puede medir:**
- Ánimo y estrés (cuestionario de 1 minuto).
- Sueño (horas e interrupciones, con un wearable).
- Prueba cognitiva corta.
- Carga de trabajo programada vs. real.
- Tiempo de descanso y de contacto con la familia.
- Clima del equipo (autorreporte anónimo).

**Privacidad:** el tripulante decide qué se comparte con el médico.

---

## Dónde se cruzan los dos riesgos
1. **Refugio por tormenta solar** ⚠️: durante un evento solar la tripulación se encierra en la zona más blindada, que es aún más pequeña. **Más radiación implica más confinamiento**, justo en un momento de estrés.
2. **Cognición** ✅: la radiación puede afectar el rendimiento cognitivo, y el aislamiento afecta el sueño y las decisiones. El mismo síntoma puede tener cualquiera de las dos causas.
3. **Ansiedad por el riesgo de cáncer** ⚠️: saber que la dosis acumulada sube puede generar estrés. **La forma de mostrar la dosis importa**: debe ser clara pero no alarmista.
4. **Dónde dormir y convivir** ⚠️: las zonas más blindadas no siempre son las más privadas o sociales. Hay que equilibrar dosis y bienestar.
5. **Autonomía**: por la distancia, todo debe funcionar **a bordo, sin internet**.
