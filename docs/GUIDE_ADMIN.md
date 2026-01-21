# 🛡️ Guide Administrateur - SCBA Bénévoles

Ce guide est réservé aux administrateurs du club pour la gestion des matchs et des bénévoles.

## 🔑 Accès Administrateur

Pour accéder aux fonctionnalités d'administration :

1. Connectez-vous avec le compte Google officiel : **`admin@votre-club.com`**.
2. Une fois connecté, une **barre d'outils Admin** apparaît en haut à droite (boutons "Ajouter match", "Import CSV", "Stats").

---

## 🏀 Gestion des Matchs

### Ajouter un match manuellement

1. Cliquez sur le bouton **"+ Ajouter"** (ou l'icône plus).
2. Remplissez le formulaire :
   - **Équipe :** Catégorie (ex: U11F).
   - **Adversaire :** Nom de l'équipe adverse.
   - **Lieu :** Gymnase (important pour le lien Waze).
   - **Date et Heure.**
   - **Type :** Domicile ou Extérieur (change les fonctionnalités Bénévoles vs Covoiturage).
3. Validez.

### Modifier ou Supprimer un match

1. Sur la carte du match, cliquez sur l'icône **Crayon** (Modifier) ou **Poubelle** (Supprimer) en haut à droite.
2. **Attention :** La suppression est définitive et supprime aussi toutes les inscriptions associées.

### Import Massif (CSV)

Pour gagner du temps en début de saison :

1. Préparez un fichier CSV avec les colonnes : `Date`, `Heure`, `Equipe`, `Adversaire`, `Lieu`.
2. Cliquez sur le bouton **"Import CSV"**.
3. Chargez votre fichier et validez.

---

## 👥 Gestion des Bénévoles

En tant qu'admin, vous avez le contrôle total sur les inscriptions :

### Désinscrire un bénévole

Si un bénévole ne peut pas venir et ne s'est pas désinscrit :

1. Ouvrez le match concerné.
2. Trouvez le nom du bénévole dans la liste.
3. Cliquez sur la **croix rouge (❌)** ou la corbeille à côté de son nom pour le retirer.

### Communications (Annonces)

L'application nettoie automatiquement les annonces expirées. Pour en créer une (fonctionnalité à venir via console Firebase ou app), définissez une date d'expiration pour qu'elle disparaisse automatiquement.

---

## 📊 Statistiques

Cliquez sur le bouton **"Stats"** (icône graphique) dans le header pour voir :

- **Top Bénévoles :** Qui s'investit le plus ?
- **Taux de remplissage :** Pourcentage de postes pourvus par équipe/catégorie.
- **Export :** Possibilité d'exporter ces données pour les AG du club.

---

## 🛠️ Dépannage Technique

- **Problème de cache :** Si un utilisateur ne voit pas les dernières mises à jour, conseillez-lui de "Tirer pour rafraîchir" (Pull-to-refresh) sur la page d'accueil.
- **Erreur "Permission denied" :** Vérifiez que vous êtes bien connecté avec le compte `admin@votre-club.com`.
