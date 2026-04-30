# Changelog

## [2.6.4] - 2026-04-30

### Performance

- Réduction des assets de polices générés en important les subsets latin Fontsource utilisés par l’application.
- Chargement différé des modales profil et authentification pour alléger le bundle initial.
- Montage conditionnel des vues planning et liste pour éviter le rendu de composants masqués.
- Optimisation des recherches de covoitureurs avec une `Map` mémoïsée dans la section covoiturage.

## [2.6.3] - 2026-04-30

### Corrigé

- Le pied de page n’affiche plus `dev` comme identifiant de build quand le hash Git local est disponible.
- L’identifiant de build utilise maintenant les variables CI, puis le hash Git local, puis un timestamp en dernier recours.

### Corrigé

- Rafraîchissement PWA renforcé pour appliquer les nouvelles versions sans vider manuellement le cache navigateur.
- Suppression de l’inscription redondante du service worker.

### Ajouté

- Affichage d’un identifiant de build dans le pied de page pour repérer immédiatement un bundle obsolète.

## [2.6.2] - 2026-04-30

### Corrigé

- Le pied de page n’affiche plus `dev` comme identifiant de build quand le hash Git local est disponible.
- L’identifiant de build utilise maintenant les variables CI, puis le hash Git local, puis un timestamp en dernier recours.

### Corrigé

- Rafraîchissement PWA renforcé pour appliquer les nouvelles versions sans vider manuellement le cache navigateur.
- Suppression de l’inscription redondante du service worker.

### Ajouté

- Affichage d’un identifiant de build dans le pied de page pour repérer immédiatement un bundle obsolète.

## [2.6.1] - 2026-04-30

### Security

- Ajout des scripts d'audit npm pour le frontend et les Cloud Functions.
- Correction des vulnérabilités critiques corrigeables sans downgrade cassant.
- Ajout de Dependabot pour surveiller les dépendances npm et GitHub Actions.

### CI

- Ajout d'un workflow GitHub Actions pour typecheck, tests, builds frontend/functions et audits.

### Accessibility

- Conversion des toasts cliquables en boutons focusables et utilisables au clavier.

---

## [2.6.0] - 2026-04-16

### Refactor

- **Logique Métier** : Centralisation complète de la logique de staffing, d'urgence et de tri dans `gameUtils.ts`.
- **GameCard / AdminStats** : Utilisation des helpers partagés pour une cohérence totale de l'affichage des manques.
- **Support Illimité** : Standardisation de la gestion des rôles à capacité infinie (ex: Goûter).
- **Tri Intelligent** : Déplacement de la logique de priorité des catégories d'équipes dans les utilitaires communs.

---

## [2.5.0] - 2026-04-08

### Fixed

- **Données Matchs** : Correction et vérification automatique des horaires de matchs via l'API FFBB.
- **Script de Résilience** : Ajout d'un outil robuste (`verify_match_times.py`) pour détecter et corriger les incohérences d'horaires, prenant en compte les catégories (U9 vs U11) et le statut Domicile/Extérieur.

## [2.4.2] - 2026-02-18

### Fixed

