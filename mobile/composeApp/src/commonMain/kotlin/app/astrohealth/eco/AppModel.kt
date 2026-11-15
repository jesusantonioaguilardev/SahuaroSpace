package app.astrohealth.eco

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import app.astrohealth.eco.data.AccessLogEntry
import app.astrohealth.eco.data.Alert
import app.astrohealth.eco.data.AlertType
import app.astrohealth.eco.data.ChatMessage
import app.astrohealth.eco.data.CheckIn
import app.astrohealth.eco.data.CrewMember
import app.astrohealth.eco.data.CrewStatus
import app.astrohealth.eco.data.DoseCareer
import app.astrohealth.eco.data.DoseDaily
import app.astrohealth.eco.data.EcoAnswer
import app.astrohealth.eco.data.EcoClient
import app.astrohealth.eco.data.Instrument
import app.astrohealth.eco.data.InstrumentPolicy
import app.astrohealth.eco.data.Scoring
import app.astrohealth.eco.data.ScreeningResult
import app.astrohealth.eco.data.ScreeningState
import app.astrohealth.eco.data.EcoTurn
import app.astrohealth.eco.data.LatestReading
import app.astrohealth.eco.data.LocalSettings
import app.astrohealth.eco.data.Mission
import app.astrohealth.eco.data.PrivateData
import app.astrohealth.eco.data.Repository
import app.astrohealth.eco.data.ShelterAssignment
import app.astrohealth.eco.data.ShelterSession
import app.astrohealth.eco.data.ShelterShift
import app.astrohealth.eco.data.SimState
import app.astrohealth.eco.data.WellbeingTrend
import app.astrohealth.eco.data.Zone
import app.astrohealth.eco.platform.AudioPlayer
import app.astrohealth.eco.platform.Speech
import app.astrohealth.eco.ui.Character
import app.astrohealth.eco.ui.Mood
import app.astrohealth.eco.platform.defaultServerUrl
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atStartOfDayIn
import kotlinx.datetime.toLocalDateTime
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import kotlin.math.roundToInt
import kotlin.time.Duration
import kotlin.time.Duration.Companion.minutes

enum class Phase { Loading, NoConfig, Login, Rules, Main }
enum class Route { Today, Eco, Data, CheckIn, Shelter, Privacy }

const val RULES_VERSION = "v1"

/** Estado de la app y lógica (se actualiza cada pocos segundos desde Supabase). */
class AppModel(private val repo: Repository?, private val scope: CoroutineScope) {
    private val eco = EcoClient()

    var phase by mutableStateOf(if (repo == null) Phase.NoConfig else Phase.Loading)
    var busy by mutableStateOf(false)
    var error by mutableStateOf<String?>(null)
    var toast by mutableStateOf<String?>(null)
    var route by mutableStateOf(Route.Today)

    var crewMember by mutableStateOf<CrewMember?>(null)
    var mission by mutableStateOf<Mission?>(null)
    var zones by mutableStateOf<List<Zone>>(emptyList())
    var crew by mutableStateOf<List<CrewMember>>(emptyList())
    var alertTypes by mutableStateOf<Map<String, AlertType>>(emptyMap())
    var sim by mutableStateOf<SimState?>(null)
    var latest by mutableStateOf<List<LatestReading>>(emptyList())
    var status by mutableStateOf<CrewStatus?>(null)
    var career by mutableStateOf<DoseCareer?>(null)
    var doseToday by mutableStateOf<DoseDaily?>(null)
    var alerts by mutableStateOf<List<Alert>>(emptyList())
    var acks by mutableStateOf<Set<String>>(emptySet())
    var shelter by mutableStateOf<ShelterSession?>(null)
    var assignments by mutableStateOf<List<ShelterAssignment>>(emptyList())
    var shifts by mutableStateOf<List<ShelterShift>>(emptyList())
    var consents by mutableStateOf<Map<String, Boolean>>(emptyMap())
    var accessLog by mutableStateOf<List<AccessLogEntry>>(emptyList())
    var history by mutableStateOf<Map<String, List<Double>>>(emptyMap())

