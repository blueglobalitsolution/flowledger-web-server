# Design System Inspired by Agencee

> Auto-extracted from `https://agencee-template.framer.website/` on 2026-08-06

## 1. Visual Theme & Atmosphere

Friendly, approachable design with rounded shapes and generous whitespace.

The hero section leads with "Scale your business".

**Key Characteristics:**
- Satoshi as the heading font (custom web font loaded via @font-face)
- sans-serif as the body font for all running text
- Heading weight 400, letter-spacing -4px
- Light/white background (#f7f7f7) as the primary canvas
- Primary accent `#0000ee` used for CTAs and brand highlights
- 8 shadow level(s) detected — tinted shadows
- Rounded corners (8px+) creating a friendly, approachable feel
- Tags: light, rounded, accented, bold-typography, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#0000ee`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Background** (`#f7f7f7`) · `--color-bg`: Page background, primary canvas.
- **Background Secondary** (`#eff0f0`) · `--color-bg-secondary`: Cards, surfaces, alternating sections.

### Text
- **Text Primary** (`#000000`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#666666`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#eff0f0`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#f7f7f7` | `--palette-1` | button | large | text-dark |
| 2 | `#eff0f0` | `--palette-2` | button | large | text-dark |
| 3 | `#0e1c29` | `--palette-3` | button | medium | text-light |
| 4 | `#0000ee` | `--palette-4` | text-accent | medium | text-light |
| 5 | `#ffffff` | `--palette-5` | button | medium | text-dark |
| 6 | `#000000` | `--palette-6` | badge | small | text-light |
| 7 | `#4d9096` | `--palette-7` | text-accent | small | text-light |

## 3. Typography Rules

- **Heading Font:** `Satoshi` (web font)
- **Body Font:** `sans-serif`, sans-serif

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | Satoshi | 100px | 400 | 110px | -4px |
| H2 | Satoshi | 56px | 400 | 67.2px | -1.12px |
| H3 | Satoshi | 36px | 400 | 50.4px | -0.36px |
| H4 | Satoshi | 24px | 400 | 36px | normal |
| Body | Inter | 14px | 400 | 22.4px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `100px` | headings |
| H1 | `56px` | headings |
| H2 | `44px` | headings |
| H3 | `36px` | headings |
| H4 | `24px` | headings |
| Body L | `20px` | body / supporting text |
| Body | `16px` | body / supporting text |
| Small | `14px` | body / supporting text |
| XS | `12px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: #000000;
  color: #000000;
  border-radius: 40px;
  padding: 0px 0px;
  font-size: 12px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

### Card

```css
.card {
  background: #eff0f0;
  border-radius: 0px;
  padding: 120px;
  box-shadow: rgba(0, 0, 0, 0.04) 0px 0.706592px 0.706592px -0.666667px, rgba(0, 0, 0, 0.04) 0px 1.80656px 1.80656px -1.33333px, rgba(0, 0, 0, 0.04) 0px 3.62176px 3.62176px -2px, rgba(0, 0, 0, 0.03) 0px 6.8656px 6.8656px -2.66667px, rgba(0, 0, 0, 0.03) 0px 13.6468px 13.6468px -3.33333px, rgba(0, 0, 0, 0.01) 0px 30px 30px -4px, rgba(255, 255, 255, 0.53) 0px -3px 1px 0px inset;
}
```

## 5. Layout Principles

- **Base spacing unit:** `6px` — use multiples (12px, 18px, 24px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `6px` | element |
| spacing-2 | `12px` | element |
| spacing-3 | `4px` | element |
| spacing-4 | `8px` | element |
| spacing-5 | `10px` | element |
| spacing-6 | `16px` | element |
| spacing-7 | `30px` | card |
| spacing-8 | `24px` | card |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-button | `8px` | button |
| radius-pill | `100px` | pill |
| radius-button | `14px` | button |
| radius-card | `20px` | card |
| radius-subtle | `4px` | subtle |
| radius-button | `10px` | button |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Mid | `rgba(0, 0, 0, 0.2) 0px 0px 5px 0px inset` | Dropdowns, popovers |
| High | `rgba(0, 0, 0, 0.08) 0px 0.796192px 0.796192px -1px, rgba(0, 0, 0, 0.07) 0px 2.41...` | Modals, floating elements |
| Deep | `rgba(0, 0, 0, 0.05) 0px 0.706592px 0.706592px -0.5px, rgba(0, 0, 0, 0.05) 0px 1....` | Hero sections, deep layers |
| Deep | `rgba(65, 159, 166, 0.13) 0px 0.706592px 0.706592px -0.666667px, rgba(65, 159, 16...` | Hero sections, deep layers |
| Deep | `rgba(0, 0, 0, 0.04) 0px 0.706592px 0.706592px -0.666667px, rgba(0, 0, 0, 0.04) 0...` | Hero sections, deep layers |

> **Note:** This site uses chromatic (color-tinted) shadows rather than pure black — this is a deliberate brand choice that adds warmth to elevation.

## 7. Do's and Don'ts

### Do
- Use `#f7f7f7` as the primary background color
- Use `Satoshi` for all headings and `sans-serif` for body text
- Use `#0000ee` as the single dominant accent/CTA color
- Maintain `6px` as the base spacing unit — all gaps should be multiples
- Use rounded corners (`8px`+) consistently for all interactive elements
- Make headlines large and bold — typography is the hero element
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 400 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute Satoshi/sans-serif with generic alternatives
- Don't use irregular spacing — stick to 6px grid
- Don't use dark/black backgrounds — this is a light-themed design
- Don't use sharp corners — they feel hostile in this rounded design language
- Don't use pure black (#000000) for text — use `#000000` instead
- Don't add decorative elements not present in the original design — no badges, ribbons, banners, or ornaments unless the source site uses them
- Don't invent UI patterns the source site doesn't have — if the original has no NEW badge, don't add one just because a red is in the palette

## 8. Responsive Behavior

| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 640px | Single column, stack sections, reduce font sizes ~80% |
| Tablet | 640–1024px | 2-column where appropriate, maintain spacing ratios |
| Desktop | 1024–1440px | Full layout as designed |
| Wide | > 1440px | Max-width container, center content |

- Touch targets: minimum 44×44px on mobile
- Maintain 6px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #f7f7f7
Text:        #000000
Accent:      #0000ee
Border:      #eff0f0
```

### Example Prompts

1. "Build a hero section with a `#f7f7f7` background, `Satoshi` heading in `#000000`, and a `#0000ee` CTA button with 40px radius."
2. "Create a pricing card using background `#eff0f0`, border `#eff0f0`, `sans-serif` for text, and 18px padding."
3. "Design a navigation bar — `#f7f7f7` background, `#000000` links, `#0000ee` for active state."
4. "Build a feature grid with 3 columns, 18px gap, each card using the card component style."
5. "Create a footer with `#000000` background, `#f7f7f7` text, and 12px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct
