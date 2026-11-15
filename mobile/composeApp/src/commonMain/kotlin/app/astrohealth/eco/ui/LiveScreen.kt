package app.astrohealth.eco.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.VolumeOff
import androidx.compose.material.icons.automirrored.outlined.VolumeUp
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material.icons.outlined.Stop
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.AppModel
import app.astrohealth.eco.platform.PlatformBackHandler
import app.astrohealth.eco.platform.rememberVoiceInput
import app.astrohealth.eco.t
import kotlinx.coroutines.delay
import org.jetbrains.compose.resources.painterResource
import kotlin.math.PI
import kotlin.math.sin

/** Estado visible de la conversación en vivo. */
private enum class LiveState { Greeting, Listening, Thinking, Speaking, Waiting }

/**
 * Modo en vivo: conversación por voz casi en tiempo real.
 * Escucha → piensa → habla (con sprites animados según la emoción) → vuelve a escuchar solo.
 * Se puede interrumpir al personaje tocándolo o con el botón central.
 */
@Composable
fun LiveScreen(model: AppModel) {
    val who = model.character
    var paused by remember { mutableStateOf(false) }
    var hint by remember { mutableStateOf<String?>(null) }
    var greeted by remember { mutableStateOf(false) }

    val voice = rememberVoiceInput(
        onResult = { text -> hint = null; model.liveSend(text) },
        onError = { code ->
            // Si no se escuchó nada, se pausa el ciclo para no quedarse escuchando sin fin
            paused = true
            hint = when (code) {
                "no_match" -> t("live_no_match")
                "permission" -> t("voice_permission", "name" to who.displayName)
                "unsupported" -> t("no_voice")
                else -> t("voice_error")
            }
        },
    )

    val state = when {
        voice.listening -> LiveState.Listening
        model.pending -> LiveState.Thinking
        model.speaking && !greeted -> LiveState.Greeting
        model.speaking -> LiveState.Speaking
        else -> LiveState.Waiting
    }

    // Ciclo automático: cuando el personaje termina de hablar, vuelve a escuchar
    LaunchedEffect(model.speaking, model.pending, voice.listening, paused, model.escalation, model.pendingUrgent, model.instrumentOffer, model.instrumentRun) {
        if (!model.speaking && !model.pending) greeted = true
        if (!paused && greeted && !model.speaking && !model.pending && !voice.listening &&
            model.escalation == null && model.pendingUrgent == null && voice.available &&
            model.instrumentOffer == null && model.instrumentRun == null // INST-11
        ) {
            delay(350)
            voice.start(model.lang)
        }
    }
    DisposableEffect(Unit) { onDispose { voice.cancel() } }
    PlatformBackHandler { voice.cancel(); model.closeLive() }

    fun mainAction() {
        when (state) {
            LiveState.Listening -> voice.stop()
            LiveState.Speaking, LiveState.Greeting -> { model.stopVoice(); greeted = true; paused = false; hint = null; voice.start(model.lang) }
            LiveState.Thinking -> {}
            LiveState.Waiting -> { paused = false; hint = null; voice.start(model.lang) }
        }
    }

    Box(
        Modifier.fillMaxSize()
            .background(EcoColors.Bg) // opaco: no se ve la pantalla de abajo
            .background(Brush.verticalGradient(listOf(Color.Transparent, who.color.copy(alpha = 0.10f), Color.Transparent)))
            // Bloquea los toques hacia la pantalla de abajo
            .clickable(interactionSource = remember { MutableInteractionSource() }, indication = null) {},
    ) {
        Column(Modifier.fillMaxSize().systemBarsPadding().padding(horizontal = 20.dp, vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            // Encabezado
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { voice.cancel(); model.closeLive() }) {
                    Icon(Icons.Outlined.Close, contentDescription = t("live_end"), tint = EcoColors.Text)
                }
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        LiveDot()
                        Text(t("live_badge"), color = EcoColors.Danger, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.5.sp)
                    }
                    Text(who.displayName, color = EcoColors.Text, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                }
                IconButton(onClick = { model.updateSettings(model.settings.copy(speak = !model.settings.speak)) }) {
                    Icon(
                        if (model.settings.speak) Icons.AutoMirrored.Outlined.VolumeUp else Icons.AutoMirrored.Outlined.VolumeOff,
                        contentDescription = if (model.settings.speak) t("mute_voice") else t("unmute_voice"),
                        tint = if (model.settings.speak) EcoColors.Accent else EcoColors.Muted,
                    )
                }
            }

            Spacer(Modifier.weight(0.6f))

            // Personaje animado (tocarlo mientras habla lo interrumpe)
            AnimatedSprite(
                who = who, state = state, emotion = model.liveEmotion, level = voice.level,
                modifier = Modifier.size(300.dp).clickable(
                    interactionSource = remember { MutableInteractionSource() }, indication = null,
                ) { if (state == LiveState.Speaking || state == LiveState.Greeting) mainAction() },
            )

            Spacer(Modifier.height(8.dp))
            Text(
                when (state) {
                    LiveState.Listening -> t("status_listening", "name" to who.displayName)
                    LiveState.Thinking -> t("status_thinking", "name" to who.displayName)
                    LiveState.Speaking, LiveState.Greeting -> t("status_speaking", "name" to who.displayName)
                    LiveState.Waiting -> hint ?: t("live_tap_to_talk")
                },
                color = if (state == LiveState.Waiting && hint != null) EcoColors.Warn else EcoColors.Muted,
                fontSize = 14.sp, textAlign = TextAlign.Center,
            )

            Spacer(Modifier.weight(0.4f))

            // Subtítulos: lo que dices (en vivo) y lo que responde el personaje
            Column(Modifier.fillMaxWidth().heightIn(min = 120.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                val mine = if (voice.listening) voice.partial else model.liveHeard
                if (mine.isNotBlank()) {
                    Text("“$mine”", color = EcoColors.Muted, fontSize = 15.sp, textAlign = TextAlign.Center, maxLines = 3)
                }
                AnimatedContent(model.liveReply, transitionSpec = { fadeIn(tween(250)) togetherWith fadeOut(tween(150)) }) { reply ->
                    if (reply.isNotBlank() && !voice.listening) {
                        Text(reply, color = EcoColors.Text, fontSize = 19.sp, lineHeight = 26.sp, textAlign = TextAlign.Center, maxLines = 6)
                    }
                }
            }

            Spacer(Modifier.height(16.dp))

            // INST-11: oferta de cuestionario también en vivo
            model.instrumentOffer?.let { inst ->
                InstrumentOfferCard(model, inst, Modifier.padding(bottom = 12.dp))
            }

            // Botón principal según el estado
            MainButton(state, voice.level, who) { mainAction() }
            Spacer(Modifier.height(10.dp))
            Text(
                when (state) {
                    LiveState.Listening -> t("live_hint_listening")
                    LiveState.Speaking, LiveState.Greeting -> t("live_hint_interrupt")
                    else -> t("live_private")
                },
                color = EcoColors.Muted, fontSize = 12.sp, textAlign = TextAlign.Center,
            )
        }

        // Precarga invisible de todas las poses para que no parpadeen al cambiar
        Box(Modifier.size(1.dp).alpha(0f)) {
            (1..24).forEach { Image(painterResource(liveFrame(who, it)), contentDescription = null, modifier = Modifier.size(1.dp)) }
        }
    }
}

