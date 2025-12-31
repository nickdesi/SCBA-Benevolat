# Changelog

## [1.4.0] - 2024-12-31

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
