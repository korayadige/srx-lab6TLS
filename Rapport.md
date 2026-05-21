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

**key (cert/web-server.key) :** C'est la clé privée du serveur. Elle est utilisée pour déchiffrer les informations envoyées par le client et signer les messages lors de la poignée de main (handshake) TLS. Elle doit rester strictement secrète.

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

Comme rejectUnauthorized est à false, le serveur nous laisse entrer sur le protocole HTTP.

Node.js vérifie si le navigateur a fourni un certificat valide signé par la ca.crt. Ce n'est pas le cas, donc req.client.authorized devient false.

La condition "if" est validée, et le serveur te renvoie une erreur HTTP **401** Unauthorized avec le texte : **"Invalid client certificate authentication."**.


## Authentification client
>Examinez les options d'export disponibles dans easy-rsa. Quels sont les formats supportés ?
L'outil Easy-RSA (basé sur OpenSSL) génère et stocke initialement les clés et certificats au format brut **PEM (Privacy-Enhanced Mail)**. Pour l'exportation et l'intégration dans des applications tierces (comme les navigateurs web ou les systèmes d'exploitation), Easy-RSA prend principalement en charge deux grandes familles de formats :

**Le format PKCS#12** (fichiers .p12 ou .pfx) :  C'est l'option d'exportation standard et la plus sécurisée pour les clients. Elle permet de regrouper de manière conteneurisée la clé privée de l'utilisateur, son certificat public, ainsi que le certificat de l'autorité racine (CA) au sein d'un seul fichier chiffré par un mot de passe.

**Le format PEM / PKCS#1 / PKCS#8** (fichiers séparés .crt et .key) :Ce format exporte les données sous forme de texte encodé en Base64 (délimité par des balises -----BEGIN...-----). Il est généralement privilégié pour la configuration directe des serveurs web (comme Node.js, Nginx ou Apache).

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

## Pharming
---
>Utilisez votre PKI pour créer un certificat serveur, en utilisant le Common Name (CN) heig-vd.ch.

>Simulez le comportement d'un malware falsifiant le DNS de votre machine, en éditant le fichier hosts. Ajoutez l'entrée suivante:

>127.0.2.2   heig-vd.ch
>Changez la configuration du serveur pour utiliser le port 443. Quel autre changement devez-vous faire pour que celà fonctionne, et pourquoi ?

>Naviguez maintenant vers https://heig-vd.ch
>Quel site obtenez-vous ? Votre navigateur génère-t-il une alerte de sécurité ? Pourquoi ?


