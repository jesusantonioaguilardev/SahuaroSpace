package app.astrohealth.eco.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Switch
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
import app.astrohealth.eco.Route
import app.astrohealth.eco.clock
import app.astrohealth.eco.formatDuration
import app.astrohealth.eco.parseInstant
import app.astrohealth.eco.round1
import app.astrohealth.eco.t
import kotlin.math.roundToInt

/** T7 · Modo refugio por tormenta solar. */
@Composable
fun ShelterScreen(model: AppModel) {
    val sh = model.shelter
    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricIconBox(MetricIcon.Shield, if (model.stormActive) EcoColors.Danger else EcoColors.Accent)
            Text(t("shelter_title"), fontSize = 22.sp, fontWeight = FontWeight.SemiBold)
        }
        if (sh == null) {
            Text(t("no_storm"), color = EcoColors.Muted)
            return@Column
        }
        if (sh.endedAt != null) {
            EcoCard {
                SectionTitle(Icons.Outlined.CheckCircle, t("all_clear"), EcoColors.Ok)
                Text(t("all_clear_text", "dose" to round1(sh.doseAvoidedEstMsv ?: 0.0)))
            }
            Button(onClick = { model.route = Route.Eco }, modifier = Modifier.fillMaxWidth().height(56.dp)) { Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, modifier = Modifier.size(18.dp)); Text("  ${t("talk_with", "name" to model.character.displayName)}") }
            return@Column
        }
        val shelterZone = model.zones.firstOrNull { it.id == sh.zoneId }
        if (model.inShelter) {
            EcoCard { SectionTitle(Icons.Outlined.CheckCircle, t("inside"), EcoColors.Ok) }
        } else {
            EcoCard("urgent") {
                val toArrival = model.stormArrival()?.let { it - model.simNow() }
                if (toArrival != null && toArrival.isPositive()) {
                    Text(t("arrive_in"))
                    val s = toArrival.inWholeSeconds
                    Text(
                        "${(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}",
                        fontSize = 44.sp, fontWeight = FontWeight.ExtraBold, color = EcoColors.Danger,
                    )
                } else {
                    Text(t("arrived_already"), color = EcoColors.Danger, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
                Text(t("your_zone", "zone" to (shelterZone?.name ?: "—")))
                Button(
                    onClick = { model.arrive() },
                    colors = ButtonDefaults.buttonColors(containerColor = EcoColors.Danger, contentColor = EcoColors.Text),
                    modifier = Modifier.fillMaxWidth().height(56.dp).padding(top = 8.dp),
                ) { Text(t("i_arrived"), fontSize = 17.sp) }
            }
        }
        val inside = model.zoneReading(sh.zoneId, "dose_rate_usv_h")
        val outsideZone = model.zones.firstOrNull { !it.isShelter && it.shieldingFactor <= 1.0 }
        val outside = model.zoneReading(outsideZone?.id, "dose_rate_usv_h")
        val co2 = model.zoneReading(sh.zoneId, "cabin_co2_mmhg")
        val o2 = model.zoneReading(sh.zoneId, "cabin_o2_pct")
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(t("dose_here"), inside?.let { "${it.value.roundToInt()} µSv/h" } ?: "—", modifier = Modifier.weight(1f))
            StatCard(t("dose_out"), outside?.let { "${it.value.roundToInt()} µSv/h" } ?: "—", level = outside?.level ?: "normal", modifier = Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            StatCard(t("exit_in"), model.stormEnd()?.let { formatDuration(it - model.simNow()) } ?: "—", modifier = Modifier.weight(1f))
            StatCard(t("people"), "${model.assignments.count { it.arrivedAt != null }} / ${model.assignments.size}", modifier = Modifier.weight(1f))
        }
        StatCard(t("shelter_air"), co2?.let { "CO2 ${round1(it.value)} mmHg" } ?: "—", o2?.let { "O2 ${round1(it.value)} %" }, worst(co2?.level, o2?.level))

        // Turnos: el bloque actual y el siguiente
        val now = model.simNow()
        val blocks = model.shifts.groupBy { it.startsAt }.toSortedMap()
        val current = blocks.entries.firstOrNull { (start, list) -> now >= parseInstant(start) && now < parseInstant(list.first().endsAt) }
        val next = blocks.entries.firstOrNull { (start, _) -> parseInstant(start) > now }
        if (current != null || next != null) {
            EcoCard {
                Text(t("shifts"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
                listOfNotNull(current?.let { t("now") to it }, next?.let { t("next") to it }).forEach { (label, entry) ->
                    val list = entry.value
                    fun names(kind: String) = list.filter { it.kind == kind }
                        .joinToString(", ") { s -> model.crew.firstOrNull { it.id == s.crewMemberId }?.displayName?.substringBefore(' ') ?: "?" }
                    Text("$label · ${clock(parseInstant(entry.key))}–${clock(parseInstant(list.first().endsAt))}", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 8.dp))
                    Text("${t("rest")}: ${names("rest")}")
                    Text("${t("watch")}: ${names("watch")}", color = EcoColors.Muted)
                }
            }
        }
        Button(onClick = { model.route = Route.Eco }, modifier = Modifier.fillMaxWidth().height(56.dp)) { Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, modifier = Modifier.size(18.dp)); Text("  ${t("talk_with", "name" to model.character.displayName)}") }
    }
}

