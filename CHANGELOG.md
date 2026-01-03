# Changelog

## [1.7.0] - 2026-01-03

### Ajouté

- **Animations Premium CSS** :
  - `animate-scale-in` pour les modales (effet popup élastique).
  - `animate-slide-up` pour les toasts et bottom sheets.
  - `backdrop-blur-premium` combinant blur, saturate et brightness.
  - Utilitaires `shadow-glow-*` pour effets de lueur colorés.
  - Classe `bg-noise` pour texture grain premium sur les fonds.
  - Classe `card-interactive` pour hover unifié.

- **Support Dark Mode Amélioré** :
  - `BottomNav` : glassmorphism adapté au dark mode.
  - `ProfileModal` : couleurs dark mode cohérentes.

### Modifié

- **Refactoring Hooks (Best Practices React 19)** :
  - `useVolunteers.ts` : ajout interface `UseVolunteersReturn`, gestion d'erreurs structurée.
  - `useCarpool.ts` : ajout interface `UseCarpoolReturn`, utilisation d'`Error` au lieu de `string`, logging structuré.

- **Composants Modernisés** :
  - `Header.tsx` : texture noise, animation hover logo (scale 105%).
  - `GameCard.tsx` : effet hover `scale[1.01]` + ombre prononcée.
  - `BottomNav.tsx` : glassmorphism premium avec `backdrop-blur-premium`.
  - `ProfileModal.tsx` : animation `animate-scale-in`, backdrop premium.

---

## [1.6.0] - 2026-01-01

### Ajouté

- **ConfirmModal** : Remplacement des `window.confirm` natifs par une modale de confirmation personnalisée et cohérente avec le design system (notamment pour la suppression de covoiturage).
- **Badge de Version** : Ajout du badge de version dans le README.

### Modifié

- **Refactoring Majeur** : Découpage du hook `useGames.ts` pour une meilleure maintenabilité :
  - `useVolunteers.ts` : Logique des bénévoles.
  - `useCarpool.ts` : Logique du covoiturage.
- **Expérience Utilisateur** : Suppression du "flicker" (fermeture immédiate) sur les modales de connexion via `stopPropagation`.

### Corrigé

- **Crash Édition** : Fix du crash lors de l'ouverture du formulaire d'édition (Règles des Hooks React).
- **Prop Drilling** : La suppression de covoiturage fonctionne désormais correctement depuis le profil utilisateur.

---

## [1.5.1] - 2025-01-01

### Ajouté

- **Mode Sombre (Dark Mode)** :
  - Toggle Soleil/Lune dans le Header.
  - Persiste la préférence utilisateur dans `localStorage`.
  - Détection automatique de la préférence système.
  - Adaptation complète de tous les composants (`GameCard`, `VolunteerSlot`, `CarpoolingSection`).

- **Distinction Visuelle Domicile/Extérieur** :
  - Headers de cartes avec fonds colorés distincts (vert émeraude pour Domicile, bleu pour Extérieur).
  - Icônes watermark décoratives (🏟️ / 🚌) pour reconnaissance instantanée.
  - Badges colorés et texte complet ("Domicile" / "Extérieur").

### Corrigé

- **Bug Accordéon Desktop** : Correction du bug où l'expansion d'une carte créait un espace vide sur les cartes adjacentes. Passage de CSS Grid à CSS Columns (layout masonry) pour des cartes visuellement indépendantes.

---

## [1.5.0] - 2024-12-31

### Ajouté

- **Tableau de Bord Admin** :
  - Nouvelle vue statistique pour visualiser le taux de remplissage global des matchs à domicile.
  - Indicateurs visuels (codes couleurs) pour identifier les besoins urgents en bénévoles.
- **Système de Notifications PWA** :
  - Support des notifications natives via le navigateur.
  - Interface d'activation dans "Mon Espace Bénévole".
  - Rappels programmables pour les missions de bénévolat.
