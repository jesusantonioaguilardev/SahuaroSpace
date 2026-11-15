# ELOISE · Mission Care System

Proyecto de NASA Space Apps: app Android (Kotlin + Compose Multiplatform, `mobile/`) para la tripulación, panel web del médico (`dashboard/`), servidor Node (`server/`) y Supabase/Postgres (`supabase/`).

## Spec-Driven Development (obligatorio)

- `specs/` es la fuente de verdad. Lee la spec afectada antes de cambiar código.
- Orden: **spec → código → prueba → trazabilidad**. Si un cambio altera un comportamiento, primero actualiza el requisito (ID, DEBE/NO DEBE, criterios Dado/Cuando/Entonces) y la matriz de `specs/README.md`.
- Un cambio que cruza piezas actualiza su contrato: `specs/api/openapi.yaml` (servidor ↔ app/panel) o `specs/features/09-base-de-datos.md` (Postgres).
- Las pruebas llevan el ID del requisito en su nombre (`CHAT-07: …`). Lo no automatizable queda como verificación manual con pasos.
- Antes de terminar: `npm test`, `npm run test:contract` (con `npm start` corriendo) y `npm run test:app`.

## Reglas que no se rompen

- Las claves (OpenAI, ElevenLabs, clave secreta de Supabase) viven solo en `.env` del servidor; nunca en la app ni en el panel. No imprimas `.env`.
- Las conversaciones, la memoria y la nota del check‑in nunca salen del teléfono (PRIV).
- El usuario escribe en español; los textos de la app son bilingües (`Strings.kt`).
