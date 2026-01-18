---
name: ui-ux-pro-max
description: "UI/UX design intelligence. 50 styles, 21 palettes, 50 font pairings, 20 charts, 9 stacks. Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, check UI/UX code..."
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications.

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text
- `focus-states` - Visible focus rings on interactive elements
- `alt-text` - Descriptive alt text
- `aria-labels` - aria-label for icon-only buttons

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Minimum 44x44px touch targets
- `hover-vs-tap` - Use click/tap for primary interactions
- `loading-buttons` - Disable button during async operations
- `cursor-pointer` - Add cursor-pointer to clickable elements

### 3. Performance (HIGH)

- `image-optimization` - Use WebP, lazy loading
- `reduced-motion` - Check prefers-reduced-motion
- `content-jumping` - Reserve space for async content

### 4. Layout & Responsive (HIGH)

- `readable-font-size` - Minimum 16px body text on mobile
- `horizontal-scroll` - Ensure content fits viewport width
- `z-index-management` - Define z-index scale (10, 20, 30, 50)

### 5. Typography & Color (MEDIUM)

- `line-height` - Use 1.5-1.75 for body text
- `no-emoji-icons` - Use SVG icons, not emojis

## Common Rules for Professional UI

### Icons & Visual Elements

| Rule | Do | Don't |
|------|----|----- |
| **No emoji icons** | Use SVG icons (Heroicons, Lucide) | Use emojis like 🎨 🚀 |
| **Stable hover** | Color/opacity transitions | Scale transforms shifting layout |

### Interaction

| Rule | Do | Don't |
|------|----|----- |
| **Cursor pointer** | Add `cursor-pointer` | Leave default cursor |
| **Transitions** | `transition-colors duration-200` | Instant or >500ms |

### Light/Dark Mode

| Rule | Do | Don't |
|------|----|----- |
| **Glass card** | `bg-white/80` (light) | `bg-white/10` (invisible) |
| **Border** | `border-gray-200` (light) | `border-white/10` (invisible) |
