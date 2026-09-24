#!/bin/zsh
# Remplace `expo run:ios` tant qu'Expo ne connaît pas Xcode 27
# (Simulator.app y est devenu DeviceHub.app, Expo ne le trouve plus ;
# la touche `i` de Metro ne marche donc plus).
set -e
cd "$(dirname "$0")/.."

DEVICE_ID=$(xcrun simctl list devices booted | grep -m1 -oE '[0-9A-F-]{36}') || true
if [ -z "$DEVICE_ID" ]; then
  DEVICE_ID=$(xcrun simctl list devices available | grep -m1 'iPhone 17 Pro' | grep -oE '[0-9A-F-]{36}')
  xcrun simctl boot "$DEVICE_ID"
fi
open "devices://device/open?id=$DEVICE_ID" 2>/dev/null || open -a DeviceHub 2>/dev/null || true

echo "› Compilation (1re fois : quelques minutes)…"
xcodebuild -workspace ios/bestiebookbattle.xcworkspace -scheme bestiebookbattle \
  -configuration Debug -destination "id=$DEVICE_ID" -derivedDataPath ios/build -quiet

xcrun simctl install "$DEVICE_ID" ios/build/Build/Products/Debug-iphonesimulator/bestiebookbattle.app

# Ouvre l'app sur Metro dès qu'il répond.
(
  until curl -s localhost:8081/status | grep -q running; do sleep 1; done
  xcrun simctl openurl "$DEVICE_ID" "bestie-book-battle://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
) &

npx expo start --dev-client
