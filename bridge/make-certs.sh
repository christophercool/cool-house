#!/bin/bash
# Makes a private certificate so your iPhone can safely talk to this Mac over the show Wi-Fi (one time only).
cd "$(dirname "$0")" && mkdir -p certs && cd certs
HOST="$(scutil --get LocalHostName 2>/dev/null || hostname -s).local"
cat > ca.cnf <<CNF
[req]
distinguished_name=dn
x509_extensions=ext
prompt=no
[dn]
CN=Cool House Show Bridge
O=Christopher Cool
[ext]
basicConstraints=critical,CA:TRUE
keyUsage=critical,keyCertSign,cRLSign
subjectKeyIdentifier=hash
CNF
openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out ca.crt -days 3650 -config ca.cnf -sha256 2>/dev/null
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
subjectKeyIdentifier=hash
authorityKeyIdentifier=keyid,issuer
subjectAltName=DNS:$HOST,DNS:localhost,IP:127.0.0.1
CNF
openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -config srv.cnf -sha256 2>/dev/null
openssl x509 -req -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt -days 397 -sha256 -extfile srv.cnf -extensions ext 2>/dev/null
cp ca.crt "$HOME/Desktop/CoolHouse-Trust.crt"
echo "$HOST" > host.txt
echo "✅ Certificate made for $HOST"
echo "   AirDrop 'CoolHouse-Trust.crt' (now on your Desktop) to your iPhone and trust it (see the steps)."
