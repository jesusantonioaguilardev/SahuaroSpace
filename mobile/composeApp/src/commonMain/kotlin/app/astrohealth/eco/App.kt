package app.astrohealth.eco

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.Warning
import androidx.compose.material.icons.outlined.MonitorHeart
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Icon
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import app.astrohealth.eco.ui.CharacterAvatar
import app.astrohealth.eco.ui.EloiseLogo
import app.astrohealth.eco.ui.InstrumentScreen
import app.astrohealth.eco.ui.LiveScreen
import app.astrohealth.eco.ui.Mono
import app.astrohealth.eco.ui.StatusDot
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import app.astrohealth.eco.data.Alert
import app.astrohealth.eco.data.Repository
import app.astrohealth.eco.ui.CheckInScreen
import app.astrohealth.eco.ui.DataScreen
import app.astrohealth.eco.ui.EcoColors
import app.astrohealth.eco.ui.EcoScreen
import app.astrohealth.eco.ui.EcoTheme
import app.astrohealth.eco.ui.LevelPill
import app.astrohealth.eco.ui.LoadingScreen
import app.astrohealth.eco.ui.LoginScreen
import app.astrohealth.eco.ui.NoConfigScreen
import app.astrohealth.eco.ui.Orb
import app.astrohealth.eco.ui.PrivacyScreen
import app.astrohealth.eco.ui.RulesScreen
import app.astrohealth.eco.ui.ShelterScreen
import app.astrohealth.eco.ui.TodayScreen

@Composable
fun App() {
    val scope = rememberCoroutineScope()
    val model = remember {
        val repo = if (Config.configured) Repository(Config.SUPABASE_URL, Config.SUPABASE_ANON_KEY) else null
        AppModel(repo, scope).also { it.start() }
    }
    EcoTheme {
        Surface(Modifier.fillMaxSize(), color = EcoColors.Bg) {
            Box(Modifier.safeDrawingPadding()) {
                when (model.phase) {
                    Phase.Loading -> LoadingScreen()
                    Phase.NoConfig -> NoConfigScreen()
                    Phase.Login -> LoginScreen(model)
                    Phase.Rules -> RulesScreen(model)
                    Phase.Main -> MainScaffold(model)
                }
            }
        }
    }
}

@Composable
private fun MainScaffold(model: AppModel) {
    var voiceRequest by remember { mutableStateOf(false) }
    val snackbar = remember { SnackbarHostState() }
    LaunchedEffect(model.toast) {
        model.toast?.let { snackbar.showSnackbar(it); model.toast = null }
    }

    Scaffold(
        containerColor = EcoColors.Bg,
        snackbarHost = { SnackbarHost(snackbar) },
        topBar = { TopBar(model) },
        bottomBar = { BottomNav(model) { voiceRequest = false } },
    ) { padding ->
        Box(Modifier.padding(padding).fillMaxSize()) {
            when (model.route) {
                // "Hablar con…" abre la conversación en vivo; "Escribir" abre el chat
                Route.Today -> TodayScreen(model) { voice -> if (voice) model.openLive() else { voiceRequest = false; model.route = Route.Eco } }
                Route.Eco -> EcoScreen(model, startWithVoice = voiceRequest, onVoiceStarted = { voiceRequest = false })
                Route.Data -> DataScreen(model)
                Route.CheckIn -> CheckInScreen(model)
                Route.Shelter -> ShelterScreen(model)
                Route.Privacy -> PrivacyScreen(model)
            }
        }
    }

    // Conversación en vivo con el personaje animado (pantalla completa)
    if (model.liveOpen) LiveScreen(model)

    // Cuestionario PHQ‑9 / GAD‑7 (encima del chat y del modo en vivo)
    if (model.instrumentRun != null) InstrumentScreen(model)

    // T6 · Alerta urgente en pantalla completa (siempre por encima de todo)
    model.pendingUrgent?.let { UrgentAlert(model, it) }

    // Aviso de emergencia: el tripulante decide
    if (model.escalation != null) {
        AlertDialog(
            onDismissRequest = { model.confirmEscalation(false) },
            icon = { Icon(Icons.Outlined.FavoriteBorder, contentDescription = null, tint = EcoColors.Accent) },
            title = { Text(t("esc_title", "name" to model.character.displayName)) },
            text = { Text(t("esc_text")) },
            confirmButton = { Button(onClick = { model.confirmEscalation(true) }) { Text(t("esc_yes")) } },
            dismissButton = { TextButton(onClick = { model.confirmEscalation(false) }) { Text(t("esc_no")) } },
        )
    }
}

