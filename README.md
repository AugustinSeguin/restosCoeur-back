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