/** Sprite con vida: flota, reacciona al volumen de tu voz y "habla" alternando cuadros. */
@Composable
private fun AnimatedSprite(who: Character, state: LiveState, emotion: String, level: Float, modifier: Modifier = Modifier) {
    val pose = when (state) {
        LiveState.Listening -> LivePose.Listen
        LiveState.Thinking -> LivePose.Think
        LiveState.Greeting -> LivePose.Wave
        LiveState.Speaking -> poseFor(emotion)
        LiveState.Waiting -> poseFor(emotion).let { if (it == LivePose.Wave) LivePose.Idle else it }
    }
    var frame by remember { mutableIntStateOf(livePoseFrame(who, pose)) }

    LaunchedEffect(state, pose, who) {
        val base = livePoseFrame(who, pose)
        frame = base
        when (state) {
            // Hablar: la pose de la emoción con cuadros de boca abierta intercalados
            LiveState.Speaking, LiveState.Greeting -> {
                val talk = talkFrames(who)
                var i = 0
                while (true) {
                    frame = base; delay(420)
                    frame = talk[i % talk.size]; delay(220)
                    i++
                }
            }
            // Esperando mucho rato: hace algo de su personalidad (café, videojuego, leer…)
            LiveState.Waiting -> {
                delay(9000)
                frame = livePoseFrame(who, LivePose.Hobby1); delay(4000)
                frame = base; delay(9000)
                frame = livePoseFrame(who, LivePose.Hobby2); delay(4000)
                frame = base
            }
            else -> {}
        }
    }

    val transition = rememberInfiniteTransition()
    val t by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(2600), RepeatMode.Restart))
    val bob = sin(t * 2 * PI).toFloat()
    val listenScale by animateFloatAsState(if (state == LiveState.Listening) 1f + level * 0.08f else 1f, tween(90))
    val sway = if (state == LiveState.Thinking) bob * 4f else 0f

    Box(modifier, contentAlignment = Alignment.Center) {
        // Halo del color del personaje; crece con tu voz cuando escucha
        Box(
            Modifier.size(260.dp).graphicsLayer {
                val s = if (state == LiveState.Listening) 1f + level * 0.25f else 1f + bob * 0.02f
                scaleX = s; scaleY = s
            }.background(Brush.radialGradient(listOf(who.color.copy(alpha = 0.32f), Color.Transparent)), CircleShape),
        )
        Image(
            painterResource(liveFrame(who, frame)),
            contentDescription = who.displayName,
            modifier = Modifier.size(280.dp).graphicsLayer {
                translationY = bob * (if (state == LiveState.Speaking) 10f else 6f)
                rotationZ = sway
                scaleX = listenScale; scaleY = listenScale
            },
        )
    }
}

