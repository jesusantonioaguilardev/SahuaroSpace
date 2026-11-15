package app.astrohealth.eco.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.outlined.Battery0Bar
import androidx.compose.material.icons.outlined.Battery2Bar
import androidx.compose.material.icons.outlined.Battery4Bar
import androidx.compose.material.icons.outlined.Battery6Bar
import androidx.compose.material.icons.outlined.BatteryFull
import androidx.compose.material.icons.outlined.Check
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material.icons.outlined.MedicalServices
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Air
import androidx.compose.material.icons.outlined.Bedtime
import androidx.compose.material.icons.outlined.Cloud
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.SentimentSatisfied
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material3.Icon
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.AppModel
import app.astrohealth.eco.data.CheckIn
import app.astrohealth.eco.round1
import app.astrohealth.eco.round2
import app.astrohealth.eco.t
import kotlin.math.roundToInt

private val SYMPTOMS = listOf("headache", "confusion", "vision", "dizziness", "shortness_of_breath", "other")

@Composable
private fun KeyValue(label: String, value: String, modifier: Modifier = Modifier) {
    Column(modifier) {
        Text(label, color = EcoColors.Muted, fontSize = 13.sp)
        Text(value, fontWeight = FontWeight.SemiBold)
    }
}

/** T4 · Mis datos de salud y radiación. */
@Composable
fun DataScreen(model: AppModel) {
    val k = model.career
    val d = model.doseToday
    val zone = model.myZoneId
    val spo2 = model.reading("spo2_pct")
    val hr = model.reading("heart_rate_bpm")
    val rr = model.reading("resp_rate_bpm")
    val sleep = model.reading("sleep_minutes")
    val o2 = model.zoneReading(zone, "cabin_o2_pct")
    val co2 = model.zoneReading(zone, "cabin_co2_mmhg")
    val pressure = model.zoneReading(zone, "cabin_pressure_psia")
    val projectedCareer = k?.let { it.careerDoseMsv - it.missionDoseMsv + it.projectedEndMsv }

    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(t("data_title"), fontSize = 26.sp, fontWeight = FontWeight.Bold)
        EcoCard {
            SectionTitle(Icons.Outlined.WbSunny, t("radiation"), EcoColors.Warn)
            Row(Modifier.padding(top = 8.dp)) {
                KeyValue(t("today"), "${round2(d?.totalMsv ?: 0.0)} mSv", Modifier.weight(1f))
                KeyValue(t("mission"), "${round1(k?.missionDoseMsv ?: 0.0)} mSv", Modifier.weight(1f))
            }
            Row(Modifier.padding(top = 8.dp)) {
                KeyValue(t("career"), "${(k?.careerDoseMsv ?: 0.0).roundToInt()} / ${(k?.careerLimitMsv ?: 600.0).roundToInt()} mSv", Modifier.weight(1f))
                KeyValue(t("projection"), projectedCareer?.let { "${it.roundToInt()} mSv" } ?: "—", Modifier.weight(1f))
            }
            ProgressBar(((k?.pctOfLimit ?: 0.0) / 100).toFloat(), Modifier.padding(vertical = 8.dp))
            Text(
                if ((projectedCareer ?: 0.0) > (k?.careerLimitMsv ?: 600.0) * 0.9) t("rad_high") else t("rad_ok"),
                color = EcoColors.Muted, fontSize = 14.sp,
            )
            Row(Modifier.padding(top = 8.dp)) {
                KeyValue(t("gcr"), "${round2(d?.gcrMsv ?: 0.0)} mSv", Modifier.weight(1f))
                KeyValue(t("spe"), "${round2(d?.speMsv ?: 0.0)} mSv", Modifier.weight(1f))
            }
            Sparkline(model.history["dose_rate_usv_h"].orEmpty())
        }
        EcoCard(spo2?.level ?: "normal") {
            SectionTitle(Icons.Outlined.Air, t("oxygen"))
            Text("SpO2 ${spo2?.value?.roundToInt() ?: "—"} %", color = levelColor(spo2?.level))
            Sparkline(model.history["spo2_pct"].orEmpty(), min = 84.0, max = 100.0)
            Text("${t("cabin_o2")}: ${o2?.let { "${round1(it.value)} %" } ?: "—"} · ${t("pressure")}: ${pressure?.let { "${round2(it.value)} psia" } ?: "—"}", color = levelColor(o2?.level))
        }
        EcoCard(co2?.level ?: "normal") {
            SectionTitle(Icons.Outlined.Cloud, t("air"))
            Text("${t("co2")}: ${co2?.let { "${round1(it.value)} mmHg" } ?: "—"}", color = levelColor(co2?.level))
        }
        EcoCard(worst(hr?.level, rr?.level)) {
            SectionTitle(Icons.Outlined.FavoriteBorder, t("heart"), EcoColors.Ok)
            Text("${t("pulse")}: ${hr?.value?.roundToInt() ?: "—"}", color = levelColor(hr?.level))
            Sparkline(model.history["heart_rate_bpm"].orEmpty())
            Text("${t("resp")}: ${rr?.value?.roundToInt() ?: "—"}", color = levelColor(rr?.level))
            Sparkline(model.history["resp_rate_bpm"].orEmpty())
        }
        EcoCard {
            SectionTitle(Icons.Outlined.Bedtime, t("sleep"))
            Text(sleep?.let { "${round1(it.value / 60)} h" } ?: "—", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }
        EcoCard {
            SectionTitle(Icons.Outlined.SentimentSatisfied, t("mood_private"))
            val last = model.checkIns.takeLast(7)
            if (last.isEmpty()) Text(t("mood_empty"), color = EcoColors.Muted)
            else Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(vertical = 6.dp)) {
                last.forEach { Icon(moodIcon(it.mood), contentDescription = "${it.mood}/5", tint = moodColor(it.mood), modifier = Modifier.size(30.dp)) }
            }
            Text(t("mood_hint"), color = EcoColors.Muted, fontSize = 13.sp)
        }
        ScreeningHistoryCard(model)
    }
}

