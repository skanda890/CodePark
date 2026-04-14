require('dotenv').config();
const dgram = require('dgram');
const crypto = require('crypto');
const WebSocket = require('ws');

const SETTINGS = {
    myIp: process.env.LAPTOP_IP,
    routerIp: process.env.ROUTER_IP,
    user: process.env.AIRTEL_NUMBER,
    pass: process.env.AIRTEL_PASSWORD
};

// --- WEBSOCKET SERVER ---
const wss = new WebSocket.Server({ port: 8080 });
let uiSocket = null;

wss.on('connection', (ws) => {
    uiSocket = ws;
    console.log("🖥️ Dialer UI Connected");
    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        if (data.type === 'DIAL') console.log(`📞 CodePark: Initiating call to ${data.number}...`);
    });
});

// --- SIP ENGINE ---
const client = dgram.createSocket('udp4');
const md5 = (str) => crypto.createHash('md5').update(str).digest('hex');

function getRegisterPacket(nonce = null, realm = null) {
    const callId = crypto.randomBytes(12).toString('hex') + "@" + SETTINGS.myIp;
    const branch = "z9hG4bK-" + crypto.randomBytes(8).toString('hex');
    const tag = crypto.randomBytes(4).toString('hex');
    let authHeader = "";

    if (nonce && realm) {
        const ha1 = md5(`${SETTINGS.user}:${realm}:${SETTINGS.pass}`);
        const ha2 = md5(`REGISTER:sip:${SETTINGS.routerIp}`);
        const response = md5(`${ha1}:${nonce}:${ha2}`);
        authHeader = `Authorization: Digest username="${SETTINGS.user}", realm="${realm}", nonce="${nonce}", uri="sip:${SETTINGS.routerIp}", response="${response}", algorithm=MD5\r\n`;
    }

    return `REGISTER sip:${SETTINGS.routerIp} SIP/2.0\r\n` +
           `Via: SIP/2.0/UDP ${SETTINGS.myIp}:5060;branch=${branch};rport\r\n` +
           `From: <sip:${SETTINGS.user}@${SETTINGS.routerIp}>;tag=${tag}\r\n` +
           `To: <sip:${SETTINGS.user}@${SETTINGS.routerIp}>\r\n` +
           `Call-ID: ${callId}\r\n` +
           `CSeq: ${nonce ? 2 : 1} REGISTER\r\n` +
           `Contact: <sip:${SETTINGS.user}@${SETTINGS.myIp}:5060>\r\n` +
           `Max-Forwards: 70\r\n` +
           `User-Agent: AirtelPhone/1.0 (Android)\r\n` +
           `Expires: 3600\r\n` +
           authHeader +
           `Content-Length: 0\r\n\r\n`;
}

client.on('message', (msg) => {
    const res = msg.toString();
    console.log(`\n[ROUTER] ${res.split('\r\n')[0]}`);

    if (res.includes("401 Unauthorized")) {
        const nonce = res.match(/nonce="([^"]+)"/)[1];
        const realm = res.match(/realm="([^"]+)"/)[1];
        client.send(Buffer.from(getRegisterPacket(nonce, realm)), 5060, SETTINGS.routerIp);
    } else if (res.includes("200 OK")) {
        console.log("\x1b[32m✔ Registered with Router.\x1b[0m");
        if (uiSocket) uiSocket.send(JSON.stringify({ event: 'REGISTERED' }));
    }
});

client.bind(5060, SETTINGS.myIp, () => {
    console.log(`🚀 Engine active on ${SETTINGS.myIp}:5060`);
    client.send(Buffer.from(getRegisterPacket()), 5060, SETTINGS.routerIp);
});