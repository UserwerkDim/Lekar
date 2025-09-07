// plugins/removePrivacyAggregation.js
// Robustly remove ':privacy_file_aggregation_enabled => ...' from ios/Podfile
// Works regardless of whitespace/newlines/comma placement.
//
// How it works:
// 1) Deletes full lines that contain the option.
// 2) Also deletes inline occurrences inside the use_react_native!(...) call.
// 3) Cleans trailing commas like ', )' -> ')' to keep Ruby syntax valid.
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withRemovePrivacyAggregation(config) {
  return withDangerousMod(config, ['ios', (cfg) => {
    const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    if (!fs.existsSync(podfilePath)) {
      console.log('[removePrivacyAggregation] Podfile not found at', podfilePath);
      return cfg;
    }
    let podfile = fs.readFileSync(podfilePath, 'utf8');

    const original = podfile;

    // 1) Remove full-line occurrences, with optional leading comma and spaces
    podfile = podfile.replace(
      /^[ \t]*,?[ \t]*:privacy_file_aggregation_enabled\s*=>\s*[^,\)\r\n]+[ \t]*,?[ \t]*\r?\n/gm,
      ''
    );

    // 2) Remove inline occurrences inside argument list (with preceding comma)
    podfile = podfile.replace(
      /,\s*:privacy_file_aggregation_enabled\s*=>\s*[^,\)\r\n]+/g,
      ''
    );

    // 3) Tidy up: remove trailing commas before ')'
    podfile = podfile.replace(/,\s*\)/g, ')');
    // 4) Also tidy possible '(,' sequences
    podfile = podfile.replace(/\(\s*,\s*/g, '(');

    if (podfile !== original) {
      fs.writeFileSync(podfilePath, podfile);
      console.log('[removePrivacyAggregation] Patched ios/Podfile: removed :privacy_file_aggregation_enabled');
    } else {
      console.log('[removePrivacyAggregation] No occurrences found; Podfile unchanged.');
    }
    return cfg;
  }]);
};
