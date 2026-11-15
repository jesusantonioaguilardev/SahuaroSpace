package app.astrohealth.eco.ui

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.FactCheck
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.AppModel
import app.astrohealth.eco.data.Instrument
import app.astrohealth.eco.data.Scoring
import app.astrohealth.eco.data.Severity
import app.astrohealth.eco.platform.PlatformBackHandler
import app.astrohealth.eco.t
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/**
 * Oferta de cuestionario (INST-03): se muestra debajo de la respuesta del personaje, sin bloquear.
 * Se usa en el chat y en el modo en vivo (INST-11).
 */
@Composable
fun InstrumentOfferCard(model: AppModel, instrument: Instrument, modifier: Modifier = Modifier) {
    val who = model.character
    val shape = RoundedCornerShape(16.dp)
    Column(
        modifier.fillMaxWidth().background(EcoColors.Surface, shape).border(1.dp, who.color.copy(alpha = 0.55f), shape).padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            CharacterAvatar(who, Mood.Idle, 36.dp)
            Text(t("inst_offer_${instrument.key}"), color = EcoColors.Text, fontSize = 15.sp, lineHeight = 21.sp, modifier = Modifier.weight(1f))
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(Icons.Outlined.Lock, contentDescription = null, tint = EcoColors.Muted, modifier = Modifier.size(12.dp))
            Text(t("inst_offer_note"), color = EcoColors.Muted, fontSize = 12.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(onClick = { model.acceptInstrument() }, modifier = Modifier.weight(1f).height(48.dp)) { Text(t("inst_yes"), fontWeight = FontWeight.SemiBold) }
            OutlinedButton(onClick = { model.declineInstrument() }, modifier = Modifier.weight(1f).height(48.dp)) { Text(t("inst_no")) }
        }
    }
}

/** Cuestionario a pantalla completa: una pregunta a la vez con 4 botones (INST-06). */
@Composable
fun InstrumentScreen(model: AppModel) {
    val run = model.instrumentRun ?: return
    val lang = model.lang
    val inst = run.instrument
    val total = if (run.full) inst.items else inst.shortCount
    PlatformBackHandler {
        if (run.result == null && (run.index > 0 || run.askContinue)) model.backInstrument() else model.closeInstrument()
    }

    Box(
        Modifier.fillMaxSize().background(EcoColors.Bg)
            .clickable(interactionSource = MutableInteractionSource(), indication = null) {},
    ) {
        Column(Modifier.fillMaxSize().systemBarsPadding().padding(horizontal = 20.dp, vertical = 12.dp)) {
            // Encabezado
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { model.closeInstrument() }) {
                    Icon(Icons.Outlined.Close, contentDescription = if (run.result == null) t("inst_exit") else t("inst_done"), tint = EcoColors.Text)
                }
                Column(Modifier.weight(1f)) {
                    Text(if (run.full || run.result?.short == false) inst.title(lang) else inst.shortTitle(), color = EcoColors.Text, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                    if (run.result == null && !run.askContinue) {
                        Text(t("inst_progress", "n" to (run.index + 1), "total" to total), color = EcoColors.Muted, fontSize = 13.sp)
                    }
                }
            }
            // Barra de avance
            if (run.result == null) {
                val fraction = if (run.askContinue) 1f else run.index.toFloat() / total
                Box(Modifier.fillMaxWidth().padding(top = 8.dp).height(6.dp).background(EcoColors.Surface3, RoundedCornerShape(3.dp))) {
                    Box(Modifier.fillMaxWidth(fraction.coerceIn(0.02f, 1f)).height(6.dp).background(model.character.color, RoundedCornerShape(3.dp)))
                }
            }
            Spacer(Modifier.height(20.dp))

            Column(Modifier.weight(1f).verticalScroll(rememberScrollState())) {
                when {
                    run.result != null -> ResultView(model, run.result.short, inst, run.result.total, run.result.severity)
                    run.askContinue -> ContinueView(model, inst)
                    else -> QuestionView(model, inst, run.index, run.answers.getOrNull(run.index), lang)
                }
            }

            // Pie: volver a la pregunta anterior
            if (run.result == null && (run.index > 0 || run.askContinue)) {
                TextButton(onClick = { model.backInstrument() }, modifier = Modifier.align(Alignment.Start)) {
                    Icon(Icons.AutoMirrored.Outlined.ArrowBack, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("  " + t("inst_back"))
                }
            }
        }
    }
}

@Composable
private fun QuestionView(model: AppModel, inst: Instrument, index: Int, previous: Int?, lang: String) {
    Text(inst.stem(lang), color = EcoColors.Muted, fontSize = 14.sp, lineHeight = 20.sp)
    Spacer(Modifier.height(12.dp))
    Text(inst.questions(lang)[index], color = EcoColors.Text, fontSize = 22.sp, lineHeight = 30.sp, fontWeight = FontWeight.SemiBold)
    Spacer(Modifier.height(24.dp))
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Instrument.options(lang).forEachIndexed { value, label ->
            val sel = previous == value
            val shape = RoundedCornerShape(14.dp)
            Row(
                Modifier.fillMaxWidth().heightIn(min = 56.dp)
                    .background(if (sel) EcoColors.Accent.copy(alpha = 0.16f) else EcoColors.Surface, shape)
                    .border(if (sel) 2.dp else 1.dp, if (sel) EcoColors.Accent else EcoColors.Border2, shape)
                    .selectable(selected = sel, role = Role.RadioButton) { model.answerInstrument(value) }
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                // Puntos que muestran la intensidad (0 a 3) además del texto
                Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                    repeat(3) { i -> Box(Modifier.size(7.dp).background(if (i < value) EcoColors.Accent else EcoColors.Border2, CircleShape)) }
                }
                Text(label, color = EcoColors.Text, fontSize = 16.sp, modifier = Modifier.weight(1f))
                if (sel) Icon(Icons.Outlined.Check, contentDescription = null, tint = EcoColors.Accent)
            }
        }
    }
}

