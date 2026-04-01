# HTTP Tests avec REST Client

Ce dossier contient des fichiers `.http` pour tester l'API avec l'extension **REST Client** pour VS Code.

## Installation

1. Installez l'extension **REST Client** de Huachao Mao :
   - ID: `humao.rest-client`
   - Lien: https://marketplace.visualstudio.com/items?itemName=humao.rest-client

## Configuration des variables

Chaque fichier `.http` contient deux variables au début :

```http
@api_url = http://localhost:3000/api
@token =
```

### Utilisation

1. **Récupérez un token** :
   - Ouvrez [auth.http](./auth.http)
   - Cliquez sur "Send Request" pour la requête Login
   - Copiez le token renvoyé

2. **Mettez à jour les variables** :
   - Remplacez `@token = ` par `@token = votre_token_jwt`
   - Vous pouvez aussi modifier `@api_url` si votre API est sur un autre port

3. **Testez les endpoints** :
   - Ouvrez le fichier `.http` correspondant (ex: [zone.http](./zone.http))
   - Cliquez sur "Send Request" pour chaque requête

## Fichiers disponibles

| Fichier                              | Description                  |
| ------------------------------------ | ---------------------------- |
| [auth.http](./auth.http)             | Authentification - Connexion |
| [zone.http](./zone.http)             | CRUD des Zones               |
| [collection.http](./collection.http) | CRUD des Collections         |
| [store.http](./store.http)           | CRUD des Magasins            |
| [slot.http](./slot.http)             | CRUD des Créneaux            |
| [user.http](./user.http)             | CRUD des Utilisateurs        |
| [assignment.http](./assignment.http) | CRUD des Affectations        |

## Étapes recommandées

1. ✅ **Créer un utilisateur admin** :
   - [user.http](./user.http) → "Create Admin User"

2. ✅ **Se connecter** :
   - [auth.http](./auth.http) → "Login"
   - Copier le token

3. ✅ **Mettre à jour le token** :
   - Dans chaque fichier, remplacer `@token = ` par `@token = <votre_token>`

4. ✅ **Créer une zone** :
   - [zone.http](./zone.http) → "Create Zone"

5. ✅ **Créer un magasin** :
   - [store.http](./store.http) → "Create Store" (avec `zoneId: 1`)

6. ✅ **Créer un créneau** :
   - [slot.http](./slot.http) → "Create Slot" (avec `collectionId: 1`)

7. ✅ **Créer une affectation** :
   - [assignment.http](./assignment.http) → "Create Assignment"

## Affichage des réponses

Les réponses s'affichent dans un onglet à droite. Vous pouvez :

- Voir les headers HTTP
- Voir le corps de la réponse (JSON)
- Voir le temps de réponse

## Astuces

- Utilisez Ctrl+Alt+R (ou Cmd+Alt+R sur Mac) pour envoyer rapidement
- Les variables peuvent être utilisées dans les URLs et les corps
- Tous les files utilisent `Authorization: Bearer {{token}}`
