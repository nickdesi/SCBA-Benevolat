# Directives & Règles du Projet SCBA Bénévolat

## 1. Source Unique de Vérité (API First & Zéro Inférence Client)
- **Règle absolue** : Ne **JAMAIS** tenter d'inférer, déduire ou extrapoler des données métier (ex: deviner le nom d'une ville depuis une chaîne de club comme `"OUEST LYONNAIS BASKET"` -> `"Lyonnais"`) côté client.
- L'API backend (`https://ffbb-api.desimone.fr` via `ffbb-data-client`) est la **source unique de vérité**.
- Si une donnée est incomplète ou manquante dans l'interface, la correction doit être apportée **à la source dans l'API backend**, et consommée telle quelle par le frontend `SCBA-Benevolat`.

## 2. Protocole de Résolution des Salles et Adresses FFBB
- Dans l'API FFBB (`ffbb-data-client`), `client.get_salle(s_id)` ne retourne que le `libelle` (nom) et l'`adresse` (rue). Les champs `codePostal` et `ville` sont absents de la table Directus des salles.
- La résolution complète (Nom, Rue, CodePostal VILLE) se fait obligatoirement en recoupant :
  1. La table des salles Directus (Nom, Rue).
  2. L'index Meilisearch officiel FFBB sur la cartographie de la salle (`cartographie_id = S-{salle_id}`) ou l'adresse.
  3. L'organisme hôte du match (`org.salle.commune` ou `org.commune`).

## 3. Efficacité et Action Directe (Anti-Bouclage)
- Dès qu'un diagnostic est posé et qu'une correction ciblée est validée par un test unitaire minimal :
  - **Appliquer immédiatement le correctif** sur les dépôts concernés.
  - Commiter, pousser et déployer.
  - Ne pas lancer de suites de tests globales lourdes et bloquantes sans nécessité.

## 4. Rigueur Temporelle
- Toujours utiliser la date système réelle fournie par l'environnement (nous sommes en **2026**). Ne jamais halluciner ou recopier aveuglément des années passées (`2024` ou `2025`).
