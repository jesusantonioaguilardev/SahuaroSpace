package app.astrohealth.eco.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.res.*
import app.astrohealth.eco.t
import org.jetbrains.compose.resources.DrawableResource
import org.jetbrains.compose.resources.painterResource

/** Los tres personajes de Eco. Cada uno con su voz de ElevenLabs y su personalidad. */
enum class Character(val key: String, val displayName: String, val voiceName: String, val color: Color) {
    Luma("luma", "Luma", "Matilda", Color(0xFF3FD99A)),
    Pipo("pipo", "Pipo", "Jessica", Color(0xFFFFB627)),
    Nix("nix", "Nix", "Eric", Color(0xFF5B8CFF));

    companion object {
        fun of(key: String?) = entries.firstOrNull { it.key == key } ?: Luma
    }
}

/** Estado de ánimo que se muestra en el personaje según lo que pasa en la app. */
enum class Mood { Idle, Wave, Thinking, Listening, Speaking, Happy, Love, Calm, Sad, Worried, Reading, Celebrate, Idea, Cool }

/**
 * Cómo actúa cada personaje según su personalidad:
 * - Luma (empática): se acerca con cariño; al hablar sostiene un corazón, en calma medita.
 * - Pipo (chistoso): siempre en movimiento; saluda brincando, al hablar celebra, al pensar se rasca la cabeza.
 * - Nix (analítico): consulta su tableta; al hablar propone una idea, al pensar revisa datos.
 */
fun personaMood(c: Character, mood: Mood): Mood = when (c) {
    Character.Luma -> when (mood) {
        Mood.Speaking -> Mood.Love
        Mood.Happy -> Mood.Love
        else -> mood
    }
    Character.Pipo -> when (mood) {
        Mood.Idle -> Mood.Happy
        Mood.Speaking -> Mood.Celebrate
        Mood.Wave -> Mood.Wave
        Mood.Calm -> Mood.Calm
        else -> mood
    }
    Character.Nix -> when (mood) {
        Mood.Idle -> Mood.Reading
        Mood.Speaking -> Mood.Idea
        Mood.Thinking -> Mood.Thinking
        Mood.Happy -> Mood.Idea
        else -> mood
    }
}

fun characterImage(c: Character, mood: Mood): DrawableResource = imageFor(c, personaMood(c, mood))

private fun imageFor(c: Character, mood: Mood): DrawableResource = when (c) {
    Character.Luma -> when (mood) {
        Mood.Idle -> Res.drawable.luma_idle
        Mood.Wave -> Res.drawable.luma_wave
        Mood.Thinking -> Res.drawable.luma_thinking
        Mood.Listening -> Res.drawable.luma_music
        Mood.Speaking -> Res.drawable.luma_love
        Mood.Happy -> Res.drawable.luma_joy
        Mood.Love -> Res.drawable.luma_love
        Mood.Calm -> Res.drawable.luma_meditate
        Mood.Sad -> Res.drawable.luma_sad
        Mood.Worried -> Res.drawable.luma_surprised
        Mood.Reading -> Res.drawable.luma_reading
        Mood.Celebrate -> Res.drawable.luma_cheer
        Mood.Idea -> Res.drawable.luma_idea
        Mood.Cool -> Res.drawable.luma_cool
    }
    Character.Pipo -> when (mood) {
        Mood.Idle -> Res.drawable.pipo_idle
        Mood.Wave -> Res.drawable.pipo_wave
        Mood.Thinking -> Res.drawable.pipo_thinking
        Mood.Listening -> Res.drawable.pipo_music
        Mood.Speaking -> Res.drawable.pipo_celebrate
        Mood.Happy -> Res.drawable.pipo_joy
        Mood.Love -> Res.drawable.pipo_love
        Mood.Calm -> Res.drawable.pipo_meditate
        Mood.Sad -> Res.drawable.pipo_sad
        Mood.Worried -> Res.drawable.pipo_surprised
        Mood.Reading -> Res.drawable.pipo_reading
        Mood.Celebrate -> Res.drawable.pipo_celebrate
        Mood.Idea -> Res.drawable.pipo_idea
        Mood.Cool -> Res.drawable.pipo_cool
    }
    Character.Nix -> when (mood) {
        Mood.Idle -> Res.drawable.nix_idle
        Mood.Wave -> Res.drawable.nix_wave
        Mood.Thinking -> Res.drawable.nix_thinking
        Mood.Listening -> Res.drawable.nix_calm
        Mood.Speaking -> Res.drawable.nix_idea
        Mood.Happy -> Res.drawable.nix_joy
        Mood.Love -> Res.drawable.nix_love
        Mood.Calm -> Res.drawable.nix_meditate
        Mood.Sad -> Res.drawable.nix_sad
        Mood.Worried -> Res.drawable.nix_worried
        Mood.Reading -> Res.drawable.nix_tablet
        Mood.Celebrate -> Res.drawable.nix_celebrate
        Mood.Idea -> Res.drawable.nix_idea
        Mood.Cool -> Res.drawable.nix_cool
    }
}

fun characterPortrait(c: Character): DrawableResource = when (c) {
    Character.Luma -> Res.drawable.luma_portrait
    Character.Pipo -> Res.drawable.pipo_portrait
    Character.Nix -> Res.drawable.nix_portrait
}

@Composable
fun CharacterAvatar(c: Character, mood: Mood, size: Dp = 56.dp, modifier: Modifier = Modifier) {
    Image(painterResource(characterImage(c, mood)), contentDescription = c.displayName, modifier = modifier.size(size))
}

@Composable
fun CharacterPortrait(c: Character, size: Dp = 120.dp, modifier: Modifier = Modifier) {
    Image(painterResource(characterPortrait(c)), contentDescription = c.displayName, modifier = modifier.size(size))
}

/** Selector de personaje: retrato, nombre, personalidad, voz y una frase de ejemplo. */
@Composable
fun CharacterPicker(selected: Character, onSelect: (Character) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Character.entries.forEach { c ->
            val isSelected = c == selected
            val shape = RoundedCornerShape(14.dp)
            Row(
                Modifier
                    .fillMaxWidth()
                    .background(if (isSelected) EcoColors.Surface2 else EcoColors.Surface, shape)
                    .border(if (isSelected) 2.dp else 1.dp, if (isSelected) c.color else EcoColors.Border, shape)
                    .clickable { onSelect(c) }
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                CharacterPortrait(c, 84.dp)
                Column(Modifier.weight(1f)) {
                    Text(c.displayName, fontWeight = FontWeight.Bold, fontSize = 20.sp, color = c.color)
                    Text(t("traits_${c.key}"), color = EcoColors.Muted)
                    Text(t("voice_of", "voice" to c.voiceName), color = EcoColors.Muted, fontSize = 12.sp)
                    Text(t("quote_${c.key}"), fontSize = 13.sp)
                }
            }
        }
    }
}
