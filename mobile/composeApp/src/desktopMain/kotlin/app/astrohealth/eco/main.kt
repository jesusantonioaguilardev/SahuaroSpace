package app.astrohealth.eco

import androidx.compose.ui.unit.DpSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Window
import androidx.compose.ui.window.application
import androidx.compose.ui.window.rememberWindowState

// Versión de escritorio: solo para probar las pantallas rápido (sin voz).
fun main() = application {
    Window(
        onCloseRequest = ::exitApplication,
        title = "Eco",
        state = rememberWindowState(size = DpSize(420.dp, 860.dp)),
    ) { App() }
}
