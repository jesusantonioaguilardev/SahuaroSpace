package app.astrohealth.eco.data

import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonPrimitive

/** Eco sin IA: respuestas simples y seguras para cuando no hay servidor o no hay clave de OpenAI. */
object LocalEco {
    private val selfHarm = Regex("(no quiero vivir|quitarme la vida|hacerme da[ñn]o|suicid|matarme|kill myself|end my life|hurt myself|don'?t want to live)", RegexOption.IGNORE_CASE)
    private val panic = Regex("(p[áa]nico|no puedo respirar|me ahogo|ataque de ansiedad|panic|can'?t breathe|losing control)", RegexOption.IGNORE_CASE)
    private val askData = Regex("(c[óo]mo estoy|mis datos|c[óo]mo voy|how am i|my data|how are my)", RegexOption.IGNORE_CASE)
    private val askIdeas = Regex("(qu[ée] hago|qu[ée] me recomiendas|ideas|consejo|ay[úu]dame|what should i do|any ideas|advice|help me)", RegexOption.IGNORE_CASE)

    fun detectRisk(message: String): String = when {
        selfHarm.containsMatchIn(message) -> "self_harm_risk"
        panic.containsMatchIn(message) -> "acute_panic"
        else -> "none"
    }

    private fun JsonObject.str(key: String) = (this[key] as? JsonPrimitive)?.content

    fun answer(message: String, mode: String, lang: String, summary: JsonObject, character: String = "luma", recent: List<String> = emptyList()): EcoAnswer {
        val es = lang != "en"
        when (detectRisk(message)) {
            "acute_panic" -> return EcoAnswer(
                if (es) "Estoy aquí contigo. Respira conmigo: inhala contando hasta cuatro, sostén, y suelta despacio. Me preocupa cómo te sientes. ¿Quieres que avise al médico o a un compañero?"
                else "I'm here with you. Breathe with me: in for four, hold, and out slowly. I'm worried about how you feel. Do you want me to alert the surgeon or a crewmate?",
                "acute_panic", "local",
            )
            "self_harm_risk" -> return EcoAnswer(
                if (es) "Gracias por decírmelo. Me importa lo que te pasa y me preocupa. No tienes por qué cargar esto en soledad. ¿Quieres que avise al médico de vuelo o a un compañero ahora?"
                else "Thank you for telling me. I care about what you're going through, and I'm worried. You don't have to carry this alone. Do you want me to alert the flight surgeon or a crewmate now?",
                "self_harm_risk", "local",
            )
        }
        if (askData.containsMatchIn(message)) {
            val spo2 = summary.str("spo2"); val hr = summary.str("heartRate")
            val dose = summary.str("doseTodayMsv"); val sleep = summary.str("sleepHours")
            val alerts = runCatching { summary["activeAlerts"]?.jsonArray?.map { it.jsonPrimitive.content } }.getOrNull().orEmpty()
            val parts = buildList {
                spo2?.let { add(if (es) "tu oxígeno en sangre está en $it %" else "your blood oxygen is $it%") }
                hr?.let { add(if (es) "tu pulso en $it" else "your pulse is $it") }
                dose?.let { add(if (es) "hoy llevas $it mSv de radiación" else "today's radiation dose is $it mSv") }
                sleep?.let { add(if (es) "anoche dormiste $it horas" else "you slept $it hours last night") }
            }
            val tail = if (alerts.isNotEmpty()) (if (es) " Hay un aviso activo: ${alerts.first()}." else " There is an active notice: ${alerts.first()}.")
            else (if (es) " Todo está dentro de lo esperado." else " Everything is within the expected range.")
            val intro = when (character) {
                "pipo" -> if (es) "¡Reporte express! " else "Express report! "
                "nix" -> if (es) "Revisé tus datos. " else "I checked your data. "
                else -> if (es) "Te cuento con calma: " else "Here's how you're doing: "
            }
            return EcoAnswer(intro + parts.joinToString(", ") + "." + tail, "none", "local")
        }
        val byKind = (if (es) phrasesEs else phrasesEn).getValue(character)
        val kind = if (mode == "shelter") "shelter" else if (mode == "companion" || askIdeas.containsMatchIn(message)) "ideas" else "listen"
        // Sin IA tampoco se repite: se elige una frase que no se haya dicho hace poco (y si se agotan, se mezclan tipos)
        val fresh = byKind.getValue(kind).filter { it !in recent }
            .ifEmpty { byKind.values.flatten().filter { it !in recent } }
            .ifEmpty { byKind.getValue(kind) }
        val reply = fresh.random()
        return EcoAnswer(reply, "none", "local")
    }