    // Privado del dispositivo
    var settings by mutableStateOf(LocalSettings())
    var chat by mutableStateOf<List<ChatMessage>>(emptyList())
    var checkIns by mutableStateOf<List<CheckIn>>(emptyList())
    /** Lo que los personajes recuerdan de la persona (memoria a largo plazo, cifrada en el teléfono). */
    var memory by mutableStateOf<List<String>>(emptyList())
    var ecoMode by mutableStateOf("listen")
    var pending by mutableStateOf(false)
    var lastSource by mutableStateOf<String?>(null)
    var lastReason by mutableStateOf<String?>(null)
    var escalation by mutableStateOf<String?>(null)
    var speaking by mutableStateOf(false)

    private var priv: PrivateData? = null
    private val spoken = mutableSetOf<String>()
    private var poller: Job? = null
    private var tick = 0

    val me get() = crewMember
    val lang get() = settings.lang
    val serverUrl get() = settings.serverUrl.ifBlank { defaultServerUrl }
    val character get() = Character.of(settings.character)

    /** Expresión del personaje según lo que está pasando. */
    val mood: Mood get() = when {
        escalation != null -> Mood.Sad
        pendingUrgent != null -> Mood.Worried
        pending -> Mood.Thinking
        inShelter -> Mood.Calm
        speaking -> Mood.Speaking
        chat.isEmpty() -> Mood.Wave
        else -> Mood.Idle
    }

    /**
     * Habla con la voz del personaje (ElevenLabs, vía el servidor).
     * Si no hay voz disponible, usa la voz del sistema.
     */
    fun say(text: String) {
        if (!settings.speak) return
        val who = character
        scope.launch {
            val mp3 = eco.voice(serverUrl, repo?.accessToken, text, who.key, lang)
            if (mp3 != null && mp3.isNotEmpty()) {
                Speech.stop()
                speaking = true
                runCatching { AudioPlayer.play(mp3) { speaking = false } }.onFailure {
                    speaking = false
                    Speech.speak(text, lang, settings.rate)
                }
            } else {
                Speech.speak(text, lang, settings.rate)
            }
        }
    }

    fun stopVoice() {
        AudioPlayer.stop()
        Speech.stop()
        speaking = false
    }

    // -----------------------------------------------------------------
    // Sesión
    // -----------------------------------------------------------------
    fun start() {
        if (repo == null) return
        scope.launch {
            val u = runCatching { repo.restore() }.getOrNull()
            if (u == null) phase = Phase.Login else afterLogin()
        }
    }

    fun login(email: String, password: String) {
        if (repo == null || busy) return
        busy = true
        error = null
        scope.launch {
            try {
                repo.login(email, password)
                afterLogin()
            } catch (e: Exception) {
                error = e.message?.takeIf { it.startsWith("Esta app") } ?: t("error", "msg" to (e.message ?: "login"))
                phase = Phase.Login
            } finally {
                busy = false
            }
        }
    }

    private suspend fun afterLogin() {
        val r = repo ?: return
        val c = r.crewMember()
        crewMember = c
        priv = PrivateData(c.id)
        settings = priv!!.settings.let { if (it == LocalSettings()) it.copy(lang = c.language) else it }
        Strings.lang = settings.lang
        chat = priv!!.conversation(character.key)
        memory = priv!!.memory()
        screenings = priv!!.screenings()
        checkIns = priv!!.checkIns()
        mission = r.mission()
        zones = r.zones()
        crew = r.crew()
        alertTypes = r.alertTypes().associateBy { it.code }
        phase = if (r.acceptedRules(RULES_VERSION)) Phase.Main else Phase.Rules
        startPolling()
    }

    fun acceptRules(speak: Boolean, character: Character) {
        val r = repo ?: return
        scope.launch {
            runCatching { r.acceptRules(RULES_VERSION) }
            updateSettings(settings.copy(speak = speak, character = character.key))
            phase = Phase.Main
        }
    }

    fun logout() {
        scope.launch {
            poller?.cancel()
            stopVoice()
            repo?.logout()
            crewMember = null
            chat = emptyList()
            phase = Phase.Login
        }
    }

