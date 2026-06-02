# Labo 6 - TLS
---
Groupe 15

Michel Polunkin

Koray Akgul

## Mise en place du serveur
---
>Inspectez le code fourni dans le répertoire server. Quel est la signification de chaque option passée à https.createServer ?

 **Signification des options de https.createServer**
 Chaque option  dans le fichier index.js :

**cert (cert/web-server.crt) :** C'est le certificat public du serveur (X.509). Il sert de carte d'identité au serveur. Lors de la connexion, le serveur le présente au navigateur pour prouver qu'il est bien le propriétaire légitime du domaine (ici, localhost).

**key (cert/web-server.key) :** C'est la clé privée du serveur. Elle est utilisée pour signer les messages lors de la poignée de main (handshake) TLS afin de prouver l'identité du serveur. Dans TLS 1.3 (utilisé par Node.js moderne), les clés de session sont dérivées séparément via ECDHE — la clé privée ne sert pas à déchiffrer les données de session. Elle doit rester strictement secrète.

**passphrase ('1234') :** C'est le mot de passe qui protège la clé privée. Même si un attaquant vole le fichier web-server.key, il ne peut pas l'utiliser sans cette phrase de passe. Le serveur l'utilise au démarrage pour déverrouiller la clé en mémoire.

**ca (cert/ca.crt) :** C'est le certificat de l'Autorité de Certification (Root CA) en laquelle le serveur a confiance. Dans le cadre du mTLS, le serveur utilise ce fichier comme référence pour vérifier la validité du certificat que le navigateur va lui présenter.

**requestCert:** true : Cette option active l'authentification mutuelle (mTLS). Le serveur n'est plus le seul à s'identifier : il demande explicitement au navigateur de lui présenter, lui aussi, un certificat client valide pour prouver son identité.

**rejectUnauthorized:** false : C'est l'option clé qui explique notre écran aussi. Si elle était à true, le serveur couperait instantanément la connexion (au niveau TLS) si le navigateur ne présentait pas de certificat valide. En la mettant à false, le serveur accepte quand même la poignée de main TLS, laisse le navigateur accéder à l'application, mais il marque la requête comme "non autorisée" (req.client.authorized = false). Cela permet de gérer l'erreur proprement dans le code Express et d'afficher un message personnalisé.

>Obtenez-vous des avertissements de sécurité ? Pourquoi ?

**Oui**, le navigateur affiche un avertissement de sécurité ("ERROR").

Pourquoi : Le certificat du serveur (web-server.crt) a été signé par notre propre autorité de certification locale (ca.crt). Par défaut, les navigateurs web ne font confiance qu'à une liste restreinte d'Autorités de Certification publiques et reconnues mondialement (comme DigiCert, Let's Encrypt, etc.). Comme notre CA locale ne fait pas partie de ce "magasin de confiance"  du navigateur, celui-ci émet une alerte par mesure de sécurité.

> Trouvez comment accéder à la listes des autorités de certification de votre navigateur. Ajoutez-y le certificat racine de votre propre PKI.

> Quel est maintenant l'état de la sécurité de la connexion, selon le navigateur ?

Selon le navigateur, l'état de la sécurité de la connexion est désormais "Sécurisé"  concernant l'authentification du serveur.

**Explication :** 

**1. Chiffrement et Confiance :** Le message d'avertissement initial a totalement disparu. Cela prouve que le canal TLS est correctement établi et que le navigateur fait entièrement confiance à notre Autorité de Certification racine (ca.crt) pour valider l'identité de localhost.
   
**2. Blocage Applicatif (mTLS) :** Le fait que la page affiche le texte "**Invalid client certificate authentication**" confirme que la couche transport (TLS) est sécurisée, mais que le serveur applique strictement le Mutual TLS. Il rejette l'accès au contenu applicatif tant que le client (le navigateur) ne lui présente pas un certificat d'identité valide (client.p12).

Dans notre fichier index.js, le code de la route principale est le suivant :
```
app.get('/', (req, res) => {
    if (!req.client.authorized) {
        return res.status(401).send('Invalid client certificate authentication.');
    }
    // ...
```
On navigue sur https://localhost:5000.

Comme rejectUnauthorized est à false, le serveur nous laisse entrer sur le protocole HTTPS.

Node.js vérifie si le navigateur a fourni un certificat valide signé par la ca.crt. Ce n'est pas le cas, donc req.client.authorized devient false.

La condition "if" est validée, et le serveur te renvoie une erreur HTTP **401** Unauthorized avec le texte : *"Invalid client certificate authentication."*.

---


## Authentification client
>Examinez les options d'export disponibles dans easy-rsa. Quels sont les formats supportés ?
L'outil Easy-RSA (basé sur OpenSSL) génère et stocke initialement les clés et certificats au format brut **PEM (Privacy-Enhanced Mail)**. Pour l'exportation et l'intégration dans des applications tierces (comme les navigateurs web ou les systèmes d'exploitation), Easy-RSA prend principalement en charge deux grandes familles de formats :

