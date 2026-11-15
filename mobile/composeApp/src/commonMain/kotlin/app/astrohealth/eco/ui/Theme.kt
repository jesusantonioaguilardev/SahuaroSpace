package app.astrohealth.eco.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Air
import androidx.compose.material.icons.outlined.SentimentDissatisfied
import androidx.compose.material.icons.outlined.SentimentNeutral
import androidx.compose.material.icons.outlined.SentimentSatisfied
import androidx.compose.material.icons.outlined.SentimentVeryDissatisfied
import androidx.compose.material.icons.outlined.SentimentVerySatisfied
import androidx.compose.material.icons.outlined.Bedtime
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material.icons.outlined.MonitorHeart
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.WbSunny
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import app.astrohealth.eco.t

/**
 * Sistema visual ELOISE · Mission Care System (diseño de Figma Make "Diseñar plataforma espacial Eloise").
 * Mismos colores que dashboard/eloise.css para que la app y el panel sean el mismo producto.
 */
object EcoColors {
    val Bg = Color(0xFF080F1C)
    val Surface = Color(0xFF101D2D)
    val Surface2 = Color(0xFF132235)
    val Surface3 = Color(0xFF172A3F)
    val Border = Color(0xFF20364D)
    val Border2 = Color(0xFF29445F)
    val Text = Color(0xFFF2F6FC)
    val Muted = Color(0xFF91A4BA)
    val Label = Color(0xFF8298AE)
    val Accent = Color(0xFF39D8E8)   // cian
    val Blue = Color(0xFF2789FF)
    val AccentInk = Color(0xFF05131B)
    val Ok = Color(0xFF35D39A)
    val Warn = Color(0xFFFFC857)
    val Danger = Color(0xFFFF4D5A)
    val DangerStrong = Color(0xFFB3141C)
    val Purple = Color(0xFF8B7CFF)
    // Fondos de las pastillas (pill) del diseño
    val OkBg = Color(0xFF163C33)
    val OkBorder = Color(0xFF285647)
    val OkText = Color(0xFF6CE1B5)
    val WarnBg = Color(0xFF493C1C)
    val WarnBorder = Color(0xFF725A23)
    val WarnText = Color(0xFFFFD476)
    val DangerBg = Color(0xFF421D28)
    val DangerBorder = Color(0xFF71313B)
    val DangerText = Color(0xFFFF7B85)
    val InfoBg = Color(0xFF163844)
    val InfoBorder = Color(0xFF245C69)
    val InfoText = Color(0xFF70DCE8)
}

@Composable
fun EcoTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            primary = EcoColors.Accent,
            onPrimary = EcoColors.AccentInk,
            secondary = EcoColors.Blue,
            background = EcoColors.Bg,
            onBackground = EcoColors.Text,
            surface = EcoColors.Surface,
            onSurface = EcoColors.Text,
            surfaceVariant = EcoColors.Surface2,
            onSurfaceVariant = EcoColors.Muted,
            secondaryContainer = EcoColors.Surface3,
            onSecondaryContainer = EcoColors.Text,
            outline = EcoColors.Border2,
            error = EcoColors.Danger,
        ),
        content = content,
    )
}

fun levelColor(level: String?) = when (level) {
    "urgent" -> EcoColors.Danger
    "attention" -> EcoColors.Warn
    else -> EcoColors.Text
}

// ---------------------------------------------------------------------
// Pastillas de estado (pill con punto luminoso)
// ---------------------------------------------------------------------
enum class Tone { Safe, Warn, Critical, Info, Neutral }

fun toneOf(level: String?) = when (level) {
    "urgent" -> Tone.Critical
    "attention" -> Tone.Warn
    else -> Tone.Safe
}

