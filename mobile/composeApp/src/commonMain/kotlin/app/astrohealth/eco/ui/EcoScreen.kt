package app.astrohealth.eco.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material.icons.automirrored.outlined.VolumeOff
import androidx.compose.material.icons.automirrored.outlined.VolumeUp
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.CloudOff
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.GraphicEq
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material.icons.outlined.MicOff
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.AppModel
import app.astrohealth.eco.data.ChatMessage
import app.astrohealth.eco.formatDuration
import app.astrohealth.eco.platform.Speech
import app.astrohealth.eco.platform.rememberVoiceInput
import app.astrohealth.eco.t

/**
 * T3 · Conversación con el personaje por voz y texto.
 *
 * Reglas de UI/UX aplicadas:
 * - El chat es lo principal: el personaje grande solo aparece al inicio; después se reduce al encabezado.
 * - Un solo indicador de estado (en línea / pensando / hablando) junto al nombre, y "escribiendo…" dentro del chat.
 * - Acciones secundarias como iconos de 48 dp con descripción para lectores de pantalla.
 * - Acción destructiva (borrar) con confirmación.
 * - Errores en lenguaje humano, sin códigos técnicos, y descartables.
 * - Una sola acción principal en el campo: micrófono cuando está vacío, enviar cuando hay texto.
 */