    private fun startPolling() {
        poller?.cancel()
        poller = scope.launch {
            while (true) {
                refresh()
                delay(3000)
            }
        }
    }

    // -----------------------------------------------------------------
    // Datos
    // -----------------------------------------------------------------
    suspend fun refresh() {
        val r = repo ?: return
        try {
            sim = r.simState()
            latest = r.latest()
            status = r.status()
            career = r.career()
            doseToday = r.doseDay(simDay())
            alerts = r.openAlerts()
            acks = r.myAcks().map { it.alertId }.toSet()
            val sh = r.openShelter()
            shelter = sh
            if (sh != null && sh.endedAt == null) {
                assignments = r.assignments(sh.id)
                shifts = r.shifts(sh.id)
            }
            if (tick % 5 == 0) {
                consents = r.consents().associate { it.scope to it.granted }
                accessLog = r.accessLog()
            }
            if (route == Route.Data || tick % 10 == 0) {
                history = listOf("spo2_pct", "heart_rate_bpm", "resp_rate_bpm", "dose_rate_usv_h")
                    .associateWith { m -> r.history(m).map { it.value } }
            }
            tick++
            error = null
            announceUrgent()
        } catch (e: Exception) {
            error = t("error", "msg" to (e.message ?: "?"))
        }
    }

    fun reading(metric: String): LatestReading? = latest.firstOrNull { it.crewMemberId == me?.id && it.metric == metric }
    fun zoneReading(zoneId: String?, metric: String): LatestReading? =
        latest.firstOrNull { it.crewMemberId == null && it.zoneId == zoneId && it.metric == metric }

    /** Zona donde estoy ahora (según la última lectura de mis sensores). */
    val myZoneId: String? get() = reading("spo2_pct")?.zoneId ?: reading("dose_rate_usv_h")?.zoneId

    val stormActive get() = shelter?.endedAt == null && shelter != null
    val myAssignment get() = assignments.firstOrNull { it.crewMemberId == me?.id }
    val inShelter get() = stormActive && myAssignment?.arrivedAt != null
    val effectiveMode get() = if (inShelter) "shelter" else ecoMode

    fun simNow(): Instant = sim?.simClock?.let { parseInstant(it) } ?: Clock.System.now()
    fun simDay(): String = simNow().toLocalDateTime(TimeZone.UTC).date.toString()
    fun missionDay(): Int {
        val start = mission?.startDate?.let { LocalDate.parse(it).atStartOfDayIn(TimeZone.UTC) } ?: return 0
        return ((simNow() - start).inWholeDays + 1).toInt()
    }

    /** Tiempo transcurrido de misión (MET) en formato DDD:HH:MM. */
    fun met(): String {
        val start = mission?.startDate?.let { LocalDate.parse(it).atStartOfDayIn(TimeZone.UTC) } ?: return "—"
        val mins = (simNow() - start).inWholeMinutes.coerceAtLeast(0)
        val d = mins / 1440
        val h = (mins % 1440) / 60
        val m = mins % 60
        return "${d.toString().padStart(3, '0')}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}"
    }

    fun stormArrival(): Instant? = shelter?.let { parseInstant(it.startedAt) + 30.minutes }
    fun stormEnd(): Instant? = shelter?.expectedEndAt?.let { parseInstant(it) }

    fun alertTitle(a: Alert): String {
        val type = alertTypes[a.alertTypeId]
        return if (lang == "en") type?.titleEn ?: a.messageEn else type?.titleEs ?: a.messageEs
    }
    fun alertSteps(a: Alert): List<String> = alertTypes[a.alertTypeId]?.let { if (lang == "en") it.stepsEn else it.stepsEs }.orEmpty()

    val myOpenAlerts get() = alerts.filter { it.crewMemberId == null || it.crewMemberId == me?.id }

    /** Alerta urgente que aún no reconozco: se muestra en pantalla completa. */
    val pendingUrgent: Alert? get() = myOpenAlerts.firstOrNull { it.level == "urgent" && it.id !in acks }

