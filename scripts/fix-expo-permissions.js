const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname, '..', 'node_modules', 'expo-modules-core', 'android', 'src',
  'main', 'java', 'expo', 'modules', 'adapters', 'react', 'permissions',
  'PermissionsService.kt'
);

try {
  if (!fs.existsSync(file)) {
    console.log('[fix-expo-permissions] file not found, skip:', file);
    process.exit(0);
  }
  let txt = fs.readFileSync(file, 'utf8');
  const before = txt;

  // Делает вызов безопасным для nullable переменной
  txt = txt.replace(/mAskAsyncRequestedPermissions\.contentEquals\(/g,
                    'mAskAsyncRequestedPermissions?.contentEquals(');

  if (txt !== before) {
    fs.writeFileSync(file, txt);
    console.log('[fix-expo-permissions] Patched PermissionsService.kt');
  } else {
    console.log('[fix-expo-permissions] No changes needed');
  }
} catch (e) {
  console.log('[fix-expo-permissions] error:', e.message);
  // не валим установку зависимостей
  process.exit(0);
}