/** T5 · Check-in diario de ánimo y síntomas. Nada viene preseleccionado: cada respuesta es una decisión real. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CheckInScreen(model: AppModel) {
    var mood by remember { mutableStateOf(0) }
    var stress by remember { mutableStateOf(0) }
    var energy by remember { mutableStateOf(0) }
    var symptoms by remember { mutableStateOf(setOf<String>()) }
    var noSymptoms by remember { mutableStateOf(false) }
    var note by remember { mutableStateOf("") }
    val answered = listOf(mood, stress, energy).count { it > 0 }
    val ready = answered == 3

    Column(Modifier.fillMaxSize()) {
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(t("checkin_title"), fontSize = 26.sp, fontWeight = FontWeight.Bold)
                    Text(t("ci_sub"), color = EcoColors.Muted, fontSize = 14.sp)
                }
                Pill(t("answered", "n" to answered.toString()), if (ready) Tone.Safe else Tone.Info)
            }
            Question(t("q_mood"), "mood", mood, { moodIcon(it) }) { mood = it }
            Question(t("q_stress"), "stress", stress, { moodIcon(6 - it) }, colorLevel = { 6 - it }) { stress = it }
            Question(t("q_energy"), "energy", energy, { energyIcon(it) }) { energy = it }

            // Síntomas: opcionales, con "Ninguno" para poder responder explícitamente
            EcoCard {
                Text(t("q_symptoms"), fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                Text(t("symptoms_opt"), color = EcoColors.Muted, fontSize = 13.sp, modifier = Modifier.padding(bottom = 8.dp))
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    SymptomChip(t("no_symptoms"), noSymptoms) { noSymptoms = !noSymptoms; if (noSymptoms) symptoms = emptySet() }
                    SYMPTOMS.forEach { s ->
                        SymptomChip(t("s_$s"), s in symptoms) {
                            symptoms = if (s in symptoms) symptoms - s else symptoms + s
                            if (symptoms.isNotEmpty()) noSymptoms = false
                        }
                    }
                }
                Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Outlined.MedicalServices, contentDescription = null, tint = EcoColors.Muted, modifier = Modifier.size(14.dp))
                    Text(t("symptom_hint"), color = EcoColors.Muted, fontSize = 12.sp)
                }
            }

            EcoCard {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Icon(Icons.Outlined.Lock, contentDescription = null, tint = EcoColors.Muted, modifier = Modifier.size(16.dp))
                    Text(t("note_private"), fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                }
                OutlinedTextField(
                    note, { note = it.take(1000) },
                    placeholder = { Text(t("note_ph"), color = EcoColors.Muted) },
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp), minLines = 3,
                )
            }
        }

        // Botón fijo abajo: siempre visible y explica por qué está desactivado
        Column(Modifier.fillMaxWidth().background(EcoColors.Bg).padding(horizontal = 16.dp, vertical = 10.dp)) {
            Button(
                onClick = { model.saveCheckIn(CheckIn("", mood, stress, energy, symptoms.toList(), note.take(1000))) },
                enabled = ready,
                modifier = Modifier.fillMaxWidth().height(52.dp),
            ) {
                Icon(Icons.Outlined.Check, contentDescription = null, modifier = Modifier.size(20.dp))
                Text("  " + t("save_checkin"), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            }
            if (!ready) Text(t("answer_all"), color = EcoColors.Muted, fontSize = 12.sp, modifier = Modifier.align(Alignment.CenterHorizontally).padding(top = 4.dp))
        }
    }
}

private fun energyIcon(level: Int): ImageVector = when (level) {
    1 -> Icons.Outlined.Battery0Bar
    2 -> Icons.Outlined.Battery2Bar
    3 -> Icons.Outlined.Battery4Bar
    4 -> Icons.Outlined.Battery6Bar
    else -> Icons.Outlined.BatteryFull
}

/** Una pregunta con 5 opciones grandes: icono + palabra. La opción elegida se colorea y se nombra arriba. */
@Composable
private fun Question(
    question: String,
    key: String,
    value: Int,
    icon: (Int) -> ImageVector,
    colorLevel: (Int) -> Int = { it },
    onChange: (Int) -> Unit,
) {
    EcoCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(question, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, modifier = Modifier.weight(1f))
            if (value > 0) Text(t("${key}_$value"), color = optionColor(colorLevel(value)), fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
        }
        Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            (1..5).forEach { level ->
                val sel = value == level
                val c = optionColor(colorLevel(level))
                val shape = RoundedCornerShape(10.dp)
                val label = t("${key}_$level")
                Column(
                    Modifier.weight(1f).height(72.dp)
                        .background(if (sel) c.copy(alpha = 0.18f) else EcoColors.Surface2, shape)
                        .border(if (sel) 2.dp else 1.dp, if (sel) c else EcoColors.Border, shape)
                        .selectable(selected = sel, role = Role.RadioButton) { onChange(level) }
                        .semantics { contentDescription = "$question: $label" },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Icon(icon(level), contentDescription = null, tint = if (sel) c else EcoColors.Muted, modifier = Modifier.size(28.dp))
                    Text(
                        label, fontSize = 11.sp, maxLines = 1,
                        color = if (sel) EcoColors.Text else EcoColors.Muted,
                        fontWeight = if (sel) FontWeight.SemiBold else FontWeight.Normal,
                        modifier = Modifier.padding(top = 4.dp),
                    )
                }
            }
        }
    }
}

/** Color de la opción: cálido si es negativo, cian si es neutro, verde si es positivo. */
private fun optionColor(level: Int) = when (level) {
    1, 2 -> EcoColors.Warn
    3 -> EcoColors.Accent
    else -> EcoColors.Ok
}

@Composable
private fun SymptomChip(label: String, selected: Boolean, onClick: () -> Unit) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label, fontSize = 14.sp) },
        leadingIcon = if (selected) ({ Icon(Icons.Outlined.Check, contentDescription = null, modifier = Modifier.size(18.dp)) }) else null,
        modifier = Modifier.height(40.dp),
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = EcoColors.Accent.copy(alpha = 0.18f),
            selectedLabelColor = EcoColors.Text,
            selectedLeadingIconColor = EcoColors.Accent,
        ),
    )
}
