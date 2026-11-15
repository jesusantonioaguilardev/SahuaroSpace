package app.astrohealth.eco

import app.astrohealth.eco.ui.Character
import app.astrohealth.eco.ui.LivePose
import app.astrohealth.eco.ui.livePoseFrame
import app.astrohealth.eco.ui.poseFor
import app.astrohealth.eco.ui.talkFrames
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals
import kotlin.test.assertTrue

/** Pruebas de specs/features/03-en-vivo.md (LIVE-08, LIVE-10) y 04-personajes.md (CHAR-05). */
class LiveSpritesTest {
    // Copia del contrato: specs/api/openapi.yaml → Emotion (el servidor tiene una prueba que compara ambas listas)
    private val emotions = listOf("neutral", "happy", "laugh", "love", "thinking", "surprised", "sad", "worried", "calm", "idea", "celebrate", "cool", "encourage", "wink")

    @Test
    fun `LIVE-10 toda emocion del servidor tiene una pose propia`() {
        emotions.filter { it != "neutral" }.forEach { assertNotEquals(LivePose.Idle, poseFor(it), it) }
        assertEquals(LivePose.Idle, poseFor("neutral"))
        assertEquals(LivePose.Idle, poseFor("algo-desconocido"))
    }

    @Test
    fun `LIVE-10 todas las poses de los tres personajes usan cuadros validos`() {
        for (c in Character.entries) for (p in LivePose.entries) {
            assertTrue(livePoseFrame(c, p) in 1..24, "$c $p")
        }
    }

    @Test
    fun `LIVE-08 cada personaje tiene cuadros para hablar distintos de su pose en reposo`() {
        for (c in Character.entries) {
            val talk = talkFrames(c)
            assertTrue(talk.size >= 2, "$c necesita al menos 2 cuadros de boca abierta")
            assertTrue(talk.all { it in 1..24 })
            assertTrue(livePoseFrame(c, LivePose.Idle) !in talk, "$c: el reposo no debe estar entre los cuadros de hablar")
        }
    }

    @Test
    fun `CHAR-05 las poses de estado no se confunden entre si`() {
        for (c in Character.entries) {
            val states = listOf(LivePose.Listen, LivePose.Think, LivePose.Wave).map { livePoseFrame(c, it) }
            assertEquals(states.size, states.toSet().size, "$c: escuchar, pensar y saludar deben verse distintos")
        }
    }
}