- **Données Matchs** : Correction et vérification automatique des horaires de matchs via l'API FFBB.
- **Script de Résilience** : Ajout d'un outil robuste (`verify_match_times.py`) pour détecter et corriger les incohérences d'horaires, prenant en compte les catégories (U9 vs U11) et le statut Domicile/Extérieur.
- **Documentation** : Ajout de la référence au projet [FFBB MCP Server](https://github.com/nickdesi/FFBB-MCP-Server).

## [2.4.1] - 2026-02-15

### Added

- **Avatar Proxy** : L'avatar de l'utilisateur connecté est automatiquement affiché pour tous les bénévoles qu'il inscrit (même avec un nom différent).

### Fixed

- **Performance** : Correction d'un crash (écran vide) lors du repli des cartes de match, causé par des listeners Firestore excessifs.

---

## [2.4.0] - 2026-02-15

### Added

- **Avatar Utilisateur** : Possibilité pour les bénévoles d'uploader une photo de profil personnalisée.
- **Support Stockage** : Intégration de Firebase Storage pour les avatars utilisateurs.

### Fixed

- **Dashboard Bénévole** : Restauration des sections "Historique" et "Covoiturage" qui avaient disparu.
- **Header Dashboard** : Correction des conflits de déclaration TypeScript.

---

## [2.3.5] - 2026-02-15

### Added

- **UI**: Compteur de matchs dans l'en-tête du calendrier Desktop (Total + Domicile/Exterieur).

### Changed

- **UX**: Amélioration de la lisibilité du header planning sur desktop.

## [2.3.4] - 2026-02-12

### Fixed

- **Inscriptions** : Correction critique de la gestion des IDs (string/number mismatch) qui empêchait l'affichage des bénévoles.
- **Affichage** : Les noms des bénévoles ne sont plus tronqués au prénom seul (affichage complet genre "Nico desi").
- **UX** : Le bouton de confirmation d'annulation affiche maintenant "Confirmer" au lieu de "Annuler" pour éviter la confusion.

### Changed

- Refonte complète de l'UI des `VolunteerSlot` avec une sheet modale pour l'inscription.
- Ajout de barres de progression visuelles pour le remplissage des équipes.

## [2.3.3] - 2026-02-04

### Added

- **UI**: Nouvelles icônes Emoji (🏠/✈️) pour le MatchTicker avec taille agrandie.

### Changed

- **Refactor**: Migration complète du code source vers le dossier `src/` standardisé.
- **Config**: Mise à jour des alias Vite et TypeScript.
- **Documentation**: Suppression des références obsolètes (Zustand).

## [2.3.2] - 2026-02-02

### Performance (v2.3.2)

- **Layout Stability (CLS)** : Réduction majeure du Cumulative Layout Shift (0.53 -> 0.18).
- **Grid Stack Pattern** : Implémentation d'une stratégie de superposition Grid pour éviter l'effondrement du layout pendant le chargement des données.

---

## [2.3.1] - 2026-02-01

### Corrigé (v2.3.1)

- **MobileTimeline** : Correction du bug d'affichage des matchs lors du changement de semaine (conflit d'animation résolu).

### Performance (v2.3.1)

- **Bundle Optimization** : Extraction des bibliothèques UI (Framer Motion, Lucide) dans un chunk dédié (`vendor-ui`), réduisant le script principal de 27% pour un chargement plus rapide.

---

## [2.3.0] - 2026-02-01

### ✨ Nouveautés (v2.3.0)

- **Système de Matching Covoiturage** :
  - **Demande de place** : Les passagers peuvent demander une place à un conducteur spécifique.
  - **Acceptation/Refus** : Les conducteurs peuvent accepter ou refuser les demandes reçues.
  - **Suggestions automatiques** : Affichage des conducteurs disponibles avec places restantes.
  - **Statuts visuels** : Badges de statut (En attente 🟡, Confirmé ✅, Disponible 🟢).
  - **Mise à jour temps réel** : Les places disponibles se mettent à jour automatiquement via Firestore.

- **UI/UX Covoiturage Premium** :
  - **Animations Framer Motion** : Transitions fluides et animations modernes.
  - **Icônes Lucide** : Remplacement des emojis par des icônes SVG professionnelles.
  - **Boutons en gradient** : Design moderne avec dégradés de couleurs.
  - **Feedback utilisateur** : Toasts de confirmation pour chaque action.

### ⚡ Technique (v2.3.0)

- **Modèle de données étendu** : Nouveaux champs `status`, `matchedWith`, `requestedDriverId` sur `CarpoolEntry`.
- **Hook `useCarpool.ts`** : Nouvelles fonctions `handleRequestSeat`, `handleAcceptPassenger`, `handleRejectPassenger`, `handleCancelRequest`.
- **Propagation des props** : Intégration complète à travers `App.tsx`, `GameCard`, `GameList`, `PlanningView`, `DesktopGrid`, `MobileTimeline`.

---

## [2.2.1] - 2026-01-27

### 🔧 Maintenance (v2.2.1)

- **Node.js** : Mise à jour des définitions de types (`@types/node`) pour correspondre au runtime LTS v24.

---

## [2.2.0] - 2026-01-27

### ⚡ Infrastructure (v2.2.0)

- **Node.js v24** : Migration du runtime vers la dernière version LTS (v24.13.0) pour de meilleures performances et sécurité.
- **Dépendances** : Mise à jour complète de toutes les librairies (`npm update`), aucune vulnérabilité détectée.
- **Sécurité** : Audit complet validé (SAST, Secrets, Firestore Rules).
- **Assets** : Conversion de `screenshot-hero.png` en WebP (Gain de perf).

---

## [2.0.1] - 2026-01-21

### 💎 UX & Accessibilité (v2.0.1)

