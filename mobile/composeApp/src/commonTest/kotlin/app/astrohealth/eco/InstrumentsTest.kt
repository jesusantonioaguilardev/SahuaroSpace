package app.astrohealth.eco

import app.astrohealth.eco.data.Instrument
import app.astrohealth.eco.data.InstrumentPolicy
import app.astrohealth.eco.data.InstrumentPolicy.DAY_MS
import app.astrohealth.eco.data.InstrumentTriggers
import app.astrohealth.eco.data.Scoring
import app.astrohealth.eco.data.ScreeningState
import app.astrohealth.eco.data.Severity
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

/** Pruebas de specs/features/11-instrumentos.md (INST). */
class InstrumentsTest {

    // ------------------------------------------------------------ INST-01
    @Test
    fun `INST-01 PHQ-9 tiene 9 preguntas y GAD-7 tiene 7, en espanol e ingles`() {
        for (lang in listOf("es", "en")) {
            assertEquals(9, Instrument.PHQ.questions(lang).size)
            assertEquals(7, Instrument.GAD.questions(lang).size)
            assertEquals(4, Instrument.options(lang).size)
        }
        assertEquals(27, Instrument.PHQ.maxScore)
        assertEquals(21, Instrument.GAD.maxScore)
    }

    @Test
    fun `INST-01 la pregunta 9 del PHQ-9 es la de pensamientos de hacerse dano`() {
        assertTrue("lastimarse" in Instrument.PHQ.questions("es")[8])
        assertTrue("hurting yourself" in Instrument.PHQ.questions("en")[8])
    }

    // ------------------------------------------------------------ INST-02
    @Test
    fun `INST-02 palabras clave de animo bajo sugieren PHQ`() {
        listOf("no he podido dormir y todo me da igual", "me siento vacío", "ya no disfruto nada", "I feel hopeless")
            .forEach { assertEquals(Instrument.PHQ, InstrumentTriggers.detect(it), it) }
    }

    @Test
    fun `INST-02 palabras clave de ansiedad sugieren GAD`() {
        listOf("estoy muy ansioso, no puedo dejar de preocuparme", "no puedo relajarme", "I'm so anxious and on edge")
            .forEach { assertEquals(Instrument.GAD, InstrumentTriggers.detect(it), it) }
    }

    @Test
    fun `INST-02 frases neutras no sugieren nada`() {
        listOf("hoy fue un buen día", "terminé el experimento", "what time is it").forEach { assertNull(InstrumentTriggers.detect(it), it) }
    }

    @Test
    fun `INST-02 con riesgo nunca se ofrece un cuestionario y la sugerencia de la IA manda`() {
        assertNull(InstrumentPolicy.choose("phq", "ya no quiero vivir", "self_harm_risk"))
        assertEquals(Instrument.GAD, InstrumentPolicy.choose("gad", "hoy fue un buen día", "none"))
        assertEquals(Instrument.PHQ, InstrumentPolicy.choose("none", "todo me da igual", "none"))
        assertNull(InstrumentPolicy.choose("none", "hoy fue un buen día", "none"))
    }

    // ------------------------------------------------------------ INST-04
    @Test
    fun `INST-04 no se repite antes de 14 dias de completado`() {
        val now = 100 * DAY_MS
        val done3 = ScreeningState(completed = mapOf("phq" to now - 3 * DAY_MS))
        val done15 = ScreeningState(completed = mapOf("phq" to now - 15 * DAY_MS))
        assertFalse(InstrumentPolicy.canOffer(Instrument.PHQ, done3, now, offerOpen = false))
        assertTrue(InstrumentPolicy.canOffer(Instrument.PHQ, done15, now, offerOpen = false))
        assertTrue(InstrumentPolicy.canOffer(Instrument.GAD, done3, now, offerOpen = false), "otro instrumento sí")
    }

    @Test
    fun `INST-04 un rechazo espera 24 horas y solo hay una oferta a la vez`() {
        val now = 100 * DAY_MS
        val declined = ScreeningState(declined = mapOf("gad" to now - 2 * 60 * 60 * 1000))
        assertFalse(InstrumentPolicy.canOffer(Instrument.GAD, declined, now, offerOpen = false))
        assertTrue(InstrumentPolicy.canOffer(Instrument.GAD, declined, now + DAY_MS, offerOpen = false))
        assertFalse(InstrumentPolicy.canOffer(Instrument.PHQ, ScreeningState(), now, offerOpen = true))
    }

    // ------------------------------------------------------------ INST-05
    @Test
    fun `INST-05 version corta positiva desde 3 puntos`() {
        assertFalse(Scoring.shortPositive(listOf(1, 1)))
        assertTrue(Scoring.shortPositive(listOf(2, 1)))
        assertTrue(Scoring.shortPositive(listOf(3, 0)))
    }

    // ------------------------------------------------------------ INST-07
    @Test
    fun `INST-07 puntos de corte del PHQ-9`() {
        val cases = mapOf(0 to Severity.Minimal, 4 to Severity.Minimal, 5 to Severity.Mild, 9 to Severity.Mild,
            10 to Severity.Moderate, 14 to Severity.Moderate, 15 to Severity.ModeratelySevere, 19 to Severity.ModeratelySevere,
            20 to Severity.Severe, 27 to Severity.Severe)
        cases.forEach { (total, sev) -> assertEquals(sev, Scoring.severity(Instrument.PHQ, total), "PHQ $total") }
    }

    @Test
    fun `INST-07 puntos de corte del GAD-7`() {
        val cases = mapOf(4 to Severity.Minimal, 5 to Severity.Mild, 9 to Severity.Mild, 10 to Severity.Moderate,
            14 to Severity.Moderate, 15 to Severity.Severe, 21 to Severity.Severe)
        cases.forEach { (total, sev) -> assertEquals(sev, Scoring.severity(Instrument.GAD, total), "GAD $total") }
    }

    @Test
    fun `INST-07 el total suma 0 a 3 por pregunta`() {
        assertEquals(10, Scoring.total(listOf(3, 3, 2, 1, 1, 0, 0, 0, 0)))
        assertEquals(3, Scoring.total(listOf(5, -1)), "valores fuera de rango se acotan")
    }

    // ------------------------------------------------------------ INST-08 / INST-09
    @Test
    fun `INST-08 la pregunta 9 con cualquier respuesta mayor a 0 es riesgo`() {
        val base = List(8) { 0 }
        assertFalse(Scoring.riskItem(Instrument.PHQ, base + 0))
        assertTrue(Scoring.riskItem(Instrument.PHQ, base + 1))
        assertTrue(Scoring.riskItem(Instrument.PHQ, base + 3))
        assertFalse(Scoring.riskItem(Instrument.GAD, List(7) { 3 }), "el GAD-7 no tiene pregunta de riesgo")
        assertFalse(Scoring.riskItem(Instrument.PHQ, listOf(3, 3)), "en la versión corta no aplica")
    }

    @Test
    fun `INST-09 sugerir al medico desde nivel moderado`() {
        assertFalse(Scoring.suggestSurgeon(Severity.Mild))
        assertTrue(Scoring.suggestSurgeon(Severity.Moderate))
        assertTrue(Scoring.suggestSurgeon(Severity.Severe))
    }

    @Test
    fun `INST-09 cada nivel tiene texto en los dos idiomas`() {
        val keys = Severity.entries.map { "sev_${it.key}" } + listOf("sev_short_negative", "sev_short_positive")
        for ((lang, texts) in Strings.all()) keys.forEach { assertTrue(it in texts, "[$lang] falta $it") }
    }
}
