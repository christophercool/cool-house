// Magic Show bridge: QLab (OSC over UDP) -> Cool House on the iPhone (secure WebSocket over the show Wi-Fi).
// No internet needed. No extra packages needed: just Node.js.
//
// QLab Network cue: OSC, destination 127.0.0.1 port 53540, message e.g. /coolhouse/santa
// Commands: santa  mrsclaus  text  camera  stop  reset  pocket  unpocket  ping
const fs = require('fs'), https = require('https'), dgram = require('dgram'), crypto = require('crypto'), os = require('os'), path = require('path');
const OSC_PORT = 53540, WSS_PORT = 8443;
const dir = __dirname, certDir = path.join(dir, 'certs');
const clients = new Set();

const frame = (txt) => { const p = Buffer.from(txt); const h = p.length < 126 ? Buffer.from([0x81, p.length]) : Buffer.from([0x81, 126, p.length >> 8, p.length & 255]); return Buffer.concat([h, p]); };
const send = (txt) => { for (const s of clients) { try { s.write(frame(txt)); } catch (e) {} } };
const stamp = () => new Date().toLocaleTimeString();

const server = https.createServer({ key: fs.readFileSync(path.join(certDir, 'server.key')), cert: fs.readFileSync(path.join(certDir, 'server.crt')) }, (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end('<meta name="viewport" content="width=device-width"><body style="font:20px -apple-system;padding:30px">✅ Magic Show Bridge is running.<br><br>Your iPhone trusts this Mac. You can close this page.</body>');
});
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return sock.destroy();
  const acc = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acc + '\r\n\r\n');
  sock.setNoDelay(true); sock.setKeepAlive(true, 5000);
  clients.add(sock); console.log(stamp(), '📱 iPhone connected (' + clients.size + ')');
  sock.on('data', (b) => { if ((b[0] & 0x0f) === 0x8) sock.end(); });
  const bye = () => { if (clients.delete(sock)) console.log(stamp(), '📴 iPhone disconnected (' + clients.size + ')'); };
  sock.on('close', bye); sock.on('error', bye);
});
setInterval(() => send('ping'), 10000);
server.listen(WSS_PORT, () => {
  let host = os.hostname().replace(/\.local$/, '') + '.local';
  try { host = fs.readFileSync(path.join(certDir, 'host.txt'), 'utf8').trim(); } catch (e) {}
  console.log('\n🎅 Magic Show Bridge is running.\n');
  console.log('   Cool House finds this Mac by itself. (Address, if asked: ' + host + ')');
  console.log('   QLab Network cue (OSC):  127.0.0.1  port ' + OSC_PORT + '  message /coolhouse/santa\n');
  console.log('   Leave this window open during the show.\n');
});

const readStr = (b, i) => { let e = b.indexOf(0, i); if (e < 0) e = b.length; return [b.toString('utf8', i, e), (e + 4) & ~3]; };
const osc = dgram.createSocket('udp4');
osc.on('message', (b) => {
  let [addr] = readStr(b, 0);
  if (addr === '#bundle') { const inner = b.slice(20); [addr] = readStr(inner, 0); }
  const cmd = addr.replace(/^\/(coolhouse\/)?/, '').toLowerCase();
  if (!cmd) return;
  send(cmd);
  console.log(stamp(), '▶', cmd, clients.size ? '' : '   ⚠️  no iPhone connected!');
});
osc.bind(OSC_PORT, '127.0.0.1');