    // Las alertas urgentes se leen en voz alta aunque la voz de Eco esté apagada
    private fun announceUrgent() {
        val a = pendingUrgent ?: return
        if (!spoken.add(a.id)) return
        AudioPlayer.stop()
        Speech.speak("${alertTitle(a)}. ${alertSteps(a).joinToString(". ")}.", lang, settings.rate)
        scope.launch { runCatching { repo?.markSpoken(a.id) } }
    }

    fun acknowledge(alert: Alert, thenShelter: Boolean) {
        stopVoice()
        acks = acks + alert.id
        if (thenShelter) route = Route.Shelter
        scope.launch {
            runCatching { repo?.acknowledge(alert.id) }
            refresh()
        }
    }

    fun arrive() {
        val sh = shelter ?: return
        scope.launch {
            runCatching { repo?.markArrived(sh.id) }
            refresh()
        }
    }

    // -----------------------------------------------------------------
    // Eco
    // -----------------------------------------------------------------
    fun summary(): JsonObject {
        val c = me
        val zone = zones.firstOrNull { it.id == myZoneId }
        val zoneO2 = zoneReading(myZoneId, "cabin_o2_pct")
        val zoneCo2 = zoneReading(myZoneId, "cabin_co2_mmhg")
        return buildJsonObject {
            put("name", c?.displayName)
            put("missionDay", missionDay())
            put("location", zone?.name)
            put("overallStatus", status?.overallLevel ?: "normal")
            reading("spo2_pct")?.let { put("spo2", it.value.roundToInt()) }
            reading("heart_rate_bpm")?.let { put("heartRate", it.value.roundToInt()) }
            reading("resp_rate_bpm")?.let { put("respRate", it.value.roundToInt()) }
            reading("sleep_minutes")?.let { put("sleepHours", round1(it.value / 60)) }
            put("doseTodayMsv", round2(doseToday?.totalMsv ?: 0.0))
            career?.let {
                put("careerDoseMsv", it.careerDoseMsv.roundToInt())
                put("careerLimitMsv", it.careerLimitMsv.roundToInt())
                put("careerPct", it.pctOfLimit.roundToInt())
            }
            zoneO2?.let { put("cabinO2Pct", round1(it.value)) }
            zoneCo2?.let { put("cabinCo2Mmhg", round1(it.value)) }
            putJsonArray("activeAlerts") { myOpenAlerts.forEach { add(kotlinx.serialization.json.JsonPrimitive(alertTitle(it))) } }
            putJsonObject("shelter") {
                put("active", stormActive)
                if (stormActive) {
                    put("inShelter", inShelter)
                    stormEnd()?.let { put("hoursLeft", ((it - simNow()).inWholeMinutes / 60.0).roundToInt().coerceAtLeast(0)) }
                    zoneReading(myZoneId, "dose_rate_usv_h")?.let { put("doseRateHereUsvH", it.value.roundToInt()) }
                }
            }
            checkIns.lastOrNull()?.let { put("lastCheckinMood", it.mood) }
        }
    }

    /** Saludo con el que abre el personaje (también va en el historial para que no vuelva a presentarse). */
    fun greeting(): String {
        val first = me?.displayName?.substringBefore(' ').orEmpty()
        return if (effectiveMode == "shelter") t("eco_hello_shelter", "name" to first) else t("hello_${character.key}", "name" to first)
    }

    fun send(text: String, voice: Boolean) {
        val msg = text.trim()
        if (msg.isEmpty() || pending) return
        val who = character
        val history = (listOf(ChatMessage("eco", greeting())) + chat).takeLast(20)
            .map { EcoTurn(if (it.role == "eco") "assistant" else "user", it.text) }
        chat = chat + ChatMessage("me", msg, voice, simNow().toString())
        priv?.saveConversation(who.key, chat)
        pending = true
        scope.launch {
            val ans = eco.ask(serverUrl, repo?.accessToken, msg, effectiveMode, who.key, lang, summary(), history, if (settings.memory) memory else emptyList())
            pending = false
            lastSource = ans.source
            lastReason = ans.reason
            remember(ans.remember)
            maybeOfferInstrument(ans, msg)
            val reply = ChatMessage("eco", ans.reply, at = simNow().toString())
            if (character == who) {
                chat = chat + reply
                priv?.saveConversation(who.key, chat)
                say(ans.reply)
            } else {
                // La persona cambió de personaje mientras esperaba: la respuesta se guarda en la conversación de quien la dio
                priv?.let { it.saveConversation(who.key, it.conversation(who.key) + reply) }
            }
            if (ans.risk != "none") escalation = ans.risk
        }
    }

