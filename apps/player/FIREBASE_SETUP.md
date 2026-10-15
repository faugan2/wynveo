# Configuration Firebase pour l'app Joueur

## Mode par défaut: Mock (Développement)

L'app utilise **le mode mock par défaut** pour développement sans Firebase.

```bash
npm run dev:player    # Mode mock (défaut, VITE_DATA_SOURCE=mock)
```

Utilisateur de démo:
- Email: `joueur@wynveo.com`
- Mot de passe: `demo1234`

## Mode Production: Firebase

Pour utiliser Firebase en production:

### 1. Obtenir les credentials Firebase

**Via Firebase Console:**

1. Allez à [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez le projet `demo-wynveo`
3. Cliquez sur ⚙️ **Project Settings** 
4. Allez à l'onglet **"Your apps"** → **Wynveo Player** 
5. Cliquez sur **Config** et copiez les valeurs

Ou trouvez dans `functions/src/lib/firebase.js` ou demandez à l'équipe.

### 2. Créer `.env` avec les credentials

Créez le fichier `.env` à la racine de `apps/player/`:

```bash
# apps/player/.env
VITE_DATA_SOURCE=firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=demo-wynveo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-wynveo
VITE_FIREBASE_STORAGE_BUCKET=demo-wynveo.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

### 3. Démarrer en mode Firebase

```bash
npm run dev:player -- --mode firebase
# Ou avec env var
VITE_DATA_SOURCE=firebase npm run dev:player
```

### 4. Configurer Firestore Rules

Créez les collections et rules dans Firebase:

**Collections à créer:**
- `users` (auto-created by auth)
- `sports_events`
- `sports_bets`

**Exemple Firestore Rules** (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Subcollections
      match /transactions/{docId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /sports_bets/{docId} {
        allow read, write: if request.auth.uid == userId;
      }
      match /game_plays/{docId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    // Sports events are public read-only
    match /sports_events/{docId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

### 5. Activer les services Firebase

- ✅ **Authentication**: Enable "Email/Password" provider
- ✅ **Firestore Database**: Create database (production or test mode)
- ✅ **Cloud Functions**: For features comme le jackpot daily draw (optionnel)

## Switching entre Mock et Firebase

L'app détecte automatiquement la configuration:

- `VITE_DATA_SOURCE=mock` → Utilise mock services
- `VITE_DATA_SOURCE=firebase` → Utilise Firebase (credentials obligatoires)
- **Pas de config** → Défaut à mock

Si Firebase n'est pas configuré et que vous utilisez `VITE_DATA_SOURCE=firebase`, vous verrez:
```
Error: Firebase auth service requires VITE_DATA_SOURCE=firebase and valid Firebase credentials in .env
```

## Déploiement

### Sur Firebase Hosting

```bash
# Build avec Firebase
VITE_DATA_SOURCE=firebase npm run build -w @wynveo/player

# Deploy
firebase deploy --only hosting:player
```

### Structure `.firebaserc`

```json
{
  "projects": {
    "default": "demo-wynveo"
  },
  "targets": {
    "demo-wynveo": {
      "hosting": {
        "player": ["wynveo-player"]
      }
    }
  }
}
```

## Troubleshooting

**Error: `auth/invalid-api-key`**
- Vérifiez que les credentials Firebase sont corrects dans `.env`
- Vérifiez que `VITE_DATA_SOURCE=mock` si vous ne voulez pas utiliser Firebase

**Error: `Firebase is not configured`**
- Remplissez les variables `VITE_FIREBASE_*` dans `.env`
- Ou utilisez `VITE_DATA_SOURCE=mock` (défaut)

**Firestore permission denied**
- Assurez-vous que les Firestore Rules sont correctement déployées
- Vérifiez que l'utilisateur est authentifié avec `firebase.auth.currentUser`

## Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_DATA_SOURCE` | Mode: mock ou firebase | `mock` |
| `VITE_FIREBASE_API_KEY` | Clé API publique Firebase | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domaine auth Firebase | `demo-wynveo.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID du projet Firebase | `demo-wynveo` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de stockage | `demo-wynveo.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID du sender | `123456789` |
| `VITE_FIREBASE_APP_ID` | ID de l'app | `1:123456789:web:abc123def456` |
