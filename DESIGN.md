# Design System Inspired by MezPay

> Auto-extracted from `https://mezpay.framer.website/` on 2026-08-06

## 1. Visual Theme & Atmosphere

High-contrast dark mode with vivid accents — feels modern, technical, and focused.

The hero section leads with "Simplify your money game with MezPay!".

**Key Characteristics:**
- Inter as the heading font (custom web font loaded via @font-face)
- sans-serif as the body font for all running text
- Heading weight 600, letter-spacing -1.44px
- Dark background (#181d27) as the primary canvas
- Primary accent `#bcfc6a` used for CTAs and brand highlights
- 5 shadow level(s) detected — tinted shadows
- Rounded corners (100px+) creating a friendly, approachable feel
- Tags: dark, rounded, accented, bold-typography, sans-serif

## 2. Color Palette & Roles

### Primary
- **Primary Accent** (`#bcfc6a`) · `--color-primary`: Brand color, CTA backgrounds, link text, interactive highlights.
- **Secondary Accent** (`#8c63e6`) · `--color-secondary`: Secondary brand, hover states, complementary highlights.
- **Background** (`#181d27`) · `--color-bg`: Page background, primary canvas.

### Text
- **Text Primary** (`#000000`) · `--color-text`: Headings and body text.
- **Text Secondary** (`#535862`) · `--color-text-secondary`: Muted text, captions, placeholders.

### Borders & Surfaces
- **Border** (`#252b37`) · `--color-border`: Dividers, outlines, input borders.

### Full Extracted Palette

| # | Hex | CSS Variable | Role | Area | Contrast |
|---|---|---|---|---|---|
| 1 | `#252b37` | `--palette-1` | button | large | text-light |
| 2 | `#181d27` | `--palette-2` | section | large | text-light |
| 3 | `#bcfc6a` | `--palette-3` | button | large | text-dark |
| 4 | `#0000ee` | `--palette-4` | text-accent | medium | text-light |
| 5 | `#f5f5f5` | `--palette-5` | button | medium | text-dark |
| 6 | `#ffffff` | `--palette-6` | button | medium | text-dark |
| 7 | `#8c63e6` | `--palette-7` | button | medium | text-light |
| 8 | `#535862` | `--palette-8` | button | small | text-light |
| 9 | `#000000` | `--palette-9` | badge | small | text-light |

## 3. Typography Rules

- **Heading Font:** `Inter` (web font)
- **Body Font:** `sans-serif`, sans-serif

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| H1 | Inter | 72px | 600 | 90px | -1.44px |
| H2 | Inter | 48px | 600 | 57.6px | normal |
| H3 | Inter | 36px | 600 | 44px | -0.72px |
| H4 | Inter | 24px | 600 | 32px | normal |
| Body | Inter | 16px | 400 | 24px | normal |

### Type Scale

| Token | Size | Suggested Usage |
|---|---|---|
| Display | `72px` | headings |
| H1 | `48px` | headings |
| H2 | `36px` | headings |
| H3 | `24px` | headings |
| H4 | `20px` | headings |
| Body L | `18px` | body / supporting text |
| Body | `16px` | body / supporting text |
| Small | `15px` | body / supporting text |
| XS | `14px` | body / supporting text |
| Caption | `12px` | body / supporting text |

## 4. Component Stylings

### Primary Button

```css
.btn-primary {
  background: #bcfc6a;
  color: #000000;
  border-radius: 100px;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 400;
  border: none;
  cursor: pointer;
}
```

## 5. Layout Principles

- **Base spacing unit:** `1px` — use multiples (2px, 3px, 4px, etc.)

### Spacing Scale (extracted from real elements)

| Token | Value | Role |
|---|---|---|
| spacing-1 | `1px` | element |
| spacing-2 | `12px` | element |
| spacing-3 | `60px` | section |
| spacing-4 | `40px` | card |
| spacing-5 | `10px` | element |
| spacing-6 | `6px` | element |
| spacing-7 | `32px` | card |
| spacing-8 | `25px` | card |

### Border Radius Scale

| Token | Value | Element |
|---|---|---|
| radius-pill | `100px` | pill |
| radius-button | `10px` | button |
| radius-card | `24px` | card |
| radius-card | `16px` | card |
| radius-button | `8px` | button |
| radius-card | `44px` | card |

## 6. Depth & Elevation

| Level | Shadow | Usage |
|---|---|---|
| Low | `rgba(10, 12, 18, 0.05) 0px 1px 2px 0px` | Cards, subtle elevation |
| Mid | `rgba(0, 0, 0, 0.29) 0px 0.602187px 0.421531px -1px, rgba(0, 0, 0, 0.28) 0px 2.28...` | Dropdowns, popovers |
| Low | `rgb(0, 0, 0) 0px 0px 0px 1px inset` | Cards, subtle elevation |
| Mid | `rgba(0, 0, 0, 0.12) 0px 0.602187px 0.421531px -1px, rgba(0, 0, 0, 0.11) 0px 2.28...` | Dropdowns, popovers |
| Deep | `rgba(0, 0, 0, 0.17) 0px 0.602187px 1.56569px -1.5px, rgba(0, 0, 0, 0.14) 0px 2.2...` | Hero sections, deep layers |

> **Note:** This site uses chromatic (color-tinted) shadows rather than pure black — this is a deliberate brand choice that adds warmth to elevation.

## 7. Do's and Don'ts

### Do
- Use `#181d27` as the primary background color
- Use `Inter` for all headings and `sans-serif` for body text
- Use `#bcfc6a` as the single dominant accent/CTA color
- Maintain `1px` as the base spacing unit — all gaps should be multiples
- Keep the overall feel dark — use dark surfaces throughout
- Use rounded corners (`100px`+) consistently for all interactive elements
- Make headlines large and bold — typography is the hero element
- Apply the shadow system for elevation — use the extracted shadow values
- Use weight 600 for headings to match the brand's typographic voice

### Don't
- Don't use colors outside the extracted palette without justification
- Don't substitute Inter/sans-serif with generic alternatives
- Don't use irregular spacing — stick to 1px grid
- Don't introduce bright white surfaces — they break the dark palette
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
- Maintain 1px base unit across breakpoints — only scale multipliers

## 9. Agent Prompt Guide

### Quick Color Reference

```
Background:  #181d27
Text:        #000000
Accent:      #bcfc6a
Secondary:   #8c63e6
Border:      #252b37
```

### Example Prompts

1. "Build a hero section with a `#181d27` background, `Inter` heading in `#000000`, and a `#bcfc6a` CTA button with 100px radius."
2. "Create a pricing card using background `#181d27`, border `#252b37`, `sans-serif` for text, and 3px padding."
3. "Design a navigation bar — `#181d27` background, `#000000` links, `#bcfc6a` for active state."
4. "Build a feature grid with 3 columns, 3px gap, each card using the card component style."
5. "Create a footer with `#181d27` background, `#000000` text, and 2px padding."

### Iteration Guide

1. Start with layout structure (sections, grid, spacing)
2. Apply colors from the palette — background first, then text, then accents
3. Set typography — font families, sizes from the type scale, weights
4. Add components — buttons, cards, inputs using the specs above
5. Apply border-radius consistently across all elements
6. Add shadows for depth — use the extracted shadow values, not defaults
7. Check responsive behavior — test mobile and tablet layouts
8. Final pass — verify all colors match, spacing is consistent, fonts are correct
