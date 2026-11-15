package app.astrohealth.eco.data

import io.ktor.client.HttpClient
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.client.statement.readRawBytes
import io.ktor.http.ContentType
import io.ktor.http.content.TextContent
import io.ktor.http.isSuccess
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject

@Serializable
private data class EcoRequest(
    val message: String,
    val mode: String,
    val character: String,
    val lang: String,
    val summary: JsonObject,
    val history: List<EcoTurn>,
    val memory: List<String> = emptyList(),
)

@Serializable
data class EcoTurn(val role: String, val text: String)

@Serializable
private data class TtsRequest(val text: String, val character: String, val lang: String)

@Serializable
private data class EcoResponse(
    val reply: String = "",
    val risk: String = "none",
    val remember: List<String> = emptyList(),
    val emotion: String = "neutral",
    @kotlinx.serialization.SerialName("suggest_instrument") val suggestInstrument: String = "none",
    val audio: String? = null,
    val model: String? = null,
    val error: String? = null,
)

data class EcoAnswer(
    val reply: String,
    val risk: String,
    val source: String,
    val reason: String? = null,
    val remember: List<String> = emptyList(),
    val emotion: String = "neutral",
    /** Cuestionario que la IA sugiere ofrecer (INST-02): none, phq o gad. */
    val instrument: String = "none",
    /** Voz del personaje (mp3) cuando viene en la misma respuesta (modo en vivo). */
    val audio: ByteArray? = null,
)

/**
 * Habla con el servidor local de Eco (que llama a ChatGPT). La clave de OpenAI vive en el servidor,
 * nunca en la app. Si no hay servidor o IA, Eco responde en modo local.
 */
@OptIn(ExperimentalEncodingApi::class)
class EcoClient {
    private val http = HttpClient()
    private val json = Json { ignoreUnknownKeys = true; explicitNulls = false }

    /** Voz del personaje con ElevenLabs (vía el servidor). Devuelve null si no está disponible. */
    suspend fun voice(serverUrl: String, token: String?, text: String, character: String, lang: String): ByteArray? = try {
        val body = json.encodeToString(TtsRequest.serializer(), TtsRequest(text, character, lang))
        val res = http.post("${serverUrl.trimEnd('/')}/api/tts") {
            if (token != null) header("Authorization", "Bearer $token")
            setBody(TextContent(body, ContentType.Application.Json))
        }
        if (res.status.isSuccess()) res.readRawBytes() else null
    } catch (e: Exception) {
        null
    }

    suspend fun ask(
        serverUrl: String,
        token: String?,
        message: String,
        mode: String,
        character: String,
        lang: String,
        summary: JsonObject,
        history: List<EcoTurn>,
        memory: List<String> = emptyList(),
        live: Boolean = false,
    ): EcoAnswer {
        val recent = history.filter { it.role == "assistant" }.takeLast(4).map { it.text }
        val local = { reason: String -> LocalEco.answer(message, mode, lang, summary, character, recent).copy(source = "local", reason = reason) }
        return try {
            val body = json.encodeToString(EcoRequest.serializer(), EcoRequest(message, mode, character, lang, summary, history.takeLast(20), memory))
            val res = http.post("${serverUrl.trimEnd('/')}${if (live) "/api/live" else "/api/eco"}") {
                if (token != null) header("Authorization", "Bearer $token")
                setBody(TextContent(body, ContentType.Application.Json))
            }
            val parsed = runCatching { json.decodeFromString(EcoResponse.serializer(), res.bodyAsText()) }.getOrNull()
            if (res.status.isSuccess() && parsed != null && parsed.reply.isNotBlank()) {
                // Red de seguridad: si la IA no marcó riesgo pero el texto lo muestra claramente, se marca igual
                val risk = if (parsed.risk != "none") parsed.risk else LocalEco.detectRisk(message)
                val audio = parsed.audio?.let { runCatching { Base64.decode(it) }.getOrNull() }
                EcoAnswer(parsed.reply, risk, "llm", remember = parsed.remember, emotion = parsed.emotion, instrument = parsed.suggestInstrument, audio = audio)
            } else {
                local(parsed?.error ?: "http_${res.status.value}")
            }
        } catch (e: Exception) {
            local("network")
        }
    }
}