- **Optimisation SEO Événementielle** :
  - Génération automatique de données structurées JSON-LD (SportsEvent).
  - Amélioration du référencement des matchs dans Google Search.

### Modifié

- **Performance** : Utilisation de `React.lazy` pour le Dashboard Admin.
- **Architecture** : Centralisation de la logique de notification.

---

### Ajouté

- **Transactions Firestore Atomiques** :
  - `handleVolunteer`, `handleRemoveVolunteer`, `handleUpdateVolunteer` utilisent maintenant `runTransaction`.
  - `handleAddCarpool`, `handleRemoveCarpool` également transactionnels.
  - Garantit la cohérence entre la feuille de match publique et les registrations utilisateur.
- **Navigation Mobile Améliorée** :
  - Bouton "Planning" dans `BottomNav` ouvre directement `ProfileModal` ("Mon Espace Bénévole").
  - Élimine la redondance entre l'onglet Planning et le menu profil.
- **Bouton Admin Conditionnel** :
  - Le bouton Admin dans `BottomNav` n'apparaît que si l'utilisateur est administrateur.
  - UX simplifiée pour les utilisateurs normaux.

### Modifié

- **useGames Hook** :
  - Retourne `userRegistrations` (array) ET `userRegistrationsMap` (Map pour lookups O(1)).
  - Utilise `useMemo` pour dériver la Map efficacement.
- **ProfileModal** :
  - Reçoit maintenant ses données via props (`registrations`, `games`) au lieu de fetcher.
  - Vérification de validité en temps réel contre la liste des matchs passée en props.
  - Géré par `App.tsx` pour permettre l'ouverture depuis `BottomNav`.
- **BottomNav** :
  - Props ajoutées : `onPlanningClick`, `isAuthenticated`.
  - Bouton Planning visible uniquement si authentifié.
- **Architecture** :
  - `App.tsx` gère maintenant `currentUser` et `isProfileModalOpen` pour la navigation mobile.

### Corrigé

- Suppression de la redondance "Planning" / "Mon Espace Bénévole" sur mobile.
- Le bouton Admin n'apparaît plus inutilement pour les utilisateurs non-admin.

---

## [1.3.0] - 2024-12-27

### Ajouté

- **Gestion de Profil Bénévole** :
  - Nouvelle modale "Mon Espace Bénévole" accessible via l'avatar utilisateur.
  - Liste des inscriptions personnelles triées par date.
  - Indication visuelle des inscriptions invalides ou expirées (⚠️).
  - Suppression sécurisée des inscriptions :
    - Annulation réelle pour les inscriptions actives.
    - Nettoyage d'historique pour les inscriptions orphelines.
- **Authentification Utilisateur** :
  - Inscription et Connexion via Email/Mot de passe.
  - Support de Google Sign-In.
  - Persistance de l'identité via Firebase Auth.
- **Logique Hybride d'Identité** :
  - Les **Invités** utilisent le `localStorage` pour suivre leurs inscriptions.
  - Les **Utilisateurs Connectés** utilisent leur profil Cloud Firestore.
  - Séparation stricte pour éviter qu'un utilisateur connecté ne modifie les inscriptions d'un autre.

### Modifié

- **Interface Utilisateur** :
  - Refonte du Header pour inclure le menu utilisateur.
  - Correction des problèmes de superposition (z-index) entre le menu et la barre de filtre.
  - Amélioration de `VolunteerSlot` pour valider l'identité côté client (Guest vs Auth).
- **Architecture** :
  - `ProfileModal` vérifie désormais en temps réel la validité des inscriptions par rapport à la feuille de match publique.

### Corrigé

- Bug où le menu utilisateur était masqué par la barre de filtres (fix z-index layout).
- Faille logique où un utilisateur connecté pouvait supprimer une inscription faite en tant qu'invité (ou par un autre compte) si le nom correspondait.