    // -----------------------------------------------------------------
    // Modo en vivo: conversación por voz casi en tiempo real con sprites
    // -----------------------------------------------------------------
    var liveOpen by mutableStateOf(false)
    /** Expresión que eligió la IA para la última respuesta (mueve el sprite). */
    var liveEmotion by mutableStateOf("wave")
    /** Último texto dicho por el personaje y por la persona (subtítulos). */
    var liveReply by mutableStateOf("")
    var liveHeard by mutableStateOf("")

    fun openLive() {
        stopVoice()
        liveEmotion = "wave"
        liveHeard = ""
        liveReply = t("live_hello_${character.key}", "name" to (me?.displayName?.substringBefore(' ').orEmpty()))
        liveOpen = true
        speakLive(liveReply, null)
    }

    fun closeLive() {
        stopVoice()
        liveOpen = false
    }

    /** Un turno en vivo: una sola llamada trae la respuesta, la emoción y la voz. */
    fun liveSend(text: String) {
        val msg = text.trim()
        if (msg.isEmpty() || pending) return
        val who = character
        val history = (listOf(ChatMessage("eco", greeting())) + chat).takeLast(20)
            .map { EcoTurn(if (it.role == "eco") "assistant" else "user", it.text) }
        liveHeard = msg
        liveReply = ""
        chat = chat + ChatMessage("me", msg, true, simNow().toString())
        priv?.saveConversation(who.key, chat)
        pending = true
        scope.launch {
            val ans = eco.ask(serverUrl, repo?.accessToken, msg, effectiveMode, who.key, lang, summary(), history,
                if (settings.memory) memory else emptyList(), live = true)
            pending = false
            lastSource = ans.source
            lastReason = ans.reason
            remember(ans.remember)
            maybeOfferInstrument(ans, msg)
            chat = chat + ChatMessage("eco", ans.reply, at = simNow().toString())
            priv?.saveConversation(who.key, chat)
            liveEmotion = if (ans.risk != "none") "worried" else ans.emotion
            liveReply = ans.reply
            if (ans.risk != "none") escalation = ans.risk
            speakLive(ans.reply, ans.audio)
        }
    }

    /** Reproduce la voz del personaje; mientras suena, speaking = true (el sprite "habla"). */
    private fun speakLive(text: String, audio: ByteArray?) {
        val who = character
        speaking = true // de inmediato: así la pantalla no empieza a escuchar antes de que hable
        scope.launch {
            val mp3 = audio ?: if (settings.speak) eco.voice(serverUrl, repo?.accessToken, text, who.key, lang) else null
            if (!liveOpen) { speaking = false; return@launch }
            val estimate = (text.length * 62L).coerceIn(1500L, 12000L)
            if (settings.speak && mp3 != null && mp3.isNotEmpty()) {
                Speech.stop()
                val ok = runCatching { AudioPlayer.play(mp3) { speaking = false } }.isSuccess
                if (!ok) { Speech.speak(text, lang, settings.rate); delay(estimate); speaking = false }
            } else {
                // Sin voz del personaje: voz del sistema (o solo subtítulos si la voz está apagada)
                if (settings.speak) Speech.speak(text, lang, settings.rate)
                delay(estimate)
                speaking = false
            }
        }
    }

    // -----------------------------------------------------------------
    // Cuestionarios PHQ‑9 / GAD‑7 (specs/features/11-instrumentos.md)
    // -----------------------------------------------------------------
    /** Cuestionario en curso: respuestas, pregunta actual y si ya es la versión completa. */
    data class InstrumentRun(
        val instrument: Instrument,
        val answers: List<Int> = emptyList(),
        val index: Int = 0,
        val full: Boolean = false,
        val askContinue: Boolean = false,
        val result: ScreeningResult? = null,
    )