@Composable
fun EcoScreen(model: AppModel, startWithVoice: Boolean, onVoiceStarted: () -> Unit) {
    var input by remember { mutableStateOf("") }
    var voiceError by remember { mutableStateOf<String?>(null) }
    var confirmClear by remember { mutableStateOf(false) }
    var offlineDismissed by remember { mutableStateOf(false) }
    val voice = rememberVoiceInput(
        onResult = { text -> model.send(text, voice = true) },
        onError = { code ->
            voiceError = when (code) {
                "no_match" -> t("voice_no_match")
                "permission" -> t("voice_permission", "name" to model.character.displayName)
                "unsupported" -> t("no_voice")
                else -> t("voice_error")
            }
        },
    )
    val listState = rememberLazyListState()
    val me = model.me ?: return
    val mode = model.effectiveMode
    val who = model.character
    val hello = ChatMessage("eco", model.greeting())
    val messages = listOf(hello) + model.chat
    val started = model.chat.isNotEmpty()
    val offline = model.lastSource == "local"
    val itemCount = messages.size + (if (model.pending) 1 else 0) + (if (model.instrumentOffer != null) 1 else 0)

    fun sendText() {
        if (input.isBlank() || model.pending) return
        model.send(input, false); input = ""
    }
    fun startVoice() {
        voiceError = null; model.stopVoice()
        if (voice.available) voice.start(model.lang) else voiceError = t("no_voice")
    }

    LaunchedEffect(itemCount) { listState.animateScrollToItem(itemCount - 1) }
    LaunchedEffect(offline) { if (!offline) offlineDismissed = false }
    LaunchedEffect(startWithVoice) {
        if (startWithVoice) {
            onVoiceStarted()
            if (voice.available) { Speech.stop(); voice.start(model.lang) } else voiceError = t("no_voice")
        }
    }

    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 8.dp)) {
        // 1 · Encabezado: quién te acompaña, su estado y acciones secundarias
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            AnimatedVisibility(started, enter = fadeIn(), exit = fadeOut()) {
                Box(
                    Modifier.size(48.dp).background(who.color.copy(alpha = 0.14f), CircleShape).border(1.dp, who.color.copy(alpha = 0.5f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) { CharacterAvatar(who, model.mood, 42.dp) }
            }
            Column(Modifier.weight(1f)) {
                Text(who.displayName, fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = EcoColors.Text)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    StatusDot(if (offline) EcoColors.Warn else EcoColors.Ok)
                    Text(
                        when {
                            voice.listening -> t("status_listening", "name" to who.displayName)
                            model.pending -> t("status_thinking", "name" to who.displayName)
                            model.speaking -> t("status_speaking", "name" to who.displayName)
                            else -> t("status_online")
                        },
                        color = EcoColors.Muted, fontSize = 13.sp,
                    )
                }
            }
            // Abre la conversación en vivo con el personaje animado
            IconButton(onClick = { voice.cancel(); model.openLive() }) {
                Icon(Icons.Outlined.GraphicEq, contentDescription = t("live_open"), tint = who.color)
            }
            IconButton(onClick = { model.updateSettings(model.settings.copy(speak = !model.settings.speak)) }) {
                Icon(
                    if (model.settings.speak) Icons.AutoMirrored.Outlined.VolumeUp else Icons.AutoMirrored.Outlined.VolumeOff,
                    contentDescription = if (model.settings.speak) t("mute_voice") else t("unmute_voice"),
                    tint = if (model.settings.speak) EcoColors.Accent else EcoColors.Muted,
                )
            }
            IconButton(onClick = { confirmClear = true }, enabled = started) {
                Icon(Icons.Outlined.DeleteOutline, contentDescription = t("clear_chat"), tint = if (started) EcoColors.Muted else EcoColors.Border2)
            }
        }

        // 2 · Modo de conversación (o aviso de refugio)
        Spacer8()
        if (mode == "shelter") {
            Row(
                Modifier.fillMaxWidth().background(EcoColors.DangerBg, RoundedCornerShape(8.dp)).border(1.dp, EcoColors.DangerBorder, RoundedCornerShape(8.dp)).padding(12.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                StatusDot(EcoColors.Danger)
                Text(t("shelter_mode"), color = EcoColors.DangerText, fontWeight = FontWeight.SemiBold)
                model.stormEnd()?.let { Text("· ${t("exit_in")} ${formatDuration(it - model.simNow())}", color = EcoColors.Muted, fontSize = 13.sp) }
            }
        } else {
            Row(
                Modifier.fillMaxWidth().background(EcoColors.Surface, RoundedCornerShape(10.dp)).border(1.dp, EcoColors.Border, RoundedCornerShape(10.dp)).padding(4.dp),
            ) {
                listOf("listen" to t("only_listen"), "companion" to t("companion")).forEach { (key, label) ->
                    val sel = model.ecoMode == key
                    Box(
                        Modifier.weight(1f).height(44.dp)
                            .background(if (sel) EcoColors.Surface3 else Color.Transparent, RoundedCornerShape(8.dp))
                            .then(if (sel) Modifier.border(1.dp, EcoColors.Accent.copy(alpha = 0.45f), RoundedCornerShape(8.dp)) else Modifier)
                            .clickable(role = Role.Tab) { model.ecoMode = key }
                            .semantics { selected = sel },
                        contentAlignment = Alignment.Center,
                    ) { Text(label, color = if (sel) EcoColors.Accent else EcoColors.Muted, fontSize = 14.sp, fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal) }
                }
            }
            Text(
                t(if (model.ecoMode == "companion") "mode_hint_companion" else "mode_hint_listen", "name" to who.displayName),
                color = EcoColors.Muted, fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp, start = 4.dp),
            )
        }

        // 3 · Personaje grande solo al inicio (bienvenida); luego cede el espacio al chat
        AnimatedVisibility(!started, enter = expandVertically() + fadeIn(), exit = shrinkVertically() + fadeOut()) {
            Box(Modifier.fillMaxWidth().padding(top = 12.dp), contentAlignment = Alignment.Center) {
                Box(
                    Modifier.size(132.dp).background(Brush.radialGradient(listOf(who.color.copy(alpha = 0.28f), Color.Transparent)), CircleShape),
                    contentAlignment = Alignment.Center,
                ) { CharacterAvatar(who, model.mood, 116.dp) }
            }
        }

        // 4 · Aviso de conexión: humano, sin códigos técnicos y descartable
        AnimatedVisibility(offline && !offlineDismissed) {
            Row(
                Modifier.fillMaxWidth().padding(top = 10.dp)
                    .background(EcoColors.Surface2, RoundedCornerShape(10.dp)).border(1.dp, EcoColors.Warn.copy(alpha = 0.5f), RoundedCornerShape(10.dp))
                    .padding(start = 12.dp, top = 4.dp, bottom = 4.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(Icons.Outlined.CloudOff, contentDescription = null, tint = EcoColors.Warn, modifier = Modifier.size(20.dp))
                Column(Modifier.weight(1f).padding(vertical = 6.dp)) {
                    Text(t("offline_title"), color = EcoColors.Text, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    Text(t("offline_text", "name" to who.displayName), color = EcoColors.Muted, fontSize = 12.sp)
                }
                IconButton(onClick = { offlineDismissed = true }) {
                    Icon(Icons.Outlined.Close, contentDescription = t("dismiss"), tint = EcoColors.Muted, modifier = Modifier.size(18.dp))
                }
            }
        }

        // 5 · Mensajes
        LazyColumn(
            Modifier.weight(1f).fillMaxWidth(),
            state = listState,
            verticalArrangement = Arrangement.spacedBy(6.dp),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 12.dp),
        ) {
            itemsIndexed(messages) { i, m ->
                val next = messages.getOrNull(i + 1)
                // El avatar solo en el último mensaje seguido del personaje (agrupación)
                val lastOfGroup = next == null || (next.role == "eco") != (m.role == "eco")
                val firstOfGroup = i == 0 || (messages[i - 1].role == "eco") != (m.role == "eco")
                Bubble(m, who, showAvatar = lastOfGroup && !(model.pending && next == null && m.role == "eco"), topGap = firstOfGroup && i > 0)
            }
            if (model.pending) item { TypingBubble(who) }
            // INST-03: oferta de cuestionario debajo de la respuesta, sin bloquear
            model.instrumentOffer?.let { inst -> item { InstrumentOfferCard(model, inst, Modifier.padding(top = 6.dp)) } }
        }

        // 6 · Error de dictado, descartable
        voiceError?.let { err ->
            Row(
                Modifier.fillMaxWidth().padding(bottom = 6.dp).background(EcoColors.Surface2, RoundedCornerShape(8.dp)).padding(start = 12.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Outlined.MicOff, contentDescription = null, tint = EcoColors.Muted, modifier = Modifier.size(18.dp))
                Text(err, color = EcoColors.Muted, fontSize = 13.sp, modifier = Modifier.weight(1f))
                IconButton(onClick = { voiceError = null }) { Icon(Icons.Outlined.Close, contentDescription = t("dismiss"), tint = EcoColors.Muted, modifier = Modifier.size(18.dp)) }
            }
        }

        // 7 · Escuchando: panel propio dentro de la app (sin la ventana de Google)
        if (voice.listening) {
            ListeningPanel(who, voice.partial, voice.level, onCancel = { voice.cancel() }, onDone = { voice.stop() })
        } else
        // 8 · Campo de texto: una sola acción principal (micrófono o enviar)
        Row(
            Modifier.fillMaxWidth().background(EcoColors.Surface, RoundedCornerShape(14.dp)).border(1.dp, EcoColors.Border2, RoundedCornerShape(14.dp)).padding(start = 4.dp, end = 6.dp, top = 4.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            OutlinedTextField(
                input, { input = it },
                placeholder = { Text(t("write_to_eco", "name" to who.displayName), color = EcoColors.Muted) },
                modifier = Modifier.weight(1f),
                maxLines = 4,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send, capitalization = KeyboardCapitalization.Sentences),
                keyboardActions = KeyboardActions(onSend = { sendText() }),
                colors = OutlinedTextFieldDefaults.colors(unfocusedBorderColor = Color.Transparent, focusedBorderColor = Color.Transparent),
            )
            val hasText = input.isNotBlank()
            val canSend = hasText && !model.pending
            Box(
                Modifier.size(48.dp)
                    .background(if (hasText && !canSend) EcoColors.Surface3 else EcoColors.Accent, CircleShape)
                    .clickable(enabled = !hasText || canSend, role = Role.Button) { if (hasText) sendText() else startVoice() }
                    .semantics { contentDescription = if (hasText) t("send") else t("speak") },
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    if (hasText) Icons.AutoMirrored.Outlined.Send else Icons.Outlined.Mic,
                    contentDescription = null,
                    tint = if (hasText && !canSend) EcoColors.Muted else EcoColors.AccentInk,
                )
            }
        }
        Row(Modifier.fillMaxWidth().padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
            Icon(Icons.Outlined.Lock, contentDescription = null, tint = EcoColors.Muted, modifier = Modifier.size(12.dp))
            Text(" " + t("private_short"), color = EcoColors.Muted, fontSize = 11.sp)
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            icon = { Icon(Icons.Outlined.DeleteOutline, contentDescription = null, tint = EcoColors.Danger) },
            title = { Text(t("clear_title")) },
            text = { Text(t("clear_text")) },
            confirmButton = {
                Button(
                    onClick = { model.clearChat(); confirmClear = false },
                    colors = ButtonDefaults.buttonColors(containerColor = EcoColors.Danger, contentColor = Color.White),
                ) { Text(t("delete")) }
            },
            dismissButton = { TextButton(onClick = { confirmClear = false }) { Text(t("cancel_btn")) } },
        )
    }
}

