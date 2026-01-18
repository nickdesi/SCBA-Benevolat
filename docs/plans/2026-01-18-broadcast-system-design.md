# Design : Système d'Annonces (Broadcast)

## Section 1 : Modèle de Données & Architecture

Cette section définit comment les annonces seront stockées et récupérées.

### 1.1 Firestore Schema

Nous allons créer une nouvelle collection racine `announcements`.

**Document Structure (`announcements/{announcementId}`) :**

```typescript
interface Announcement {
  id: string;
  type: 'info' | 'warning' | 'urgent'; // Détermine la couleur/style
  message: string; // Le contenu, support Markdown basique si besoin
  active: boolean; // Soft delete / switch on-off rapide
  expiresAt: Timestamp; // DATE D'EXPIRATION (Requis)
  createdAt: Timestamp;
  createdBy: string; // User ID de l'admin
  target?: 'all' | 'volunteers' | 'admins'; // (Optionnel pour le futur, default 'all')
}
```

### 1.2 Règles de Sécurité

* **Lecture** : Publique (`allow read: if true;`) ou Authentifiée (`allow read: if request.auth != null;`). *Recommandation : Publique pour que même les invités voient les alertes urgentes.*
* **Écriture** : Réservée aux Admins (`allow write: if isUserAdmin();`).

### 1.3 Index & Requêtes

Le client fera une requête simple pour récupérer les annonces actives :

```typescript
// Récupérer les annonces qui ne sont pas expirées
query(
  collection(db, 'announcements'),
  where('active', '==', true),
  where('expiresAt', '>', Timestamp.now()),
  orderBy('expiresAt', 'asc') // Les urgences qui expirent bientôt en premier ? ou 'createdAt' ?
);
```

> **À Valider :** Le tri par défaut. Préférez-vous voir en premier les messages les plus récents (`createdAt desc`) ou ceux qui expirent bientôt ?
> *Hypothèse retenue : Tri par Priorité (Urgent > Warning > Info) puis par Date (Plus récent).*

## Section 2 : Composants UI

### 2.1 Côté Bénévole : `<AnnouncementBanner />`

Un composant global inséré dans `AppLayout.tsx` (juste sous la Navbar).

* **Comportement** : Écoute en temps réel la collection `announcements`.
* **Affichage** :
  * **Info** : `bg-blue-500` (ou variante premium glassmorphism). Icône `Info`.
  * **Warning** : `bg-orange-500`. Icône `AlertTriangle`.
  * **Urgent** :
    * Bandeau `bg-red-600` animate-pulse.
    * **ET** déclenche l'ouverture automatique d'une `<CriticalInfoModal />` si c'est la première fois qu'on la voit (optionnel pour v2, restons simple pour v1).
* **Tech** : Utilise `useAnnouncementStore` (Zustand ou simple Hook) pour éviter le re-render de toute l'App.

### 2.2 Côté Admin : `<AdminBroadcastPanel />`

Un nouvel onglet dans le Dashboard Admin existant.

* **Liste** : Tableau des annonces actives (avec badge "Active" / "Expirée").
* **Actions** :
  * Créer (Formulaire simple : Message, Type, Expiration).
  * Supprimer (Soft delete `active: false`).
* **UX** : "Live Preview" du bandeau pendant qu'on tape le message (pour éviter les typos en prod).

### 2.3 Intégration

* Fichier : `components/layout/AnnouncementBanner.tsx`
* Fichier : `components/admin/AdminBroadcastPanel.tsx`
* Modification : `App.tsx` ou `AppLayout.tsx` pour inclure le banner.

## Section 3 : Cas Limites & Sécurité

### 3.1 Mode Hors-Ligne

* Firestore gère le cache offline par défaut.
* **Risque** : Une annonce "Urgent" supprimée par l'admin reste visible si le bénévole passe hors ligne.
* **Mitigation** : Acceptable pour V1. Le TTL (`expiresAt`) fera le nettoyage final.

### 3.2 Sécurité

* Un bénévole malin ne doit pas pouvoir spammer les autres.
* Règle Firestore stricte : `allow create, update, delete: if isUserAdmin()`.

## Section 4 : Plan d'Implémentation (Transition)

Si ce design est validé, voici les prochaines étapes concrètes :

1. **Backend** : Créer `announcements` collection + règles de sécu.
2. **Admin** : Implémenter le panneau de création (Dashboard).
3. **Client** : Implémenter le Banner dans le Layout.
4. **Test** :
    * Créer une annonce "Warning" -> Vérifier qu'elle apparaît en Orange.
    * Changer de compte (non-admin) -> Vérifier qu'on ne peut pas écrire.
