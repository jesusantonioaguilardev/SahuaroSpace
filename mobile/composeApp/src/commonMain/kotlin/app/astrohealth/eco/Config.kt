package app.astrohealth.eco

/**
 * Configuración pública de Supabase. Se genera al compilar desde el archivo .env de la raíz
 * (SUPABASE_URL y SUPABASE_ANON_KEY). La clave secreta nunca entra a la app.
 */
object Config {
    const val SUPABASE_URL = GeneratedConfig.SUPABASE_URL
    const val SUPABASE_ANON_KEY = GeneratedConfig.SUPABASE_ANON_KEY
    val configured get() = SUPABASE_URL.isNotBlank() && SUPABASE_ANON_KEY.isNotBlank()
}
