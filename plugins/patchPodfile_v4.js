// plugins/patchPodfile_v4.js
// Goal: fix Expo/RN iOS build on EAS
// 1) Remove ':privacy_file_aggregation_enabled' from use_react_native! args
// 2) Remove global 'use_modular_headers!' (can cause 'redefinition of module ReactCommon')
// 3) Add `pod 'React-jsinspector', :modular_headers => true` into the main app target
// 4) (Optional safety) Ensure post_install sets DEFINES_MODULE=YES for 'React-jsinspector'
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function stripPrivacyFlag(podfile) {
  let out = podfile.replace(
    /^[ \t]*,?[ \t]*:privacy_file_aggregation_enabled\s*=>\s*[^,\)\r\n]+[ \t]*,?[ \t]*\r?\n/gm,
    ''
  );
  out = out.replace(/,\s*:privacy_file_aggregation_enabled\s*=>\s*[^,\)\r\n]+/g, '');
  out = out.replace(/,\s*\)/g, ')');
  out = out.replace(/\(\s*,\s*/g, '(');
  return out;
}
function stripGlobalModularHeaders(podfile) {
  return podfile.replace(/^\s*use_modular_headers!\s*$/gm, '');
}
function injectJsinspectorModularHeaders(podfile) {
  if (/pod\s+['"]React-jsinspector['"]\s*,\s*:modular_headers\s*=>\s*true/.test(podfile)) {
    return podfile; // already present
  }
  // Find the first target block that likely is the app (contains use_react_native! or use_expo_modules!)
  const targetRegex = /(^\s*target\s+['"][^'"]+['"]\s+do\b)([\s\S]*?^\s*end\s*$)/gm;
  let replaced = false;
  podfile = podfile.replace(targetRegex, (m, head, body) => {
    if (replaced) return m;
    if (/\buse_react_native!\b/.test(body) || /\buse_expo_modules!\b/.test(body)) {
      // Inject just before 'end' inside this target
      const injection = `  pod 'React-jsinspector', :modular_headers => true\n`;
      if (body.includes("pod 'React-jsinspector'")) {
        // upgrade existing pod line to modular headers
        const body2 = body.replace(/pod\s+['"]React-jsinspector['"][^\n]*\n/g, "  pod 'React-jsinspector', :modular_headers => true\n");
        replaced = true;
        return head + body2;
      } else {
        const body2 = body.replace(/^\s*end\s*$/m, injection + 'end');
        replaced = true;
        return head + body2;
      }
    }
    return m;
  });
  return podfile;
}
function ensurePostInstallDefinesModule(podfile) {
  const snippet = `
  # Ensure React-jsinspector defines a module so Swift (ExpoModulesCore) can import it
  installer.pods_project.targets.each do |target|
    if target.name == 'React-jsinspector'
      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
  end
`;
  if (/^\s*post_install\s+do\s*\|\s*installer\s*\|/m.test(podfile)) {
    return podfile.replace(/post_install\s+do\s*\|\s*installer\s*\|([\s\S]*?)end/m, (m, body) => {
      if (body.includes("DEFINES_MODULE'") || body.includes('DEFINES_MODULE')) return m;
      return m.replace(body, body + snippet);
    });
  }
  const full = `
post_install do |installer|
  react_native_post_install(
    installer,
    :mac_catalyst_enabled => false
  )
${snippet}end
`.trim() + '\n';
  return podfile.trimEnd() + '\n\n' + full;
}

module.exports = function withPatchPodfileV4(config) {
  return withDangerousMod(config, ['ios', (cfg) => {
    const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    if (!fs.existsSync(podfilePath)) {
      console.log('[patchPodfile_v4] Podfile not found at', podfilePath);
      return cfg;
    }
    let podfile = fs.readFileSync(podfilePath, 'utf8');
    const before = podfile;

    podfile = stripPrivacyFlag(podfile);
    podfile = stripGlobalModularHeaders(podfile);
    podfile = injectJsinspectorModularHeaders(podfile);
    podfile = ensurePostInstallDefinesModule(podfile);

    if (podfile !== before) {
      fs.writeFileSync(podfilePath, podfile);
      console.log('[patchPodfile_v4] Patched ios/Podfile: privacy flag removed; modular_headers for React-jsinspector added; DEFINES_MODULE ensured.');
    } else {
      console.log('[patchPodfile_v4] No changes applied');
    }
    return cfg;
  }]);
};
