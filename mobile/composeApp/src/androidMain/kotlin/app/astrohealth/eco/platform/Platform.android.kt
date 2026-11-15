package app.astrohealth.eco.platform

import android.content.Context
import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.speech.RecognitionListener
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import android.content.Intent
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import java.security.KeyStore
import java.util.Locale
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

object AndroidContext {
    lateinit var app: Context
}

// El emulador ve la computadora en 10.0.2.2. Un celular conectado por USB la ve en localhost
// gracias a "adb reverse tcp:3000 tcp:3000". También se puede cambiar en Ajustes.
private val isEmulator: Boolean = android.os.Build.FINGERPRINT.contains("generic") ||
    android.os.Build.FINGERPRINT.contains("emulator") || android.os.Build.PRODUCT.contains("sdk") ||
    android.os.Build.MODEL.contains("sdk_gphone") || android.os.Build.HARDWARE.contains("ranchu")

actual val defaultServerUrl: String = if (isEmulator) "http://10.0.2.2:3000" else "http://localhost:3000"

private fun locale(lang: String): Locale = if (lang == "en") Locale.US else Locale.forLanguageTag("es-MX")

actual object Speech {
    private var tts: TextToSpeech? = null
    private var ready = false
    private var pending: Triple<String, String, Float>? = null

    private fun ensure() {
        if (tts != null) return
        tts = TextToSpeech(AndroidContext.app) { status ->
            ready = status == TextToSpeech.SUCCESS
            pending?.let { (text, lang, rate) ->
                pending = null
                speak(text, lang, rate)
            }
        }
    }

    actual val available: Boolean get() = true

    actual fun speak(text: String, lang: String, rate: Float) {
        ensure()
        val engine = tts ?: return
        if (!ready) {
            pending = Triple(text, lang, rate)
            return
        }
        engine.language = locale(lang)
        engine.setSpeechRate(rate)
        engine.speak(text, TextToSpeech.QUEUE_FLUSH, null, "eco")
    }

    actual fun stop() {
        tts?.stop()
    }
}

actual object AudioPlayer {
    private var player: android.media.MediaPlayer? = null

    actual fun play(mp3: ByteArray, onDone: () -> Unit) {
        stop()
        val file = java.io.File(AndroidContext.app.cacheDir, "eco_voice.mp3")
        file.writeBytes(mp3)
        player = android.media.MediaPlayer().apply {
            setDataSource(file.absolutePath)
            setOnCompletionListener { onDone(); release(); if (player === this) player = null }
            setOnErrorListener { _, _, _ -> onDone(); true }
            prepare()
            start()
        }
    }

    actual fun stop() {
        player?.let { runCatching { it.stop() }; it.release() }
        player = null
    }
}

/**
 * Dictado dentro de la app con SpeechRecognizer: sin la ventana de Google.
 * Usa el reconocimiento en el dispositivo cuando existe (funciona sin internet, como en la nave);
 * si ese idioma no está instalado, cae al reconocimiento normal.
 */
private class AndroidVoiceInput(private val context: Context) : VoiceInput {
    override val available: Boolean = SpeechRecognizer.isRecognitionAvailable(context)
    override var listening by mutableStateOf(false)
    override var partial by mutableStateOf("")
    override var level by mutableStateOf(0f)

    var onResult: (String) -> Unit = {}
    var onError: (String) -> Unit = {}
    var askPermission: () -> Unit = {}

    private var recognizer: SpeechRecognizer? = null
    private var onDevice = false
    private var lang = "es"
    private var cancelled = false

    private fun hasPermission() =
        ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun create(useOnDevice: Boolean): SpeechRecognizer {
        recognizer?.destroy()
        onDevice = useOnDevice
        val r = if (useOnDevice) SpeechRecognizer.createOnDeviceSpeechRecognizer(context) else SpeechRecognizer.createSpeechRecognizer(context)
        r.setRecognitionListener(listener)
        recognizer = r
        return r
    }

