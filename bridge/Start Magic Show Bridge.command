#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed yet. Opening nodejs.org: install the LTS version, then double-click this again."
  open "https://nodejs.org/en/download"; read -p "Press Return to close."; exit 1
fi
[ -f certs/server.crt ] || bash make-certs.sh
bash ensure-cert.sh
node bridge.js
