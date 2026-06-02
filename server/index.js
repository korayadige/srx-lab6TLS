import express from 'express';
import fs from 'fs';
import https from 'https';


const PORT = 5000;
const app = express()

const WHITELIST = ['web-client-1'];

app.get('/', (req, res) => {
    if (!req.client.authorized) {
        return res.status(401).send('Invalid client certificate authentication.');
    }
    const cert = req.socket.getPeerCertificate();
    const cn = cert.subject.CN;
    console.log(cn);
    if (!WHITELIST.includes(cn)) {
        return res.status(403).send(`Access denied: "${cn}" is not authorized.`);
    }
    return res.send('Hello, world!');
});

const options = {
    cert: fs.readFileSync('cert/web-server.crt'),
    key: fs.readFileSync('cert/web-server.key'),
    passphrase: '1234',
    requestCert: true,
    rejectUnauthorized: false,
    ca: fs.readFileSync('cert/ca.crt'),
};

https.createServer(
    options,
    app
)
    .listen(PORT, () => {
        console.log(`Running on PORT ${PORT}`);
    });