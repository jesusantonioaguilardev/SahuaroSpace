package app.astrohealth.eco.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Modelos de la base de la misión (supabase/schema.sql).

@Serializable
data class AppUser(
    val id: String,
    val role: String,
    @SerialName("mission_id") val missionId: String,
    @SerialName("crew_member_id") val crewMemberId: String? = null,
    @SerialName("display_name") val displayName: String? = null,
)

@Serializable
data class Mission(
    val id: String,
    val name: String,
    val destination: String,
    @SerialName("start_date") val startDate: String,
    @SerialName("end_date_planned") val endDatePlanned: String? = null,
    @SerialName("comm_delay_s") val commDelayS: Int = 0,
)

@Serializable
data class CrewMember(
    val id: String,
    @SerialName("mission_id") val missionId: String,
    @SerialName("display_name") val displayName: String,
    @SerialName("role_title") val roleTitle: String? = null,
    val language: String = "es",
    @SerialName("avatar_color") val avatarColor: String? = null,
    @SerialName("prior_career_dose_msv") val priorCareerDoseMsv: Double = 0.0,
    @SerialName("career_limit_msv") val careerLimitMsv: Double = 600.0,
)

@Serializable
data class Zone(
    val id: String,
    val name: String,
    @SerialName("shielding_factor") val shieldingFactor: Double = 1.0,
    @SerialName("is_shelter") val isShelter: Boolean = false,
)

@Serializable
data class LatestReading(
    @SerialName("crew_member_id") val crewMemberId: String? = null,
    @SerialName("zone_id") val zoneId: String? = null,
    val metric: String,
    val value: Double,
    @SerialName("recorded_at") val recordedAt: String,
    val level: String = "normal",
)

@Serializable
data class Reading(
    val metric: String,
    val value: Double,
    @SerialName("recorded_at") val recordedAt: String,
)

@Serializable
data class CrewStatus(
    @SerialName("crew_member_id") val crewMemberId: String,
    @SerialName("overall_level") val overallLevel: String = "normal",
    @SerialName("active_alerts") val activeAlerts: Int = 0,
)

@Serializable
data class DoseCareer(
    @SerialName("crew_member_id") val crewMemberId: String,
    @SerialName("mission_dose_msv") val missionDoseMsv: Double = 0.0,
    @SerialName("career_dose_msv") val careerDoseMsv: Double = 0.0,
    @SerialName("career_limit_msv") val careerLimitMsv: Double = 600.0,
    @SerialName("pct_of_limit") val pctOfLimit: Double = 0.0,
    @SerialName("projected_end_msv") val projectedEndMsv: Double = 0.0,
)

@Serializable
data class DoseDaily(
    @SerialName("crew_member_id") val crewMemberId: String,
    val day: String,
    @SerialName("total_msv") val totalMsv: Double = 0.0,
    @SerialName("gcr_msv") val gcrMsv: Double = 0.0,
    @SerialName("spe_msv") val speMsv: Double = 0.0,
    @SerialName("neutron_msv") val neutronMsv: Double = 0.0,
)

@Serializable
data class AlertType(
    val code: String,
    val metric: String? = null,
    @SerialName("title_es") val titleEs: String,
    @SerialName("title_en") val titleEn: String,
    @SerialName("steps_es") val stepsEs: List<String> = emptyList(),
    @SerialName("steps_en") val stepsEn: List<String> = emptyList(),
)

@Serializable
data class Alert(
    val id: String,
    @SerialName("crew_member_id") val crewMemberId: String? = null,
    @SerialName("zone_id") val zoneId: String? = null,
    @SerialName("alert_type_id") val alertTypeId: String,
    @SerialName("shelter_session_id") val shelterSessionId: String? = null,
    val level: String,
    val status: String,
    val metric: String? = null,
    val value: Double? = null,
    @SerialName("message_es") val messageEs: String,
    @SerialName("message_en") val messageEn: String,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class AlertAck(
    @SerialName("alert_id") val alertId: String,
    @SerialName("user_id") val userId: String,
)

@Serializable
data class ShelterSession(
    val id: String,
    @SerialName("zone_id") val zoneId: String,
    @SerialName("started_at") val startedAt: String,
    @SerialName("expected_end_at") val expectedEndAt: String? = null,
    @SerialName("ended_at") val endedAt: String? = null,
    @SerialName("dose_avoided_est_msv") val doseAvoidedEstMsv: Double? = null,
)

@Serializable
data class ShelterAssignment(
    @SerialName("session_id") val sessionId: String,
    @SerialName("crew_member_id") val crewMemberId: String,
    @SerialName("zone_id") val zoneId: String,
    @SerialName("arrived_at") val arrivedAt: String? = null,
)

@Serializable
data class ShelterShift(
    val id: String,
    @SerialName("crew_member_id") val crewMemberId: String,
    val kind: String,
    @SerialName("starts_at") val startsAt: String,
    @SerialName("ends_at") val endsAt: String,
)

@Serializable
data class SimState(
    @SerialName("sim_clock") val simClock: String,
    @SerialName("time_speed") val timeSpeed: Int = 1,
    val running: Boolean = false,
)

@Serializable
data class Consent(
    @SerialName("crew_member_id") val crewMemberId: String,
    val scope: String,
    val granted: Boolean,
)

@Serializable
data class AccessLogEntry(
    val resource: String,
    @SerialName("viewed_at") val viewedAt: String,
)

@Serializable
data class RulesAcceptance(
    @SerialName("crew_member_id") val crewMemberId: String,
    @SerialName("rules_version") val rulesVersion: String,
)

@Serializable
data class NewSymptom(
    @SerialName("crew_member_id") val crewMemberId: String,
    val symptom: String,
    @SerialName("reported_at") val reportedAt: String,
)

@Serializable
data class NewEscalation(
    @SerialName("crew_member_id") val crewMemberId: String,
    val category: String,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class WellbeingTrend(
    @SerialName("crew_member_id") val crewMemberId: String,
    val day: String,
    @SerialName("mood_avg") val moodAvg: Double? = null,
    @SerialName("stress_avg") val stressAvg: Double? = null,
    @SerialName("energy_avg") val energyAvg: Double? = null,
)

// ---------------------------------------------------------------------
// Datos privados del dispositivo (nunca van a la base)
// ---------------------------------------------------------------------
@Serializable
data class ChatMessage(val role: String, val text: String, val voice: Boolean = false, val at: String = "")

@Serializable
data class CheckIn(
    val day: String,
    val mood: Int,
    val stress: Int,
    val energy: Int,
    val symptoms: List<String> = emptyList(),
    val note: String = "",
)

@Serializable
data class LocalSettings(
    val lang: String = "es",
    val speak: Boolean = true,
    val rate: Float = 1f,
    val memory: Boolean = true,
    val serverUrl: String = "",
    val character: String = "luma",
)