/** Encabezado del diseño ELOISE: logo, estado de la nave y tiempo de misión (MET). */
@Composable
private fun TopBar(model: AppModel) {
    Row(
        Modifier.fillMaxWidth().background(Color(0xE80A1523)).padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        EloiseLogo()
        Spacer(Modifier.weight(1f))
        Column(horizontalAlignment = Alignment.End) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                StatusDot(if (model.error == null) EcoColors.Ok else EcoColors.Danger)
                Text(t("ship_connected"), color = Color(0xFF8FA4B9), fontSize = 10.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.8.sp)
            }
            Text("MET ${model.met()}", color = Color(0xFF8FA4B9), fontSize = 10.sp, fontFamily = Mono, modifier = Modifier.padding(top = 2.dp))
        }
    }
    Box(Modifier.fillMaxWidth().height(1.dp).background(Color(0xFF1C3044)))
    model.error?.let {
        Text(it, color = EcoColors.DangerText, fontSize = 12.sp, modifier = Modifier.fillMaxWidth().background(EcoColors.DangerBg).padding(6.dp))
    }
}

/** Barra inferior del diseño: Hoy · Salud · [personaje] · Check-in · Ajustes. */
@Composable
private fun BottomNav(model: AppModel, onEco: () -> Unit) {
    val who = model.character
    Box(Modifier.fillMaxWidth().background(Color(0xF00A1523))) {
        Box(Modifier.fillMaxWidth().height(1.dp).background(Color(0xFF1C3044)))
        Row(
            Modifier.fillMaxWidth().navigationBarsPadding().height(76.dp).padding(horizontal = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            NavItem(model, Route.Today, Icons.Outlined.Home, t("nav_today"))
            NavItem(model, if (model.stormActive) Route.Shelter else Route.Data, if (model.stormActive) Icons.Outlined.Shield else Icons.Outlined.MonitorHeart,
                if (model.stormActive) t("nav_shelter") else t("nav_health"), alarm = model.stormActive)
            // Botón central: el personaje
            Column(
                Modifier.weight(1f).clickable { onEco(); model.route = Route.Eco },
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    Modifier.offset(y = (-6).dp).size(54.dp).clip(CircleShape)
                        .background(Brush.radialGradient(listOf(who.color.copy(alpha = 0.35f), EcoColors.Surface2)))
                        .border(1.dp, if (model.route == Route.Eco) EcoColors.Accent else EcoColors.Border2, CircleShape),
                    contentAlignment = Alignment.Center,
                ) { CharacterAvatar(who, model.mood, 46.dp) }
                Text(who.displayName.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.8.sp,
                    color = if (model.route == Route.Eco) EcoColors.Accent else EcoColors.Muted, modifier = Modifier.offset(y = (-4).dp))
            }
            NavItem(model, Route.CheckIn, Icons.Outlined.CheckCircle, t("nav_checkin"))
            NavItem(model, Route.Privacy, Icons.Outlined.Settings, t("nav_settings"))
        }
    }
}

@Composable
private fun RowScope.NavItem(model: AppModel, route: Route, icon: ImageVector, label: String, alarm: Boolean = false) {
    val selected = model.route == route
    val color = when {
        alarm -> EcoColors.Danger
        selected -> EcoColors.Accent
        else -> EcoColors.Muted
    }
    Column(
        Modifier.weight(1f).clickable { model.route = route }.padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(22.dp))
        Text(label, color = color, fontSize = 11.sp, fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal, modifier = Modifier.padding(top = 3.dp))
    }
}

@Composable
private fun UrgentAlert(model: AppModel, alert: Alert) {
    Dialog(onDismissRequest = {}, properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false)) {
        Column(
            Modifier.fillMaxWidth().background(EcoColors.DangerStrong, RoundedCornerShape(20.dp)).padding(22.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Outlined.Warning, contentDescription = null, tint = EcoColors.Text, modifier = Modifier.size(18.dp))
                Text(t("urgent").uppercase(), color = EcoColors.Text, fontWeight = FontWeight.Bold, fontSize = 13.sp, letterSpacing = 1.sp)
            }
            Text(model.alertTitle(alert), color = EcoColors.Text, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp)
            alert.value?.let { Text(round1(it).toString(), color = EcoColors.Text, fontWeight = FontWeight.Bold, fontSize = 22.sp) }
            model.alertSteps(alert).forEachIndexed { i, s -> Text("${i + 1}. $s", color = EcoColors.Text, fontSize = 17.sp) }
            val light = ButtonDefaults.buttonColors(containerColor = EcoColors.Text, contentColor = EcoColors.DangerStrong)
            if (alert.alertTypeId == "solar_storm") {
                Button(onClick = { model.acknowledge(alert, thenShelter = true) }, colors = light, modifier = Modifier.fillMaxWidth().height(56.dp)) {
                    Icon(Icons.Outlined.Shield, contentDescription = null, modifier = Modifier.size(20.dp))
                    Text("  ${t("go_shelter")}", fontSize = 17.sp)
                }
            }
            Button(onClick = { model.acknowledge(alert, thenShelter = false) }, colors = light, modifier = Modifier.fillMaxWidth().height(56.dp)) {
                Text(t("got_it"), fontSize = 17.sp)
            }
        }
    }
}
