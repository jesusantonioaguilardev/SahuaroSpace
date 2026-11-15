package app.astrohealth.eco.platform

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

actual val defaultServerUrl: String = "http://localhost:3000"

// En escritorio no hay voz: la app sigue funcionando por texto.
actual object Speech {
    actual val available: Boolean = false
    actual fun speak(text: String, lang: String, rate: Float) {}
    actual fun stop() {}
}

actual object AudioPlayer {
    actual fun play(mp3: ByteArray, onDone: () -> Unit) = onDone()
    actual fun stop() {}
}

@Composable
actual fun rememberVoiceInput(onResult: (String) -> Unit, onError: (String) -> Unit): VoiceInput = remember {
    object : VoiceInput {
        override val available = false
        override val listening = false
        override val partial = ""
        override val level = 0f
        override fun start(lang: String) = onError("unsupported")
        override fun stop() {}
        override fun cancel() {}
    }
}

// Solo para pruebas en escritorio: en memoria, se borra al cerrar.
actual object SecureStore {
    private val data = mutableMapOf<String, String>()
    actual fun get(key: String): String? = data[key]
    actual fun put(key: String, value: String) { data[key] = value }
    actual fun remove(key: String) { data.remove(key) }
}

@Composable
actual fun PlatformBackHandler(enabled: Boolean, onBack: () -> Unit) {}
