# ProjectPay — Frontend Design Specification

This document defines the visual design system for ProjectPay as currently implemented. Every component, page, and layout created by Claude Code must follow these rules.

---

## 1. Design Identity

**Vision:** A professional fintech platform inspired by Salesforce Cosmos — grey canvas, floating white elevated cards, clean data-first hierarchy applied to construction finance.

**Core Principles:**
- **Grey canvas with floating cards:** The page background is `#f3f3f3`. All content lives in white cards elevated with box shadows. The canvas never competes with content.
- **Single accent color:** Peach/orange (`#E7651C`) is the only accent. No green, blue, or multi-color schemes. Status variants stay within the peach family (peach-600, peach-800).
- **Elevation over borders:** Cards use `shadow-elevation-1/2/3` for depth. Borders are not used on standard cards. Only special components (budget utilization) use borders intentionally.
- **Scientific, not editorial:** Minimal decoration, no accent strips, no layered/nested card patterns. Data comes first, ornamentation is stripped away.
- **All text is off-black:** Every label, value, and description uses `text-off-black` (`#170B01`). The only exception is subdued meta-text which uses `text-off-black/40`.
- **Trust-first:** This platform handles real money. Every pixel reinforces professionalism, reliability, and transparency.

**What This Is NOT:**
- Not Guild.com warm/editorial (no accent strips, no cream backgrounds, no pastel card grids, no layered card patterns)
- Not a consumer app (no gamification, no badges, no streaks)
- Not a generic dashboard template (no identical card grids, no icon-in-circle patterns)
- Not multi-color (no green accents, no blue accents — peach/orange family only)

---

## 2. Color System

### Primary Tokens (CSS Variables in `globals.css`)

```
:root {
  --primary: 22 82% 51%              /* Orange #E7651C — the only accent */
  --primary-foreground: 0 0% 100%    /* White */
  --secondary: 28 40% 65%            /* Muted peach (not green) */
  --secondary-foreground: 0 0% 100%  /* White */
  --accent: 25 60% 95%               /* Very light peach */
  --accent-foreground: 0 0% 0%       /* Black */
  --muted: 25 15% 90%                /* Warm neutral */
  --muted-foreground: 24 100% 4%     /* Off-black */
  --destructive: 15 70% 42%          /* Burnt orange (not red) */
  --destructive-foreground: 0 0% 100%
  --background: 0 0% 100%            /* White */
  --foreground: 24 100% 4%           /* Off-black #170B01 */
  --border: 25 15% 85%
  --input: 0 0% 100%
  --ring: 22 82% 51%                 /* Match primary */
  --card: 0 0% 100%
  --card-foreground: 24 100% 4%
  --radius: 0.75rem
}
```

### Guild Palette Tokens (tailwind.config.ts)

These tokens exist in the config. Only the following are actively used on the dashboard:

| Token | Hex | Current Usage |
|-------|-----|---------------|
| `off-black` | `#170B01` | All text color |
| `peach-50` | `#FFF8F2` | Hover tints |
| `peach-100` | `#FFEAD6` | Light accent backgrounds |
| `peach-600` | `#D4792A` | Dark accent text (warning status) |
| `peach-800` | `#8B4513` | Critical emphasis text |
| `guild-peach` | `#F6CA9E` | Budget utilization outer card only |
| `guild-cream` | `#F8F2E9` | Not used on dashboard |
| `guild-mint` | `#2D4A34` | Not used on dashboard |

### Color Usage Rules

- **Primary orange (`#E7651C`):** Sidebar active icon, "New Project" button, progress bar fills, status badge accents, promo banner background.
- **Off-black (`#170B01`):** All text — headings, labels, values, descriptions. No grey text for readable content.
- **Sub-text opacity:** `text-off-black/40` for metadata and secondary information only.
- **Status colors:** All within the peach/orange family. Normal = `bg-primary/50`, Warning = `bg-primary`, Critical = `bg-peach-800`. No green/red status indicators.
- **Destructive:** Burnt orange (`--destructive: 15 70% 42%`), not red.
- **Page canvas:** `bg-[#f3f3f3]` — a neutral grey, not cream or white.

