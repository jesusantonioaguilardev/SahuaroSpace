package app.astrohealth.eco

import kotlin.test.AfterTest
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/** Pruebas de specs/features/08-privacidad.md (PRIV-07). */
class StringsTest {
    private val banned = Regex("\\b(Eco|Echo)\\b")

    @AfterTest
    fun reset() { Strings.lang = "es" }

    @Test
    fun `PRIV-07 ningun texto de la app dice Eco o Echo`() {
        for ((lang, texts) in Strings.all()) for ((key, text) in texts) {
            assertFalse(banned.containsMatchIn(text), "[$lang] $key = \"$text\"")
        }
    }

    @Test
    fun `PRIV-07 los textos del personaje reciben su nombre`() {
        for (lang in listOf("es", "en")) {
            Strings.lang = lang
            for (key in listOf("write_to_eco", "esc_title", "voice")) {
                val text = t(key, "name" to "Nix")
                assertTrue("Nix" in text && "{name}" !in text, "[$lang] $key = \"$text\"")
            }
        }
    }

    @Test
    fun `PRIV-07 textos de la spec`() {
        assertEquals("Escribe a Pipo…", t("write_to_eco", "name" to "Pipo"))
        assertEquals("Luma se preocupa por ti", t("esc_title", "name" to "Luma"))
        assertEquals("Servidor de ELOISE", t("server"))
        assertTrue("tu compañero" in t("rule3"))
    }

    @Test
    fun `PRIV-07 todas las claves existen en los dos idiomas`() {
        val es = Strings.all().getValue("es").keys
        val en = Strings.all().getValue("en").keys
        assertEquals(emptySet(), es - en, "faltan en inglés")
        assertEquals(emptySet(), en - es, "faltan en español")
    }
}
