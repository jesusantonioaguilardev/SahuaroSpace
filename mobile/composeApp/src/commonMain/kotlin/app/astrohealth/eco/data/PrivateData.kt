package app.astrohealth.eco.data

import app.astrohealth.eco.platform.SecureStore
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

/**
 * Datos que nunca salen del dispositivo: conversaciones con Eco, check-ins completos (con nota) y ajustes.
 * Se guardan cifrados con SecureStore.
 */
class PrivateData(private val crewId: String) {
    private val json = Json { ignoreUnknownKeys = true }
    private fun key(name: String) = "$crewId:$name"

    var settings: LocalSettings
        get() = SecureStore.get(key("settings"))?.let { runCatching { json.decodeFromString(LocalSettings.serializer(), it) }.getOrNull() } ?: LocalSettings()
        set(value) = SecureStore.put(key("settings"), json.encodeToString(LocalSettings.serializer(), value))

    private val chats = ListSerializer(ChatMessage.serializer())
    private val facts = ListSerializer(kotlinx.serialization.serializer<String>())

    /** Cada personaje tiene su propia conversación (así nadie "habla" con la voz de otro). */
    fun conversation(character: String): List<ChatMessage> {
        val own = SecureStore.get(key("conversation:$character"))?.let { runCatching { json.decodeFromString(chats, it) }.getOrNull() }
        if (own != null) return own
        // Migración: la conversación anterior (de un solo personaje) pasa al personaje activo
        val legacy = SecureStore.get(key("conversation"))?.let { runCatching { json.decodeFromString(chats, it) }.getOrNull() } ?: return emptyList()
        SecureStore.remove(key("conversation"))
        saveConversation(character, legacy)
        return legacy
    }

    fun saveConversation(character: String, list: List<ChatMessage>) {
        if (!settings.memory) return
        SecureStore.put(key("conversation:$character"), json.encodeToString(chats, list.takeLast(200)))
    }

    fun deleteConversation(character: String) = SecureStore.remove(key("conversation:$character"))

    fun deleteAllConversations(characters: List<String>) {
        characters.forEach { deleteConversation(it) }
        SecureStore.remove(key("conversation"))
    }

    /**
     * Memoria a largo plazo: hechos breves sobre la persona ("Su hija se llama Sofía.").
     * La comparten los tres personajes, vive cifrada en el teléfono y la persona puede verla y borrarla.
     */
    fun memory(): List<String> =
        SecureStore.get(key("memory"))?.let { runCatching { json.decodeFromString(facts, it) }.getOrNull() } ?: emptyList()

    fun saveMemory(list: List<String>) {
        if (!settings.memory) return
        SecureStore.put(key("memory"), json.encodeToString(facts, list.takeLast(MAX_FACTS)))
    }

    fun deleteMemory() = SecureStore.remove(key("memory"))

    // Cuestionarios (INST-10): resultados y cuándo se ofrecieron/completaron, cifrados en el teléfono
    private val results = ListSerializer(ScreeningResult.serializer())

    fun screenings(): List<ScreeningResult> =
        SecureStore.get(key("screenings"))?.let { runCatching { json.decodeFromString(results, it) }.getOrNull() } ?: emptyList()

    fun saveScreenings(list: List<ScreeningResult>) =
        SecureStore.put(key("screenings"), json.encodeToString(results, list.takeLast(60)))

    var screeningState: ScreeningState
        get() = SecureStore.get(key("screening_state"))?.let { runCatching { json.decodeFromString(ScreeningState.serializer(), it) }.getOrNull() } ?: ScreeningState()
        set(value) = SecureStore.put(key("screening_state"), json.encodeToString(ScreeningState.serializer(), value))

    fun deleteScreenings() {
        SecureStore.remove(key("screenings"))
        SecureStore.remove(key("screening_state"))
    }

    companion object {
        const val MAX_FACTS = 40
    }

    fun checkIns(): List<CheckIn> =
        SecureStore.get(key("checkins"))?.let { runCatching { json.decodeFromString(ListSerializer(CheckIn.serializer()), it) }.getOrNull() } ?: emptyList()

    fun addCheckIn(c: CheckIn) {
        val list = (checkIns() + c).takeLast(60)
        SecureStore.put(key("checkins"), json.encodeToString(ListSerializer(CheckIn.serializer()), list))
    }
}
