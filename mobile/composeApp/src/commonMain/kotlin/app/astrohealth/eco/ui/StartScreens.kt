package app.astrohealth.eco.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.AppModel
import app.astrohealth.eco.t

@Composable
fun LoadingScreen() {
    Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        CircularProgressIndicator()
    }
}

@Composable
fun NoConfigScreen() {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        EloiseLogo()
        Spacer(Modifier.height(16.dp))
        Text(t("login_title"), fontSize = 26.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(8.dp))
        Text(t("no_config"), color = EcoColors.Muted)
    }
}

/** Inicio de sesión del tripulante. */
@Composable
fun LoginScreen(model: AppModel) {
    var email by remember { mutableStateOf("tripulante1@astrohealth.test") }
    var password by remember { mutableStateOf("") }
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        EloiseLogo()
        Spacer(Modifier.height(28.dp))
        Pill(t("encrypted_network"), Tone.Info)
        Spacer(Modifier.height(12.dp))
        Text(t("login_title"), fontSize = 28.sp, fontWeight = FontWeight.SemiBold)
        Text(t("login_intro"), color = EcoColors.Muted)
        Spacer(Modifier.height(20.dp))
        OutlinedTextField(
            email, { email = it }, label = { Text(t("email")) }, singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email), modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(
            password, { password = it }, label = { Text(t("password")) }, singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password), modifier = Modifier.fillMaxWidth(),
        )
        model.error?.let { Text(it, color = EcoColors.Danger, modifier = Modifier.padding(top = 8.dp)) }
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = { model.login(email, password) },
            enabled = !model.busy && email.isNotBlank() && password.isNotBlank(),
            modifier = Modifier.fillMaxWidth().height(56.dp),
        ) { Text(if (model.busy) "…" else t("login"), fontSize = 17.sp) }
    }
}

/** T1 · Bienvenida y reglas de privacidad (primera vez). */
@Composable
fun RulesScreen(model: AppModel) {
    var speak by remember { mutableStateOf(true) }
    var character by remember { mutableStateOf(model.character) }
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Spacer(Modifier.height(12.dp))
        EloiseLogo()
        Pill(t("first_access"), Tone.Info)
        Text(t("rules_title"), fontSize = 26.sp, fontWeight = FontWeight.SemiBold)
        Text(t("rules_intro"), color = EcoColors.Muted)
        EcoCard {
            Text(t("rules"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Spacer(Modifier.height(6.dp))
            listOf("rule1", "rule2", "rule3").forEachIndexed { i, k -> Text("${i + 1}. ${t(k)}", modifier = Modifier.padding(vertical = 3.dp)) }
            Spacer(Modifier.height(6.dp))
            Text(t("rule_emergency"), color = EcoColors.Muted, fontSize = 14.sp)
        }
        Text(t("choose_character"), fontWeight = FontWeight.Bold, fontSize = 17.sp)
        CharacterPicker(character) { character = it }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(speak, { speak = it })
            Text(t("voice_replies"))
        }
        Button(onClick = { model.acceptRules(speak, character) }, modifier = Modifier.fillMaxWidth().height(56.dp)) {
            Text(t("accept"), fontSize = 17.sp)
        }
    }
}