**Le format PKCS#12** (`export-p12`, fichiers .p12 ou .pfx) : C'est l'option d'exportation standard et la plus sécurisée pour les clients. Elle permet de regrouper de manière conteneurisée la clé privée de l'utilisateur, son certificat public, ainsi que le certificat de l'autorité racine (CA) au sein d'un seul fichier chiffré par un mot de passe.

**Le format PKCS#7** (`export-p7`, fichiers .p7b) : Permet d'exporter une chaîne de certificats (sans clé privée). Utilisé notamment pour distribuer des certificats intermédiaires ou racines.

**Le format PEM / PKCS#8** (`export-p8`, fichiers séparés .crt et .key) : Ce format exporte les données sous forme de texte encodé en Base64 (délimité par des balises `-----BEGIN...-----`). Il est généralement privilégié pour la configuration directe des serveurs web (comme Node.js, Nginx ou Apache).

>Créez un certificat client, exportez-le au format PKCS#12, puis importez le comme certificat personnel dans votre navigateur, puis visitez l'URL du serveur.

<img width="355" height="199" alt="image" src="https://github.com/user-attachments/assets/1147ce6e-7f40-4517-a923-f5b864ddcab0" />

<img width="517" height="153" alt="image" src="https://github.com/user-attachments/assets/40e94e74-db13-4487-842a-ed02747c2288" />


>Qu'est-ce qui à changé ?
**Après l'importation du certificat client (client.p12) et la validation de la boîte de dialogue du navigateur**, l'accès au contenu applicatif du serveur a été débloqué. Le message d'erreur "Invalid client certificate" a disparu pour laisser place à la page sécurisée du laboratoire (affichant "**Hello,World!**").

Le protocole mTLS (Mutual TLS) est désormais finalisé avec succès. La poignée de main (Handshake TLS) inclut maintenant l'étape où le client prouve son identité au serveur en signant un défi cryptographique avec sa clé privée (client.key), tandis que le serveur valide la signature grâce au certificat public reçu (client.crt) lié à l'autorité racine (ca.crt).

>Comment le navigateur détermine-t-il quel certificat présenter au serveur ?

Le navigateur détermine le certificat à présenter en suivant un processus strict basé sur les requêtes cryptographiques du serveur lors du Handshake TLS :

**Certificate Request  :** Lors de la négociation TLS, le serveur configuré avec requestCert: true envoie un message Certificate Request. Ce message contient une liste des noms d'autorités de certification acceptées (Distinguished Names de CA acceptés, ici **CN=MyLocalCA**).

**Filtrage par le navigateur :** Le navigateur (Firefox) parcourt son magasin de certificats personnels (**Vos certificats**). Il filtre et ne propose à l'utilisateur que les certificats clients qui ont été signés et émis par l'une des CA demandées par le serveur.

**Sélection/Validation utilisateur :** Si un seul certificat correspond (comme notre certificat CN=Koray signé par MyLocalCA), le navigateur affiche une invite de confirmation à l'utilisateur pour valider l'envoi de cette identité spécifique afin de protéger la vie privée du client.
---
## Pharming
---

>Utilisez votre PKI pour créer un certificat serveur, en utilisant le Common Name (CN) heig-vd.ch.

Nous avons fait.

>Simulez le comportement d'un malware falsifiant le DNS de votre machine, en éditant le fichier hosts. Ajoutez l'entrée suivante:

>127.0.2.2   heig-vd.ch
>Changez la configuration du serveur pour utiliser le port 443. Quel autre changement devez-vous faire pour que celà fonctionne, et pourquoi ?

1.Changement web_server.key et crt. avec fake_server.crt et fake_server.key.(index.js)
Le fichier hosts change la direction du trafic (DNS Spoofing) vers notre machine. Mais cela ne suffit pas. Quand le navigateur (Firefox) arrive sur notre serveur, il demande une preuve d'identité. Pour cela, nous avons changé le code dans index.js : le serveur utilise maintenant *fake_server.crt* et *fake_server.key* (avec le CN heig-vd.ch) à la place des fichiers de localhost. 

