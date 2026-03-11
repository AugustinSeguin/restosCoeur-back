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

### 3. Configurer PM2 (processus manager)

```bash
npm install -g pm2

# Démarrer l'application
pm2 start npm --name api -- run start

# Persistence des processus au reboot
pm2 startup
pm2 save
```

## Workflow de déploiement

À chaque push sur `main` ou `master` :

1. ✅ Télécharge le code
2. ✅ Configure Node.js v22.21.0
3. ✅ Installe les dépendances (`npm ci`)
4. ✅ Build le TypeScript (`npm run build`)
5. ✅ Se connecte au VPS en SSH
6. ✅ Pull les dernières modifications
7. ✅ Installe et build sur le VPS
8. ✅ Redémarre le process avec PM2

## Dépannage

### Erreur : "Permission denied (publickey)"

- Vérifiez que la clé SSH publique est dans `~/.ssh/authorized_keys` sur le VPS
- Vérifiez que les permissions du dossier `.ssh` sont correctes : `chmod 700 ~/.ssh`

### Erreur : "npm: command not found"

- Installez Node.js sur le VPS : `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`

### Erreur : "pm2: command not found"

- Installez PM2 globalement : `npm install -g pm2`
