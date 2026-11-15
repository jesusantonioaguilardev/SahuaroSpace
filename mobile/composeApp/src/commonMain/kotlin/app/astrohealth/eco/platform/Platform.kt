package app.astrohealth.eco.platform

import androidx.compose.runtime.Composable

/** Dirección del servidor de Eco por defecto (emulador de Android: 10.0.2.2 = esta computadora). */
expect val defaultServerUrl: String

/** Texto a voz del sistema. */
expect object Speech {
    val available: Boolean
    fun speak(text: String, lang: String, rate: Float = 1f)
    fun stop()
}

/** Reproduce el audio mp3 de la voz del personaje (ElevenLabs). */
expect object AudioPlayer {
    fun play(mp3: ByteArray, onDone: () -> Unit)
    fun stop()
}

/** Dictado por voz (voz a texto). */
/** Dictado por voz dentro de la app (sin ventanas del sistema). */
interface VoiceInput {
    val available: Boolean
    /** true mientras el micrófono está escuchando. */
    val listening: Boolean
    /** Lo que se va reconociendo en vivo. */
    val partial: String
    /** Volumen de la voz de 0 a 1, para animar el indicador. */
    val level: Float
    fun start(lang: String)
    /** Termina de escuchar y entrega lo dicho. */
    fun stop()
    /** Cancela sin enviar nada. */
    fun cancel()
}

@Composable
expect fun rememberVoiceInput(onResult: (String) -> Unit, onError: (String) -> Unit): VoiceInput

/** Almacén privado y cifrado del dispositivo (conversaciones, check-ins, ajustes). */
expect object SecureStore {
    fun get(key: String): String?
    fun put(key: String, value: String)
    fun remove(key: String)
}

/** Botón "atrás" del sistema (en Android); en escritorio no hace nada. */
@Composable
expect fun PlatformBackHandler(enabled: Boolean = true, onBack: () -> Unit)