---

## 3. Shadows (Elevation System)

Defined in `tailwind.config.ts`. Shadows are the primary mechanism for creating depth.

```
"elevation-1": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"    — default cards
"elevation-2": "0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)"    — hover/emphasis
"elevation-3": "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)"    — modals/overlays
"elevation-nav": "0 1px 4px rgba(0,0,0,0.06)"                                 — top navigation bar
```

- Cards at rest: `shadow-elevation-1`
- Cards on hover or with emphasis: `shadow-elevation-2`
- Modals, dropdowns, popovers: `shadow-elevation-3`
- Top nav bar: `shadow-elevation-nav`

---

## 4. Typography

### Font Stack
- **Headlines & Display:** Manrope (weights: 600, 700, 800)
- **Body & UI:** DM Sans (weights: 400, 500, 600, 700)

### Implemented Scale

| Element | Classes | Notes |
|---------|---------|-------|
| Page title | `text-lg lg:text-xl font-bold` | Clean text, no eyebrow labels |
| Section headers | `text-sm lg:text-base font-bold` | Plain text only, NO icons |
| KPI labels | `text-xs lg:text-sm font-medium text-off-black` | NOT uppercase, normal letter-spacing |
| KPI values | `text-xl lg:text-3xl font-bold tracking-tight` | Manrope for monetary amounts |
| Body text | `text-xs lg:text-sm` | DM Sans |
| Minimum size | 10px | Never use 9px anywhere |
| Sub-text | `text-off-black/40` | Only for metadata/secondary info |

### Typography Rules
- All monetary amounts use Manrope regardless of size.
- KPI labels are sentence case with normal weight — NOT uppercase, NOT wide-tracked.
- Section headers are plain bold text with no accompanying icons.
- Mixed weight text (e.g., "Your Company's" normal + "Budget Utilization" bold) is used in the budget card title.
- All text uses `text-off-black`. No grey text for labels or descriptions.

---

## 5. Layout

### Page Structure
```
Promo Banner:  32px fixed top, bg-primary, white text, dismissible (localStorage)
Top Nav:       h-12, bg-white, shadow-elevation-nav, no border
Sidebar:       88px fixed left, bg-white, icon-above-text navigation
Content:       mt-20, md:ml-[88px], max-w-[1200px]
Background:    bg-[#f3f3f3] grey canvas
```

### Sidebar (88px Fixed)
- Background: `bg-white` (not taupe or cream)
- Nav items: Icon above text label, vertically stacked
- Active state: Orange icon color + `border-primary` outline. NO background fill on active items.
- Inactive state: `text-off-black` icon and label
- Width: 88px fixed, does not collapse

### Top Navigation (h-12)
- Background: `bg-white`
- Shadow: `shadow-elevation-nav` (no border-bottom)
- Contents (left to right):
  - Rounded search input
  - "New Project" button: `h-7 px-3 text-[11px] rounded-xl` (compact pill)
  - Round notification icon button
  - Round settings icon button
  - Round user avatar

### Promo Banner (32px)
- Fixed at top of viewport
- `bg-primary` (orange) with white text
- Dismissible — state persisted in localStorage
- Height: 32px

### Content Area
- Top offset: `mt-20` (accounts for banner + nav)
- Left offset: `md:ml-[88px]` (accounts for sidebar)
- Max width: 1200px
- Padding: `px-5 py-4 lg:px-10 lg:py-6 xl:px-16 xl:py-8`
- Section spacing: `space-y-5 lg:space-y-6`

### Responsive Behavior
- Mobile: Sidebar hidden, full-width content, single-column grid
- Tablet/Desktop: Sidebar visible, multi-column grids
- Cards: Full-width on mobile, maintain padding
- Touch targets: Minimum 44x44px

