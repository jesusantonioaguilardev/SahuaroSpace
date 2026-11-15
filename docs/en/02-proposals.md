# 02 · Proposals

> Spanish version: [../es/02-propuestas.md](../es/02-propuestas.md) · Data and sources: [01-research.md](01-research.md)

There are **10 proposals** focused on **radiation-induced cancer** and **isolation & confinement**:
- 3 for radiation.
- 3 for isolation.
- 3 that combine both risks.
- 1 integrated platform.

All follow two challenge rules:
- **They work onboard without a link to Earth.**
- The demo data is **simulated** from values published by NASA and CSA.

| Code | Name | Risks |
|---|---|---|
| A | RadShield | Radiation |
| B | Solar Alert | Radiation |
| C | Vehicle dose map | Radiation |
| D | MindLink | Isolation |
| E | CrewSync | Isolation (team and schedules) |
| F | Earth Bridge | Isolation (communication delay) |
| G | Smart Shelter | B + D + E |
| H | Cognitive Sentinel | A + D |
| I | Right Place | C + D |
| J | RadMind Hub | All |

---

## Radiation

### A · RadShield — personal dose and career risk
- **Problem:** outside the magnetosphere dose goes up, and cancer risk depends on dose accumulated over the whole career.
- **User:** crew member, flight surgeon and radiation officer.
- **Inputs:** personal and area dosimeters, including neutrons (~30 % of ISS dose per CSA), and dose from previous missions.
- **Key features:**
  - Accumulated dose per person against the career limit (⚠️ 600 mSv), with an end-of-mission projection.
  - Breakdown by radiation type: GCR, SPE and neutrons.
  - **Clear but non-alarming messages**, because how risk is shown affects mood.
- **Demo:** a simulated Mars mission where the dose bar advances and the projection changes with shielding.

### B · Solar Alert — storm warning and shelter order
- **Problem:** a solar particle event arrives fast, and the crew has little time to take cover.
- **Inputs:**
  - Space weather: public NOAA SWPC and NASA DONKI data ⚠️, with the signal delay to the vehicle.
  - Vehicle dosimeters.
- **Key features:**
  - Countdown.
  - Step checklist: who goes to which area and which tasks pause.
  - Dose tracking during the event.
  - "All clear" notice.
- **Demo:** replay a real historic solar event and show the alert and the shelter.

### C · Vehicle dose map
- **Idea:** a floor plan of the vehicle colored by the dose in each module.
- **Features:**
  - Suggests which area to sleep or work in to lower dose.
  - Adds up each person's dose from the time they spend in each area.
- **Risk:** needs a shielding model per module; demo values would be simulated.

---

## Isolation and confinement

### D · MindLink — mental wellbeing and sleep
- **Problem:** isolation, communication delay and limited privacy cause anxiety, depression and poor sleep. NASA does not describe how this is monitored onboard.
- **User:** the crew member and, only with their consent, the psychologist or flight surgeon.
- **Inputs:**
  - 1-minute daily check-in: mood, stress and energy.
  - Sleep measured by a wearable.
  - Workload and downtime.
  - Personal journal (private).
- **Key features:**
  - Personal mood and sleep trend, with a gentle notice if they drop several days in a row.
  - Suggestions based on NASA countermeasures: rest, window time, plants, journaling and lighting adjustments.
  - **Privacy first:** the crew member decides what the surgeon sees; the journal is never shared.
- **Demo:** 30 simulated days where overload lowers sleep and mood, and the system suggests a schedule change.

### E · CrewSync — team and schedules
- **Idea:** look after group dynamics.
- **Features:**
  - Planned vs. actual workload per person, with a notice if someone accumulates overload.
  - Protection of sleep hours.
  - **Anonymous** team-climate self-report.
  - Group activity suggestions.
- **Risk:** conflict data is subjective and sensitive; it can feel like surveillance.

### F · Earth Bridge — living with the delay
- **Idea:** since there are no real-time conversations on Mars, the system makes communication with family and doctors work well even when it arrives late.
- **Features:**
  - Current delay indicator.
  - Queued messages and videos.
  - "Ask the doctor" questions with answers that arrive later.
  - Local library of self-care guides so the crew doesn't depend on Earth.
- **Risk:** it looks like a messaging app; its value depends on how it is pitched.

---

## Combined (radiation + isolation)

### G · Smart Shelter (B + D + E)
- **Idea:** when a solar storm hits, the crew is **confined in the smallest, most shielded place** for hours or days. The system manages that moment, both physically and emotionally.
- **Why combine:** it is exactly where **more radiation means more confinement**.
- **Features:**
  - Alert and shelter order (from B).
  - Live dose inside the shelter and estimated exit time.
  - Rest shifts and personal space inside the shelter.
  - Activities and tasks that can be done in there.
  - Mood check-in before, during and after the event (from D).
  - Fair task sharing (from E).
- **Demo:** a simulated 30-hour solar event. It shows the alert, entering the shelter, the dose avoided, the shifts and the team's mood, and ends with a summary.

### H · Cognitive Sentinel (A + D)
- **Idea:** a 60 s daily cognitive test that, crossed with other data, suggests the **likely cause** of a poor result.
- **Why combine:** both radiation and isolation stress can lower cognitive performance ✅. Telling the cause apart changes the action: check dose or take rest.
- **Features:**
  - Reaction and memory test, compared with each person's baseline.
  - "Likely cause" card based on recent dose, sleep and mood.
  - Always a **suggestion for the surgeon**, never a diagnosis.
- **Risk:** cognitive effects of radiation are slow and hard to isolate; the demo would rely mostly on sleep and stress.

### I · Right Place (C + D)
- **Idea:** balance dose and wellbeing when deciding where to sleep, work and socialize.
- **Features:**
  - Recommends schedules and areas that lower dose without taking away privacy or social time.
  - Shows the dose cost of each option.
- **Risk:** depends on the dose map (C), which is simulated.

---

## Integrated platform

### J · RadMind Hub (all)
- **Idea:** one dashboard with two views:
  - **Crew:** simple, "how am I doing and what do I do today".
  - **Surgeon:** dose, mood and trends for the whole team.
- **Parts:**
  1. Simulated data: dosimeters, space weather, wearables and daily check-in.
  2. Rules engine and change detection against each person's baseline.
  3. Modules: dose (A), solar alert (B), wellbeing (D) and smart shelter (G).
  4. Compressed daily report to send to Earth over a slow link, with each crew member's consent.
- **Advantage:** covers the R and the I of RIDGE and shows how they affect each other.
- **Risk:** large scope for a weekend; it must be built **module by module** (see document 03).
