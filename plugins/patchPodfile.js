// plugins/patchPodfile.js
// Fixes two issues for Expo/RN iOS builds on EAS:
// 1) Removes `:privacy_file_aggregation_enabled => true` from use_react_native! args
// 2) Ensures `use_modular_headers!` is present (needed for ExpoModulesCore -> React-jsinspector)
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function patchPodfile(podfile) {
  const original = podfile;

  // --- Remove the privacy aggregation flag wherever it appears
  podfile = podfile.replace(
    /^[ \t]*,?[ \t]*:privacy_file_aggregation_enabled\s*=>\s*[^,\)\r\n]+[ \t]*,?[ \t]*\r?\n/gm,
    ''
  );
  podfile = podfile.replace(
    /,\s*:privacy_file_aggregation_enabled\s*=>\s*[^,\)\r\n]+/g,
    ''
  );
  podfile = podfile.replace(/,\s*\)/g, ')');
  podfile = podfile.replace(/\(\s*,\s*/g, '(');

  // --- Ensure use_modular_headers! is present (for Swift pods + React-jsinspector)
  if (!/^\s*use_modular_headers!\s*$/m.test(podfile)) {
    // insert it right before the first use_react_native!( ... )
    const marker = podfile.indexOf('use_react_native!(');
    if (marker !== -1) {
      podfile = podfile.slice(0, marker) + 'use_modular_headers!\n' + podfile.slice(marker);
    } else {
      // fallback: put near the top (after any `platform :ios` or `require_relative` lines)
      const lines = podfile.split('\n');
      let insertAt = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/^require_relative\b/.test(lines[i]) || /^platform\s+:ios\b/.test(lines[i])) {
          insertAt = i + 1;
        }
      }
      lines.splice(insertAt, 0, 'use_modular_headers!');
      podfile = lines.join('\n');
    }
  }

  if (podfile !== original) {
    return { changed: true, content: podfile };
  }
  return { changed: false, content: podfile };
}

module.exports = function withPatchPodfile(config) {
  return withDangerousMod(config, ['ios', (cfg) => {
    const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    if (!fs.existsSync(podfilePath)) {
      console.log('[patchPodfile] Podfile not found at', podfilePath);
      return cfg;
    }
    const before = fs.readFileSync(podfilePath, 'utf8');
    const { changed, content } = patchPodfile(before);
    if (changed) {
      fs.writeFileSync(podfilePath, content);
      console.log('[patchPodfile] Patched ios/Podfile (privacy flag removed, modular headers ensured)');
    } else {
      console.log('[patchPodfile] No changes applied (already clean)');
    }
    return cfg;
  }]);
};
