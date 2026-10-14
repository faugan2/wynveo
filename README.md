# Wynveo

Jeux et paris sportifs, **un seul compte et un seul solde**.
React (JavaScript) + Vite, Firebase en syntaxe v8 (modules `compat`), Cloud Functions pour tout ce qui touche à l'argent.

## État du projet : étape 1 livrée

| Livré | Détail |
|---|---|
| Inscription / connexion | Numéro togolais + mot de passe, **sans SMS** (gratuit) ; un numéro = un compte |
| Vérification du numéro | Par le **premier dépôt Mobile Money fait depuis ce numéro** (confirmé avec le code secret de l'opérateur) ; débloque les retraits et le bonus |
| Portefeuille partagé Jeux + Sport | Solde réel, bonus, solde retirable, mis à jour en direct |
| Dépôt | T-Money / Flooz, **paiement simulé**, bonus de bienvenue 100 % jusqu'à 10 000 FCFA sur le 1er dépôt depuis le numéro du compte |
| Retrait | Numéro vérifié obligatoire, envoi vers le numéro du compte uniquement, plafond 50 000 FCFA/jour sans vérification d'identité, validation automatique ou manuelle |
| Historique | Filtres Tout / Dépôts / Retraits / Jeux / Sport |
| Accueil | Choix **Jeux** ou **Sport** (les deux modules arrivent aux étapes 2 et 3) |
| Admin | Connexion e-mail + rôle, tableau de bord, retraits à valider (approuver / refuser avec motif), journal d'audit |

Prochaines étapes proposées : 2. les 4 jeux (tirages côté serveur) · 3. le sport (matchs, coupon, The Odds API, règlement) · 4. KYC, jeu responsable, notifications · 5. le reste de l'admin.

## Organisation du code

```
wynveo/
├─ packages/core/        Logique métier PURE, sans React ni Firebase, testée
│                        (montants, numéros, règles de dépôt/retrait, bonus, références)
├─ functions/            Cloud Functions : seul endroit qui modifie l'argent
│  ├─ src/api/           Points d'entrée (authentification + paramètres → service)
│  ├─ src/services/      Orchestration métier (profil, dépôt, retrait) en transactions Firestore
│  ├─ src/payments/      Prestataires de paiement interchangeables (simulé aujourd'hui)
│  ├─ src/repositories/  Chemins et format des documents Firestore
│  └─ test/              Parcours complets testés sur un Firestore en mémoire
├─ apps/player/          Application joueur
│  └─ src/
│     ├─ config/         Initialisation Firebase (votre fichier, adapté)
│     ├─ services/       SEUL accès aux données ; deux versions : firebase/ et mock/ (démo hors ligne)
│     ├─ hooks/          Logique d'écran (session, connexion, inscription, dépôt, retrait…)
│     ├─ features/       Écrans par domaine : auth, home, wallet, games, sport, bets, profile
│     ├─ ui/             Composants visuels purs (Button, Card, OtpInput…) : aucune logique
│     ├─ layout/         Cadres d'écran (barre du haut, onglets)
│     └─ app/            Routes et gardes d'accès
├─ apps/admin/           Back-office (même découpage)
└─ firebase/             Règles Firestore / Storage et index
```

**Règle de séparation :** `ui/` ne connaît que des props ; `features/` assemble `ui/` et `hooks/` ; `hooks/` appellent `services/` ; seuls `services/firebase/` et `config/` importent Firebase. Les règles chiffrées (limites, bonus) vivent dans `packages/core/src/config.js` et sont partagées par les apps et les Cloud Functions.

**Sécurité de l'argent :** les règles Firestore interdisent toute écriture depuis le navigateur sur `users`, `wallets` et `transactions`. Les soldes ne changent que dans des transactions Firestore côté serveur, de façon idempotente (un dépôt n'est jamais crédité deux fois).

## Démarrer

Prérequis : Node 20+, `npm i -g firebase-tools`.

```bash
npm install
cd functions && npm install && cd ..

npm test                       # tests de la logique métier
cd functions && npm test       # parcours dépôt / retrait / validation admin
```

### Démo hors ligne (sans Firebase)
```bash
npm run dev:mock -w @wynveo/player   # http://localhost:5173  · créez un compte avec n'importe quel numéro togolais
npm run dev:mock -w @wynveo/admin    # http://localhost:5174  · admin@wynveo.com / demo1234
```

### Avec les émulateurs Firebase (recommandé pour développer)
```bash
cp apps/player/.env.example apps/player/.env   # puis VITE_USE_EMULATORS=true
cp apps/admin/.env.example apps/admin/.env     # idem
npm run emulators                              # http://localhost:4000 pour l'interface
npm run dev:player
```

Créer un admin sur l'émulateur :
```bash
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 GCLOUD_PROJECT=demo-wynveo \
  node functions/scripts/set-admin.mjs admin@wynveo.com super motdepasse
```

## Mise en ligne sur le projet Firebase

1. **Console Firebase** du projet `my-streakers` :
   - passer au forfait **Blaze** ;
   - **Authentication → Méthodes de connexion** → activer **E-mail/Mot de passe** (sert aux joueurs, via une adresse technique `22890123456@joueurs.wynveo.app`, et aux admins) ;
   - **Authentication → Paramètres → Domaines autorisés** : ajouter les domaines des deux sites ;
   - **Firestore** : créer la base (région `europe-west1` conseillée, comme les Functions).
2. Déployer :
   ```bash
   firebase login
   npm run build
   firebase target:apply hosting player my-streakers         # site du joueur
   firebase target:apply hosting admin my-streakers-admin    # créer d'abord ce 2e site dans Hosting
   npm run deploy
   ```
3. Nommer le premier super admin (clé de compte de service : Console → Paramètres → Comptes de service) :
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
     node functions/scripts/set-admin.mjs vous@domaine.com super "MotDePasseSolide"
   ```
   Ne jamais commiter `service-account.json`.

## Comment le numéro d'un joueur est vérifié

Il n'y a pas de SMS. À l'inscription, le numéro est « à confirmer ». Le premier dépôt réussi **fait depuis ce numéro**
est validé par le joueur avec son code secret T-Money / Flooz : cela prouve qu'il possède la carte SIM.
Ce dépôt passe le profil en `phoneVerified: true` (côté serveur uniquement) et accorde le bonus de bienvenue.
Un dépôt depuis un autre numéro est crédité, mais ne vérifie rien et ne donne pas de bonus.
Mot de passe oublié : réinitialisation par le support (un écran admin est prévu ; un SMS pourra être ajouté plus tard).

## Brancher un vrai prestataire de paiement

Créer `functions/src/payments/<nom>Provider.js` qui respecte le contrat décrit dans `functions/src/payments/index.js`,
l'ajouter à la liste, puis définir `PAYMENT_PROVIDER=<nom>` et les clés en **secrets** :
`firebase functions:secrets:set CINETPAY_API_KEY`. Le webhook `paymentWebhook` est déjà prêt.
Les écrans et les services n'ont pas à changer ; le bouton « Simuler la confirmation » disparaît de lui-même.
