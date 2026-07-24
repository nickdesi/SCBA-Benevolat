# Instructions pour tous les Agents IA (Jules, Bolt, Copilot, Antigravity)

## 1. Règle d'or de formatage & style
- **TOUJOURS** exécuter `npm run format` (ou `npx prettier --write <fichiers_modifiés>`) avant de commiter.
- **NE JAMAIS** altérer le formatage Prettier existant sur les types TypeScript ou les imports.
- Ne re-formater **que** les lignes modifiées. Ne pas toucher au style des fichiers adjacents.

## 2. Validation obligatoire avant commit
Avant de commiter la moindre Pull Request ou modification, exécuter la chaîne de vérification locale :
```bash
npm run format && npx eslint . && npm run typecheck
```
Si l'une de ces commandes échoue, **corriger l'erreur avant de pousser**.

## 3. Gestion des dépendances & Lockfile
- **NE JAMAIS** exécuter `npm audit fix` ou `npm update` directement car cela supprime les dépendances optionnelles Linux (`@tailwindcss/oxide-linux-x64-*`) du `package-lock.json` et casse le CI sur GitHub Actions.
- Préférer `npm ci` pour les installations.

## 4. Simplicité & Modifications Chirurgicales
- Implémenter le minimum de code nécessaire. Pas de refactoring spéculatif.
- Conserver les règles de performance archivées dans `.jules/bolt.md`.
