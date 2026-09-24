#!/bin/bash
cd "$(dirname "$0")"
clear
echo "===================================================================="
echo "        PrintHub Local Print Bridge for macOS"
echo "===================================================================="
echo ""
which node > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "[OK] Node.js found. Starting Print Bridge daemon..."
    node print-bridge.js
else
    echo "[!] Node.js is required on macOS to run the bridge."
    echo "Please install Node.js from https://nodejs.org or run 'brew install node'"
    echo ""
    read -p "Press Enter to exit..."
fi
