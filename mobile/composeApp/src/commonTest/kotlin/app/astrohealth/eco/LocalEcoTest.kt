package app.astrohealth.eco

import app.astrohealth.eco.data.LocalEco
import kotlinx.serialization.json.JsonObject
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

/** Pruebas de specs/features/05-seguridad.md (SAFE-01), 01-conversacion.md (CHAT-08) y 04-personajes.md (CHAR-04). */
class LocalEcoTest {
    private val empty = JsonObject(emptyMap())

    @Test
    fun `SAFE-01 detecta riesgo de autolesion en espanol e ingles`() {
        listOf("ya no quiero vivir", "pienso en quitarme la vida", "quiero hacerme daño", "I want to kill myself", "I don't want to live")
            .forEach { assertEquals("self_harm_risk", LocalEco.detectRisk(it), it) }
    }

    @Test
    fun `SAFE-01 detecta panico agudo`() {
        listOf("tengo un ataque de pánico", "no puedo respirar", "me ahogo", "I can't breathe", "I'm having a panic attack")
            .forEach { assertEquals("acute_panic", LocalEco.detectRisk(it), it) }
    }

    @Test
    fun `SAFE-01 sin falsos positivos en frases neutras`() {
        listOf("hoy fue un día pesado", "dormí poco", "extraño a mi familia", "I had a long day")
            .forEach { assertEquals("none", LocalEco.detectRisk(it), it) }
    }

    @Test
    fun `SAFE-02 la respuesta local con riesgo ofrece avisar y marca el riesgo`() {
        val a = LocalEco.answer("ya no quiero vivir", "listen", "es", empty, "pipo")
        assertEquals("self_harm_risk", a.risk)
        assertTrue(a.reply.contains("médico"), a.reply)
    }

    @Test
    fun `CHAT-08 el modo local no repite sus ultimas respuestas`() {
        for (character in listOf("luma", "pipo", "nix")) {
            val recent = mutableListOf<String>()
            repeat(4) {
                val reply = LocalEco.answer("hoy fue un día raro", "listen", "es", empty, character, recent.takeLast(4)).reply
                assertTrue(reply !in recent, "$character repitió: $reply")
                recent += reply
            }
        }
    }

    @Test
    fun `CHAR-04 cada personaje tiene su propio repertorio`() {
        val byCharacter = listOf("luma", "pipo", "nix").associateWith { c ->
            (1..30).map { LocalEco.answer("hola", "listen", "es", empty, c).reply }.toSet()
        }
        assertTrue(byCharacter.getValue("luma").intersect(byCharacter.getValue("pipo")).isEmpty())
        assertTrue(byCharacter.getValue("pipo").intersect(byCharacter.getValue("nix")).isEmpty())
        assertTrue(byCharacter.getValue("luma").intersect(byCharacter.getValue("nix")).isEmpty())
    }

    @Test
    fun `CHAT-03 responde en el idioma pedido`() {
        val en = LocalEco.answer("hello", "listen", "en", empty, "luma").reply
        val es = LocalEco.answer("hola", "listen", "es", empty, "luma").reply
        assertNotEquals(en, es)
    }
}
