package app.astrohealth.eco.data

import kotlinx.serialization.Serializable

/**
 * Instrumentos de tamizaje (specs/features/11-instrumentos.md).
 * El texto es FIJO (INST-01): la IA nunca lo redacta. La puntuación es del código (INST-07).
 * PHQ‑9 y GAD‑7 © Spitzer, Williams, Kroenke y col.; se permite reproducirlos sin permiso.
 * ⚠️ Verificar el texto en español contra la versión oficial antes de un uso real.
 */
enum class Instrument(val key: String, val shortCount: Int) {
    PHQ("phq", 2),
    GAD("gad", 2);

    val items: Int get() = questions("es").size
    val maxScore: Int get() = items * 3

    fun title(lang: String): String = when (this) {
        PHQ -> if (lang == "en") "PHQ‑9 · Mood" else "PHQ‑9 · Estado de ánimo"
        GAD -> if (lang == "en") "GAD‑7 · Anxiety" else "GAD‑7 · Ansiedad"
    }

    fun shortTitle(): String = if (this == PHQ) "PHQ‑2" else "GAD‑2"

    fun stem(lang: String): String =
        if (lang == "en") "Over the last 2 weeks, how often have you been bothered by any of the following problems?"
        else "Durante las últimas 2 semanas, ¿qué tan seguido ha tenido molestias debido a los siguientes problemas?"

    fun questions(lang: String): List<String> = if (lang == "en") EN.getValue(this) else ES.getValue(this)

    companion object {
        fun of(key: String?): Instrument? = entries.firstOrNull { it.key == key }

        /** Opciones 0–3, iguales en ambos instrumentos. */
        fun options(lang: String): List<String> =
            if (lang == "en") listOf("Not at all", "Several days", "More than half the days", "Nearly every day")
            else listOf("Ningún día", "Varios días", "Más de la mitad de los días", "Casi todos los días")

        private val ES = mapOf(
            PHQ to listOf(
                "Poco interés o placer en hacer cosas",
                "Se ha sentido decaído(a), deprimido(a) o sin esperanzas",
                "Ha tenido dificultad para quedarse o permanecer dormido(a), o ha dormido demasiado",
                "Se ha sentido cansado(a) o con poca energía",
                "Sin apetito o ha comido en exceso",
                "Se ha sentido mal con usted mismo(a), o que es un fracaso o que ha quedado mal con usted mismo(a) o con su familia",
                "Ha tenido dificultad para concentrarse en ciertas actividades, tales como leer o ver la televisión",
                "¿Se ha movido o hablado tan lento que otras personas podrían haberlo notado? O lo contrario: muy inquieto(a) o agitado(a), moviéndose mucho más de lo normal",
                "Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera",
            ),
            GAD to listOf(
                "Se ha sentido nervioso(a), ansioso(a) o con los nervios de punta",
                "No ha sido capaz de parar o controlar su preocupación",
                "Se ha preocupado demasiado por motivos diferentes",
                "Ha tenido dificultad para relajarse",
                "Se ha sentido tan inquieto(a) que no ha podido quedarse quieto(a)",
                "Se ha molestado o irritado fácilmente",
                "Ha tenido miedo de que algo terrible fuera a pasar",
            ),
        )
        private val EN = mapOf(
            PHQ to listOf(
                "Little interest or pleasure in doing things",
                "Feeling down, depressed, or hopeless",
                "Trouble falling or staying asleep, or sleeping too much",
                "Feeling tired or having little energy",
                "Poor appetite or overeating",
                "Feeling bad about yourself, or that you are a failure or have let yourself or your family down",
                "Trouble concentrating on things, such as reading the newspaper or watching television",
                "Moving or speaking so slowly that other people could have noticed? Or the opposite: being so fidgety or restless that you have been moving around a lot more than usual",
                "Thoughts that you would be better off dead or of hurting yourself in some way",
            ),
            GAD to listOf(
                "Feeling nervous, anxious, or on edge",
                "Not being able to stop or control worrying",
                "Worrying too much about different things",
                "Trouble relaxing",
                "Being so restless that it is hard to sit still",
                "Becoming easily annoyed or irritable",
                "Feeling afraid as if something awful might happen",
            ),
        )
    }
}

/** Nivel por puntos de corte (INST-07). */
enum class Severity(val key: String) { Minimal("minimal"), Mild("mild"), Moderate("moderate"), ModeratelySevere("mod_severe"), Severe("severe") }