@Composable
private fun ContinueView(model: AppModel, inst: Instrument) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        CharacterAvatar(model.character, Mood.Thinking, 120.dp)
        Spacer(Modifier.height(16.dp))
        Text(t("inst_continue_title"), color = EcoColors.Text, fontSize = 20.sp, lineHeight = 27.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
        Spacer(Modifier.height(8.dp))
        Text(t("inst_continue_text", "n" to (inst.items - inst.shortCount)), color = EcoColors.Muted, fontSize = 15.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(24.dp))
        Button(onClick = { model.continueInstrument() }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(t("inst_continue_yes"), fontWeight = FontWeight.SemiBold) }
        Spacer(Modifier.height(8.dp))
        OutlinedButton(onClick = { model.stopInstrumentAtShort() }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(t("inst_continue_no")) }
    }
}

/** Resultado (INST-09): nivel en palabras, sin diagnóstico; con nivel moderado o más, sugiere al médico. */
@Composable
private fun ResultView(model: AppModel, short: Boolean, inst: Instrument, total: Int, severity: String) {
    val who = model.character
    val sev = Severity.entries.firstOrNull { it.key == severity }
    val high = sev != null && Scoring.suggestSurgeon(sev)
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
        CharacterAvatar(who, if (high) Mood.Calm else Mood.Happy, 120.dp)
        Spacer(Modifier.height(12.dp))
        Eyebrow(t("inst_result"), color = EcoColors.Label)
        Spacer(Modifier.height(6.dp))
        val max = if (short) inst.shortCount * 3 else inst.maxScore
        Text(t("inst_score", "score" to total, "max" to max), color = EcoColors.Text, fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text(
            if (short) t(if (severity == "short_positive") "inst_short_positive" else "inst_short_negative")
            else t("inst_level", "level" to t("sev_$severity")),
            color = if (high || severity == "short_positive") EcoColors.Warn else EcoColors.Ok,
            fontSize = 16.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp),
        )
        Spacer(Modifier.height(18.dp))
        Text(t("inst_thanks_${who.key}"), color = EcoColors.Text, fontSize = 16.sp, lineHeight = 23.sp, textAlign = TextAlign.Center)
        if (high) {
            Spacer(Modifier.height(14.dp))
            Text(t("inst_surgeon"), color = EcoColors.Text, fontSize = 15.sp, lineHeight = 21.sp, textAlign = TextAlign.Center,
                modifier = Modifier.background(EcoColors.WarnBg, RoundedCornerShape(10.dp)).padding(12.dp))
        }
        Spacer(Modifier.height(14.dp))
        Text(t("inst_disclaimer"), color = EcoColors.Muted, fontSize = 13.sp, textAlign = TextAlign.Center)
        Spacer(Modifier.height(24.dp))
        Button(onClick = { model.closeInstrument() }, modifier = Modifier.fillMaxWidth().height(52.dp)) { Text(t("inst_done"), fontWeight = FontWeight.SemiBold) }
    }
}

/** Historial en Salud (INST-10). */
@Composable
fun ScreeningHistoryCard(model: AppModel) {
    EcoCard {
        SectionTitle(Icons.Outlined.FactCheck, t("inst_history"))
        if (model.screenings.isEmpty()) {
            Text(t("inst_history_empty"), color = EcoColors.Muted, fontSize = 14.sp, modifier = Modifier.padding(top = 6.dp))
        }
        model.screenings.takeLast(6).reversed().forEach { r ->
            val inst = Instrument.of(r.instrument) ?: return@forEach
            val max = if (r.short) inst.shortCount * 3 else inst.maxScore
            Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(if (r.short) inst.shortTitle() else inst.title(model.lang), color = EcoColors.Text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    Text(formatDay(r.at), color = EcoColors.Muted, fontSize = 12.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("${r.total}/$max", color = EcoColors.Text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    Text(t("sev_${r.severity}"), color = EcoColors.Muted, fontSize = 12.sp)
                }
            }
        }
        Text(t("inst_history_note"), color = EcoColors.Muted, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp)
            .semantics { contentDescription = t("inst_history_note") })
        // INST-13: borrar historial (con confirmación)
        if (model.screenings.isNotEmpty()) {
            var confirm by remember { mutableStateOf(false) }
            TextButton(onClick = { confirm = true }) { Text(t("inst_clear"), color = EcoColors.Danger) }
            if (confirm) {
                AlertDialog(
                    onDismissRequest = { confirm = false },
                    title = { Text(t("inst_clear_title")) },
                    text = { Text(t("inst_clear_text")) },
                    confirmButton = { Button(onClick = { model.clearScreenings(); confirm = false }) { Text(t("delete")) } },
                    dismissButton = { TextButton(onClick = { confirm = false }) { Text(t("cancel_btn")) } },
                )
            }
        }
    }
}

private fun formatDay(ms: Long): String {
    val dt = Instant.fromEpochMilliseconds(ms).toLocalDateTime(TimeZone.currentSystemDefault())
    fun two(n: Int) = n.toString().padStart(2, '0')
    return "${two(dt.dayOfMonth)}/${two(dt.monthNumber)} · ${two(dt.hour)}:${two(dt.minute)}"
}
