package app.astrohealth.eco.data

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.status.SessionStatus
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.serializer.KotlinXSerializer
import kotlinx.coroutines.flow.first
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

/**
 * Acceso a la base de la misión con la sesión del tripulante.
 * Las reglas de acceso (RLS) garantizan que solo vea lo suyo y lo de la nave.
 */
class Repository(url: String, anonKey: String) {
    private val client: SupabaseClient = createSupabaseClient(url, anonKey) {
        defaultSerializer = KotlinXSerializer(Json { ignoreUnknownKeys = true; explicitNulls = false })
        install(Auth)
        install(Postgrest)
    }

    var user: AppUser? = null
        private set

    val accessToken: String? get() = client.auth.currentSessionOrNull()?.accessToken

    private val me get() = user ?: error("Sesión no iniciada")
    private val crewId get() = me.crewMemberId ?: error("Esta cuenta no es de un tripulante")

    // ---------------- Sesión ----------------
    suspend fun login(email: String, password: String): AppUser {
        client.auth.signInWith(Email) { this.email = email.trim(); this.password = password }
        return loadUser()
    }

    suspend fun restore(): AppUser? {
        val status = client.auth.sessionStatus.first { it !is SessionStatus.Initializing }
        return if (status is SessionStatus.Authenticated) runCatching { loadUser() }.getOrNull() else null
    }

    suspend fun logout() {
        runCatching { client.auth.signOut() }
        user = null
    }

    private suspend fun loadUser(): AppUser {
        val uid = client.auth.currentUserOrNull()?.id ?: error("Sin sesión")
        val u = client.from("app_users").select { filter { eq("id", uid) } }.decodeSingle<AppUser>()
        if (u.role != "crew" || u.crewMemberId == null) {
            runCatching { client.auth.signOut() }
            error("Esta app es para la tripulación. Usa una cuenta de tripulante.")
        }
        user = u
        return u
    }

    // ---------------- Lecturas ----------------
    suspend fun mission(): Mission = client.from("missions").select { filter { eq("id", me.missionId) } }.decodeSingle()
    suspend fun crewMember(): CrewMember = client.from("crew_members").select { filter { eq("id", crewId) } }.decodeSingle()
    suspend fun crew(): List<CrewMember> = client.from("crew_members").select().decodeList()
    suspend fun zones(): List<Zone> = client.from("vehicle_zones").select().decodeList()
    suspend fun alertTypes(): List<AlertType> = client.from("alert_types").select().decodeList()
    suspend fun simState(): SimState? = client.from("simulation_state").select().decodeList<SimState>().firstOrNull()

    /** Lo último de cada sensor: lo mío y lo de la cabina (RLS). */
    suspend fun latest(): List<LatestReading> = client.from("latest_readings").select().decodeList()

    suspend fun status(): CrewStatus? = client.from("crew_status").select { filter { eq("crew_member_id", crewId) } }
        .decodeList<CrewStatus>().firstOrNull()

    suspend fun career(): DoseCareer? = client.from("dose_career").select { filter { eq("crew_member_id", crewId) } }
        .decodeList<DoseCareer>().firstOrNull()

    suspend fun doseDay(day: String): DoseDaily? = client.from("dose_daily").select {
        filter { eq("crew_member_id", crewId); eq("day", day) }
    }.decodeList<DoseDaily>().firstOrNull()

    suspend fun history(metric: String, limit: Long = 80): List<Reading> = client.from("sensor_readings").select {
        filter { eq("crew_member_id", crewId); eq("metric", metric) }
        order("recorded_at", Order.DESCENDING)
        limit(limit)
    }.decodeList<Reading>().reversed()

    /** Alertas abiertas que me tocan (mías y de toda la nave). */
    suspend fun openAlerts(): List<Alert> = client.from("alerts").select {
        filter { neq("status", "resolved") }
        order("created_at", Order.DESCENDING)
    }.decodeList()

    suspend fun myAcks(): List<AlertAck> = client.from("alert_acknowledgements").select {
        filter { eq("user_id", me.id) }
    }.decodeList()

    suspend fun openShelter(): ShelterSession? = client.from("shelter_sessions").select {
        order("started_at", Order.DESCENDING)
        limit(1)
    }.decodeList<ShelterSession>().firstOrNull()

    suspend fun assignments(sessionId: String): List<ShelterAssignment> = client.from("shelter_assignments").select {
        filter { eq("session_id", sessionId) }
    }.decodeList()

    suspend fun shifts(sessionId: String): List<ShelterShift> = client.from("shelter_shifts").select {
        filter { eq("session_id", sessionId) }
        order("starts_at", Order.ASCENDING)
    }.decodeList()

    suspend fun consents(): List<Consent> = client.from("consents").select { filter { eq("crew_member_id", crewId) } }.decodeList()

    suspend fun accessLog(): List<AccessLogEntry> = client.from("surgeon_access_log").select {
        filter { eq("crew_member_id", crewId) }
        order("viewed_at", Order.DESCENDING)
        limit(10)
    }.decodeList()

    suspend fun acceptedRules(version: String): Boolean = client.from("rules_acceptance").select {
        filter { eq("crew_member_id", crewId); eq("rules_version", version) }
    }.decodeList<RulesAcceptance>().isNotEmpty()

    // ---------------- Escrituras ----------------
    suspend fun acceptRules(version: String) {
        client.from("rules_acceptance").upsert(RulesAcceptance(crewId, version))
    }

    suspend fun setConsent(scope: String, granted: Boolean) {
        client.from("consents").upsert(Consent(crewId, scope, granted))
    }

    suspend fun acknowledge(alertId: String) {
        client.postgrest.rpc("acknowledge_alert", buildJsonObject { put("p_alert", alertId) })
    }

    suspend fun markSpoken(alertId: String) {
        client.postgrest.rpc("mark_alert_spoken", buildJsonObject { put("p_alert", alertId) })
    }

    suspend fun markArrived(sessionId: String) {
        client.postgrest.rpc("mark_shelter_arrival", buildJsonObject { put("p_session", sessionId) })
    }

    suspend fun setLanguage(lang: String) {
        client.postgrest.rpc("set_my_language", buildJsonObject { put("p_language", lang) })
    }

    /** Solo síntomas físicos, sin la nota (la nota se queda en el dispositivo). */
    suspend fun reportSymptoms(symptoms: List<String>, at: String) {
        if (symptoms.isEmpty()) return
        client.from("symptom_reports").insert(symptoms.map { NewSymptom(crewId, it, at) })
    }

    /** Solo el promedio del día; la base descarta lo que no tenga permiso. */
    suspend fun shareTrend(trend: WellbeingTrend) {
        client.from("wellbeing_trends").upsert(trend.copy(crewMemberId = crewId))
    }

    /** Aviso de emergencia: solo la categoría y la hora. */
    suspend fun escalate(category: String, at: String) {
        client.from("emergency_escalations").insert(NewEscalation(crewId, category, at))
    }
}