---

## 6. Cards

### Default Card
```
bg-white rounded-2xl shadow-elevation-1
```
- NO border by default
- NO accent strips
- Differentiated from canvas by elevation shadow only

### KPI Cards
```
bg-white rounded-2xl shadow-elevation-1 p-5 lg:p-6
```
- Layout: Label (top) -> Value (large) -> Sub-text (muted)
- No icons in KPI cards
- Label: `text-xs lg:text-sm font-medium text-off-black`
- Value: `text-xl lg:text-3xl font-bold tracking-tight`

### Section Cards (Activity, Transactions)
```
bg-white rounded-2xl shadow-elevation-1
```
- Header area: `px-5 py-3.5 lg:px-6 lg:py-4` with `border-b` divider
- Activity card: Text header "Activity" with count badge on right ("4 recent"), dot indicators per item
- Transactions card: Text header + toolbar buttons, tab strip below, sort icons on table columns, alternating row backgrounds
- Headers are plain text — NO icons next to section titles

### Card Gaps
- Between cards: `gap-3 lg:gap-4`
- Card internal padding: `p-5 lg:p-6`

---

## 7. Project Card Stack

A horizontally stacked display of virtual project cards with 3D perspective.

### Container
- White elevated card wrapper

### Individual Cards
- Width: 240px
- Overlap: -32px horizontal offset between cards
- 3D perspective with subtle hover lift animation

### Virtual Card Design
- Dark gradient background
- VISA logo
- EMV chip graphic
- Card number (partially masked)
- Holder name (client name)
- Expiry date

### Below Each Card
- Project name (bold)
- Budget amount (muted)
- Status badge + percentage
- `<ProgressBar />` component

---

## 8. Budget Utilization Card (Special)

This is the only card that intentionally uses borders and a non-white background.

### Outer Card
```
bg-[#F6CA9E] border border-off-black shadow-elevation-1 rounded-2xl
```

### Header
- "Your Company's" (normal weight) + "Budget Utilization" (bold) — same font size, mixed weight
- Geometric SVG visualization on the right ~65% of the card (hatched mountain peaks pattern)

### Divider
- Black horizontal line separating header from content

### Inner Card
```
bg-white border border-off-black rounded-xl
```
- Split layout with vertical black divider
- Left side: "Overall Spend" title, outlined `<ProgressBar />`, metadata
- Right side: SVG donut chart (90px diameter)

---

## 9. Reusable Components

### ProgressBar
```
<ProgressBar value={n} />
```
- Track: `border border-off-black/15 bg-off-black/10` (outlined, not filled)
- Fill: `bg-primary`
- Used in project cards and budget utilization

### Icon
```
<Icon name="dashboard" />
```
- Material Symbols Outlined exclusively
- Default: FILL 0, wght 400, GRAD 0, opsz 24
- Active nav items: FILL 1
- Do NOT use lucide-react or any other icon library

### Button Variants

| Variant | Key Styles | Usage |
|---------|-----------|-------|
| `pill-orange` | `bg-primary text-white rounded-xl` | Primary CTAs (NOT rounded-full) |
| `pill` | `bg-off-black text-white rounded-xl` | Dark CTAs |
| `pill-destructive` | `border-destructive text-destructive rounded-xl` | Delete/reject actions |
| `ghost` | No background, hover underline | Cancel, back |

**Critical:** All pill button variants use `rounded-xl`, NOT `rounded-full`.

### Badges
- Active: `shared.badgeActive` — primary border and text color
- Default: `shared.badgeDefault` — muted styling

---

## 10. Progress & Status Colors

All status colors stay within the peach/orange family. No green or red.

| Level | Fill Color | Text Color |
|-------|-----------|------------|
| Normal (< 80%) | `bg-primary/50` | `text-primary` |
| Warning (80-100%) | `bg-primary` | `text-peach-600` |
| Critical (> 100%) | `bg-peach-800` | `text-peach-800` |