- **Pull-to-Refresh Premium** : Remplacement du rechargement brut de la page par une simulation de synchronisation fluide (feedback toast + vibration haptique simulée).
- **Accessibilité (A11y)** : Ajout exhaustif de labels ARIA pour la navigation, les actions de calendrier et les filtres, rendant l'application plus inclusive.
- **Loading States** : Remplacement des écrans blancs par des spinners de chargement explicites lors de l'accès aux modales lourdes (Stats, Import).
- **Documentation** : Ajout des guides complets pour Bénévoles et Admin dans le dossier `/docs`.

---

## [2.0.0] - 2026-01-18

### 🚀 Major Release (v2.0.0)

Cette version marque une étape majeure dans l'évolution de l'application avec une refonte complète de l'expérience utilisateur ("UI/UX Pro Max") et l'introduction de fonctionnalités sociales clés.

#### ✨ Nouveautés

- **Système de Broadcast (Admin)** :
  - **Bannières d'urgence** : Diffusez des messages prioritaires (Info, Warning, Urgent) visibles par tous.
  - **Gestion Admin** : Interface dédiée pour créer, programmer et désactiver les annonces.
  - **Auto-dismiss** : Les utilisateurs peuvent masquer les annonces pour leur session.

- **Mon Espace Bénévole (Redesign)** :
  - **Dashboard Complet** : Vue unifiée avec statistiques personnelles, prochains matchs et historique.
  - **Cartes Intelligentes** : Affichage prioritaire de la "Prochaine Mission".
  - **Filtres Avancés** : Navigation par onglets (Missions, Historique, Messages).

- **Global App Polish (Round 1 & 2)** :
  - **Navigation Mobile** : Nouvelle barre de navigation glassmorphic avec animations fluides.
  - **Cartes Matchs** : Animations étagées ("staggered") à l'apparition pour un effet premium.
  - **Smart Navigation** : Bouton "Itinéraire" riche dans les cartes de matchs avec lien Waze/Maps direct.
  - **Layout Grid** : Passage d'un layout Masonry à une Grille CSS stricte pour un alignement parfait.
  - **Typographie** : Refonte de la hiérarchie visuelle (Titres "Sport", Badges "Néon").

#### ⚡ Performance & Technique

- **Scrollbar Liquid** : Nouvelle barre de défilement custom (fine et flottante) pour un look natif.
- **Optimisation Mobile** : Bundle size maintenu sous les 150kB malgré les nouvelles features.
- **Sécurité** : Règles Firestore strictes pour la collection `announcements` (Lecture publique, Écriture admin).

---

## [1.11.0] - 2026-01-17

### Design & UX (v1.11.0)

- **Restauration Header** : Retour au design "Pilule" centré, très apprécié des utilisateurs.
- **Bouton Bugün** : Le bouton "Aujourd'hui" est maintenant large, bleu et centré sur mobile, offrant une meilleure ergonomie.
- **Micro-interactions** : Ajout d'effets de scale et de transitions fluides sur la navigation.

---

## [1.10.5] - 2026-01-17

### Mobile & UX (v1.10.5)

- **Navigation Agrandie** : Flèches plus larges (padding augmenté) pour faciliter le tactile.
- **Bouton Aujourd'hui** : Texte forcé en visible sur mobile (ne se cache plus).

---

## [1.10.4] - 2026-01-17

### Design (v1.10.4)

- **Navigation Compacte** :
  - Suppression du bloc sombre massif dans le planning.
  - Titre et navigation intégrés directement sur le fond.
  - Bouton "Aujourd'hui" rapproché et aligné avec la navigation (gauche).
  - Gain de ~50px de hauteur pour le contenu.

---

## [1.10.3] - 2026-01-17

### Fonctionnalité (v1.10.3)

- **Covoiturage Intelligent** :
  - Nouveau système de badges de statut dans le header.
  - Affiche **"⚠️ X cherchent place"** (Orange) si manque de conducteurs.
  - Affiche **"🚗 Y places dispo"** (Vert) si places libres.
  - Affiche **"✅ Complet"** (Gris) si équilibré.

---

## [1.10.2] - 2026-01-17

### Performance (v1.10.2)

- **Polices** : Réduction du nombre de variantes chargées (16 -> 8). Poids réduit de 50%.
  - *Inter* : 400, 500, 600, 700
  - *Outfit* : 700, 900
  - *Oswald* : 500, 700

---

## [1.10.1] - 2026-01-17

### Visuel & Finitions (v1.10.1)

- **Badge COMPLET** : Style "Néon" flashy (Teal/Emerald) pour meilleure distinction
- **Filigranes** : Visibilité améliorée en Dark Mode (opacité/contraste)
- **Layout** : Centrage grille Desktop & Correction overlay bordures (z-index)

---

## [1.10.0] - 2026-01-17

