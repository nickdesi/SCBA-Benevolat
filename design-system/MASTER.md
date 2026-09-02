# SCBA Bénévoles — Design System MASTER
> Version 1.0 · Branche `feat/ux-refonte-mobile-premium`
> Source de vérité unique. Toute décision de style est ici.

---

## 1. Philosophie & Accessibilité Universelle (Apple HIG + Material Design 3)

L'interface SCBA Bénévoles est un **outil utilitaire sportif**, pas une landing page marketing.
Chaque élément visuel doit répondre à une question simple : **"Est-ce que ça aide le bénévole à prendre une décision en moins de 3 secondes ?"**

### 📐 Normes d'Accessibilité Obligatoires (Apple HIG iOS & Google M3 Android) :
1. **Touch Targets (Cibles tactiles minimales)** :
   - Minimum **44×44 pt** (Apple) et **48×48 dp** (Google).
   - Tout élément cliquable (boutons de filtre, bottom nav, triggers, avatars) doit respecter `min-h-[44px]`.
2. **Seuil de Lisibilité Typographique** :
   - **Interdiction formelle des polices microscopiques** (`text-[10px]`, `text-[9px]`).
   - Seuil minimum fixé à **`text-xs` (12px minimum)** avec graisse `font-bold`/`font-black` pour les métadonnées.
3. **Arbre Sémantique & Lecteurs d'écran** :
   - Déclarer `role="tablist"`, `role="tab"`, `aria-selected`, `aria-label` sur toutes les navigations par onglets.
   - Déclarer `role="menu"`, `role="menuitem"`, `aria-haspopup="menu"`, `aria-expanded` sur les menus.
   - `aria-hidden="true"` obligatoire sur toutes les icônes décoratives.
4. **Ordre Sportif FFBB** :
   - Hôte (qui reçoit) toujours à gauche en 1ère position, Visiteur à droite.
5. **Scroll Reset SPA** :
   - `window.scrollTo({ top: 0, left: 0, behavior: 'instant' })` obligatoire lors de tout basculement de vue principale.

**Anti-patterns à ne jamais introduire :**
- Glassmorphisme excessif (backdrop-blur sur tout)
- Gradients décoratifs sur des zones de contenu texte
- Cartes purement décoratives sans action associée
- Couleurs sans label/icône pour communiquer un statut
- Boutons trop arrondis (`rounded-full`) sur les CTAs principaux

---

## 2. Palette de couleurs

Basée sur l'identité SCBA existante. **Ne pas changer les valeurs hex.**

### Couleurs de marque

```css
/* Déjà dans styles.css :root — NE PAS DUPLIQUER */
--primary-500: #3629e1;   /* Bleu électrique SCBA — action principale */
--primary-600: #2a21b4;   /* Hover état primaire */
--primary-700: #272890;   /* Profond / header / fonds sombres */
--accent-orange: #aa2e0f; /* Rouge brique ballon — urgence, accent */
--accent-amber:  #c2988f; /* Beige rosé — neutre secondaire */
```

### Couleurs sémantiques de statut

**Règle absolue : jamais de couleur seule. Toujours couleur + icône + label.**

