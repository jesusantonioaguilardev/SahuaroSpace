# 03 · Combinations and feasibility

> Spanish version: [../es/03-combinaciones-factibilidad.md](../es/03-combinaciones-factibilidad.md) · Proposals: [02-proposals.md](02-proposals.md)

## 1. How do radiation and isolation connect?

| Link | Strength | Why | Proposal |
|---|---|---|---|
| Solar storm → shelter | **Very strong** | A solar event forces the crew into the smallest, most shielded area for hours or days ⚠️. More radiation means more confinement and more stress. | G |
| Cognition | **Medium** | Radiation can impair cognitive performance ✅ and isolation affects sleep and decisions ✅. They share symptoms, but the radiation effect is slow and hard to separate. | H |
| Anxiety about cancer risk | **Medium** | Watching accumulated dose rise can cause stress ⚠️. It shapes how RadShield is designed more than it justifies a separate proposal. | A, D |
| Where to sleep and socialize | **Medium-weak** | Shielded areas are not always private or social ⚠️. Needs a shielding model we don't have. | I |
| Communication delay | **Medium** | Affects both risks: the solar alert must be handled onboard, and so must psychological support. | B, F |

**Conclusion:** the clearest and most original combination is the **solar storm shelter (G)**. It is the moment when both risks happen at the same time and in the same place.

---

## 2. Scoring each proposal

Scale 1 to 5 (5 = best). Criteria:
- **Feas.:** technical feasibility in one weekend.
- **Data:** how easy it is to get or simulate credible data.
- **Impact:** how useful it would be on a real mission.
- **Orig.:** how original it is versus what already exists.
- **Demo:** how easy it is to show in 2 minutes.

| Prop. | Name | Feas. | Data | Impact | Orig. | Demo | **Total /25** |
|---|---|---|---|---|---|---|---|
| A | RadShield | 4 | 5 | 4 | 2 | 5 | **20** |
| B | Solar Alert | 4 | 5 | 5 | 3 | 5 | **22** |
| C | Dose map | 3 | 3 | 4 | 4 | 5 | **19** |
| D | MindLink | 4 | 3 | 5 | 3 | 4 | **19** |
| E | CrewSync | 3 | 2 | 4 | 4 | 3 | **16** |
| F | Earth Bridge | 4 | 4 | 4 | 3 | 3 | **18** |
| G | Smart Shelter | 4 | 4 | 5 | 5 | 5 | **23** |
| H | Cognitive Sentinel | 3 | 2 | 4 | 5 | 4 | **18** |
| I | Right Place | 3 | 3 | 4 | 4 | 4 | **18** |
| J | RadMind Hub (all) | 2 | 3 | 5 | 4 | 4 | **18** |

**Why these scores:**
- **G** is the best:
  - It crosses both risks at a concrete moment any judge understands.
  - It uses real public space-weather data.
  - We know of no other tool that also treats the shelter as a psychological problem.
- **B** has the best data (public historic solar events) and is the base for G.
- **A** is needed but not very original, since dose dashboards already exist. What sets it apart is showing dose without alarming.
- **D** fills a real gap (NASA does not describe onboard psychological monitoring), but there are many mood apps already.
- **E** has subjective, sensitive data. **H** depends on cognitive effects of radiation that are hard to separate.
- **J** in full is too much for a weekend, but it is the **destination** if built in stages.

---

## 3. Recommendation

> **Update:** the project now focuses on an **assistant that listens**. See [04-assistant.md](04-assistant.md). This section stays as background: the Smart Shelter becomes the assistant's "shelter mode".

### Project: "RadMind Hub", with the Smart Shelter as the centerpiece
Build **J in stages**, with a simple story: **when a solar storm hits, both risks happen at once**.

**Weekend MVP:**
1. **A · RadShield:** accumulated dose per crew member and end-of-mission projection, with clear messages.
2. **B · Solar Alert:** replay a real historic solar event, with countdown and shelter order.
3. **G · Smart Shelter:** live dose, shifts, personal space and mood check-in during the event.
4. **D lite:** 1-minute daily mood and sleep check-in, with privacy control.
5. **Crew** view and **surgeon** view, in **Spanish and English** (language toggle).

**If time allows, in this order:**
6. **C · Dose map** of the vehicle (very visual in the demo).
7. **F · Earth Bridge:** delay indicator and queued messages.
8. **H · Cognitive Sentinel:** 60 s reaction test.

**Leave out for now:** E (sensitive data) and I (depends on C).

### Demo script (2 minutes)
1. Normal day en route to Mars: dose and mood for 4 crew members.
2. A replayed real solar event alert arrives; the countdown starts.
3. They enter the shelter; the system assigns shifts and shows the dose avoided.
4. At hour 20, team mood drops and the system suggests activities and rest.
5. "All clear": summary for the surgeon and for Earth.

### Suggested architecture (for when you move to code)
- **Web frontend** (HTML, CSS and JS, or React) that works offline.
- **Simulator** of mission days using the values in document 01.
- **Public space-weather data** (⚠️ NASA DONKI / NOAA SWPC) to replay a real event.
- Simple **rules engine**: thresholds and deviation from each person's baseline.

### Project risks
| Risk | Mitigation |
|---|---|
| Looking like a medical diagnosis | Clear notices: "estimate to support the flight surgeon". |
| Made-up numbers | Use only ✅ values; flag ⚠️ ones and verify them. |
| Very sensitive mental health data | The crew member decides what is shared; the journal never leaves the device. |
| Scope too large | Follow the MVP order; each module works on its own. |

### Open decisions for you
- Final project name.
- Stack: plain HTML and JS (faster) or React.
- Which historic solar event to use in the demo.