### Amélioré (v1.10.0)

- **Dark mode** : Correction des couleurs dans ConfirmModal, Footer, AdminStats
- **Filigranes cartes** : 🏠 (domicile) et ✈️ (extérieur) remplacent les anciens
- **Badge matchs** : Centrage vertical corrigé dans MobileTimeline

### Supprimé (v1.10.0)

- **PlanningGameCard.tsx** : Composant inutilisé (code mort)

---

## [1.9.9] - 2026-01-17

### Amélioré (v1.9.9)

- **React 18 Concurrent** : Utilisation de `startTransition` pour les changements de vue non-bloquants.

---

## [1.9.8] - 2026-01-17

### Amélioré (v1.9.8)

- **Performance "Snappy"** :
  - Animations CSS réduites (300-500ms → 100-200ms).
  - Transitions Tailwind optimisées (`duration-150`).
  - Composants memoizés (PlanningView, MobileTimeline, DesktopGrid).
  - Vues toujours montées avec CSS `hidden` au lieu de remount.
  - Suppression des animations staggered au changement de vue.

---

## [1.9.7] - 2026-01-17

### Amélioré (v1.9.7)

- **Navigation Mobile** :
  - Vue calendrier/semaine par défaut (au lieu de la liste).
  - Bouton navigation renommé "📋 Liste" / "📅 Semaine" (plus clair que "Planning").
  - Matchs passés (heure dépassée) masqués automatiquement.

### Corrigé (v1.9.7)

- **Bug fuseau horaire** : Correction du bouton "Aujourd'hui" qui affichait parfois le mauvais jour (UTC vs heure locale).

---

## [1.9.6] - 2026-01-16

### Amélioré (v1.9.6)

- **UI** : Badge "Complet" style célébration avec gradient vert vif, texte blanc, et animation "shine" pour les matchs entièrement pourvus.

---

## [1.9.5] - 2026-01-16

### Amélioré (v1.9.5)

- **Dashboard Admin** : Refonte complète avec :
  - Section "Urgences" pour les matchs < 48h non complets (badge countdown "Dans Xh").
  - Filtres rapides : "Tous", "🚨 Urgents", "⚠️ Incomplets".
  - Détail des rôles manquants par match ("Manque: Buvette, Chrono").
  - Tri intelligent : urgents en premier, puis par taux de remplissage.

---

## [1.9.4] - 2026-01-09

### Amélioré (v1.9.4)

- **UI** : Le compteur de bénévoles affiche désormais les postes pourvus réels (limités à la capacité) pour mieux mettre en évidence les manques (ex: "7/6" devient "4/6" si un poste est vide mais les autres sont en surplus).

---

## [1.9.3] - 2026-01-09

### Ajouté (v1.9.3)

- **SEO** : Intégration de Google Analytics et génération du sitemap.xml.

---

## [1.9.2] - 2026-01-09

### Corrigé (v1.9.2)

- **Calendrier Mobile** : Correction de l'affichage de la date qui s'affichait sur plusieurs lignes.

---

## [1.9.1] - 2026-01-09

### Corrigé (v1.9.1)

- **Mode Sombre** : Correction du bug affichant un fond blanc en mode sombre via `AppLayout`.

---

## [1.9.0] - 2026-01-09

### Ajouté (v1.9.0)

- **UI/UX Premium** :
  - **Drag-to-Scroll Desktop** : Navigation fluide à la souris sur les filtres d'équipes (curseur grab/grabbing).
  - **Indicateur Urgence** : Badge rouge pulsant pour les matchs à < 24h avec rôles incomplets.
  - **Tri Intelligent** : Ordre des équipes par catégorie (U9 -> Senior) par défaut.
  - **Interface** : Correction du cropping sur le bouton "Tous les matchs" et padding ajusté.

### Modifié (v1.9.0)

- **Architecture (Refactoring)** :
  - `GameCard` scindé en sous-composants (`GameHeader`, `VolunteerSection`, `ActionButtons`).
  - `AppLayout` extrait pour alléger `App.tsx`.
  - Logique de filtrage extraite dans le hook personnalisé `useGameFilters`.
  - Suppression de la redondance du bouton "Trajet" (fusionné avec le lien lieu).

---

## [1.8.0] - 2026-01-04

### Ajouté (v1.8.0)

- **Workflows Automatisés (.agent)** :
  - `release-manager` : Automatisation des versions, build et changelog.
  - `performance-audit` : Vérification de la taille du bundle et des métriques web.
  - `debugging-workflow`, `setup-check`, `parallel-orchestrator` : Nouveaux outils pour l'agent.
