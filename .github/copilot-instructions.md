# RTK — Token-Optimized CLI

**rtk** is a CLI proxy that filters and compresses command outputs, saving 60-90% tokens.

## Rule

Always prefix shell commands with `rtk`:

```bash
# Instead of:              Use:
git status                 rtk git status
git log -10                rtk git log -10
cargo test                 rtk cargo test
docker ps                  rtk docker ps
kubectl get pods           rtk kubectl pods
```

## Meta commands (use directly)

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk proxy <cmd>       # Run raw (no filtering) but track usage
```

Note: use `rtk discover` only when a Claude Code projects directory exists; otherwise it is not relevant in VS Code/Copilot.

---

# 📅 Rigueur Temporelle (Dates & Journaux d'apprentissage)

Tout agent IA (Copilot, Cursor, Jules/Bolt, Claude) travaillant sur ce dépôt doit obligatoirement respecter la règle suivante :

1. **Ne pas assumer ou halluciner l'année en cours** : Ne pas copier/coller aveuglément les années des entrées précédentes (comme `2024` ou `2025`).
2. **Utiliser la date système réelle** : Toujours exécuter une commande système (`date` ou équivalent) ou lire les métadonnées réelles fournies dans le prompt de session pour obtenir l'année en cours (nous sommes en **2026**).
3. **Correspondance des journaux** : S'assurer que les dates écrites dans `.jules/bolt.md` ou tout autre journal correspondent exactement à la date réelle de création du commit ou de la PR en cours.

