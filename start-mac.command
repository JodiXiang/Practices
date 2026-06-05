#!/bin/zsh
cd "$(dirname "$0")"
echo "Starting Lullaby for Daiyu..."
echo "If the browser does not open automatically, visit:"
echo "http://127.0.0.1:4173/"
open "http://127.0.0.1:4173/" >/dev/null 2>&1 &
npm start