    override fun start(lang: String) {
        this.lang = lang
        if (hasPermission()) begin() else askPermission()
    }

    fun begin() {
        val canOnDevice = Build.VERSION.SDK_INT >= 33 && SpeechRecognizer.isOnDeviceRecognitionAvailable(context)
        val r = recognizer ?: create(canOnDevice)
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale(lang).toLanguageTag())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }
        cancelled = false
        partial = ""
        level = 0f
        listening = true
        r.startListening(intent)
    }

    override fun stop() {
        recognizer?.stopListening()
    }

    override fun cancel() {
        cancelled = true
        recognizer?.cancel()
        listening = false
        partial = ""
    }

    fun destroy() {
        recognizer?.destroy()
        recognizer = null
    }

    private val listener = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {}
        override fun onBeginningOfSpeech() {}
        override fun onRmsChanged(rmsdB: Float) { level = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f) }
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() { level = 0f }
        override fun onPartialResults(partialResults: Bundle?) {
            partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.let { if (it.isNotBlank()) partial = it }
        }
        override fun onResults(results: Bundle?) {
            listening = false
            val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull().orEmpty().ifBlank { partial }
            partial = ""
            if (cancelled) return
            if (text.isNotBlank()) onResult(text) else onError("no_match")
        }
        override fun onError(error: Int) {
            // El reconocimiento en el dispositivo no tiene este idioma: se reintenta con el normal
            if (onDevice && (error == SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED || error == SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE)) {
                create(false)
                begin()
                return
            }
            listening = false
            level = 0f
            val heard = partial
            partial = ""
            if (cancelled) return
            when (error) {
                SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT ->
                    if (heard.isNotBlank()) onResult(heard) else onError("no_match")
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> onError("permission")
                else -> if (heard.isNotBlank()) onResult(heard) else onError("error")
            }
        }
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }
}

@Composable
actual fun rememberVoiceInput(onResult: (String) -> Unit, onError: (String) -> Unit): VoiceInput {
    val context = LocalContext.current
    val input = remember { AndroidVoiceInput(context.applicationContext) }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) input.begin() else input.onError("permission")
    }
    input.onResult = onResult
    input.onError = onError
    input.askPermission = { permission.launch(Manifest.permission.RECORD_AUDIO) }
    DisposableEffect(Unit) { onDispose { input.destroy() } }
    return input
}

/**
 * Almacén privado cifrado: AES-GCM con una llave guardada en el Android Keystore
 * (la llave nunca sale del almacén seguro del teléfono).
 */
actual object SecureStore {
    private const val KEY_ALIAS = "eco_private_store"
    private val prefs by lazy { AndroidContext.app.getSharedPreferences("eco_private", Context.MODE_PRIVATE) }

    private fun key(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getEntry(KEY_ALIAS, null) as? KeyStore.SecretKeyEntry)?.let { return it.secretKey }
        val gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        gen.init(
            KeyGenParameterSpec.Builder(KEY_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .build(),
        )
        return gen.generateKey()
    }

    actual fun get(key: String): String? {
        val stored = prefs.getString(key, null) ?: return null
        return runCatching {
            val bytes = Base64.decode(stored, Base64.NO_WRAP)
            val cipher = Cipher.getInstance("AES/GCM/NoPadding")
            cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
            String(cipher.doFinal(bytes.copyOfRange(12, bytes.size)), Charsets.UTF_8)
        }.getOrNull()
    }

    actual fun put(key: String, value: String) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        val out = cipher.iv + cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        prefs.edit().putString(key, Base64.encodeToString(out, Base64.NO_WRAP)).apply()
    }

    actual fun remove(key: String) {
        prefs.edit().remove(key).apply()
    }
}

@Composable
actual fun PlatformBackHandler(enabled: Boolean, onBack: () -> Unit) = androidx.activity.compose.BackHandler(enabled, onBack)
