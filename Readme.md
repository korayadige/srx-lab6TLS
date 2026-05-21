# Labo 6 - TLS

Ce laboratoire comporte deux tâches principales: mettre en place une authentification mutuelle pour TLS (mTLS) entre un serveur web et un navigateur, et
mettre en place un scénario d'attaque de type pharming (DNS falsifié + CA
malhonnête).

Pour la 2e partie, il sera nécessaire de *travailler dans une machine virtuelle*, car nous allons délibérément affaiblir la sécurité du système.

## Création d'une PKI

Un Dockerfile est mis à disposition afin de créer une image incluant `easyrsa`.

Build l'image:
`docker build -t local/easyrsa -f docker/easyrsa/Dockerfile .`

Utiliser l'image:
1. Lancer un container : `docker run --rm -it -v .:/home/operator local/easyrsa  /bin/sh`
   - Cette commande doit être effectuée depuis la racine du dossier du labo.
   - Cette commande monte un volume dans le container afin que les données crées par `easyrsa` soient diponibles sur votre hôte.
2. Utiliser les commandes `easyrsa` directement en tapant `easyrsa` dans le terminal du container.

Utilisez `easyrsa` pour générer un certificat serveur et un certificat client.


### Example de data pki

```
data
└── pki
    ├── ca.crt
    ├── certs_by_serial
    │   ├── 15FB30D0DF72D21D740A0DE685488290.pem
    │   ├── 6B977642AC3843C3827694DF493BF482.pem
    │   └── AB7EEBC8F2FC8B023358B651FBECD6CF.pem
    ├── index.txt
    ├── index.txt.attr
    ├── index.txt.attr.old
    ├── index.txt.old
    ├── inline
    │   └── private
    │       ├── README.inline.private
    │       ├── web-client-1.inline
    │       └── web-server.inline
    ├── issued
    │   └── web-client-1.crt
    ├── private
    │   ├── ca.key
    │   ├── web-client-1.key
    │   └── web-server.key
    ├── reqs
    │   ├── web-client-1.req
    │   └── web-server.req
    ├── revoked
    │   ├── certs_by_serial
    │   └── private_by_serial
    ├── serial
    ├── serial.old
    └── vars.example

```

## Mise en place du serveur

Inspectez le code fourni dans le répertoire `server`.
Quel est la signification de chaque option passée à `https.createServer` ?

Copiez les clés et certificats nécessaires au fonctionnement du serveur depuis votre PKI. Visitez l'URL depuis votre navigateur web. 

Obtenez-vous des avertissements de sécurité ? Pourquoi ?

**ATTENTION: NE PAS REALISER LA SUITE EN DEHORS D'UNE VM. FAIRE UN SNAPSHOT DE LA VM AVANT**

Trouvez comment accéder à la listes des autorités de certification de votre navigateur. Ajoutez-y le certificat racine de votre propre PKI.

Quel est maintenant l'état de la sécurité de la connexion, selon le navigateur ?


## Authentification client

Examinez les options d'export disponibles dans `easy-rsa`. Quels sont les formats supportés ?

Créez un certificat client, exportez-le au format PKCS#12, puis importez le comme certificat personnel dans votre navigateur, puis visitez l'URL du serveur.

Qu'est-ce qui à changé ?

Comment le navigateur détermine-t-il quel certificat présenter au serveur ?

## Pharming

Utilisez votre PKI pour créer un certificat serveur, en utilisant le Common Name (CN) `heig-vd.ch`.

Simulez le comportement d'un malware falsifiant le DNS de votre machine, en éditant le fichier `hosts`. Ajoutez l'entrée suivante:

```
127.0.2.2   heig-vd.ch
```

Changez la configuration du serveur pour utiliser le port 443. Quel autre changement devez-vous faire pour que celà fonctionne, et pourquoi ?


Naviguez maintenant vers https://heig-vd.ch

Quel site obtenez-vous ? Votre navigateur génère-t-il une alerte de sécurité ? Pourquoi ?

## Idées de tâches
- script de setup
- tester la révocation
- tester la durée de validité
- serveur CA
- implémenter une whitelist des utilisateurs authorisés

## Question théoriques
- imaginer un scénario pertinent où ce serait utile
- Comment gérer la signature des certificats ?


## Commandes utiles

- Ajouter un SAN avec `easyrsa`
`easyrsa --subject-alt-name=DNS:localhost gen-req web-server`

- Exporter le certificat client en format importable dans le browser
`openssl pkcs12 -export -out client.p12 -inkey pki/private/web-client-1.key  -in pki/issued/web-client-1.crt -certfile pki/ca.crt`
