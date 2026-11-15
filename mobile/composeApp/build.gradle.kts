import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.androidApplication)
    alias(libs.plugins.composeMultiplatform)
    alias(libs.plugins.composeCompiler)
    alias(libs.plugins.kotlinSerialization)
}

// ---------------------------------------------------------------------
// Configuración generada desde el .env de la raíz del proyecto.
// Solo se copian datos PÚBLICOS (URL y clave publishable/anon de Supabase).
// La clave secreta de Supabase y la de OpenAI nunca entran a la app.
// ---------------------------------------------------------------------
val envFile = rootProject.file("../.env")
val env = Properties().apply { if (envFile.exists()) envFile.inputStream().use { load(it) } }
fun envValue(name: String) = (env.getProperty(name) ?: "").trim().removeSurrounding("\"")

val generatedConfigDir = layout.buildDirectory.dir("generated/ecoConfig/kotlin")
val generateEcoConfig by tasks.registering {
    val url = envValue("SUPABASE_URL")
    val key = envValue("SUPABASE_ANON_KEY")
    inputs.property("url", url)
    inputs.property("key", key)
    outputs.dir(generatedConfigDir)
    doLast {
        val dir = generatedConfigDir.get().asFile.resolve("app/astrohealth/eco")
        dir.mkdirs()
        dir.resolve("GeneratedConfig.kt").writeText(
            """
            |// Archivo generado desde ../.env al compilar. No lo edites a mano.
            |package app.astrohealth.eco
            |
            |internal object GeneratedConfig {
            |    const val SUPABASE_URL = "$url"
            |    const val SUPABASE_ANON_KEY = "$key"
            |}
            |""".trimMargin(),
        )
    }
}

kotlin {
    androidTarget {
        compilerOptions { jvmTarget.set(JvmTarget.JVM_17) }
    }

    // Escritorio: para probar rápido las pantallas sin emulador (sin voz)
    jvm("desktop")

    sourceSets {
        val desktopMain by getting

        commonMain {
            kotlin.srcDir(generatedConfigDir)
        }
        commonMain.dependencies {
            implementation(compose.runtime)
            implementation(compose.foundation)
            implementation(compose.material3)
            implementation(compose.materialIconsExtended)
            implementation(compose.ui)
            implementation(compose.components.resources)
            implementation(libs.kotlinx.coroutines.core)
            implementation(libs.kotlinx.serialization.json)
            implementation(libs.kotlinx.datetime)
            implementation(project.dependencies.platform(libs.supabase.bom))
            implementation(libs.supabase.auth)
            implementation(libs.supabase.postgrest)
            implementation(libs.ktor.client.core)
        }
        androidMain.dependencies {
            implementation(libs.androidx.activity.compose)
            implementation(libs.kotlinx.coroutines.android)
            implementation(libs.ktor.client.okhttp)
        }
        desktopMain.dependencies {
            implementation(compose.desktop.currentOs)
            implementation(libs.kotlinx.coroutines.swing)
            implementation(libs.ktor.client.cio)
        }
        // Pruebas derivadas de specs/ (se corren en la JVM: gradlew :composeApp:desktopTest)
        commonTest.dependencies {
            implementation(kotlin("test"))
        }
    }
}

tasks.matching { it.name.startsWith("compile") || it.name.contains("Kotlin") }.configureEach {
    if (name != "generateEcoConfig") dependsOn(generateEcoConfig)
}

android {
    namespace = "app.astrohealth.eco"
    compileSdk = libs.versions.android.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "app.astrohealth.eco"
        minSdk = libs.versions.android.minSdk.get().toInt()
        targetSdk = libs.versions.android.targetSdk.get().toInt()
        versionCode = 1
        versionName = "0.1.0"
    }
    packaging {
        resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    }
    buildTypes {
        getByName("release") { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

// Imágenes de los personajes (composeResources/drawable) → clase Res
compose.resources {
    packageOfResClass = "app.astrohealth.eco.res"
    generateResClass = always
}

compose.desktop {
    application {
        mainClass = "app.astrohealth.eco.MainKt"
    }
}
