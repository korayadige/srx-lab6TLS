# Labo 6 - TLS
---
Michel

Koray Akgul

## Mise en place du serveur
---
>Inspectez le code fourni dans le répertoire server. Quel est la signification de chaque option passée à https.createServer ?

1. Signification des options de https.createServer
 Chaque option  dans le fichier index.js :

**cert (cert/web-server.crt) :** C'est le certificat public du serveur (X.509). Il sert de carte d'identité au serveur. Lors de la connexion, le serveur le présente au navigateur pour prouver qu'il est bien le propriétaire légitime du domaine (ici, localhost).

**key (cert/web-server.key) :** C'est la clé privée du serveur. Elle est utilisée pour déchiffrer les informations envoyées par le client et signer les messages lors de la poignée de main (handshake) TLS. Elle doit rester strictement secrète.

**passphrase ('1234') :** C'est le mot de passe qui protège la clé privée. Même si un attaquant vole le fichier web-server.key, il ne peut pas l'utiliser sans cette phrase de passe. Le serveur l'utilise au démarrage pour déverrouiller la clé en mémoire.

**ca (cert/ca.crt) :** C'est le certificat de l'Autorité de Certification (Root CA) en laquelle le serveur a confiance. Dans le cadre du mTLS, le serveur utilise ce fichier comme référence pour vérifier la validité du certificat que le navigateur va lui présenter.

**requestCert:** true : Cette option active l'authentification mutuelle (mTLS). Le serveur n'est plus le seul à s'identifier : il demande explicitement au navigateur de lui présenter, lui aussi, un certificat client valide pour prouver son identité.

**rejectUnauthorized:** false : C'est l'option clé qui explique ton écran actuel.

Si elle était à true, le serveur couperait instantanément la connexion (au niveau TLS) si le navigateur ne présentait pas de certificat valide.

En la mettant à false, le serveur accepte quand même la poignée de main TLS, laisse le navigateur accéder à l'application, mais il marque la requête comme "non autorisée" (req.client.authorized = false). Cela permet de gérer l'erreur proprement dans le code Express et d'afficher un message personnalisé.

>Obtenez-vous des avertissements de sécurité ? Pourquoi ?

**Oui**, le navigateur affiche un avertissement de sécurité ("Invalid client certificate authentication.).

Pourquoi : Le certificat du serveur (web-server.crt) a été signé par notre propre autorité de certification locale (ca.crt). Par défaut, les navigateurs web ne font confiance qu'à une liste restreinte d'Autorités de Certification publiques et reconnues mondialement (comme DigiCert, Let's Encrypt, etc.). Comme notre CA locale ne fait pas partie de ce "magasin de confiance"  du navigateur, celui-ci émet une alerte par mesure de sécurité.

Dans notre fichier index.js, le code de la route principale est le suivant :

```
app.get('/', (req, res) => {
    if (!req.client.authorized) {
        return res.status(401).send('Invalid client certificate authentication.');
    }
    // ...

```
On navigue sur https://localhost:5000.

Comme rejectUnauthorized est à false, le serveur nous laisse entrer sur le protocole HTTP.

Node.js vérifie si le navigateur a fourni un certificat valide signé par la ca.crt. Ce n'est pas le cas, donc req.client.authorized devient false.

La condition if (<!req.client.authorized>) est validée, et le serveur te renvoie une erreur HTTP **401** Unauthorized avec le texte : **"Invalid client certificate authentication."**.



