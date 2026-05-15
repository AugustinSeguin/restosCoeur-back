# restosCoeur-back

API REST Node.js / TypeScript.

## Prérequis

- **Node.js** `v22.21.0` (voir [.nvmrc](.nvmrc))
- **npm** `v10+`

> Avec [nvm](https://github.com/nvm-sh/nvm) :
>
> ```bash
> nvm use
> ```

## Installation

```bash
npm install
```

## Commandes

| Commande        | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `npm run dev`   | Lance le serveur en mode développement avec rechargement automatique |
| `npm run build` | Compile TypeScript vers `dist/`                                      |
| `npm start`     | Lance le serveur compilé (production)                                |

## Structure

```
src/        # Sources TypeScript
dist/       # Build compilé (généré)
```

```json
  "id": 1,
  "title": "Collecte Mars 2026",
  "isActive": true,
  "formUrl": "https://forms.example.com/collecte1",
users: [
        // list de users
    {
        //  user id = 1
        assignements : [
            // récupérer les assignemnts du user à l'id 1 et correspondat a la collection
        ],
     "userAnswers": [
        // récupérer les userAnswer du userId l'id 1 et correspondat a la collection
        {
          "id": 1,
          "userId": 2,
          "collectionId": 1,
          "slotId": 1,
          "zoneId": 1,
          "createdAt": "2026-04-01T09:51:58.150Z",
          "updatedAt": "2026-04-01T09:51:58.150Z"
        },
        ],
        },
],
  "slots": [
    {
        // les slots de la collection 1

    "openStores": [
        // les stores qui sont ouverts au startAt et EndAt de chaque slot & que si les jours startAt et EndAt sont un diomanche et que isOpenSunday est false alors on n'inclut pas ces stores
        // dans chaque store inclut les zones associées
    ]

```

## Deploiement

## CI / Pipeline (GitHub Actions)

Le dépôt contient un workflow GitHub Actions pour builder et déployer l'API sur un VPS via SSH/PM2: [back/.github/workflows/deploy.yml](back/.github/workflows/deploy.yml#L1-L200).

- Quand vous poussez sur `main` (ou `master`), l'action :
  - installe les dépendances et build le projet TypeScript (`npm run build`).
  - copie `dist/`, `package.json`, `package-lock.json` et le dossier `prisma/` sur le VPS.
  - exécute une commande SSH qui installe les dépendances (`npm ci`), puis redémarre ou démarre le process `pm2` avec les variables d'environnement.

Variables d'environnement attendues (GitHub Secrets recommandés) :

- `API_KEY` : clé API interne
- `JWT_SECRET` : secret JWT utilisé par l'API
- `FRONTEND_URL` : URL public du frontend (ex: https://app.monsite.fr)
- `FRONTEND_URLS` : liste d'origines CORS séparées par des virgules (ex: https://app.monsite.fr,http://localhost:5173)
- `MAIL_HOST` : hôte SMTP
- `MAIL_PORT` : port SMTP
- `MAIL_SECURE` : active TLS/SSL pour SMTP
- `MAIL_USER` : utilisateur SMTP
- `MAIL_PASS` : mot de passe SMTP
- `MAIL_FROM` : adresse d'expéditeur
- `SMS_URL` : endpoint SMS Partner (ex: https://api.smspartner.fr/v1/send)
- `SMS_API_KEY` : clé API SMS Partner
- `SMS_GAMME` : gamme SMS Partner (ex: 1)
- `SMS_SENDER` : nom d'expéditeur SMS
- `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`, `VPS_TARGET_PATH_API` : variables utilisées par le workflow pour le déploiement SSH/SCP

Ajouter les secrets GitHub :

1. Dans GitHub, repo → Settings → Secrets & variables → Actions → New repository secret
2. Créez par exemple `FRONTEND_URLS` avec la valeur `https://app.monsite.fr,http://localhost:5173`.

Vous pouvez aussi utiliser l'outil `gh` :

```bash
gh secret set FRONTEND_URLS --body "https://app.monsite.fr,http://localhost:5173"
```

## Déploiement manuel (Backend)

Pré-requis sur le serveur : Node.js v22, npm, pm2, accès SSH, base de données accessible.

1. Récupérer les fichiers sur le serveur (git clone ou scp). Exemple avec git :

```bash
git clone <repo> /var/www/restos-coeur-api
cd /var/www/restos-coeur-api/back
npm install
npm run build
```

2. Configurer les variables d'environnement (exemple `~/.env` ou systemd/pm2 env) :

```
API_KEY=xxxxx
JWT_SECRET=xxxxx
FRONTEND_URLS=https://app.monsite.fr,http://localhost:5173
PORT=3001
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
MAIL_HOST="smtp.example.com"
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=""
MAIL_PASS=""
MAIL_FROM=""
SMS_URL="https://api.smspartner.fr/v1/send"
SMS_API_KEY=""
SMS_GAMME="1"
SMS_SENDER="RESTOS"
```

3. Prisma :

- Installer et exécuter les migrations (si nécessaire) :

```bash
npx prisma migrate deploy
npx prisma generate
```

4. Démarrer l'API avec `pm2` (ou votre process manager) :

```bash
API_KEY='...' JWT_SECRET='...' FRONTEND_URLS='https://app.monsite.fr' PORT=3001 MAIL_HOST='smtp.example.com' MAIL_PORT=587 MAIL_SECURE=false MAIL_USER='' MAIL_PASS='' MAIL_FROM='' SMS_URL='https://api.smspartner.fr/v1/send' SMS_API_KEY='...' SMS_GAMME='1' SMS_SENDER='RESTOS' pm2 start dist/index.js --name restos-coeur-api --cwd /var/www/restos-coeur-api
```

5. Vérifier les logs :

```bash
pm2 logs restos-coeur-api --lines 200
```

Notes :

- Assurez-vous que `FRONTEND_URLS` contient bien l'origine exacte utilisée par le navigateur (y compris le schéma `https://`).
- Si vous utilisez un reverse-proxy (nginx), vérifiez qu'il forwarde correctement les headers et que TLS est configuré.
