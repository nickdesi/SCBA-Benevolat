---
name: SCBA Bénévoles
description: Design System et identité visuelle sportive de la PWA Bénévolat du Stade Clermontois Basket Auvergne (SCBA)
colors:
  primary: "#3629E1"
  primary-deep: "#272890"
  secondary: "#2A21B4"
  accent-ball: "#AA2E0F"
  accent-neutral: "#C2988F"
  surface-light: "#FFFFFF"
  surface-dark: "#0F172A"
  bg-page-light: "#E8ECEF"
  bg-page-dark: "#0B1320"
  text-primary-light: "#0F172A"
  text-primary-dark: "#F8FAFC"
  text-muted-light: "#70849A"
  text-muted-dark: "#7287A0"
  border-light: "#D9E1E8"
  border-dark: "#243349"
  success: "#047857"
  urgent: "#AA2E0F"
typography:
  display-sport:
    fontFamily: "Oswald, sans-serif"
    letterSpacing: "0.05em"
    fontWeight: "700"
  heading:
    fontFamily: "Outfit, sans-serif"
    fontWeight: "700"
    fontSize: "1.25rem"
  body:
    fontFamily: "Outfit, Inter, sans-serif"
    fontSize: "1rem"
    lineHeight: "1.5"
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    lineHeight: "1.25"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  touch-target: "48px"
components:
  page-container:
    backgroundColor: "{colors.bg-page-light}"
    textColor: "{colors.text-primary-light}"
    padding: "{spacing.md}"
  header-nav:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.surface-light}"
    height: "{spacing.touch-target}"
  card-match:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
  card-match-dark:
    backgroundColor: "{colors.surface-dark}"
    textColor: "{colors.text-primary-dark}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-target}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-target}"
  badge-urgent:
    backgroundColor: "{colors.urgent}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
  badge-neutral:
    backgroundColor: "{colors.accent-neutral}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.pill}"
    padding: "{spacing.xs}"
  slot-volunteer:
    backgroundColor: "{colors.bg-page-light}"
    textColor: "{colors.text-primary-light}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
    height: "{spacing.touch-target}"
  text-muted:
    textColor: "{colors.text-muted-light}"
    typography: "{typography.caption}"
  text-muted-dark:
    textColor: "{colors.text-muted-dark}"
    typography: "{typography.caption}"
  border-container:
    textColor: "{colors.border-light}"
    padding: "{spacing.xs}"
  border-container-dark:
    textColor: "{colors.border-dark}"
    padding: "{spacing.xs}"
  accent-ball-element:
    backgroundColor: "{colors.accent-ball}"
    textColor: "{colors.surface-light}"
    rounded: "{rounded.pill}"
  page-container-dark:
    backgroundColor: "{colors.bg-page-dark}"
    textColor: "{colors.text-primary-dark}"
    padding: "{spacing.md}"
---

## Overview

Le Design System de **SCBA Bénévoles** est conçu pour une utilisation terrain (*gymnase, bord de court, vestiaires*) combinant une identité sportive affirmée (*Stade Clermontois Basket Auvergne*) et une ergonomie tactile mobile ultra-rapide (*mobile-first*).

L'interface privilégie :
1. **L'efficacité à une main (Thumb-Zone) :** Inscription, confirmation et recherche de covoiturage en 2 taps.
2. **Le contraste en conditions difficiles :** Lisibilité garantie sous néons de gymnase ou en plein soleil.
3. **L'immédiateté visuelle :** Statuts des créneaux (complet, disponible, urgent) identifiables en un coup d'œil.

---

## Colors

La palette s'articule autour des couleurs officielles du Stade Clermontois avec une distinction claire entre action, structure et urgence :

- **Bleu électrique (`#3629E1` - Primary) :** Couleur identitaire principale, utilisée pour les boutons d'action clés, les focus rings et les éléments actifs.
- **Bleu profond (`#272890` - Primary Deep) :** Couleur d'ancrage structurel (en-têtes, barres de navigation, cartes en mode sombre).
- **Rouge brique ballon (`#AA2E0F` - Accent Ball & Urgent) :** Accents dynamiques, badges d'alerte, indicateur de besoin urgent d'arbitre/table de marque et actions destructives.
- **Beige rosé (`#C2988F` - Accent Neutral) :** Neutre secondaire pour adoucir les bordures et fonds tertiaires.
- **Blanc & Ardoise sombre :** Cartes de match contrastées sur fond de page structuré (clair `#E8ECEF` ou sombre `#0B1320`).

---

## Typography

Le système typographique combine expressivité sportive et lisibilité compacte :

- **Oswald (`display-sport`) :** Police condensée et percutante en majuscules pour les scores, dates de matchs et catégories d'équipes (U13, U15, DM2, PNM).
- **Outfit (`heading` & `body`) :** Typographie géométrique moderne et chaleureuse pour les titres de sections et la lecture principale.
- **Inter (`caption` & data) :** Rendu optimal pour les noms de gymnases, adresses et horaires de covoiturage.
- **CLS Fallbacks :** Polices système calibrées (`Inter Fallback`, `Outfit Fallback`, `Oswald Fallback`) avec ajustement de taille (`size-adjust`) pour éliminer tout décalage visuel au chargement.

---

## Mobile-First & Ergonomie Tactile

Comme plus de 90 % des interactions se font sur smartphone :

- **Cible tactile minimale :** Tout élément interactif (bouton, sélecteur, slot bénévole) doit respecter une taille tactile minimale de **48 × 48 px** (`touch-target`).
- **Thumb-Zone Optimization :** Les actions primaires (s'inscrire, filtrer) sont positionnées dans la zone de balayage naturel du pouce.
- **Feedback Haptique & Visuel :** Transitions instantanées (100–150ms) sans effet de rebond élastique pour une sensation d'application native.
- **Safe Area Insets :** Prise en compte stricte des zones sécurisées iOS/Android (`env(safe-area-inset-bottom)`).

---

## Components

### 1. Carte de Match (`GameCard`)
- Surface blanche ou ardoise avec bordure subtile de 1px.
- En-tête avec badge de catégorie d'équipe et pastille domicile/extérieur.
- Grille des créneaux bénévoles (Table, Arbitre, Responsable de salle, Goûter) avec états clairs : *Libre*, *Complet*, ou *Besoin urgent*.

### 2. Slot Bénévole (`VolunteerSlot`)
- Bouton tactile large avec zone de saisie simplifiée.
- Affichage du nom avec icône de statut (validé, modification).
- Verrouillage automatique contre les saisies concurrentes et synchronisation Firebase temps réel.

### 3. Covoiturage (`CarpoolingSection`)
- Vue segmentée conducteurs / passagers.
- Bouton direct pour proposer ou demander une place.

---

## Accessibility & Contrast (WCAG)

- **Contraste AA/AAA :** Tous les textes principaux et boutons respectent un ratio de contraste supérieur à **4.5:1** (et **7:1** pour les textes critiques).
- **Focus Rings :** Contour visible `outline: 2px solid #3629E1` avec décalage de 2px pour la navigation au clavier et lecteurs d'écran.
- **Mode Sombre Natif :** Activation par classe `.dark` avec basculement immédiat sans clignotement.
