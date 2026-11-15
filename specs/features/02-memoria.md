# 02 · Memoria a largo plazo — `MEM`

**Objetivo:** que los personajes recuerden lo importante de la persona entre días y entre personajes, sin que eso salga del teléfono ni se convierta en vigilancia.

**Código:** [`data/PrivateData.kt`](../../mobile/composeApp/src/commonMain/kotlin/app/astrohealth/eco/data/PrivateData.kt) (`memory`), `AppModel.remember / forgetFact / forgetAll`, [`server/eco.mjs`](../../server/eco.mjs) (campo `remember`), Ajustes → "Lo que recuerdan de ti".

## Requisitos

| ID | Requisito | Estado |
|---|---|---|
| MEM-01 | Un recuerdo es una frase breve en tercera persona sobre algo duradero: personas o mascotas importantes, qué le ayuda o no, preocupaciones en curso, metas, preferencias, eventos importantes. NO DEBE guardar charla trivial, estados de ánimo pasajeros ni valores de salud. | 🟢 |
| MEM-02 | El servidor DEBE devolver entre 0 y 3 recuerdos **nuevos** por respuesta, sin duplicados y sin repetir los que ya recibió en `memory`. | 🟢 |
| MEM-03 | La app DEBE enviar la memoria en cada mensaje (últimos 40, cada uno ≤ 200 caracteres) y el personaje DEBE usarla con naturalidad, sin recitarla ni decir que tiene una lista. | 🟢 |
| MEM-04 | La memoria DEBE ser **compartida** por Luma, Pipo y Nix. | 🟢 |
| MEM-05 | La memoria DEBE guardarse cifrada solo en el teléfono (Android Keystore, AES‑GCM), con un máximo de 40 recuerdos (se descartan los más viejos), y DEBE sobrevivir a cerrar la app. | 🟢 |
| MEM-06 | La persona DEBE poder ver todos sus recuerdos, borrar uno por uno o todos. Si apaga "Recordar nuestras conversaciones", se DEBEN borrar conversaciones y recuerdos, y no se envía memoria. | 🟢 |
| MEM-07 | El personaje NO DEBE guardar algo que la persona pidió olvidar. | 🟢 |

## Criterios de aceptación

- **MEM-04/05** — *Dado* que le dije a Luma "me ayuda escuchar jazz antes de dormir", *cuando* cierro la app por completo, la abro y le pregunto a Nix "¿qué sabes de mí que me ayude a dormir?", *entonces* Nix menciona el jazz. *(Verificado en emulador 2026‑11‑14.)*
- **MEM-06** — *Dado* un recuerdo en Ajustes, *cuando* toco ✕ junto a él, *entonces* desaparece y no se vuelve a enviar.
- **MEM-02** — *Dado* `memory` con "Su hija se llama Sofía.", *cuando* vuelvo a mencionar a Sofía, *entonces* `remember` no incluye esa frase otra vez.

## Pruebas automáticas

- `server/test/eco.test.mjs` → recorte de `memory` (MEM-03).
- El resto requiere la IA real: verificación manual.
