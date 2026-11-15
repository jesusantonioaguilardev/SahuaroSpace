# 01 · Risk research

> Spanish version: [../es/01-investigacion.md](../es/01-investigacion.md)

Challenge: **Create Health Monitoring Software for Astronauts on Space Missions** (NASA Space Apps).
The project focuses on **two risks**:
1. **Radiation-induced cancer**
2. **Isolation and confinement**, which groups the behavior, teamwork and sleep risks of NASA's Human Research Program (HRP).

Legend: ✅ = taken from the cited official source · ⚠️ = general knowledge (NASA-STD-3001 and literature); **verify it** before using it in the pitch.

---

## Context: the 5 hazards (RIDGE)
Source: [NASA – 5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/)

Our two risks are the **R** and the **I** in RIDGE. The **D** (distance) shapes the whole design.

| Hazard | What it means for the software |
|---|---|
| **R**adiation | Invisible; NASA calls it one of the most hazardous aspects of spaceflight ✅. Dose must be measured and tracked over time. |
| **I**solation & confinement | Groups far from Earth, isolated in a small space for a long time, show behavioral responses ✅. |
| **D**istance from Earth | Mars averages ~140 million miles away; a mission lasts ~3 years ✅. **Self-sufficiency is key** ✅ → the system must work **without mission control** (comm delay up to ~20 min one way ⚠️). |

---

## Risk 1 · Radiation-induced cancer
Sources: [NASA – Risk of Radiation-Induced Cancers](https://www.nasa.gov/reference/risk-of-radiation-induced-cancers/) · [CSA – Monitoring radiation for astronaut health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp)

- **Risk** ✅: space has more radiation than Earth. The ISS is inside the magnetosphere, but Moon and Mars missions leave it.
- **Other effects** ✅: heart, blood vessels, eyes and **cognitive performance** during the mission.
- **Countermeasures** ✅:
  - Health surveillance.
  - Drugs against radiation effects.
  - Shielding (Artemis and Gateway).
  - **Personalized cancer risk assessment** from dose and genetics (in research).
- **Monitoring (CSA)** ✅:
  - **Neutrons** are ~**30 %** of total radiation on the ISS and are especially harmful.
  - Canada has flown MOSFET, EVARM, Radi‑N and Radi‑N2.
  - It is funding (CAD 5.5 M) **CANS**, an instrument that measures neutrons **continuously and autonomously**.
- **Reference values** ⚠️:
  - NASA career limit: **600 mSv** (NASA‑STD‑3001, 2022).
  - On the ISS: ≈ 0.5–1 mSv/day.
  - A Mars mission could add hundreds of mSv.
- **Radiation sources** ⚠️:
  - Galactic cosmic rays (GCR): constant and hard to shield.
  - Solar particle events (SPE): sudden and intense; the crew must go to a **shielded shelter** for hours or days.
- **Gaps** ✅: NASA is still studying shielding for Mars and which interventions work best.

**Measurable:** dose per crew member (personal dosimeters), area dose per module, neutron flux, space-weather alerts (public NOAA SWPC / NASA DONKI data ⚠️), time spent in shielded areas.

---

## Risk 2 · Isolation and confinement
Sources: [Risk of Behavioral Conditions and Psychiatric Disorders](https://www.nasa.gov/reference/risk-of-behavioral-conditions-and-psychiatric-disorders/) · [Risk of Inadequate Teamwork](https://www.nasa.gov/reference/risk-of-inadequate-teamwork/) · [Risk from Inadequate Sleep and Irregular Schedules](https://www.nasa.gov/reference/risk-from-inadequate-sleep-and-irregular-schedules/)

- **Behavior and mental health** ✅:
  - Anxiety and depression can occur, affecting sleep, morale and decision making.
  - Causes:
    - Isolation.
    - **Communication delays**: on Mars there will be no real-time calls with family or doctors.
    - **Limited privacy**: living for years in a space "roughly the size of a studio apartment".
- **Teamwork** ✅:
  - The risk is performance and health declining from poor cooperation, coordination or communication.
  - On the way to Mars there is no resupply and less room than on the ISS, so conflicts must be solved onboard.
- **Sleep and schedules** ✅:
  - Work overload, irregular light cycles (about **16 sunrises a day** on the ISS) and disrupted sleep lower performance.
  - Countermeasures: LED lighting that mimics Earth's day and scheduled downtime.
- **Countermeasures** ✅:
  - Personal journal.
  - Growing fresh vegetables.
  - Windows.
  - More privacy.
  - Compatible crews and pre-mission team training.
  - In-mission medical support, which will be harder because of the delay.
- **Analog studies** ✅: HERA (45-day simulated mission), CHAPEA (one-year simulated Mars) and Antarctica studies.
- **Key gap** ✅: **NASA does not describe how psychological health is monitored onboard** → a clear opportunity for this challenge.

**Measurable:**
- Mood and stress (1-minute questionnaire).
- Sleep (hours and interruptions, from a wearable).
- Short cognitive test.
- Planned vs. actual workload.
- Downtime and family contact time.
- Team climate (anonymous self-report).

**Privacy:** the crew member decides what is shared with the surgeon.

---

## Where the two risks meet
1. **Solar storm shelter** ⚠️: during a solar event the crew shuts itself in the most shielded area, which is even smaller. **More radiation means more confinement**, right at a stressful moment.
2. **Cognition** ✅: radiation can impair cognitive performance, and isolation affects sleep and decisions. The same symptom can have either cause.
3. **Anxiety about cancer risk** ⚠️: knowing that accumulated dose is rising can cause stress. **How dose is shown matters**: it must be clear but not alarming.
4. **Where to sleep and socialize** ⚠️: the most shielded areas are not always the most private or social. Dose and wellbeing must be balanced.
5. **Autonomy**: because of distance, everything must run **onboard, offline**.