object Scoring {
    const val SHORT_POSITIVE = 3

    fun total(answers: List<Int>): Int = answers.sumOf { it.coerceIn(0, 3) }

    fun severity(instrument: Instrument, total: Int): Severity = when (instrument) {
        Instrument.PHQ -> when (total) {
            in 0..4 -> Severity.Minimal
            in 5..9 -> Severity.Mild
            in 10..14 -> Severity.Moderate
            in 15..19 -> Severity.ModeratelySevere
            else -> Severity.Severe
        }
        Instrument.GAD -> when (total) {
            in 0..4 -> Severity.Minimal
            in 5..9 -> Severity.Mild
            in 10..14 -> Severity.Moderate
            else -> Severity.Severe
        }
    }

    /** INST-05: PHQ‑2 / GAD‑2 positivo si las 2 primeras suman ≥ 3. */
    fun shortPositive(answers: List<Int>): Boolean = total(answers.take(2)) >= SHORT_POSITIVE

    /** INST-08: la pregunta 9 del PHQ‑9 (índice 8) con cualquier respuesta > 0 es riesgo. */
    fun riskItem(instrument: Instrument, answers: List<Int>): Boolean =
        instrument == Instrument.PHQ && (answers.getOrNull(8) ?: 0) > 0

    /** INST-09: sugerir hablar con el médico desde nivel moderado. */
    fun suggestSurgeon(severity: Severity): Boolean = severity.ordinal >= Severity.Moderate.ordinal
}

/** Detonadores locales por palabras clave (INST-02). La IA también puede sugerir uno. */
object InstrumentTriggers {
    private val mood = Regex(
        "(triste|deprimid|desanimad|decaíd|decaid|sin ganas|sin esperanza|todo me da igual|nada me (gusta|interesa|importa)|ya no disfruto|no disfruto|me siento vac[ií]o|vac[ií]a? por dentro|sin energ[ií]a|no tengo ganas|" +
            "depressed|hopeless|feel empty|no interest|nothing matters|don'?t enjoy|no energy)",
        RegexOption.IGNORE_CASE,
    )
    private val anxiety = Regex(
        "(ansios|ansiedad|nervios|angusti|no puedo (parar|dejar) de (pensar|preocupar)|muy preocupad|preocupad[oa] todo el tiempo|no puedo relajarme|inquiet|tens[oa] todo el tiempo|con los nervios|" +
            "anxious|anxiety|nervous|on edge|can'?t stop worrying|can'?t relax|restless|panicky)",
        RegexOption.IGNORE_CASE,
    )

    fun detect(message: String): Instrument? = when {
        anxiety.containsMatchIn(message) -> Instrument.GAD
        mood.containsMatchIn(message) -> Instrument.PHQ
        else -> null
    }
}

@Serializable
data class ScreeningResult(
    val instrument: String,
    val answers: List<Int>,
    val total: Int,
    val severity: String,
    /** true si solo se respondió la versión corta (PHQ‑2 / GAD‑2). */
    val short: Boolean,
    val at: Long,
)

/** Cuándo se ofreció, rechazó o completó cada instrumento (INST-04), en milisegundos de reloj real. */
@Serializable
data class ScreeningState(
    val completed: Map<String, Long> = emptyMap(),
    val declined: Map<String, Long> = emptyMap(),
)

object InstrumentPolicy {
    const val DAY_MS = 24L * 60 * 60 * 1000
    const val REPEAT_AFTER_COMPLETE_MS = 14 * DAY_MS
    const val REPEAT_AFTER_DECLINE_MS = DAY_MS

    /** INST-04: ¿se puede ofrecer ahora este instrumento? */
    fun canOffer(instrument: Instrument, state: ScreeningState, now: Long, offerOpen: Boolean): Boolean {
        if (offerOpen) return false
        val done = state.completed[instrument.key]
        if (done != null && now - done < REPEAT_AFTER_COMPLETE_MS) return false
        val declined = state.declined[instrument.key]
        if (declined != null && now - declined < REPEAT_AFTER_DECLINE_MS) return false
        return true
    }

    /** INST-02: qué ofrecer tras una respuesta. Con riesgo nunca se ofrece (manda SAFE). */
    fun choose(serverSuggestion: String?, message: String, risk: String): Instrument? {
        if (risk != "none") return null
        return Instrument.of(serverSuggestion) ?: InstrumentTriggers.detect(message)
    }
}