@Composable
fun Pill(text: String, tone: Tone = Tone.Safe, modifier: Modifier = Modifier) {
    val (bg, border, fg) = when (tone) {
        Tone.Safe -> Triple(EcoColors.OkBg, EcoColors.OkBorder, EcoColors.OkText)
        Tone.Warn -> Triple(EcoColors.WarnBg, EcoColors.WarnBorder, EcoColors.WarnText)
        Tone.Critical -> Triple(EcoColors.DangerBg, EcoColors.DangerBorder, EcoColors.DangerText)
        Tone.Info -> Triple(EcoColors.InfoBg, EcoColors.InfoBorder, EcoColors.InfoText)
        Tone.Neutral -> Triple(Color(0xFF1A2939), Color(0xFF304356), Color(0xFFA4B5C7))
    }
    Row(
        modifier.background(bg, RoundedCornerShape(50)).border(1.dp, border, RoundedCornerShape(50))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(Modifier.size(5.dp).background(fg, CircleShape))
        Text(text.uppercase(), color = fg, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp, maxLines = 1)
    }
}

@Composable
fun LevelPill(level: String) = Pill(t("lvl_$level"), toneOf(level))

// ---------------------------------------------------------------------
// Paneles y encabezados
// ---------------------------------------------------------------------
private val PanelGradient = Brush.linearGradient(listOf(Color(0xE8111F30), Color(0xE80E1A29)))

/** Panel del diseño: degradado, borde fino y esquinas de 8 dp. */
@Composable
fun EcoCard(level: String = "normal", modifier: Modifier = Modifier, title: String? = null, action: (@Composable () -> Unit)? = null, content: @Composable () -> Unit) {
    val border = when (level) {
        "urgent" -> EcoColors.Danger
        "attention" -> EcoColors.WarnBorder
        "hero" -> Color(0xFF284960)
        else -> EcoColors.Border
    }
    Column(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(PanelGradient)
            .border(1.dp, border, RoundedCornerShape(8.dp))
            .padding(16.dp),
    ) {
        if (title != null) {
            Row(Modifier.fillMaxWidth().padding(bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp, modifier = Modifier.weight(1f))
                action?.invoke()
            }
        }
        content()
    }
}

/** Texto pequeño en mayúsculas y espaciado (etiqueta o "eyebrow"). */
@Composable
fun Eyebrow(text: String, color: Color = EcoColors.Accent, modifier: Modifier = Modifier) {
    Text(text.uppercase(), color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.4.sp, modifier = modifier)
}

@Composable
fun ScreenHeader(eyebrow: String?, title: String, subtitle: String? = null, action: (@Composable () -> Unit)? = null) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
        Column(Modifier.weight(1f)) {
            if (eyebrow != null) Eyebrow(eyebrow, modifier = Modifier.padding(bottom = 6.dp))
            Text(title, fontSize = 26.sp, fontWeight = FontWeight.SemiBold, lineHeight = 31.sp)
            if (subtitle != null) Text(subtitle, color = EcoColors.Muted, fontSize = 14.sp, modifier = Modifier.padding(top = 6.dp))
        }
        action?.invoke()
    }
}

/** Logo ELOISE: anillo cian con punto luminoso y órbita azul. */
@Composable
fun EloiseLogo(compact: Boolean = false) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Canvas(Modifier.size(30.dp)) {
            val c = Offset(size.width / 2, size.height / 2)
            drawCircle(EcoColors.Accent, radius = size.minDimension / 2 - 2f, center = c, style = Stroke(width = 1.5.dp.toPx()))
            rotate(-28f, c) {
                drawOval(EcoColors.Blue, topLeft = Offset(c.x - size.width * 0.6f, c.y - size.height * 0.2f), size = Size(size.width * 1.2f, size.height * 0.4f), style = Stroke(width = 1.dp.toPx()))
            }
            drawCircle(EcoColors.Accent.copy(alpha = 0.35f), radius = 7.dp.toPx(), center = c)
            drawCircle(EcoColors.Accent, radius = 3.5.dp.toPx(), center = c)
        }
        if (!compact) {
            Column {
                Text("ELOISE", fontWeight = FontWeight.Bold, fontSize = 16.sp, letterSpacing = 3.sp)
                Text("MISSION CARE SYSTEM", color = Color(0xFF7990A6), fontSize = 7.sp, letterSpacing = 1.4.sp)
            }
        }
    }
}