@Composable
private fun Spacer8() = Box(Modifier.height(10.dp))

/**
 * Panel de escucha: barras que siguen el volumen de la voz, la transcripción en vivo
 * y dos acciones claras (cancelar o terminar y enviar).
 */
@Composable
private fun ListeningPanel(who: Character, partial: String, level: Float, onCancel: () -> Unit, onDone: () -> Unit) {
    val transition = rememberInfiniteTransition()
    val pulse by transition.animateFloat(0.85f, 1.1f, infiniteRepeatable(tween(700), RepeatMode.Reverse))
    val shape = RoundedCornerShape(14.dp)
    Column(
        Modifier.fillMaxWidth().background(EcoColors.Surface, shape).border(1.dp, who.color.copy(alpha = 0.6f), shape).padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Text(
            partial.ifBlank { t("listening_hint", "name" to who.displayName) },
            color = if (partial.isBlank()) EcoColors.Muted else EcoColors.Text,
            fontSize = 15.sp, lineHeight = 21.sp, maxLines = 4,
            modifier = Modifier.semantics { contentDescription = t("status_listening", "name" to who.displayName) },
        )
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            IconButton(onClick = onCancel, modifier = Modifier.size(48.dp).background(EcoColors.Surface3, CircleShape)) {
                Icon(Icons.Outlined.Close, contentDescription = t("cancel_btn"), tint = EcoColors.Muted)
            }
            // Barras de volumen
            Row(Modifier.weight(1f).height(40.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                val shapeFactors = listOf(0.45f, 0.7f, 1f, 0.8f, 0.55f, 0.9f, 0.6f)
                shapeFactors.forEach { f ->
                    val h = (8f + 32f * (0.2f + level * 0.8f) * f * pulse).coerceIn(6f, 40f)
                    Box(Modifier.padding(horizontal = 3.dp).size(width = 5.dp, height = h.dp).background(who.color, RoundedCornerShape(3.dp)))
                }
            }
            Box(
                Modifier.size(56.dp).background(EcoColors.Accent, CircleShape)
                    .clickable(role = Role.Button, onClick = onDone)
                    .semantics { contentDescription = t("listening_done") },
                contentAlignment = Alignment.Center,
            ) { Icon(Icons.Outlined.Check, contentDescription = null, tint = EcoColors.AccentInk, modifier = Modifier.size(28.dp)) }
        }
    }
}