@Composable
private fun MainButton(state: LiveState, level: Float, who: Character, onClick: () -> Unit) {
    val ring by animateFloatAsState(if (state == LiveState.Listening) 1f + level * 0.35f else 1f, tween(90))
    Box(contentAlignment = Alignment.Center) {
        if (state == LiveState.Listening) {
            Box(Modifier.size(84.dp).graphicsLayer { scaleX = ring; scaleY = ring }.border(3.dp, who.color.copy(alpha = 0.6f), CircleShape))
        }
        Box(
            Modifier.size(76.dp)
                .background(if (state == LiveState.Thinking) EcoColors.Surface3 else EcoColors.Accent, CircleShape)
                .clickable(enabled = state != LiveState.Thinking, role = Role.Button, onClick = onClick)
                .semantics {
                    contentDescription = when (state) {
                        LiveState.Listening -> t("listening_done")
                        LiveState.Speaking, LiveState.Greeting -> t("live_interrupt")
                        LiveState.Thinking -> t("status_thinking", "name" to who.displayName)
                        LiveState.Waiting -> t("speak")
                    }
                },
            contentAlignment = Alignment.Center,
        ) {
            when (state) {
                LiveState.Listening -> Icon(Icons.Outlined.Check, contentDescription = null, tint = EcoColors.AccentInk, modifier = Modifier.size(34.dp))
                LiveState.Speaking, LiveState.Greeting -> Icon(Icons.Outlined.Stop, contentDescription = null, tint = EcoColors.AccentInk, modifier = Modifier.size(34.dp))
                LiveState.Thinking -> CircularProgressIndicator(color = who.color, strokeWidth = 3.dp, modifier = Modifier.size(30.dp))
                LiveState.Waiting -> Icon(Icons.Outlined.Mic, contentDescription = null, tint = EcoColors.AccentInk, modifier = Modifier.size(34.dp))
            }
        }
    }
}

@Composable
private fun LiveDot() {
    val transition = rememberInfiniteTransition()
    val a by transition.animateFloat(0.35f, 1f, infiniteRepeatable(tween(800), RepeatMode.Reverse))
    Box(Modifier.size(8.dp).alpha(a).background(EcoColors.Danger, CircleShape))
}