@Composable
fun StatusDot(color: Color = EcoColors.Ok) {
    Box(Modifier.size(6.dp).background(color, CircleShape))
}

// ---------------------------------------------------------------------
// Tarjetas de métricas (MetricCard del diseño)
// ---------------------------------------------------------------------
enum class MetricIcon(val vector: ImageVector) {
    Radiation(Icons.Outlined.WbSunny), Air(Icons.Outlined.Air), Activity(Icons.Outlined.MonitorHeart),
    Heart(Icons.Outlined.FavoriteBorder), Moon(Icons.Outlined.Bedtime), Shield(Icons.Outlined.Shield),
}

@Composable
fun MetricIconBox(icon: MetricIcon, tint: Color = EcoColors.Accent, size: Dp = 36.dp) {
    Box(
        Modifier.size(size).background(Color(0xFF15283C), RoundedCornerShape(6.dp)).border(1.dp, EcoColors.Border2, RoundedCornerShape(6.dp)),
        contentAlignment = Alignment.Center,
    ) { Icon(icon.vector, contentDescription = null, tint = tint, modifier = Modifier.size(size * 0.55f)) }
}

/**
 * Tarjeta de un signo vital: icono, estado, etiqueta, valor grande, mini gráfica y línea de color abajo.
 * tone: "cyan" | "green" | "yellow" | "red"
 */
@Composable
fun MetricCard(
    icon: MetricIcon,
    label: String,
    value: String,
    unit: String = "",
    detail: String,
    tone: String = "cyan",
    values: List<Double> = emptyList(),
    min: Double? = null,
    max: Double? = null,
    modifier: Modifier = Modifier,
) {
    val color = when (tone) {
        "green" -> EcoColors.Ok
        "yellow" -> EcoColors.Warn
        "red" -> EcoColors.Danger
        else -> EcoColors.Accent
    }
    val pillTone = when (tone) {
        "yellow" -> Tone.Warn
        "red" -> Tone.Critical
        else -> Tone.Safe
    }
    Box(modifier.clip(RoundedCornerShape(8.dp)).background(PanelGradient).border(1.dp, EcoColors.Border, RoundedCornerShape(8.dp))) {
        Column(Modifier.padding(14.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                MetricIconBox(icon, color)
                Spacer(Modifier.weight(1f))
                Pill(detail, pillTone)
            }
            Spacer(Modifier.height(12.dp))
            Eyebrow(label, color = EcoColors.Label)
            Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(top = 4.dp)) {
                Text(value, fontSize = 26.sp, fontWeight = FontWeight.SemiBold, color = if (tone == "red") EcoColors.DangerText else EcoColors.Text)
                if (unit.isNotEmpty()) Text(" $unit", color = EcoColors.Muted, fontSize = 13.sp, modifier = Modifier.padding(bottom = 4.dp))
            }
            Sparkline(values, min = min, max = max, color = color)
        }
        Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(2.dp).background(color.copy(alpha = 0.35f)))
    }
}

/** Mini gráfica con líneas de guía y punto al final (como en el diseño). */
@Composable
fun Sparkline(values: List<Double>, modifier: Modifier = Modifier, min: Double? = null, max: Double? = null, color: Color = EcoColors.Accent) {
    Canvas(modifier.fillMaxWidth().height(40.dp).padding(top = 6.dp)) {
        val grid = Color(0xFF1C3146)
        for (f in listOf(0.33f, 0.66f, 0.99f)) {
            drawLine(grid, Offset(0f, size.height * f), Offset(size.width, size.height * f), strokeWidth = 1f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f)))
        }
        if (values.size < 2) return@Canvas
        var lo = min ?: values.min()
        var hi = max ?: values.max()
        if (hi - lo < 1e-6) { hi += 1; lo -= 1 }
        val path = Path()
        var last = Offset.Zero
        values.forEachIndexed { i, v ->
            val x = size.width * i / (values.size - 1)
            val y = size.height * 0.92f - ((v.coerceIn(lo, hi) - lo) / (hi - lo)).toFloat() * size.height * 0.8f
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
            last = Offset(x, y)
        }
        drawPath(path, color, style = Stroke(width = 2.dp.toPx()))
        drawCircle(color, radius = 3.dp.toPx(), center = last)
    }
}

