# 05 · Final concept: Echo, an assistant that listens and looks after the crew

> Spanish version: [../es/05-concepto-final.md](../es/05-concepto-final.md) · Before: [04-assistant.md](04-assistant.md) · Sources: [01-research.md](01-research.md)

## The idea
**Echo** is an onboard assistant that does two things at once:
1. **Keeps the crew company:** it listens or converses with the crew member **by text or by voice**, especially during confinement.
2. **Looks after the body:** it monitors radiation, oxygen and other vital data, warns when something goes wrong and, with consent, informs the flight surgeon.

It combines three proposals from document 04:
- **Listener.**
- **Companion.**
- **Signals for the surgeon.**

It also adds **radiation monitoring**, to **reduce cancer risk**, and **oxygen monitoring**.

> Echo cannot "prevent" cancer. What it does is **lower the dose**: it warns of solar storms in time, shows where to take cover and keeps track of accumulated dose.

---

## How to talk to Echo: text and voice
The crew member chooses how to communicate at any moment, and can switch in the middle of a conversation.

| Mode | When it helps | How it works |
|---|---|---|
| **Voice** | Hands busy, tiredness, wanting to vent out loud | The crew member speaks and Echo replies in a calm voice. Activated with a button or a wake word ("Echo"). |
| **Text** | Little privacy (others nearby), at night, topics hard to say out loud | Written chat, like a journal that replies. |
| **Voice + text** | Always available | Everything said by voice also appears in writing on screen, and the crew member can mute Echo's voice. |

**Design details:**
- **Voice privacy:** headphones are recommended. Echo can lower its volume or switch to text if it detects other people nearby.
- **🔴 alerts:** Echo **speaks out loud** even if the crew member is in text mode, because it is an emergency. It also shows the alert on screen.
- **Language:** recognizes and replies in Spanish and English, switching when the crew member does.
- **Voice tone:** slow and warm, neither robotic nor alarming.
- **Without Earth:** on a real vehicle, speech recognition and synthetic voice run onboard, offline.

---

## The 4 modules

### 1 · Listen (from Listener)
- This is the default mode. The crew member talks and Echo keeps them company without advising.
- It asks before giving an opinion: "do you want me to just listen, or would you like ideas?".

### 2 · Companion
- Converses when asked.
- With consent, remembers what the crew member said on other days.
- Suggests NASA countermeasures: rest, window time, plants, lighting and messages for family.
- **It can tell the crew member how their data looks, in plain words.** For example: "your oxygen is fine and this week's dose was low".

### 3 · Wellbeing monitoring
It reads the sensors and compares each value with the crew member's baseline and with reference limits.

