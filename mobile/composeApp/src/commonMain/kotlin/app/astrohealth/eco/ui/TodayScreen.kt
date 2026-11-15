package app.astrohealth.eco.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.outlined.Mic
import androidx.compose.material.icons.outlined.Keyboard
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.AppModel
import app.astrohealth.eco.Route
import app.astrohealth.eco.round1
import app.astrohealth.eco.t
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlin.math.roundToInt


/** T2 · Hoy (diseño ELOISE): saludo, tarjeta del personaje, sistemas vitales, check-in y refugio. */
@Composable
fun TodayScreen(model: AppModel, onTalk: (voice: Boolean) -> Unit) {
    val me = model.me ?: return
    val who = model.character
    val level = model.status?.overallLevel ?: "normal"
    val zone = model.myZoneId
    val hr = model.reading("heart_rate_bpm")
    val o2 = model.zoneReading(zone, "cabin_o2_pct")
    val co2 = model.zoneReading(zone, "cabin_co2_mmhg")
    val career = model.career
    val notices = model.myOpenAlerts.filter { it.level == "attention" }
    val lastCheckin = model.checkIns.lastOrNull()
    val firstName = me.displayName.substringBefore(' ')
    val hour = model.simNow().toLocalDateTime(TimeZone.UTC).hour
    val greeting = t(if (hour < 12) "good_morning" else if (hour < 19) "good_afternoon" else "good_evening", "name" to firstName)
    val subtitle = when (level) {
        "urgent" -> t("urgent_now")
        "attention" -> t("some_attention", "n" to notices.size.coerceAtLeast(1))
        else -> t("all_stable")
    }

    Column(
        Modifier.verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ScreenHeader(
            eyebrow = t("mission_day", "n" to model.missionDay()),
            title = greeting,
            subtitle = subtitle,
            action = {
                Column(horizontalAlignment = Alignment.End) {
                    Eyebrow(t("health_status"), color = EcoColors.Muted)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 4.dp)) {
                        StatusDot(levelColor(level).takeIf { level != "normal" } ?: EcoColors.Ok)
                        Text(t("lvl_$level").uppercase(), color = if (level == "normal") EcoColors.OkText else levelColor(level), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                }
            },
        )

        if (model.stormActive && !model.inShelter) {
            Row(
                Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(EcoColors.DangerBg)
                    .border(1.dp, EcoColors.DangerBorder, RoundedCornerShape(8.dp)).clickable { model.route = Route.Shelter }.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MetricIconBox(MetricIcon.Shield, EcoColors.Danger)
                Text(t("storm_banner"), color = EcoColors.DangerText, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f).padding(start = 12.dp))
            }
        }

        // Tarjeta principal: el personaje en lugar del orbe del diseño
        Box(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF11243A), Color(0xFF0D1B2B))))
                .border(1.dp, Color(0xFF284960), RoundedCornerShape(8.dp)).padding(18.dp),
        ) {
            Column {
                Row(verticalAlignment = Alignment.Top) {
                    Column(Modifier.weight(1f)) {
                        Pill(t("available", "name" to who.displayName), Tone.Info)
                        Text(t("how_feel"), fontSize = 22.sp, fontWeight = FontWeight.SemiBold, lineHeight = 27.sp, modifier = Modifier.padding(top = 12.dp))
                        Text(t("hero_sub_${who.key}"), color = EcoColors.Muted, fontSize = 14.sp, modifier = Modifier.padding(top = 6.dp))
                    }
                    Box(
                        Modifier.size(104.dp).background(Brush.radialGradient(listOf(who.color.copy(alpha = 0.28f), Color.Transparent)), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) { CharacterAvatar(who, model.mood, 96.dp) }
                }
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = { onTalk(true) },
                    shape = RoundedCornerShape(5.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = EcoColors.Accent, contentColor = EcoColors.AccentInk),
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                ) {
                    Icon(Icons.Outlined.Mic, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("  ${t("talk_with", "name" to who.displayName)}", fontWeight = FontWeight.Bold)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                    OutlinedButton(onClick = { onTalk(false) }, shape = RoundedCornerShape(5.dp), modifier = Modifier.weight(1f).height(46.dp)) {
                        Icon(Icons.Outlined.Keyboard, contentDescription = null, tint = EcoColors.Text, modifier = Modifier.size(18.dp))
                        Text("  ${t("write")}", color = EcoColors.Text)
                    }
                    OutlinedButton(onClick = { model.route = Route.CheckIn }, shape = RoundedCornerShape(5.dp), modifier = Modifier.weight(1.4f).height(46.dp)) {
                        Text(t("checkin_1min"), color = EcoColors.Text, maxLines = 1)
                    }
                }
            }
        }

        Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(t("vital_systems"), fontWeight = FontWeight.SemiBold, fontSize = 16.sp, modifier = Modifier.weight(1f))
            TextButton(onClick = { model.route = Route.Data }) {
                Text(t("see_trends"), color = EcoColors.Accent, fontSize = 13.sp)
                Icon(Icons.AutoMirrored.Outlined.ArrowForward, contentDescription = null, tint = EcoColors.Accent, modifier = Modifier.size(15.dp).padding(start = 2.dp))
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricCard(
                MetricIcon.Radiation, t("accumulated_radiation"),
                career?.careerDoseMsv?.let { round1(it).toString() } ?: "—", "mSv",
                t("of_limit", "pct" to (career?.pctOfLimit ?: 0.0).roundToInt()), "yellow",
                model.history["dose_rate_usv_h"].orEmpty(), modifier = Modifier.weight(1f),
            )
            MetricCard(
                MetricIcon.Air, t("cabin_oxygen"),
                o2?.let { round1(it.value).toString() } ?: "—", "%",
                if (o2?.level == null || o2.level == "normal") t("nominal") else t("lvl_${o2.level}"),
                if (o2?.level == null || o2.level == "normal") "green" else "red",
                modifier = Modifier.weight(1f),
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricCard(
                MetricIcon.Activity, t("air_quality"),
                co2?.let { round1(it.value).toString() } ?: "—", "mmHg",
                if (co2?.level == null || co2.level == "normal") t("nominal") else t("check"),
                when (co2?.level) { "urgent" -> "red"; "attention" -> "yellow"; else -> "cyan" },
                modifier = Modifier.weight(1f),
            )
            MetricCard(
                MetricIcon.Heart, t("heart_rate"),
                hr?.value?.roundToInt()?.toString() ?: "—", if (model.lang == "en") "bpm" else "lpm",
                if (hr?.level == null || hr.level == "normal") t("at_rest") else t("check"),
                if (hr?.level == null || hr.level == "normal") "green" else "red",
                model.history["heart_rate_bpm"].orEmpty(), modifier = Modifier.weight(1f),
            )
        }

        EcoCard(title = t("last_checkin"), action = { lastCheckin?.let { Text(it.day, color = EcoColors.Muted, fontSize = 12.sp, fontFamily = Mono) } }) {
            if (lastCheckin == null) {
                Text(t("no_checkin"), color = EcoColors.Muted)
                OutlinedButton(onClick = { model.route = Route.CheckIn }, shape = RoundedCornerShape(5.dp), modifier = Modifier.padding(top = 10.dp)) {
                    Text(t("checkin_go"), color = EcoColors.Text)
                }
            } else {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(Modifier.size(44.dp).background(EcoColors.Surface3, CircleShape), contentAlignment = Alignment.Center) {
                        Icon(moodIcon(lastCheckin.mood), contentDescription = "${lastCheckin.mood}/5", tint = moodColor(lastCheckin.mood), modifier = Modifier.size(26.dp))
                    }
                    Column(Modifier.weight(1f)) {
                        Text("${t("mood")} ${lastCheckin.mood}/5 · ${t("energy")} ${lastCheckin.energy}/5", fontWeight = FontWeight.SemiBold)
                        Text("${t("stress")} ${lastCheckin.stress}/5 · ${if (lastCheckin.symptoms.isEmpty()) "—" else lastCheckin.symptoms.joinToString { t("s_$it") }}", color = EcoColors.Muted, fontSize = 13.sp)
                    }
                    Pill(t("complete"))
                }
            }
        }

        EcoCard {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                MetricIconBox(MetricIcon.Shield, if (model.stormActive) EcoColors.Danger else EcoColors.Accent)
                Column(Modifier.weight(1f)) {
                    Text(t("shelter_card"), fontWeight = FontWeight.SemiBold)
                    Text(t("shelter_card_sub"), color = EcoColors.Muted, fontSize = 13.sp)
                }
                OutlinedButton(onClick = { model.route = Route.Shelter }, shape = RoundedCornerShape(5.dp)) { Text(t("open"), color = EcoColors.Text) }
            }
        }

        if (notices.isNotEmpty()) {
            EcoCard(title = t("notices"), action = { Pill("${notices.size}", Tone.Warn) }) {
                notices.forEach { a ->
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
                        StatusDot(EcoColors.Warn)
                        Text("  ${model.alertTitle(a)}${a.value?.let { " · ${round1(it)}" } ?: ""}", modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

fun worst(vararg levels: String?): String = when {
    levels.any { it == "urgent" } -> "urgent"
    levels.any { it == "attention" } -> "attention"
    else -> "normal"
}
