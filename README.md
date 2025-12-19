# SCBA Bénévoles 🏀

[![demo online](https://img.shields.io/badge/demo-online-brightgreen)](https://scba.desimone.fr)
[![Deploy with Coolify](https://img.shields.io/badge/🚀_Deploy_with-Coolify-blueviolet)](https://coolify.io)

Application de gestion du bénévolat pour le **Stade Clermontois Basket Auvergne**.

![Logo SCBA](public/logo-scba.png)

## ✨ Fonctionnalités

### 👥 Pour les parents

- **Inscription facile** : entrez votre nom et inscrivez-vous à un poste
- **Interface moderne** : Design épuré avec dégradés, cartes animées et mode sombre. ❄️ *Thème Noël activé : Neige et Guirlandes !*
- **📅 Ajouter au calendrier** : exportez les matchs vers Google Agenda, Apple Calendar ou Outlook en un clic
- **🚗 Covoiturage** : proposez des places (conducteur) ou cherchez une place (passager) pour chaque match. *🔒 Numéros de téléphone masqués par défaut pour protéger la vie privée*
- **🔄 Mise à jour automatique** : l'application se met à jour automatiquement à l'arrivée sur le site
- **Synchronisation temps réel** : Mises à jour instantanées via Firebase
- **Confirmation d'inscription** : popup de confirmation avant validation
- **Toast de confirmation** : notification visuelle après inscription ✅
- **Se désinscrire** : retirez-vous facilement (uniquement vos propres inscriptions)
- **Badge "C'est vous !"** : identifiez rapidement vos inscriptions
- **🔑 Récupération d'identité** : bouton "C'est moi ?" pour récupérer vos inscriptions sur un nouvel appareil
- **Matchs triés par date** : affichage chronologique automatique (stockage ISO fiable)
- **⚡ Match Ticker** : Bandeau défilant des matchs à venir (J-14)
- **📊 Stats Breakdown** : Récapitulatif mensuel des matchs (Total / Domicile / Extérieur)

### 🔧 Pour les administrateurs

- **Accès rapide** : bouton Admin directement dans le header
- **🏠 Matchs Domicile / 🚗 Extérieur** : différenciation des types de matchs
  - **Domicile** : Menu déroulant strict ("Maison des Sports" ou "Gymnase Fleury")
  - **Extérieur** : Champ libre avec auto-complétion intelligente des lieux existants
- **Gestion des matchs** : ajouter, modifier, supprimer
- **📥 Import en masse** : Copier-coller depuis le calendrier FFBB avec **recherche automatique des gymnases** (OpenStreetMap + Ministère des Sports)
- **Configuration des postes** : modifier le nombre de bénévoles par poste
- **Gestion des inscriptions** : supprimer n'importe quel bénévole

### 🎨 Interface moderne

- Design responsive (mobile & desktop)
- **Badges visuels** : 🏠 Domicile (vert) / 🚗 Extérieur (bleu) sur chaque carte
- **Typographie premium** : Police Outfit pour une apparence moderne et professionnelle
- **Skeleton Loader** : Chargement élégant avec aperçu de la structure pendant le chargement
- **Spinner initial** : Animation pendant le chargement des scripts
- **Animations fluides** : Cartes qui apparaissent progressivement avec effet décalé
- **État vide amélioré** : Design engageant quand aucun match n'est programmé
- **Match Ticker** : Animation fluide avec inversion intelligente des équipes pour les matchs extérieurs *(compatible `prefers-reduced-motion`)*
- Animation de célébration quand un match est complet
- Notifications toast avec auto-dismiss
- Emojis pour chaque poste (🍺 Buvette, ⏱️ Chrono, 📋 Table de marque, 🍪 Goûter)
- Logo officiel du club

### 📲 PWA & Cache

- **Installation mobile** : Ajoutez l'app sur votre écran d'accueil
- **Mises à jour automatiques** : Détection et rechargement automatique toutes les 30s
- **Network First** : Toujours afficher la dernière version (pas de cache bloquant)

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/nickdesi/SCBA-Benevolat.git
cd SCBA-Benevolat

# Installer les dépendances
npm install

# Configurer le mot de passe admin
cp .env.example .env.local
# Éditer .env.local avec votre mot de passe
```

## ⚙️ Configuration

### Environment Variables

Créez un fichier `.env.local` :

```env
VITE_ADMIN_PASSWORD=VotreMotDePasseAdmin
```

### Firebase

L'application utilise Firebase Firestore pour la synchronisation en temps réel.
La configuration peut être personnalisée via variables d'environnement (optionnel) :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

## 🏃 Lancer l'application

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Prévisualiser le build
npm run preview
```

## 📁 Structure du projet

```
├── index.tsx               # Point d'entrée (React + import CSS)
├── App.tsx                 # Composant principal (Logique Firestore + tri dates)
├── firebase.ts             # Configuration Firebase (env vars)
├── components/
│   ├── Header.tsx          # En-tête avec logo + bouton Admin
│   ├── MatchTicker.tsx     # Bandeau défilant des matchs à venir
│   ├── GameCard.tsx        # Carte de match (memoized)
│   ├── GameForm.tsx        # Formulaire ajout/édition match
│   ├── VolunteerSlot.tsx   # Gestion des inscriptions (memoized)
│   ├── CarpoolingSection.tsx # Section covoiturage (memoized)
│   ├── ConfirmModal.tsx    # Modal de confirmation
│   ├── AdminAuthModal.tsx  # Authentification admin
│   ├── SkeletonLoader.tsx  # Chargement élégant (memoized)
│   ├── ReloadPrompt.tsx    # PWA update prompt
│   ├── Toast.tsx           # Notifications toast
│   ├── SnowEffect.tsx      # Animation neige (Noël)
│   ├── ChristmasGarland.tsx # Guirlande lumineuse (Noël)
│   └── Icons.tsx           # Icônes SVG centralisées
│   └── AddressAutocomplete.tsx # Autocomplétion d'adresses
├── utils/
│   ├── calendar.ts         # Export calendrier (Google, Outlook, Apple)
│   └── storage.ts          # Utilitaires localStorage partagés
├── public/
│   ├── logo-scba.png       # Logo du club
│   └── pwa-*.png           # Icônes PWA (192x192, 512x512)
├── styles.css              # Design system global
├── constants.ts            # Constantes partagées (rôles, MONTH_MAP)
└── types.ts                # Types TypeScript
```

## 🔒 Sécurité et Données

- **Firebase Firestore** : Synchronisation temps réel des matchs et inscriptions.
- **Migration automatique** : Les données locales sont importées dans Firestore au premier lancement.
- **Identité** : L'identification "C'est vous !" reste locale au navigateur pour garantir la confidentialité sans compte utilisateur complexe.
- **Admin** : Mot de passe sécurisé requis pour les actions sensibles.

## 📱 Responsive

L'application est optimisée pour :

- 📱 Mobile (boutons pleine largeur, navigation tactile)
- 💻 Desktop (grille 2 colonnes, hover effects)

## 🎉 Célébration automatique

Quand tous les postes d'un match sont pourvus :

- Carte passe en vert avec animation
- Badge "COMPLET" affiché
- Message de remerciement

**Note** : Le poste Goûter (illimité) est considéré complet avec minimum 2 personnes.

---

Fait avec ❤️ pour le Stade Clermontois Basket Auvergne