2.Au niveau de la Configuration Réseau (Configuration 0.0.0.0) :
Nous avons changé le code pour écouter sur 0.0.0.0 (.listen(PORT, '0.0.0.0')). Notre fichier hosts redirige le trafic vers l'adresse 127.0.2.2. Si le serveur écoute seulement 127.0.0.1, le navigateur affiche une erreur de connexion. Avec 0.0.0.0, le serveur écoute toutes les adresses IP de la machine.

3.Utilisation de sudo :

Pour utiliser le port 443, on doit démarrer le serveur avec la commande sudo node index.js. En Linux, les ports de 0 à 1023 sont des "ports privilégiés" (sécurisés). Un utilisateur normal ne peut pas utiliser le port 443. On a besoin des droits d'administrateur (root) pour ouvrir ce port


>Quel site obtenez-vous ?

Nous n'obtenons pas le vrai site de l'école. Cela s'est passé en deux étapes :

Étape 1 : Au début, nous obtenons une erreur de connexion (page blanche avec le renard) parce que le serveur n'écoute pas sur l'adresse 127.0.2.2.

Étape 2 : Après la configuration 0.0.0.0, le navigateur demande notre certificat client. Nous acceptons, et nous obtenons un message d'erreur sur une page blanche : *"Invalid client certificate authentication."*

>Votre navigateur génère-t-il une alerte de sécurité ?

*Oui*, Firefox génère d'abord une alerte de sécurité en arrière-plan avec le code SEC_ERROR_UNKNOWN_ISSUER avant de demander le certificat client.

>Pourquoi ?

Autorité inconnue (CA) : Notre certificat est signé par MyLocalCA. Firefox ne connaît pas cette autorité locale pour un vrai site public comme heig-vd.ch. C'est une protection contre le vol d'identité.

**Point clé — le scénario "CA malhonnête" :** Si notre CA avait déjà été présente dans le magasin de confiance du navigateur (comme nous l'avions ajoutée dans la partie précédente), Firefox n'aurait généré **aucune alerte**. L'utilisateur aurait vu le cadenas vert et cru naviguer sur le vrai heig-vd.ch. C'est précisément le danger d'une CA compromise ou corrompue : une fois qu'elle est approuvée par le système, elle peut signer n'importe quel domaine sans déclencher d'avertissement.

<img width="295" height="283" alt="image" src="https://github.com/user-attachments/assets/9366a462-a8a0-46ef-9227-004542e16ad3" />

<img width="299" height="199" alt="image" src="https://github.com/user-attachments/assets/796ddb6c-2fc0-4d38-abd6-0cef80fb171d" />
---

## Idées de tâches

### Whitelist des utilisateurs autorisés

Nous avons implémenté une whitelist dans `server/index.js` afin de restreindre l'accès non seulement aux clients possédant un certificat valide, mais également à une liste explicite d'utilisateurs autorisés.

**Modification apportée :**

```js
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
```

**Comportement :**

- Certificat invalide ou absent → **401 Unauthorized**
- Certificat valide mais CN absent de la whitelist → **403 Forbidden** (`Access denied: "..." is not authorized.`)
- Certificat valide et CN présent dans la whitelist → **200 OK** (`Hello, world!`)

**Intérêt :** Cette approche découple l'authentification (valider l'identité cryptographique) de l'autorisation (décider si cet utilisateur a le droit d'accéder). Même si un attaquant obtient un certificat signé par notre CA, il sera bloqué s'il ne figure pas dans la whitelist.

---

## Questions théoriques

>**Imaginer un scénario pertinent où ce serait utile :**

Une banque souhaitant sécuriser la communication entre son application mobile et ses API internes. Le serveur vérifie que le client est bien l'application officielle (et non une application malveillante) grâce à son certificat client. Le client vérifie l'identité du serveur. Les deux parties s'authentifient mutuellement, ce qui empêche aussi bien le phishing que l'usurpation d'identité côté client.

>**Comment gérer la signature des certificats ?**

Dans un système à petite échelle, un opérateur signe manuellement chaque CSR avec la CA (comme nous l'avons fait avec EasyRSA).

Dans la réalité, une entreprise doit utiliser une PKI (Public Key Infrastructure) interne :

CA Racine Offline : L'autorité racine (ca.crt) doit être stockée déconnectée d'Internet (offline) pour être protégée des hackers.

CA Intermédiaire : Une autorité secondaire est utilisée pour signer les certificats des serveurs et des clients tous les jours.

Automatisation : Utiliser des outils comme Active Directory ou OpenXPKI pour distribuer et révoquer (annuler) les certificats automatiquement.


---