---

## 11. Spacing Standards

| Context | Value |
|---------|-------|
| Page section spacing | `space-y-5 lg:space-y-6` |
| Page padding | `px-5 py-4 lg:px-10 lg:py-6 xl:px-16 xl:py-8` |
| Card gaps | `gap-3 lg:gap-4` |
| Card internal padding | `p-5 lg:p-6` |
| Max content width | 1200px |

---

## 12. Anti-Patterns (NEVER Do)

### Removed Patterns
- Guild-style accent strip cards
- Layered/nested card patterns (Guild Academy style)
- Multi-color card grids (peach, mint, cream backgrounds)
- Guild-mint dark green anything on the dashboard
- Pastel variety in card grids — all cards are white now
- Eyebrow labels with orange underlines
- Dark pill buttons with arrows as primary CTA style

### Color Violations
- Grey text for labels or descriptions — use `text-off-black`, sub-text uses `text-off-black/40`
- Green accents, blue accents, or any non-peach accent color
- Red for destructive — use burnt orange (`--destructive: 15 70% 42%`)
- `guild-cream` as page background — canvas is `#f3f3f3`

### Component Violations
- Icons next to section headers (Activity, Transactions) — use plain text
- Uppercase KPI labels with wide tracking — labels are sentence case, normal spacing
- `rounded-full` on buttons — always use `rounded-xl`
- Borders as the primary card differentiator — use shadow elevation
- `shadow-soft: none` — the system now uses shadows actively
- Icon circles/squares (`bg-primary/10 rounded-md` behind icons) — icons float freely
- Decorative SVG blobs, gradient backgrounds, blur effects

### Code Violations
- Inline Tailwind strings in JSX — use CSS Modules with `@apply`
- Hardcoded button styles — use `<Button variant="...">` component
- `text-muted-foreground` for visible text — all text is `text-off-black`
- Raw hex colors in JSX (except `bg-[#f3f3f3]` canvas and `bg-[#F6CA9E]` budget card)
- Missing `sizes` attribute on `next/image` with `fill`
- Font size below 10px

---

## 13. Coding Standards

### CSS Modules with @apply
All styling lives in CSS Module files (`.module.css`) using `@apply` with Tailwind utilities. No inline Tailwind class strings in JSX.

**Architecture:**
- `styles/shared.module.css` — shared patterns (cards, tables, progress bars, badges)
- `app/<route>/<name>.module.css` — page-specific styles, co-located with the page file

**Import convention:**
```tsx
import s from "./dashboard.module.css";        // page-specific — always as `s`
import shared from "@/styles/shared.module.css"; // shared — always as `shared`
import { cn } from "@/lib/utils";              // for composing classes
```

### Server Components by Default
- Pages and layouts are Server Components (no `"use client"`)
- Only leaf interactive components (forms, toggles, dropdowns, dismissible banners) use `"use client"`
- Data fetching happens in Server Components, not via `useEffect`

### Component-First Buttons
All button patterns use the `<Button>` component with CVA variants. Never write button class strings inline.

### Semantic HTML
Every page uses proper landmarks:
- `<main>` wrapping primary page content
- `<header>` for page/site headers
- `<nav>` for navigation groups
- `<section>` for distinct content sections
- `<footer>` for page/site footers

### Image Optimization
All `next/image` with `fill` must include a `sizes` attribute:
```tsx
<Image fill sizes="(max-width: 768px) 100vw, 50vw" ... />
```

### TypeScript
- Use `interface` for component props, not `type`
- No `any` types
- Prefer explicit return types on exported functions

### Icon Usage
- Material Symbols Outlined via `<Icon />` component exclusively
- No lucide-react or other icon libraries
- Icons add clarity, not decoration — if text communicates the meaning, skip the icon