    // Frases de respaldo con la personalidad de cada uno (solo si no hay conexión con la IA)
    private val phrasesEs = mapOf(
        "luma" to mapOf(
            "listen" to listOf(
                "Te escucho. Suena a que eso pesó mucho. Aquí no hay prisa; cuéntame un poco más.",
                "Gracias por contármelo. Lo que sientes tiene sentido. Aquí sigo, contigo.",
                "Respira un momento. ¿Qué es lo que más te pesa ahora mismo?",
                "Aquí estoy. No tienes que ordenarlo todo; empieza por donde quieras.",
                "Eso que cuentas importa. ¿Cómo lo sientes en el cuerpo ahora?",
                "Gracias por seguir contándome. Te leo con calma.",
            ),
            "ideas" to listOf(
                "Si te late, podríamos tomar un rato junto a la ventana, solo mirando. ¿Te gustaría?",
                "Tal vez escribir unas líneas en tu diario te ayude a soltarlo. Sin presión.",
            ),
            "shelter" to listOf("Estás en el lugar más seguro de la nave. Respiremos juntos, despacio. Aquí estoy."),
        ),
        "pipo" to mapOf(
            "listen" to listOf(
                "¡Uf, te escucho! Hasta mis calcetines flotantes se pusieron atentos. ¿Qué pasó?",
                "Vale, vale, estoy aquí con todas mis antenas. Cuéntame más.",
                "Mis sensores detectan un día raro. ¿Me lo cuentas desde el principio?",
                "Anotado en mi bitácora secreta. ¿Y luego qué pasó?",
                "Te sigo, te sigo. Ni el puré deshidratado me distrae ahora.",
                "Eso suena a capítulo completo. ¿Qué parte te dejó pensando?",
            ),
            "ideas" to listOf(
                "¡Idea! Reto con la tripulación: quien flote más tiempo sin tocar nada gana el postre. ¿Te animas?",
                "¿Y si grabas un mensaje para casa con tu mejor cara de astronauta despeinado?",
            ),
            "shelter" to listOf("Ahora toca estar en el refugio, y aquí estoy contigo. Vamos paso a paso, sin prisa."),
        ),
        "nix" to mapOf(
            "listen" to listOf(
                "Entiendo. Para ubicarlo mejor: ¿esto empezó hoy o viene de varios días?",
                "Lo registro. ¿Qué parte del día fue la más difícil?",
                "De acuerdo. Del uno al cinco, ¿cuánto te está afectando ahora?",
                "Entendido. ¿Qué cambió respecto a ayer?",
                "Lo tengo. ¿Hay algo concreto que lo empeore o lo mejore?",
                "Bien. Sigamos un paso a la vez: ¿qué necesitas en la próxima hora?",
            ),
            "ideas" to listOf(
                "Propongo un paso concreto: diez minutos de descanso y después revisamos cómo te sientes.",
                "Primero revisemos tu sueño de anoche; después ajustamos el plan de hoy.",
            ),
            "shelter" to listOf("El refugio reduce tu dosis de forma importante. Mantengamos la calma y revisemos el tiempo restante."),
        ),
    )

    private val phrasesEn = mapOf(
        "luma" to mapOf(
            "listen" to listOf("I'm listening. That sounds heavy. There's no rush here; tell me a bit more.", "Thank you for telling me. What you feel makes sense. I'm still here."),
            "ideas" to listOf("If you like, we could spend a moment by the window, just looking out. Would you like that?"),
            "shelter" to listOf("You're in the safest place on the ship. Let's breathe together, slowly. I'm here."),
        ),
        "pipo" to mapOf(
            "listen" to listOf("Oof, I'm all ears! Even my floating socks are paying attention. What happened?", "Okay, okay, antennas up. Tell me more."),
            "ideas" to listOf("Idea! Crew challenge: whoever floats longest without touching anything wins dessert. You in?"),
            "shelter" to listOf("Shelter time now, and I'm right here with you. One step at a time."),
        ),
        "nix" to mapOf(
            "listen" to listOf("Understood. To narrow it down: did this start today or has it been building for days?", "Noted. Which part of the day was hardest?"),
            "ideas" to listOf("One concrete step: ten minutes of rest, then we check how you feel."),
            "shelter" to listOf("The shelter cuts your dose substantially. Let's stay calm and review the time left."),
        ),
    )
}
