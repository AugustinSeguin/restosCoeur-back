# Configuration du CI/CD GitHub Actions

## Secrets à configurer sur GitHub

Allez dans **Settings > Secrets and variables > Actions** et ajoutez les secrets suivants :

| Clé                   | Description                         | Exemple                         |
| --------------------- | ----------------------------------- | ------------------------------- |
| `VPS_HOST`            | IP ou domaine du VPS                | `192.168.1.100`                 |
| `VPS_USER`            | Utilisateur SSH                     | `deploy`                        |
| `VPS_SSH_KEY`         | Clé SSH privée (entière)            | Contenu de `~/.ssh/id_rsa`      |
| `VPS_PORT`            | Port SSH                            | `22`                            |
| `VPS_TARGET_PATH_API` | Chemin d'accès au projet sur le VPS | `/home/deploy/restos-coeur-api` |

## Configuration du VPS

### 1. Préparer le serveur

```bash
# Créer l'utilisateur de déploiement
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG sudo deploy

# Générer une clé SSH (sur votre machine local)
ssh-keygen -t ed25519 -f ~/.ssh/vps_deploy -C "deploy@restos-coeur"

# Copier la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/vps_deploy -p 22 deploy@VPS_HOST
```

### 2. Configurer le dépôt Git sur le VPS

```bash
ssh deploy@VPS_HOST
cd /home/deploy
git clone [URL du repository] restos-coeur-api
cd restos-coeur-api
npm install
npm run build
```

### 3. Configurer PM2 (gestionnaire de processus)

```bash
ssh deploy@VPS_HOST

# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start dist/index.js --name restos-coeur-api

# Configurer la persistence au reboot
pm2 startup
pm2 save

# Vérifier les processus
pm2 list
pm2 logs restos-coeur-api
```

## Variables d'environnement

Créez un fichier `.env` sur le VPS :

```bash
ssh deploy@VPS_HOST
cd /home/deploy/restos-coeur-api
nano .env
```

Contenu du `.env` :

```
DATABASE_URL="postgresql://user:password@localhost:5432/restos_coeur?schema=public"
PORT=3000
NODE_ENV=production
```

## Workflow de déploiement

À chaque push sur `main` ou `master` :

1. ✅ **Checkout** — Télécharge le code du repository
2. ✅ **Node.js** — Configure Node.js v22
3. ✅ **Install** — Installe les dépendances (`npm install`)
4. ✅ **Build** — Compile le TypeScript (`npm run build`)
5. ✅ **SCP Copy** — Transfère les fichiers compilés via SCP :
   - `dist/*` — Le code compilé
   - `package.json` + `package-lock.json` — Les dépendances
6. ✅ **SSH Commands** — Exécute les commandes post-déploiement :
   - `npm install --production` — Installe uniquement les dépendances de production
   - `pm2 restart||start` — Redémarre ou démarre l'application

## Dépannage

### Erreur : "Permission denied (publickey)"

- Vérifiez la clé SSH publique dans `~/.ssh/authorized_keys` sur le VPS
- Permissions correctes : `chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys`

### Erreur : "npm: command not found"

- Installez Node.js sur le VPS :
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### Erreur : "pm2: command not found"

- Installez PM2 globalement : `npm install -g pm2`

### L'app ne redémarre pas après déploiement

- Vérifiez que PM2 est actif : `pm2 list`
- Vérifiez les logs : `pm2 logs restos-coeur-api`
- Redémarrez manuellement : `pm2 restart restos-coeur-api`

## Structure des fichiers sur le VPS

```
/home/deploy/restos-coeur-api/
├── dist/              # Code compilé (copié par GitHub Actions)
├── node_modules/      # Dépendances de production (installées par workflow)
├── package.json       # Copié par GitHub Actions
├── package-lock.json  # Copié par GitHub Actions
├── .env              # À créer manuellement
└── prisma/           # Schema Prisma (à copier manuellement)
```

## Notes importantes

- ⚠️ Le fichier `.env` **NE doit PAS** être commité sur GitHub
- ⚠️ Les fichiers de source TypeScript (`src/`) ne sont pas copiés (seulement `dist/`)
- ⚠️ Les `node_modules` ne sont pas copiés, ils sont réinstallés sur le VPS
- ⚠️ Utilisez `npm install --production` sur le VPS pour économiser l'espace disque