- **Mobile UX** :
  - **Indicateur de Scroll** : Effet de masque dégradé sur la droite de la barre de filtres Team pour indiquer qu'elle est défilable.
  - **Admin Toolbar** : Nouvelle barre d'outils unifiée et glassmorphic pour les administrateurs (au lieu de boutons épars).
- **MatchTicker Optimisé** :
  - Intégration de `react-fast-marquee`.
  - Vitesse constante (40px/s) quel que soit nombre de matchs.
  - Support amélioré pour le mode "Reduced Motion" (Brave/iOS) tout en garantissant l'affichage des infos.

### Modifié (v1.8.0)

- **Nettoyage Codebase** :
  - Suppression de la feature "Import par URL" (obsolète/instable).
  - Suppression des fichiers morts (`ffbbImport.ts`).
  - Refactoring de `csvImport.ts` pour utiliser `dateUtils.ts` (DRY).
  - Organisation propre du dossier `.agent/workflows`.

---

## [1.7.0] - 2026-01-03

### Ajouté (v1.7.0)

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

### Modifié (v1.7.0)

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

### Ajouté (v1.6.0)

- **ConfirmModal** : Remplacement des `window.confirm` natifs par une modale de confirmation personnalisée et cohérente avec le design system (notamment pour la suppression de covoiturage).
- **Badge de Version** : Ajout du badge de version dans le README.

### Modifié (v1.6.0)

- **Refactoring Majeur** : Découpage du hook `useGames.ts` pour une meilleure maintenabilité :
  - `useVolunteers.ts` : Logique des bénévoles.
  - `useCarpool.ts` : Logique du covoiturage.
- **Expérience Utilisateur** : Suppression du "flicker" (fermeture immédiate) sur les modales de connexion via `stopPropagation`.

### Corrigé (v1.6.0)

- **Crash Édition** : Fix du crash lors de l'ouverture du formulaire d'édition (Règles des Hooks React).
- **Prop Drilling** : La suppression de covoiturage fonctionne désormais correctement depuis le profil utilisateur.

---

## [1.5.1] - 2025-01-01

### Ajouté (v1.5.1)

- **Mode Sombre (Dark Mode)** :
  - Toggle Soleil/Lune dans le Header.
  - Persiste la préférence utilisateur dans `localStorage`.
  - Détection automatique de la préférence système.
  - Adaptation complète de tous les composants (`GameCard`, `VolunteerSlot`, `CarpoolingSection`).

- **Distinction Visuelle Domicile/Extérieur** :
  - Headers de cartes avec fonds colorés distincts (vert émeraude pour Domicile, bleu pour Extérieur).
  - Icônes watermark décoratives (🏟️ / 🚌) pour reconnaissance instantanée.
  - Badges colorés et texte complet ("Domicile" / "Extérieur").

### Corrigé (v1.5.1)

- **Bug Accordéon Desktop** : Correction du bug où l'expansion d'une carte créait un espace vide sur les cartes adjacentes. Passage de CSS Grid à CSS Columns (layout masonry) pour des cartes visuellement indépendantes.

---

## [1.5.0] - 2024-12-31

### Ajouté (v1.5.0)

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

### Modifié (v1.5.0)

- **Performance** : Utilisation de `React.lazy` pour le Dashboard Admin.
- **Architecture** : Centralisation de la logique de notification.

---

### Ajouté (v1.4.0) — Transactions & Mobile Nav

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

### Modifié (v1.4.0)

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

### Corrigé (v1.4.0)

- Suppression de la redondance "Planning" / "Mon Espace Bénévole" sur mobile.
- Le bouton Admin n'apparaît plus inutilement pour les utilisateurs non-admin.

---

## [1.3.0] - 2024-12-27

### Ajouté (v1.3.0) — Profil & Auth

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

### Modifié (v1.3.0)

- **Interface Utilisateur** :
  - Refonte du Header pour inclure le menu utilisateur.
  - Correction des problèmes de superposition (z-index) entre le menu et la barre de filtre.
  - Amélioration de `VolunteerSlot` pour valider l'identité côté client (Guest vs Auth).
- **Architecture** :
  - `ProfileModal` vérifie désormais en temps réel la validité des inscriptions par rapport à la feuille de match publique.

### Corrigé (v1.3.0)

- Bug où le menu utilisateur était masqué par la barre de filtres (fix z-index layout).
- Faille logique où un utilisateur connecté pouvait supprimer une inscription faite en tant qu'invité (ou par un autre compte) si le nom correspondait.
