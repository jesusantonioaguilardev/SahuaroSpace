# 04 · Project focus: an assistant that listens

> Spanish version: [../es/04-asistente.md](../es/04-asistente.md) · Background: [01-research.md](01-research.md) · [03-combinations-feasibility.md](03-combinations-feasibility.md)

> **Update:** the final version combines Listener, Companion and Signals for the surgeon, and adds radiation and oxygen monitoring. See [05-final-concept.md](05-final-concept.md).

## The idea in one sentence
An **onboard conversational companion** crew members can **talk to whenever they want**, especially during confinement. It can **converse** or **just listen**, without judging and without depending on Earth.

## Why it makes sense (per the sources)
- **Isolation and confinement** cause anxiety, depression and poor sleep, and affect decisions ✅.
- **On Mars there will be no real-time calls** with family or doctors, because of communication delay ✅. Psychological support from Earth arrives late.
- **Privacy is limited:** years in a space "roughly the size of a studio apartment" ✅. Sometimes there is nobody to talk to without the rest of the crew hearing.
- **A personal journal** is already a NASA countermeasure ✅. The assistant is a journal that can also respond.
- **NASA does not describe how mental health is monitored onboard** ✅.
- **Critical moment:** during a solar storm the crew is shut in the shielded shelter for hours or days ⚠️ (see document 03).
- **Precedent** ⚠️: **CIMON** (DLR, Airbus and IBM, 2018), a voice assistant, already flew on the ISS. It was mainly technical, not emotional support. Verify the details before citing it.

---

## What it is NOT
- **Not a therapist or a doctor.** It does not diagnose or prescribe.
- **It does not replace the crew or family.** It helps bring the crew member closer to them.
- **It does not monitor.** What is said belongs to the crew member; nothing is shared without their consent, except under the emergency protocol explained below.

---

## Assistant proposals

### A · Listener — just listens
- **What it does:** the crew member speaks (voice or text) and the assistant **listens**. It replies briefly: confirms it understood, reflects what it heard ("sounds like today was heavy") and asks if they want to continue.
- **For whom:** someone who needs to vent without advice.
- **Advantage:** the simplest and safest, because it gives almost no recommendations.
- **Risk:** can feel repetitive on long missions.

### B · Companion — active conversation
- **What it does:** converses, remembers what the crew member said on other days (with consent) and, when asked, suggests NASA countermeasures: rest, window time, plants, lighting, family contact.
- **Advantage:** feels more human and useful long-term.
- **Risk:** the more it converses, the higher the risk of inappropriate answers or dependence.

### C · Shelter mode — support during confinement
- **What it does:** activates with a solar alert or a confinement:
  - Calmly explains what is happening and how long is left (dose and estimated time).
  - Proposes routines for the lockdown: rest in shifts, breathing, group activities.
  - Offers a private space to talk using headphones.
- **Advantage:** brings the project's two risks together at the hardest moment.
- **Risk:** needs solar alert data; simulated in the demo.

### D · Earth Bridge
- **What it does:** helps live with the delay:
  - Records and organizes messages for family.
  - Summarizes replies that arrive hours later.
  - Shows how long the signal takes.
- **Risk:** looks like a messaging app.

### E · Signals for the surgeon (with consent)
- **What it does:** if the crew member allows it, the flight surgeon receives a general mood and sleep trend. **They never receive what was said.**
- **Advantage:** fills the psychological monitoring gap without breaking trust.
- **Risk:** if designed badly, the crew member stops using it for fear of being evaluated.

---

## Scoring

Scale 1 to 5, same criteria as document 03.

| Prop. | Name | Feas. | Data | Impact | Orig. | Demo | **Total /25** |
|---|---|---|---|---|---|---|---|
| A | Listener | 5 | 4 | 4 | 4 | 4 | **21** |
| B | Companion | 4 | 4 | 5 | 3 | 5 | **21** |
| C | Shelter mode | 4 | 4 | 5 | 5 | 5 | **23** |
| D | Earth Bridge | 4 | 4 | 4 | 3 | 3 | **18** |
| E | Signals for the surgeon | 3 | 3 | 5 | 4 | 3 | **18** |

"Data" here means how easy it is to simulate credible conversations and scenarios.

---

## Recommendation: one assistant with modes

One assistant (working name: **"Echo"**) with these modes:
1. **Listen** (default, from A): the crew member talks and the assistant keeps them company without advising.
2. **Conversation** (from B): only when the crew member asks for it ("what do you suggest?").
3. **Shelter** (from C): activates with a solar alert or a confinement.
4. **Extras if time allows:** the consented trend summary for the surgeon (E) and queued messages (D).

### Design rules
- **Listen first:** ask before advising ("do you want me to just listen, or would you like ideas?").
- **Full privacy by default:** conversations are stored only on the crew member's device, encrypted, and can be deleted.
- **Works without Earth:** the language model and voice run onboard.
- **Tone:** calm, brief, no textbook phrases.
- **Bilingual:** Spanish and English, switching when the crew member does.
- **Emergency protocol:** if it detects serious risk (self-harm or acute panic), it **says so clearly** and offers to alert the surgeon or a crewmate. This rule is explained to the crew member from day one; it is not secret.

### Possible technology
- **On a real vehicle:** a small language model running locally, offline speech recognition (e.g. Whisper ⚠️) and local synthetic voice.
- **At the hackathon:** a web app with voice or text chat. The demo can use a cloud model (e.g. the Claude API), explaining that on the real mission it would run onboard.
- **Personality and limits:** a system *prompt* with the rules above, plus examples of good and bad replies.

### Demo script (2 minutes)
1. **Normal day:** a crew member says they miss their family; Echo just listens and reflects.
2. **Asks for advice:** "what should I do?"; Echo switches to conversation and suggests recording a message for home.
3. **A solar storm arrives:** Echo enters shelter mode, calmly explains the situation and organizes shifts.
4. **Hour 20 in the shelter:** the crew member says they can't stand the lockdown; Echo stays with them and offers a breathing exercise.
5. **Close:** the privacy screen shows what is shared (nothing, or only the trend).

### Risks
| Risk | Mitigation |
|---|---|
| Harmful or made-up replies | Listen mode by default, clear limits in the *prompt*, emergency protocol and testing with hard cases. |
| Dependence on the assistant | Encourages talking with crew and family; does not try to replace them. |
| Fear of being monitored | Privacy by default, explained on the start screen. |
| Looking like therapy | Clear notice: "I'm not a therapist, I'm here to listen". |
| Model too large for the vehicle | Explain in the pitch the path to a small local model. |

### Open decisions for you
- Final assistant name ("Echo" is a working name).
- Voice, text or both in the demo?
- Keep shelter mode tied to radiation, or make it generic for any confinement?
