#!/usr/bin/env bash
# Builds the web content, archives the app and uploads it to App Store Connect (TestFlight).
#
#   ASC_KEY_ID=… ASC_ISSUER_ID=… ios/scripts/testflight.sh <build number>
#
# The App Store Connect API key is read from ~/.appstoreconnect/private_keys/AuthKey_<ASC_KEY_ID>.p8 and
# never enters the repository. Signing is local: the Apple Distribution certificate in the keychain and the
# "Fun with Quantum App Store" profile (ExportOptions.plist). The build number must be higher than every
# build uploaded before; the version is MARKETING_VERSION in project.yml. Builds land in the internal
# TestFlight group "Internal" (all builds) after Apple has processed them, usually within minutes.
set -euo pipefail
build="${1:?usage: testflight.sh <build number>}"
: "${ASC_KEY_ID:?set ASC_KEY_ID}" "${ASC_ISSUER_ID:?set ASC_ISSUER_ID}"
key="$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8"
[ -f "$key" ] || { echo "no API key at $key" >&2; exit 1; }
auth=(-authenticationKeyPath "$key" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")

cd "$(dirname "$0")/.."
node scripts/build-web.mjs
xcodegen generate
archive="build/FunWithQuantum-$build.xcarchive"
xcodebuild archive -project FunWithQuantum.xcodeproj -scheme FunWithQuantum -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$archive" -allowProvisioningUpdates "${auth[@]}" \
  CURRENT_PROJECT_VERSION="$build"
xcodebuild -exportArchive -archivePath "$archive" -exportOptionsPlist ExportOptions.plist \
  -exportPath "build/export-$build" "${auth[@]}"
echo "Uploaded build $build. It appears in TestFlight once App Store Connect has processed it."
