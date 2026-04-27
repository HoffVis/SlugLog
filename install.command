#!/bin/bash
# ═══════════════════════════════════════════════════════════
#  SlugLog — macOS First Launch Setup
# ═══════════════════════════════════════════════════════════
#  Double-click this file to prepare SlugLog for first use.
#  It removes the download quarantine flag and re-signs the
#  app locally so macOS accepts it without warnings.
#
#  You only need to run this ONCE after downloading.
# ═══════════════════════════════════════════════════════════

APP_NAME="SlugLog.app"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_PATH="$SCRIPT_DIR/$APP_NAME"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║   SlugLog — macOS First Launch Setup     ║"
echo "  ║          🐌 The slug awaits...            ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# Check the app exists next to this script
if [ ! -d "$APP_PATH" ]; then
    echo "  ❌ $APP_NAME not found next to this script."
    echo "     Place install.command in the same folder as $APP_NAME."
    echo ""
    read -n 1 -s -r -p "  Press any key to close..."
    exit 1
fi

echo "  Found: $APP_PATH"
echo ""

# Step 1: Remove quarantine
echo "  [1/2] Removing download quarantine..."
xattr -cr "$APP_PATH" 2>/dev/null
echo "         ✓ Quarantine removed"

# Step 2: Ad-hoc code sign (local identity)
echo "  [2/2] Signing locally..."
codesign --force --deep --sign - "$APP_PATH" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "         ✓ Signed successfully"
else
    echo "         ⚠ Signing failed (the app may still work)"
fi

echo ""
echo "  ✅ Done! SlugLog is ready."
echo "     Drag $APP_NAME to Applications or launch it now."
echo ""
echo "  The slug is hungry. Go feed it some hours."
echo ""

read -n 1 -s -r -p "  Press any key to launch SlugLog (or close this window)..."
echo ""
open "$APP_PATH"
