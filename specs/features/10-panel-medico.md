# 10 · Panel del médico y consola de demo — `DASH`

**Objetivo:** que el médico de vuelo vea a toda la tripulación en vivo, atienda alertas y prepare informes, respetando la privacidad; y que la demo se pueda conducir desde una consola.

**Código:** [`dashboard/`](../../dashboard/) (`index.html`, `js/app.js`), `handleSim` en [`server/server.mjs`](../../server/server.mjs), [`server/simulator.mjs`](../../server/simulator.mjs).

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| DASH-01 | M1 Panel general: cada tripulante con estado, dosis acumulada contra su límite de carrera, SpO2 y alertas abiertas, actualizado en tiempo real. | 🟢 |
| DASH-02 | M2 Detalle: datos de seguridad siempre; ánimo y sueño solo con permiso, y si no hay permiso se muestra "Privado" (nunca un valor vacío engañoso). Cada vista queda en el registro de accesos (PRIV-04). | 🟢 |
| DASH-03 | M3 Alertas: atender (`acknowledge`) y resolver con nota; las urgentes sin atender escalan. | 🟢 |
| DASH-04 | M4 Radiación y clima espacial; M5 informe diario para la Tierra. | 🟢 |
| DASH-05 | D1 Consola (solo médico, simulador o admin): iniciar/pausar, velocidad 1×/60×/600×, lanzar tormenta solar, "todo despejado", fallas (O2 bajo, CO2 alto, SpO2 bajo, mal sueño) y reiniciar. Sin el rol correcto DEBE responder 403. | 🟢 (403 cubierto por contrato) |
| DASH-06 | El panel DEBE usar solo la clave pública de Supabase obtenida de `/api/config`. | 🟢 |

## Verificación manual

Guion de demo del README: Consola → ▶ Iniciar → *Lanzar tormenta solar* → en el celular aparece la alerta → *Ya llegué al refugio* → en el panel se ven refugio, dosis y alertas → *Todo despejado*.
