# Changelog

## [1.3.0] - 2026-01-31

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