    var instrumentOffer by mutableStateOf<Instrument?>(null)
    var instrumentRun by mutableStateOf<InstrumentRun?>(null)
    var screenings by mutableStateOf<List<ScreeningResult>>(emptyList())
    private val nowMs get() = Clock.System.now().toEpochMilliseconds()

    /** INST-02/04: tras cada respuesta, decide si se ofrece un cuestionario. */
    private fun maybeOfferInstrument(ans: EcoAnswer, message: String) {
        val inst = InstrumentPolicy.choose(ans.instrument, message, ans.risk) ?: return
        val state = priv?.screeningState ?: ScreeningState()
        if (InstrumentPolicy.canOffer(inst, state, nowMs, offerOpen = instrumentOffer != null || instrumentRun != null)) {
            instrumentOffer = inst
        }
    }

    fun acceptInstrument() {
        val inst = instrumentOffer ?: return
        stopVoice()
        instrumentOffer = null
        instrumentRun = InstrumentRun(inst)
    }

    fun declineInstrument() {
        val inst = instrumentOffer ?: return
        instrumentOffer = null
        priv?.let { it.screeningState = it.screeningState.let { s -> s.copy(declined = s.declined + (inst.key to nowMs)) } }
    }

    /** INST-05/06/08: registra la respuesta y avanza. */
    fun answerInstrument(value: Int) {
        val run = instrumentRun ?: return
        val answers = run.answers.take(run.index) + value
        // INST-08: pregunta 9 del PHQ‑9 con riesgo → protocolo de emergencia de inmediato
        if (Scoring.riskItem(run.instrument, answers)) {
            finishInstrument(run.copy(answers = answers), short = false)
            val msg = t("inst_risk_msg")
            chat = chat + ChatMessage("eco", msg, at = simNow().toString())
            priv?.saveConversation(character.key, chat)
            escalation = "self_harm_risk"
            say(msg)
            return
        }
        val limit = if (run.full) run.instrument.items else run.instrument.shortCount
        val next = run.index + 1
        instrumentRun = when {
            next < limit -> run.copy(answers = answers, index = next)
            !run.full && Scoring.shortPositive(answers) -> run.copy(answers = answers, askContinue = true)
            else -> { finishInstrument(run.copy(answers = answers), short = !run.full); instrumentRun }
        }
    }

    fun continueInstrument() {
        val run = instrumentRun ?: return
        instrumentRun = run.copy(full = true, askContinue = false, index = run.instrument.shortCount)
    }

    fun stopInstrumentAtShort() {
        val run = instrumentRun ?: return
        finishInstrument(run, short = true)
    }

    fun backInstrument() {
        val run = instrumentRun ?: return
        instrumentRun = when {
            run.askContinue -> run.copy(askContinue = false, index = run.instrument.shortCount - 1)
            run.index > 0 -> run.copy(index = run.index - 1)
            else -> run
        }
    }

    /** Cierra el cuestionario; si no se terminó, no se guarda nada (INST-06). */
    fun closeInstrument() {
        instrumentRun = null
    }

    private fun finishInstrument(run: InstrumentRun, short: Boolean) {
        val answers = if (short) run.answers.take(run.instrument.shortCount) else run.answers
        val total = Scoring.total(answers)
        val result = ScreeningResult(
            instrument = run.instrument.key,
            answers = answers,
            total = total,
            severity = if (short) (if (Scoring.shortPositive(answers)) "short_positive" else "short_negative")
            else Scoring.severity(run.instrument, total).key,
            short = short,
            at = nowMs,
        )
        screenings = screenings + result
        priv?.saveScreenings(screenings)
        priv?.let { it.screeningState = it.screeningState.let { s -> s.copy(completed = s.completed + (run.instrument.key to nowMs)) } }
        instrumentRun = run.copy(answers = answers, askContinue = false, result = result)
    }

    private fun remember(facts: List<String>) {
        if (!settings.memory || facts.isEmpty()) return
        val known = memory.map { it.lowercase().trim() }.toSet()
        val fresh = facts.map { it.trim() }.filter { it.isNotEmpty() && it.lowercase() !in known }
        if (fresh.isEmpty()) return
        memory = (memory + fresh).takeLast(PrivateData.MAX_FACTS)
        priv?.saveMemory(memory)
    }

