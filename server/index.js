import express from 'express';
import fs from 'fs';
import https from 'https';

const PORT = 443;
const app = express();
const WHITELIST = ['Koray'];

app.get('/', (req, res) => {
    // 1. Vérification mTLS : Le certificat client est-il valide ?
    if (!req.client.authorized) {
        return res.status(401).send('Invalid client certificate authentication.');
    }

    // Extraction du Common Name (CN) du certificat
    const cert = req.socket.getPeerCertificate();
    const cn = cert.subject.CN;
    console.log(`Utilisateur connecté (CN): ${cn}`);

    // 2. Autorisation : Le CN est-il présent dans la whitelist ?
    if (!WHITELIST.includes(cn)) {
        return res.status(403).send(`Access denied: "${cn}" is not authorized.`);
    }

    // Accès accordé après double validation
    return res.send('Hello, world!');
});

// Configuration du serveur HTTPS et du mTLS
const options = {
    cert: fs.readFileSync('cert/fake_server.crt'),
    key: fs.readFileSync('cert/fake_server.key'),
    requestCert: true,              // Oblige le navigateur à présenter un certificat
    rejectUnauthorized: false,     // Ne coupe pas la connexion TLS, l'erreur est gérée par Express
    ca: fs.readFileSync('cert/ca.crt'), // Autorité racine pour valider le client
};

https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
    console.log(`Running on PORT ${PORT}`);
});