@Composable
fun ProgressBar(fraction: Float, modifier: Modifier = Modifier, color: Color? = null) {
    Box(modifier.fillMaxWidth().height(6.dp).background(EcoColors.Surface3, RoundedCornerShape(50))) {
        Box(
            Modifier.fillMaxWidth(fraction.coerceIn(0f, 1f)).height(6.dp).background(
                color ?: if (fraction > 0.9f) EcoColors.Warn else EcoColors.Accent, RoundedCornerShape(50),
            ),
        )
    }
}

/** Tarjeta simple (compatibilidad con pantallas anteriores). */
@Composable
fun StatCard(title: String, value: String, sub: String? = null, level: String = "normal", modifier: Modifier = Modifier, extra: @Composable () -> Unit = {}) {
    EcoCard(level, modifier) {
        Eyebrow(title, color = EcoColors.Label)
        Text(value, color = levelColor(level), fontSize = 22.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(top = 4.dp))
        if (sub != null) Text(sub, color = EcoColors.Muted, fontSize = 13.sp)
        extra()
    }
}

@Composable
fun ColorDot(hex: String?, modifier: Modifier = Modifier) {
    val color = runCatching { Color(("FF" + (hex ?: "#888888").removePrefix("#")).toLong(16)) }.getOrDefault(EcoColors.Muted)
    Canvas(modifier.size(10.dp)) { drawCircle(color, radius = size.minDimension / 2, center = Offset(size.width / 2, size.height / 2)) }
}

/** Orbe de ELOISE (se usa donde no hay personaje, p. ej. pantalla de acceso). */
@Composable
fun Orb(size: Int = 18) {
    Canvas(Modifier.size(size.dp)) {
        val c = Offset(this.size.width / 2, this.size.height / 2)
        val r = this.size.minDimension / 2
        drawCircle(EcoColors.Accent.copy(alpha = 0.18f), radius = r, center = c)
        drawCircle(Brush.radialGradient(listOf(Color(0xFFBFF3FF), EcoColors.Accent, Color(0xFF14527A)), center = c - Offset(r * 0.25f, r * 0.25f), radius = r * 0.8f), radius = r * 0.62f, center = c)
        drawCircle(EcoColors.Accent.copy(alpha = 0.6f), radius = r * 0.92f, center = c, style = Stroke(width = 1.dp.toPx()))
    }
}

@Composable
fun FixedWidthSpacer(w: Dp) = Spacer(Modifier.width(w))

/** Icono de ánimo (1 = muy mal … 5 = muy bien) en lugar de caritas emoji. */
fun moodIcon(level: Int): ImageVector = when (level.coerceIn(1, 5)) {
    1 -> Icons.Outlined.SentimentVeryDissatisfied
    2 -> Icons.Outlined.SentimentDissatisfied
    3 -> Icons.Outlined.SentimentNeutral
    4 -> Icons.Outlined.SentimentSatisfied
    else -> Icons.Outlined.SentimentVerySatisfied
}

fun moodColor(level: Int): Color = when (level.coerceIn(1, 5)) {
    1, 2 -> EcoColors.Warn
    3 -> EcoColors.Muted
    else -> EcoColors.Ok
}

/** Título de tarjeta con icono a la izquierda. */
@Composable
fun SectionTitle(icon: ImageVector, text: String, tint: Color = EcoColors.Accent) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(18.dp))
        Text(text, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
    }
}

/** Fuente monoespaciada para MET y horas (como el diseño). */
val Mono = FontFamily.Monospace