    fun forgetFact(fact: String) {
        memory = memory - fact
        priv?.saveMemory(memory)
        if (memory.isEmpty()) priv?.deleteMemory()
    }

    fun forgetAll() {
        memory = emptyList()
        priv?.deleteMemory()
    }

    /** INST-13: borra resultados y bloqueos de frecuencia; los cuestionarios se pueden ofrecer de nuevo. */
    fun clearScreenings() {
        priv?.deleteScreenings()
        screenings = emptyList()
        instrumentOffer = null
    }

    fun confirmEscalation(yes: Boolean) {
        val category = escalation ?: return
        escalation = null
        if (!yes) return
        scope.launch {
            runCatching { repo?.escalate(category, simNow().toString()) }
            val sent = t("esc_sent_${character.key}")
            chat = chat + ChatMessage("eco", sent, at = simNow().toString())
            priv?.saveConversation(character.key, chat)
            say(sent)
        }
    }

    fun clearChat() {
        chat = emptyList()
        priv?.deleteConversation(character.key)
    }

    // -----------------------------------------------------------------
    // Check-in, privacidad y ajustes
    // -----------------------------------------------------------------
    fun saveCheckIn(c: CheckIn) {
        val entry = c.copy(day = simDay())
        priv?.addCheckIn(entry)
        checkIns = priv?.checkIns().orEmpty()
        scope.launch {
            runCatching { repo?.reportSymptoms(entry.symptoms, simNow().toString()) }
            shareTrendIfAllowed()
        }
        toast = t("checkin_saved_${character.key}")
        route = Route.Today
    }

    private suspend fun shareTrendIfAllowed() {
        if (consents["mood_trend"] != true) return
        val day = simDay()
        val today = checkIns.filter { it.day == day }
        if (today.isEmpty()) return
        fun avg(f: (CheckIn) -> Int) = round1(today.map(f).average())
        runCatching { repo?.shareTrend(WellbeingTrend(me!!.id, day, avg { it.mood }, avg { it.stress }, avg { it.energy })) }
    }

    fun setConsent(scope_: String, granted: Boolean) {
        consents = consents + (scope_ to granted)
        scope.launch {
            runCatching { repo?.setConsent(scope_, granted) }
            if (scope_ == "mood_trend" && granted) shareTrendIfAllowed()
        }
    }

    fun updateSettings(s: LocalSettings) {
        val langChanged = s.lang != settings.lang
        val characterChanged = s.character != settings.character
        settings = s
        priv?.settings = s
        Strings.lang = s.lang
        if (!s.memory) {
            priv?.deleteAllConversations(Character.entries.map { it.key })
            forgetAll()
        } else if (!characterChanged) priv?.saveConversation(s.character, chat)
        // Cada personaje retoma su propia conversación
        if (characterChanged) chat = priv?.conversation(s.character).orEmpty()
        if (!s.speak) stopVoice()
        if (langChanged) scope.launch { runCatching { repo?.setLanguage(s.lang) } }
    }

    fun deleteAllConversations() {
        chat = emptyList()
        priv?.deleteAllConversations(Character.entries.map { it.key })
        forgetAll()
        priv?.deleteScreenings()
        screenings = emptyList()
        toast = t("deleted")
    }
}

// ---------------------------------------------------------------------
fun parseInstant(s: String): Instant = Instant.parse(s.replace(" ", "T"))
fun round1(v: Double) = (v * 10).roundToInt() / 10.0
fun round2(v: Double) = (v * 100).roundToInt() / 100.0

fun formatDuration(d: Duration): String {
    val total = d.inWholeMinutes.coerceAtLeast(0)
    val h = total / 60
    val m = total % 60
    return if (h > 0) "$h h ${m.toString().padStart(2, '0')} min" else "$m min"
}

fun clock(i: Instant): String = i.toLocalDateTime(TimeZone.UTC).let {
    "${it.hour.toString().padStart(2, '0')}:${it.minute.toString().padStart(2, '0')}"
}