@Composable
private fun Bubble(m: ChatMessage, who: Character, showAvatar: Boolean, topGap: Boolean) {
    val mine = m.role != "eco"
    // Forma asimétrica: la "cola" apunta hacia quien habla
    val shape = if (mine) RoundedCornerShape(16.dp, 16.dp, 4.dp, 16.dp) else RoundedCornerShape(16.dp, 16.dp, 16.dp, 4.dp)
    Row(
        Modifier.fillMaxWidth().padding(top = if (topGap) 8.dp else 0.dp),
        horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Bottom,
    ) {
        if (!mine) {
            Box(Modifier.size(34.dp).padding(end = 4.dp)) {
                if (showAvatar) CharacterAvatar(who, Mood.Idle, 30.dp)
            }
        }
        Column(
            Modifier.widthIn(max = 300.dp)
                .background(if (mine) EcoColors.Accent.copy(alpha = 0.16f) else EcoColors.Surface, shape)
                .border(1.dp, if (mine) EcoColors.Accent.copy(alpha = 0.35f) else EcoColors.Border, shape)
                .padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalAlignment = if (mine) Alignment.End else Alignment.Start,
        ) {
            Text(m.text, color = EcoColors.Text, fontSize = 15.sp, lineHeight = 21.sp)
            if (mine && m.voice) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 4.dp)) {
                    Icon(Icons.Outlined.Mic, contentDescription = null, tint = EcoColors.Muted, modifier = Modifier.size(12.dp))
                    Text(" " + t("by_voice"), color = EcoColors.Muted, fontSize = 11.sp)
                }
            }
        }
    }
}

/** Indicador de "está escribiendo": tres puntos que respiran, del color del personaje. */
@Composable
private fun TypingBubble(who: Character) {
    val transition = rememberInfiniteTransition()
    Row(verticalAlignment = Alignment.Bottom) {
        Box(Modifier.size(34.dp).padding(end = 4.dp)) { CharacterAvatar(who, Mood.Thinking, 30.dp) }
        Row(
            Modifier.background(EcoColors.Surface, RoundedCornerShape(16.dp, 16.dp, 16.dp, 4.dp))
                .border(1.dp, EcoColors.Border, RoundedCornerShape(16.dp, 16.dp, 16.dp, 4.dp))
                .padding(horizontal = 16.dp, vertical = 14.dp)
                .semantics { contentDescription = t("status_thinking", "name" to who.displayName) },
            horizontalArrangement = Arrangement.spacedBy(5.dp),
        ) {
            repeat(3) { i ->
                val a by transition.animateFloat(
                    0.25f, 1f,
                    infiniteRepeatable(tween(600, delayMillis = i * 180), RepeatMode.Reverse),
                )
                Box(Modifier.size(7.dp).alpha(a).background(who.color, CircleShape))
            }
        }
    }
}
