# SCBA Bénévoles 🏀

Application de gestion du bénévolat pour le **Stade Clermontois Basket Auvergne**.

![Logo SCBA](public/logo-scba.png)

## ✨ Fonctionnalités

### 👥 Pour les parents

- **Inscription facile** : entrez votre nom et inscrivez-vous à un poste
- **Temps réel** : visualisez les inscriptions des autres instantanément (Firebase)
- **Confirmation d'inscription** : popup de confirmation avant validation
- **Se désinscrire** : retirez-vous facilement (uniquement vos propres inscriptions)
- **Badge "C'est vous !"** : identifiez rapidement vos inscriptions

### 🔧 Pour les administrateurs

- **Gestion des matchs** : ajouter, modifier, supprimer
- **Configuration des postes** : modifier le nombre de bénévoles par poste
- **Gestion des inscriptions** : supprimer n'importe quel bénévole

### 🎨 Interface moderne

- Design responsive (mobile & desktop)
- Animation de célébration quand un match est complet
- Emojis pour chaque poste (🍺 Buvette, ⏱️ Chrono, 📋 Table de marque, 🍪 Goûter)
- Logo officiel du club

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
La configuration est définie dans `firebase.ts`.

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
├── App.tsx                 # Composant principal (Logique Firestore)
├── firebase.ts             # Configuration Firebase
├── components/
│   ├── Header.tsx          # En-tête avec logo SCBA
│   ├── GameCard.tsx        # Carte de match
│   ├── GameForm.tsx        # Formulaire ajout/édition match
│   ├── VolunteerSlot.tsx   # Gestion des inscriptions
│   ├── ConfirmModal.tsx    # Modal de confirmation
│   ├── AdminAuthModal.tsx  # Authentification admin
│   └── Icons.tsx           # Icônes SVG centralisées
├── hooks/
│   └── useLocalStorage.ts  # Persistance identité locale
├── public/
│   └── logo-scba.png       # Logo du club
├── styles.css              # Design system
├── constants.ts            # Données initiales
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
