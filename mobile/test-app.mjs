// Corre las pruebas de la app (commonTest en la JVM) en Windows, macOS o Linux: npm run test:app
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const r = spawnSync(win ? path.join(dir, 'gradlew.bat') : './gradlew', [':composeApp:desktopTest'], { cwd: dir, stdio: 'inherit', shell: win });
process.exit(r.status ?? 1);