| Statut | Token CSS / Classe TW | Icône (Lucide) | Label affiché |
|---|---|---|---|
| Poste libre | `emerald-500` | `Circle` (outline) | "X places libres" |
| Presque complet (1 poste restant) | `amber-500` | `AlertTriangle` | "Presque complet" |
| Complet / couvert | `emerald-600` | `CheckCircle` | "Équipe au complet" |
| Urgent (< 48h, postes vides) | `red-500` pulsant | `Flame` | "Urgent : X postes" |
| Mon engagement (inscrit) | `--primary-500` (#3629e1) | `Check` (bold) | "Mon engagement" |
| Extérieur / Covoiturage | `blue-500` | `Car` | "Extérieur" |
| Domicile | `emerald-500` | `Home` | "Domicile" |
| Coupe / Compétition spéciale | `amber-500` | `Trophy` | Nom compétition |

### Couleurs de fond et surface

```css
/* Light mode */
--bg-page:   #e8ecef;     /* Fond de page — ne pas utiliser de blanc pur */
--bg-card:   rgba(255,255,255,0.95); /* Surface carte */
--bg-input:  #ffffff;

/* Dark mode */
--bg-page:   #0b1320;
--bg-card:   #0f172a;
```

### Couleurs de texte

```css
/* Light */
--text-primary:   #0f172a;  /* Titres, valeurs importantes */
--text-secondary: #334155;  /* Corps de texte */
--text-muted:     #475569;  /* Labels secondaires (était #52637a — corrigé pour AA) */

/* Dark */
--text-primary:   #f8fafc;
--text-secondary: #cbd5e1;
--text-muted:     #94a3b8;
```

> **Correction P1** : `--text-muted` passe de `#52637a` à `#475569` (slate-600) pour atteindre 4.5:1 sur fond `#e8ecef`.

### Couleurs de bordure

```css
--border-color:       #d9e1e8;  /* Bordures standard */
--border-color-light: #edf1f5;  /* Séparateurs légers */
```

---

## 3. Typographie

### Familles de polices

| Usage | Police | Fallback | Classe TW |
|---|---|---|---|
| Titres sportifs (équipes, scores) | Oswald | Oswald Fallback, Arial Narrow | `font-sport` |
| Corps, headings UI | Outfit | Outfit Fallback, system-ui | (défaut body) |
| Données, labels | Inter | Inter Fallback, -apple-system | (implicite) |

### Échelle typographique mobile

| Usage | Taille mobile | Taille xs (390px+) | Poids |
|---|---|---|---|
| Nom équipe SCBA (h2) | `text-xl` (20px) | `text-2xl` (24px) | `font-black` |
| Nom adversaire (h3) | `text-sm` (14px) | `text-base` (16px) | `font-bold` |
| Date (condensée) | `text-xs` (12px) | `text-sm` (14px) | `font-semibold` |
| Heure | `text-sm` (14px) | `text-base` (16px) | `font-black` |
| Lieu | `text-xs` (12px) | `text-xs` (12px) | `font-medium` |
| Rôle (slot bénévole) | `text-sm` (14px) | `text-sm` (14px) | `font-semibold` |
| Badge / label statut | `text-[11px]` | `text-xs` (12px) | `font-bold uppercase` |
| Caption / metadata | `text-xs` (12px) | `text-xs` | `font-medium` |
| Header titre (abrégé) | `text-sm` (14px) | `text-lg` (18px) | `font-black` |

---

## 4. Espacement (grille 4px)

```
xs:  4px   (gap-1, p-1)
sm:  8px   (gap-2, p-2)
md:  12px  (gap-3, p-3)
lg:  16px  (gap-4, p-4)
xl:  24px  (gap-6, p-6)
2xl: 32px  (gap-8, p-8)
```

- **Padding interne des cartes :** `p-4` (16px)
- **Gap entre cartes :** `gap-3` (12px)
- **Padding page container :** `px-4` (16px) sur mobile, `px-6` sur sm+

---

## 5. Tailles de composants

### Cibles tactiles

**Minimum absolu : 44×44px sur tout élément interactif.**

| Composant | Taille min | Note |
|---|---|---|
| Bouton d'action principal (CTA) | `h-12` (48px) | Pleine largeur sur mobile |
| Filtre équipe (pill header) | `min-h-[44px]` | Était 36px → corrigé P1 |
| Bouton admin (edit/delete) | `w-11 h-11` (44px) | Était 40px → corrigé P1 |
| Slot bénévole (ligne tactile) | `min-h-[52px]` | Zone de tap confortable |
| Tab BottomNav | `flex-1 h-14` | OK (56px hauteur) |
| Filtre accordéon GameCard | `py-3` minimum | ~44px avec padding |

### BottomNav

- Hauteur fixe : `h-14` (56px) + safe-area-bottom
- Position : `fixed bottom-4 left-4 right-4` ✓ (déjà en place)
- 3 destinations maximum (Liste / Semaine / Moi ou Se connecter)
- Réserver `pb-20` sur le contenu scrollable pour ne pas être masqué

---

## 6. Rayons de bordure

| Usage | Classe TW | Valeur |
|---|---|---|
| Carte match | `rounded-2xl` | 16px (réduit depuis 24px) |
| Modale / Bottom sheet | `rounded-3xl` | 24px |
| Bouton CTA principal | `rounded-xl` | 12px |
| Badge / pill statut | `rounded-full` | pill |
| Filtre équipe | `rounded-full` | pill ✓ |
| Input | `rounded-xl` | 12px |
| Slot bénévole (ligne) | `rounded-xl` | 12px |

---

## 7. Ombres

| Usage | Classe TW |
|---|---|
| Carte standard | `shadow-md` |
| Carte urgente | `shadow-lg ring-1 ring-red-500/20` |
| Carte fully staffed | `shadow-none opacity-75` |
| Bouton CTA primary | `shadow-md shadow-[--primary-500]/25` |
| BottomNav | `shadow-[0_12px_30px_rgba(18,31,47,0.18)]` ✓ existant |

---

## 8. Statuts de jeu — Règles visuelles

### Dans le header de carte (visible sans tap)

```
[Badge Domicile/Ext]  [Badge Mon engagement OU statut couverture]
```

- Si l'utilisateur est inscrit à ce match → badge bleu "✓ Mon engagement"
- Si urgent et non inscrit → badge rouge pulsant "🔥 Urgent : X postes"
- Si presque complet (1 poste restant) → badge amber "⚡ Presque complet"
- Si complet → badge vert "✅ Couvert"
- Sinon → "X places libres" en texte muted

### Dans l'accordéon (après tap)

- Liste des rôles avec état individuel
- CTA principal adapté à l'état

---

## 9. États obligatoires par composant

| État | GameCard | VolunteerSlot | Liste globale |
|---|---|---|---|
| Chargement | Skeleton fidèle (3 cartes) | Placeholder gris animé | SkeletonLoader ✓ |
| Vide | EmptyState avec contexte (off-saison / pas de match) | — | EmptyState ✓ |
| Erreur réseau | Toast NetworkStatus ✓ | Restauration état précédent + message | Toast ✓ |
| Action en cours | Bouton désactivé + spinner inline | Input bloqué | — |
| Succès | Optimistic update + toast vert | Optimistic update ✓ | Toast ✓ |
| Échec | Rollback optimistic + toast rouge | Rollback + message clair | Toast ✓ |
| Déjà inscrit | Badge "Mon engagement" | Check vert + bouton se désinscrire | — |
| Complet | Badge "Équipe au complet" | Slots verrouillés | — |

---

## 10. Animations

**Principes :**
- Durées : 100ms (instant), 150ms (normal), 250ms (lent)
- Toujours respecter `prefers-reduced-motion`
- Uniquement `transform` et `opacity` pour les animations (pas de layout animations)
- Pas d'animation sur les actions critiques (inscription, désinscription)

**Micro-interactions autorisées :**
- Tap → `scale(0.98)` sur boutons (déjà en CSS global) ✓
- Expand accordéon → `height: auto` via Framer Motion ✓
- Badge "Mon engagement" → `scale-in` à l'apparition
- Toast → `slide-up` ✓

**Interdites :**
- Rotation infinie sur éléments de contenu (sauf ballon animé BottomNav)
- Pulse continu sauf badge "Urgent"
- Transitions > 300ms sur interactions directes

---

## 11. Navigation mobile

```
┌─────────────────────────────────┐
│  [Logo]  SCBA Bénévoles  [👤🌙] │  ← Header sticky (compact)
│  [Tous] [Senior M1] [U17]...    │  ← Filtres scroll horizontal
├─────────────────────────────────┤
│                                 │
│  Liste de matchs / Planning     │  ← Contenu
│                                 │
├─────────────────────────────────┤
│  [📋 Liste] [📅 Semaine] [⭕ Moi]│  ← BottomNav (fixed)
└─────────────────────────────────┘
```

- Vue par défaut : **Liste** (corrigé depuis Semaine)
- BottomNav : 3 tabs fixes, pas de menu "···"
- "Moi" → ouvre ProfileModal (VolunteerDashboard) si connecté, sinon affiche prompt connexion

---

## 12. Accessibilité (WCAG AA minimum)

| Règle | Implémentation |
|---|---|
| Contraste texte/fond ≥ 4.5:1 | `--text-muted: #475569` sur `#e8ecef` = 4.6:1 ✓ |
| Cibles tactiles ≥ 44×44px | Appliqué sur tous les composants interactifs |
| Focus ring visible | `outline: 2px solid #3629e1; outline-offset: 2px` ✓ |
| `aria-label` sur icônes seules | Obligatoire sur tous les boutons sans texte |
| `aria-expanded` sur accordéons | Présent ✓ |
| `prefers-reduced-motion` | CSS global + Framer Motion ✓ |
| Statut non-couleur seule | Icône + label toujours associés ✓ |
| `100dvh` | Utilisé ✓ |
| Safe area iOS | `env(safe-area-inset-*)` ✓ |
