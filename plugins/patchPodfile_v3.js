// plugins/patchPodfile_v3.js
// Fix Podfile for Expo/RN iOS builds on EAS without global modular headers.
// 1) Remove ':privacy_file_aggregation_enabled' from use_react_native! args.
// 2) Remove any global 'use_modular_headers!' to avoid 'redefinition of module' errors.
// 3) Ensure in post_install we set 'DEFINES_MODULE=YES' for 'React-jsinspector' target,
//    so Swift (ExpoModulesCore) can import it without modular headers.
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

function ensurePostInstallDefinesModule(podfile) {
  const injection = `
post_install do |installer|
  react_native_post_install(
    installer,
    :mac_catalyst_enabled => false
  )
  # Ensure React-jsinspector defines a module so Swift (ExpoModulesCore) can import it
  installer.pods_project.targets.each do |target|
    if target.name == 'React-jsinspector'
      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
  end
end
`.trim();

  // If there's already a post_install block, append our snippet inside it safely.
  if (/^\s*post_install\s+do\s*\|\s*installer\s*\|/m.test(podfile)) {
    // Try to insert our defines-module loop just before 'end' of the first post_install block.
    return podfile.replace(
      /post_install\s+do\s*\|\s*installer\s*\|([\s\S]*?)end/m,
      (m, body) => {
        if (body.includes("DEFINES_MODULE' = 'YES'") || body.includes('DEFINES_MODULE')) {
          return m; // already present
        }
        const addition = `
  # Ensure React-jsinspector defines a module so Swift (ExpoModulesCore) can import it
  installer.pods_project.targets.each do |target|
    if target.name == 'React-jsinspector'
      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
  end
`;
        return m.replace(body, body + addition);
      }
    );
  }

  // No post_install block found; append ours at the end.
  return podfile.trimEnd() + '\n\n' + injection + '\n';
}

module.exports = function withPatchPodfileV3(config) {
  return withDangerousMod(config, ['ios', (cfg) => {
    const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    if (!fs.existsSync(podfilePath)) {
      console.log('[patchPodfile_v3] Podfile not found at', podfilePath);
      return cfg;
    }
    let podfile = fs.readFileSync(podfilePath, 'utf8');
    const before = podfile;

    podfile = stripPrivacyFlag(podfile);
    podfile = stripGlobalModularHeaders(podfile);
    podfile = ensurePostInstallDefinesModule(podfile);

    if (podfile !== before) {
      fs.writeFileSync(podfilePath, podfile);
      console.log('[patchPodfile_v3] Patched ios/Podfile (privacy flag removed, modular headers removed, DEFINES_MODULE injected)');
    } else {
      console.log('[patchPodfile_v3] No changes applied');
    }
    return cfg;
  }]);
};
