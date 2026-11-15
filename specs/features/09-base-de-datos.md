# 09 · Reglas en la base de datos — `DB`

**Objetivo:** que las reglas críticas (umbrales, alertas, dosis, refugio y permisos) vivan en Postgres y se cumplan igual sin importar qué cliente escriba los datos.

**Código:** [`supabase/schema.sql`](../../supabase/schema.sql) (funciones `reading_level`, `trg_evaluate_reading`, `trg_start_shelter`, `trg_wellbeing_guard`, `trg_consents_after`) · **Datos de prueba:** [`supabase/seed_demo.sql`](../../supabase/seed_demo.sql) · **Pruebas:** [`supabase/test/schema.test.mjs`](../../supabase/test/schema.test.mjs) (PGlite en memoria, no toca Supabase).

## Umbrales de referencia ⚠️ (por verificar contra NASA‑STD‑3001)

| Dato | Atención | Urgente |
|---|---|---|
| SpO2 (%) | < 94 | < 90 |
| O2 de cabina (%) | < 32 | < 30 |
| Presión de cabina (psia) | fuera de 7.9–8.6 | fuera de 7.5–9.0 |
| CO2 de cabina (mmHg) | > 3 | > 6 |
| Frecuencia cardíaca (lpm) | fuera de 45–110 | fuera de 38–140 |
| Respiración (rpm) | fuera de 10–24 | fuera de 8–30 |
| Tasa de dosis (µSv/h) | > 200 | > 1000 |
| Temperatura de cabina (°C) | fuera de 18–27 | fuera de 15–30 |

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| DB-01 | `reading_level(métrica, valor)` DEBE devolver `normal`, `attention` o `urgent` según la tabla de umbrales. | ✅ |
| DB-02 | Al insertar una lectura fuera de umbral, DEBE crearse una alerta abierta del tipo de esa métrica, con el nivel correspondiente y un mensaje en español e inglés con el valor. | ✅ |
| DB-03 | NO DEBE crearse una segunda alerta abierta del mismo tipo, misma persona/zona y nivel igual o mayor (sin tormenta de alertas). | ✅ |
| DB-04 | Si el nivel sube (atención → urgente), la alerta anterior DEBE resolverse (`escalated`) y abrirse una nueva urgente. | ✅ |
| DB-05 | Cuando el dato vuelve a la normalidad, sus alertas abiertas DEBEN resolverse solas (`auto`). | ✅ |
| DB-06 | Cada lectura del dosímetro personal DEBE sumar a la dosis del día `tasa × horas desde la lectura anterior` (máximo 1 h, en mSv), separando GCR y tormenta solar (SPE). | ✅ |
| DB-07 | Una tendencia de bienestar sin permiso NO DEBE guardarse (los campos sin permiso quedan vacíos; si no queda ninguno, no se inserta la fila). | ✅ |
| DB-08 | Al revocar un permiso, DEBEN borrarse los datos ya compartidos de ese tipo y registrarse el cambio en `consent_log`. | ✅ |
| DB-09 | Un evento solar de escala S3 o mayor DEBE abrir **una** sesión de refugio en la zona más blindada, una alerta urgente `solar_storm` y asignar a toda la tripulación. Con S < 3 no pasa nada; con un refugio ya abierto no se abre otro. Mientras el refugio está abierto, la radiación alta NO DEBE generar alertas propias. | ✅ |
| DB-10 | RLS: cada tripulante solo ve sus datos; el médico ve datos de seguridad siempre y bienestar solo con permiso; el simulador/servidor escribe lecturas. | 🟢 (políticas en `schema.sql`, sin prueba automática aún) |

## Criterios de aceptación (automatizados)

- **DB-02/03** — *Dado* Ana sin alertas, *cuando* llegan dos lecturas de SpO2 = 92, *entonces* hay exactamente **una** alerta `spo2_low` abierta de nivel `attention`.
- **DB-04** — *cuando* después llega SpO2 = 88, *entonces* la de atención queda `resolved` y hay una `urgent` abierta.
- **DB-05** — *cuando* llega SpO2 = 97, *entonces* no queda ninguna alerta `spo2_low` abierta.
- **DB-06** — *Dado* dos lecturas de 500 µSv/h separadas 30 min, *entonces* la dosis del día sube 0.25 mSv.
- **DB-07/08** — *Dado* que Ana no dio permiso, *cuando* se inserta su tendencia, *entonces* no se guarda; *dado* el permiso, sí se guarda; *cuando* lo revoca, se borra y queda en `consent_log`.
- **DB-09** — *cuando* llega un evento S2, no se abre refugio; *cuando* llega un S4, hay 1 sesión, 1 alerta urgente y 4 asignaciones; *cuando* llega otro S4, sigue habiendo 1 sesión.