/** T8 · Privacidad y permisos (con ajustes). */
@Composable
fun PrivacyScreen(model: AppModel) {
    val s = model.settings
    var server by remember { mutableStateOf(s.serverUrl) }
    Column(Modifier.verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(t("privacy_title"), fontSize = 24.sp, fontWeight = FontWeight.Bold)
        EcoCard {
            Text(t("rules"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
            listOf("rule1", "rule2", "rule3").forEachIndexed { i, k -> Text("${i + 1}. ${t(k)}", modifier = Modifier.padding(vertical = 3.dp)) }
        }
        EcoCard {
            Toggle(t("share_mood"), model.consents["mood_trend"] == true) { model.setConsent("mood_trend", it) }
            Toggle(t("share_sleep"), model.consents["sleep_trend"] == true) { model.setConsent("sleep_trend", it) }
            Toggle(t("memory"), s.memory) { model.updateSettings(s.copy(memory = it)) }
        }
        // Memoria visible y editable: la persona siempre sabe qué recuerdan los personajes y puede borrarlo
        if (s.memory) EcoCard {
            Text(t("memory_title"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Text(t("memory_sub"), color = EcoColors.Muted, fontSize = 13.sp, modifier = Modifier.padding(bottom = 6.dp))
            if (model.memory.isEmpty()) Text(t("memory_empty"), color = EcoColors.Muted, fontSize = 14.sp)
            model.memory.forEach { fact ->
                androidx.compose.foundation.layout.Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Text(fact, fontSize = 14.sp, modifier = Modifier.weight(1f))
                    androidx.compose.material3.IconButton(onClick = { model.forgetFact(fact) }) {
                        Icon(androidx.compose.material.icons.Icons.Outlined.Close, contentDescription = t("forget_fact"), tint = EcoColors.Muted, modifier = Modifier.size(18.dp))
                    }
                }
            }
            if (model.memory.isNotEmpty()) androidx.compose.material3.TextButton(onClick = { model.forgetAll() }) {
                Text(t("forget_all"), color = EcoColors.Danger)
            }
        }
        EcoCard {
            Text(t("viewed"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
            if (model.accessLog.isEmpty()) Text(t("viewed_none"), color = EcoColors.Muted)
            model.accessLog.forEach { e ->
                val what = when {
                    e.resource.contains("wellbeing") -> t("res_wellbeing")
                    e.resource.contains("detail") -> t("res_detail")
                    else -> t("res_safety")
                }
                Text("${clock(parseInstant(e.viewedAt))} — $what", fontSize = 14.sp, modifier = Modifier.padding(vertical = 2.dp))
            }
        }
        OutlinedButton(onClick = { model.deleteAllConversations() }, modifier = Modifier.fillMaxWidth()) {
            Text(t("delete_all"), color = EcoColors.Danger)
        }
        Text(t("choose_character"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
        CharacterPicker(model.character) { model.updateSettings(s.copy(character = it.key)) }
        EcoCard {
            Text(t("settings"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Text(t("language"), modifier = Modifier.padding(top = 8.dp))
            SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                listOf("es" to "Español", "en" to "English").forEachIndexed { i, (code, label) ->
                    SegmentedButton(selected = s.lang == code, onClick = { model.updateSettings(s.copy(lang = code)) }, shape = SegmentedButtonDefaults.itemShape(i, 2)) { Text(label) }
                }
            }
            Toggle(t("voice", "name" to model.character.displayName), s.speak) { model.updateSettings(s.copy(speak = it)) }
            OutlinedTextField(
                server, { server = it },
                label = { Text(t("server")) },
                placeholder = { Text(model.serverUrl) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            Text(t("server_hint"), color = EcoColors.Muted, fontSize = 12.sp)
            OutlinedButton(onClick = { model.updateSettings(s.copy(serverUrl = server.trim())) }, modifier = Modifier.padding(top = 6.dp)) { Text(t("save")) }
        }
        OutlinedButton(onClick = { model.logout() }, modifier = Modifier.fillMaxWidth()) { Text(t("logout")) }
    }
}

@Composable
private fun Toggle(label: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, modifier = Modifier.weight(1f))
        Switch(checked, onChange)
    }
}
