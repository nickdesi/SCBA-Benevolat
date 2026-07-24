# AI Agent Instructions for SCBA Bénévolat

Ces principes doivent être suivis par tout agent travaillant sur ce projet pour garantir simplicité et maintenabilité.

## 1. Think Before Coding
- Énoncer explicitement les hypothèses et les interprétations multiples en cas d'ambiguïté.
- Demander une clarification au lieu de deviner.
- Questionner les demandes qui semblent inutilement complexes.

## 2. Simplicity First
- Implémenter le minimum de code nécessaire.
- Pas d'abstractions prématurées ou de fonctionnalités spéculatives.
- Si une solution simple en 50 lignes existe, ne pas en écrire 200.

## 3. Surgical Changes
- Ne modifier **que** ce qui est nécessaire pour remplir l'objectif.
- Respecter le style de code existant.
- Ne pas refactoriser du code adjacent qui n'est pas "cassé" ou lié à la tâche.
- Supprimer uniquement le code mort généré par vos propres modifications (ou explicitement demandé).

## 4. Goal-Driven Execution
- Modifier uniquement ce qui est demandé, mais le faire de bout en bout.
- Valider systématiquement par un build (`npm run build`) ou des tests.

## 5. Rigueur Temporelle (Dates et Journaux d'apprentissage)
- **Vérifier l'année réelle** : Lors de la rédaction de notes d'apprentissage (comme dans `.jules/bolt.md`), de commits ou de documentation, **ne jamais présumer de l'année en cours (ne pas copier/coller aveuglément les années des lignes précédentes, ex: 2024)**.
- **Requêter le système** : Toujours utiliser la date système réelle fournie dans les métadonnées de session ou via une commande de type `date` pour garantir que les logs correspondent précisément aux dates réelles des commits de 2026.

## 6. Formatting & Lockfile Rules
- **Toujours** exécuter `npm run format` avant de commiter des fichiers `.ts`, `.tsx` ou `.css`.
- **Ne JAMAIS commiter** un `package-lock.json` modifié par `npm audit fix` sans valider d'abord avec `npm ci` sur une machine linux ou dans le CI.
- **Ne JAMAIS** exécuter `npm install` ou `npm update` sans que cela soit explicitement demandé. Utiliser `npm ci` pour les installations reproductibles.
- **Après chaque modification de code**, vérifier localement : `npm run format && npx eslint . && npm run typecheck`.

---

> [!NOTE]
> Ces règles s'ajoutent au protocole ZipAI global.
