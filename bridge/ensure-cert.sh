#!/bin/bash
# Runs on every start: makes sure the bridge certificate covers this Mac's current Wi-Fi address.
# Keeps every address it has seen before (home Wi-Fi, show router), so switching networks never breaks it.
# Works offline. Uses the existing trust certificate (ca.crt), so the iPhone never needs a new one.
cd "$(dirname "$0")/certs" || exit 0
[ -f ca.key ] && [ -f server.key ] || exit 0
HOST="$(scutil --get LocalHostName 2>/dev/null || hostname -s).local"
NOW=""
for IF in en0 en1 en2; do IP=$(ipconfig getifaddr $IF 2>/dev/null); [ -n "$IP" ] && NOW="$NOW $IP"; done
MAIN=$(echo $NOW | awk '{print $1}')
HAVE=$(openssl x509 -in server.crt -noout -text 2>/dev/null | tr ',' '\n' | sed 's/^ *//' | grep '^IP Address:' | sed 's/^IP Address://' | grep -v '^127\.0\.0\.1$')
NEED=0
for IP in $NOW; do echo "$HAVE" | grep -qxF "$IP" || NEED=1; done
if [ "$NEED" = 1 ]; then
  ALL=$(printf '%s\n' $HAVE $NOW | awk 'NF && !seen[$0]++')
  SAN="DNS:$HOST,DNS:localhost,IP:127.0.0.1"
  for IP in $ALL; do SAN="$SAN,IP:$IP"; done
  cat > srv.cnf <<CNF
[req]
distinguished_name=dn
prompt=no
[dn]
CN=$HOST
[ext]
basicConstraints=CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=$SAN
CNF
  openssl req -new -key server.key -out server.csr -config srv.cnf -sha256 2>/dev/null &&
  openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 397 -sha256 -extfile srv.cnf -extensions ext 2>/dev/null &&
  echo "🔐 Certificate updated for this network:$NOW"
fi
if [ -n "$MAIN" ]; then echo "$MAIN" > host.txt; else echo "$HOST" > host.txt; fi
