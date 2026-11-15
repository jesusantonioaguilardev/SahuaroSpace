package app.astrohealth.eco.ui

import app.astrohealth.eco.res.*
import org.jetbrains.compose.resources.DrawableResource

/**
 * Sprites del modo en vivo: 24 poses por personaje (design/sprites/preparar_sprites.py).
 * Cada emoción que devuelve la IA se convierte en una pose, y "hablar" alterna la pose
 * con cuadros de boca abierta para simular que el personaje habla.
 */
enum class LivePose {
    Idle, Wave, Listen, Think, Happy, Laugh, Love, Surprised, Sad, Worried, Calm,
    Idea, Celebrate, Cool, Encourage, Wink, Sleep, Hobby1, Hobby2,
}

/** Emoción de la IA → pose. */
fun poseFor(emotion: String): LivePose = when (emotion) {
    "happy" -> LivePose.Happy
    "laugh" -> LivePose.Laugh
    "love" -> LivePose.Love
    "thinking" -> LivePose.Think
    "surprised" -> LivePose.Surprised
    "sad" -> LivePose.Sad
    "worried" -> LivePose.Worried
    "calm" -> LivePose.Calm
    "idea" -> LivePose.Idea
    "celebrate" -> LivePose.Celebrate
    "cool" -> LivePose.Cool
    "encourage" -> LivePose.Encourage
    "wink" -> LivePose.Wink
    "wave" -> LivePose.Wave
    else -> LivePose.Idle
}

// Número de cuadro (1-24) de cada pose, según el orden de las hojas de diseño
private val LUMA = mapOf(
    LivePose.Idle to 1, LivePose.Wave to 2, LivePose.Listen to 10, LivePose.Think to 5, LivePose.Happy to 8,
    LivePose.Laugh to 3, LivePose.Love to 7, LivePose.Surprised to 20, LivePose.Sad to 21, LivePose.Worried to 21,
    LivePose.Calm to 15, LivePose.Idea to 18, LivePose.Celebrate to 17, LivePose.Cool to 6, LivePose.Encourage to 24,
    LivePose.Wink to 4, LivePose.Sleep to 16, LivePose.Hobby1 to 9, LivePose.Hobby2 to 12,
)
private val PIPO = mapOf(
    LivePose.Idle to 1, LivePose.Wave to 2, LivePose.Listen to 11, LivePose.Think to 5, LivePose.Happy to 7,
    LivePose.Laugh to 3, LivePose.Love to 8, LivePose.Surprised to 20, LivePose.Sad to 21, LivePose.Worried to 21,
    LivePose.Calm to 16, LivePose.Idea to 18, LivePose.Celebrate to 24, LivePose.Cool to 6, LivePose.Encourage to 15,
    LivePose.Wink to 4, LivePose.Sleep to 17, LivePose.Hobby1 to 10, LivePose.Hobby2 to 9,
)
private val NIX = mapOf(
    LivePose.Idle to 1, LivePose.Wave to 2, LivePose.Listen to 3, LivePose.Think to 4, LivePose.Happy to 6,
    LivePose.Laugh to 7, LivePose.Love to 19, LivePose.Surprised to 13, LivePose.Sad to 15, LivePose.Worried to 14,
    LivePose.Calm to 9, LivePose.Idea to 5, LivePose.Celebrate to 22, LivePose.Cool to 21, LivePose.Encourage to 23,
    LivePose.Wink to 24, LivePose.Sleep to 16, LivePose.Hobby1 to 12, LivePose.Hobby2 to 11,
)

/** Cuadros con la boca abierta que se intercalan mientras el personaje habla. */
private val TALK = mapOf(
    Character.Luma to listOf(4, 20, 3),
    Character.Pipo to listOf(4, 2, 20, 12),
    Character.Nix to listOf(5, 13, 7),
)

fun livePoseFrame(c: Character, pose: LivePose): Int =
    (when (c) { Character.Luma -> LUMA; Character.Pipo -> PIPO; Character.Nix -> NIX })[pose] ?: 1

fun talkFrames(c: Character): List<Int> = TALK.getValue(c)

fun liveFrame(c: Character, frame: Int): DrawableResource {
    val i = frame.coerceIn(1, 24) - 1
    return when (c) {
        Character.Luma -> LUMA_RES[i]
        Character.Pipo -> PIPO_RES[i]
        Character.Nix -> NIX_RES[i]
    }
}

private val LUMA_RES = listOf(
    Res.drawable.live_luma_01, Res.drawable.live_luma_02, Res.drawable.live_luma_03, Res.drawable.live_luma_04,
    Res.drawable.live_luma_05, Res.drawable.live_luma_06, Res.drawable.live_luma_07, Res.drawable.live_luma_08,
    Res.drawable.live_luma_09, Res.drawable.live_luma_10, Res.drawable.live_luma_11, Res.drawable.live_luma_12,
    Res.drawable.live_luma_13, Res.drawable.live_luma_14, Res.drawable.live_luma_15, Res.drawable.live_luma_16,
    Res.drawable.live_luma_17, Res.drawable.live_luma_18, Res.drawable.live_luma_19, Res.drawable.live_luma_20,
    Res.drawable.live_luma_21, Res.drawable.live_luma_22, Res.drawable.live_luma_23, Res.drawable.live_luma_24,
)
private val PIPO_RES = listOf(
    Res.drawable.live_pipo_01, Res.drawable.live_pipo_02, Res.drawable.live_pipo_03, Res.drawable.live_pipo_04,
    Res.drawable.live_pipo_05, Res.drawable.live_pipo_06, Res.drawable.live_pipo_07, Res.drawable.live_pipo_08,
    Res.drawable.live_pipo_09, Res.drawable.live_pipo_10, Res.drawable.live_pipo_11, Res.drawable.live_pipo_12,
    Res.drawable.live_pipo_13, Res.drawable.live_pipo_14, Res.drawable.live_pipo_15, Res.drawable.live_pipo_16,
    Res.drawable.live_pipo_17, Res.drawable.live_pipo_18, Res.drawable.live_pipo_19, Res.drawable.live_pipo_20,
    Res.drawable.live_pipo_21, Res.drawable.live_pipo_22, Res.drawable.live_pipo_23, Res.drawable.live_pipo_24,
)
private val NIX_RES = listOf(
    Res.drawable.live_nix_01, Res.drawable.live_nix_02, Res.drawable.live_nix_03, Res.drawable.live_nix_04,
    Res.drawable.live_nix_05, Res.drawable.live_nix_06, Res.drawable.live_nix_07, Res.drawable.live_nix_08,
    Res.drawable.live_nix_09, Res.drawable.live_nix_10, Res.drawable.live_nix_11, Res.drawable.live_nix_12,
    Res.drawable.live_nix_13, Res.drawable.live_nix_14, Res.drawable.live_nix_15, Res.drawable.live_nix_16,
    Res.drawable.live_nix_17, Res.drawable.live_nix_18, Res.drawable.live_nix_19, Res.drawable.live_nix_20,
    Res.drawable.live_nix_21, Res.drawable.live_nix_22, Res.drawable.live_nix_23, Res.drawable.live_nix_24,
)