| Data | Why | Data source | Reference |
|---|---|---|---|
| **Personal radiation dose** (daily and accumulated) | Long-term cancer risk | Personal dosimeter | Career limit: 600 mSv ⚠️ |
| **Dose by area and neutrons** | Choose where to sleep and work | Area dosimeters (like CSA's CANS) | Neutrons ≈ 30 % of ISS dose ✅ |
| **Solar storm alert** | Reach the shelter in time | Space weather (NOAA SWPC / NASA DONKI ⚠️) | NOAA S-scale ⚠️ |
| **Oxygen saturation (SpO2)** | Detect hypoxia | Pulse oximeter (wearable) | Normal ≥ 95 %; below 90 % is concerning ⚠️ |
| **Cabin oxygen and pressure** | Deep-space vehicles will have a low-pressure cabin with mild hypoxia risk ✅ | Vehicle sensors | Exploration atmosphere ≈ 8.2 psia and 34 % O2 ⚠️ |
| **Cabin CO2** | Causes headaches and fatigue | Vehicle sensors | NASA limit ≈ 3 mmHg ⚠️ |
| **Heart and respiratory rate** | Stress, exertion, hypoxia | Wearable | Compare with personal baseline |
| **Sleep** (hours and interruptions) | Poor sleep hurts performance ✅ | Wearable | ≥ 7 h ⚠️ |
| **Mood and stress** | Isolation risk ✅ | 1-minute check-in or what the crew member shares | Personal trend |
| **Symptoms** (headache, confusion, vision) | Signs of hypoxia ✅ | What the crew member shares | — |

Oxygen source: [NASA – Risk of Hypoxia](https://www.nasa.gov/reference/risk-of-hypoxia/) ✅. Deep-space vehicles will use a low-pressure cabin to prepare for spacewalks, which raises the risk of mild hypoxia. Its symptoms are confusion, headaches, vision problems and poor sleep. NASA says it is developing new protocols to monitor it.

### 4 · Signals for the surgeon
There are two kinds of information, with different rules:

| Type | Examples | Shared with the surgeon? |
|---|---|---|
| **Physical safety data** | Radiation dose, SpO2, cabin O2 and CO2, alerts | **Yes, always.** It is operational mission data, and the crew member knows this from the start. |
| **Emotional wellbeing** | Mood and sleep trend | **Only with consent.** The crew member can turn it on or off at any time. |
| **Conversations** | What the crew member says to Echo | **Never.** They stay encrypted on their device. |

**Exception, known from day one:** if there is serious risk, such as self-harm or acute panic, Echo says so clearly and offers to alert the surgeon or a crewmate.

---

## How alerts are ranked
Echo must know **when to interrupt** a conversation:

| Level | Example | What Echo does |
|---|---|---|
| 🔴 **Urgent** | Solar storm incoming, low SpO2, high CO2 | Interrupts even in listen mode, calmly explains what to do and alerts the surgeon. |
| 🟡 **Attention** | Weekly dose higher than usual, three nights of poor sleep | Mentions it when the conversation ends or in the daily summary. |
| 🟢 **Normal** | Everything as expected | Only mentions it if the crew member asks. |

---

## Shelter mode (radiation + confinement)
When a solar storm hits:
1. **🔴 Alert:** Echo gives the countdown and says who goes to which shielded area.
2. **Inside the shelter:**
   - Shows live dose and estimated exit time.
   - Organizes rest shifts.
   - Monitors oxygen and CO2, since many people share a small space ⚠️.
3. **Support:** Echo listens to whoever needs it, with headphones for privacy.
4. **"All clear":** Echo gives a summary with the dose avoided and notifies the surgeon.

---

## Feasibility of the combination

| Criterion | Score (1–5) | Comment |
|---|---|---|
| Weekend feasibility | 3 | Many pieces, but each one is simple. Scope must be limited (see the MVP). |
| Data | 4 | Sensors are simulated from NASA values; space weather is public. |
| Impact | 5 | Covers physical and mental health with a single tool. |
| Originality | 5 | Joins an assistant that listens with health monitoring, while respecting privacy. |
| Demo | 5 | A conversation interrupted by a real alert is very striking. |
| **Total** | **22 / 25** | |

**Main risk:** the assistant feeling like a monitor. That is why the privacy table is central and is shown in the demo.

---

## Hackathon MVP
1. **Conversation with Echo by text and by voice**, with listen and companion modes, in Spanish and English. Voice is transcribed on screen.
2. **Simulated data panel:** radiation (daily and accumulated), SpO2, cabin O2 and CO2, heart rate and sleep.
3. **Alert engine** with the three levels. A 🔴 alert interrupts the chat.
4. **Shelter mode** with a replayed historic solar storm.
5. **Surgeon view:** safety data only and, with consent, the emotional trend.
6. **Privacy screen** where the crew member sees and controls what is shared.

**If time allows:** wake word to start voice ("Echo"), dose map by area and queued messages for family.

### Suggested architecture
- **Sensor simulator:** generates mission days with radiation, oxygen, CO2, pulse and sleep.
- **Rules engine:** compares data with limits and the baseline, and decides the alert level.
- **Echo (language model):** receives a summary of the data and the alert level, along with a system *prompt* that sets its personality, limits and emergency protocol.
  - The demo can use a cloud model, such as the Claude API.
  - On a real vehicle it would be a small local model.
- **Voice:**
  - Speech to text: the crew member speaks and it is turned into text for Echo.
  - Text to speech: Echo's reply is read aloud.
  - The demo can use the browser's Web Speech API ⚠️, which is free but may need internet depending on the browser.
  - On a real vehicle: Whisper or another local speech model ⚠️ and a local synthetic voice.
- **Web frontend:** chat with a microphone button, crew panel, surgeon view and privacy screen.

---

## Demo script (2 minutes)
1. **Normal morning, by voice:** the crew member tells Echo out loud that they miss their family, and Echo just listens and replies in a calm voice.
2. **Asks about their data, by text:** since crewmates are nearby, they type "how am I doing?". Echo answers in plain words: oxygen fine, low dose this week and two nights of little sleep.
3. **🔴 Interruption:** a solar storm arrives. Even though the crew member was in text mode, Echo **speaks out loud**, calmly stops the conversation and starts the countdown to the shelter.
4. **Inside the shelter:** live dose, CO2 rising slightly and the shifts are shown. The crew member says they can't stand the lockdown, and Echo stays with them through a breathing exercise.
5. **Surgeon view:** receives the dose and the alert, but **not** the conversation.
6. **Close:** "all clear" and the summary with the dose avoided.

---

## Open decisions for you
- Final name ("Echo" is a working name).
- What voice Echo will have (female, male or neutral), and whether the crew member can choose it.
- Should we add other data to the monitoring, such as temperature, blood pressure or hydration?
