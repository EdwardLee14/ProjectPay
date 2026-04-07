# ProjectPay (VisiBill) — Frontend Design Specification

This document defines the visual design language for ProjectPay. Every component, page, and layout created by Claude Code must follow these rules to ensure a consistent, professional, trust-building interface.

---

## 1. Design Identity

**Vision:** A fintech platform that directly adopts Guild.com's warm, editorial design language — applied to construction finance.

**Core Principles:**
- **Cream canvas for marketing, white for app:** Landing/marketing pages use `guild-cream` (`#F8F2E9`) as the primary background. Dashboard/app pages use white. All content sections on marketing pages share the same cream background — no alternating section colors.
- **Dark forest green as signature color:** `guild-mint` (`#2D4A34`) is the dark green used for feature cards (For Contractors), stat cards, and accent blocks. Text on green backgrounds is always white. Icons on green backgrounds are white, large (`text-3xl`).
- **Guild orange accent:** Primary accent is Guild's exact orange (`#E7651C`). Used for pill buttons, icon colors on light backgrounds, progress bar fills, and SVG decorative elements.
- **Thick off-black borders:** All cards use `border-2 border-off-black` — thick, sharp, black. NO border-radius on cards (radius is `0px`). NO box shadows. Only buttons use `rounded-full`.
- **Pastel variety in card grids:** When cards sit in a grid, alternate backgrounds between `white`, `guild-peach`, `guild-mint` (dark green), and `guild-cream` for visual variety. Not all cards should be the same color.
- **Dark pill buttons:** Primary CTA is `bg-off-black text-guild-cream rounded-full` with hover inversion. Use `<Button variant="pill">`. Orange pill variant for secondary CTAs.
- **Editorial typography:** Large, confident headings (Manrope). Eyebrow labels uppercase with wide tracking. Text-link CTAs with underline and arrows for editorial contexts.
- **Icons float freely:** NO colored circles, squares, or backgrounds behind icons. Icons sit directly inline. On dark backgrounds, icons are white. On light backgrounds, icons are `text-off-black` or `text-primary`.
- **SVG decorative arcs:** Flowing geometric curves (SVG `<path>` elements) can be used behind sections for visual interest. Use primary orange strokes at low opacity. No blurs, no gradients, no blobs.
- **Trust-first:** This platform handles real money. Every pixel should reinforce professionalism, reliability, and transparency.

**What This Is NOT:**
- Not a startup landing page (no hero gradients, no floating overlays, no check-circle badge rows)
- Not a consumer app (no gamification, no badges, no streaks)
- Not a generic dashboard template (no identical card grids, no shadow-soft cards, no 4-card icon grids)
- Not "vibe coded" — no rounded card corners, no thin gray borders, no shadow elevation, no icon-in-circle patterns

---

## 2. Color System

### Primary Tokens (CSS Variables in `globals.css`)

```
:root {
  --background: 0 0% 100%            /* Pure white */
  --foreground: 24 100% 4%          /* Warm near-black #170B01 */
  --primary: 22 82% 51%             /* Guild orange #E7651C */
  --primary-foreground: 0 0% 100%   /* White */
  --secondary: 153 30% 32%          /* Forest green ~#3A6B4A */
  --secondary-foreground: 0 0% 100% /* White */
  --accent: 28 72% 79%              /* Guild peach #F6CA9E */
  --accent-foreground: 0 0% 0%      /* Black */
  --muted: 40 18% 80%               /* Guild taupe #D7D1BD */
  --muted-foreground: 0 0% 25%      /* Dark gray */
  --destructive: 0 65% 42%          /* Red */
  --destructive-foreground: 0 0% 100%
  --border: 40 18% 80%              /* Guild taupe */
  --input: 0 0% 100%                 /* White */
  --ring: 22 82% 51%                /* Match primary */
  --card: 0 0% 100%                  /* White */
  --card-foreground: 24 100% 4%     /* Warm near-black */
  --popover: 0 0% 100%
  --popover-foreground: 0 0% 0%
  --radius: 0.375rem
}
```

### Guild Palette Tokens (Tailwind config)

| Token | Hex | Usage |
|-------|-----|-------|
| `guild-cream` | `#F8F2E9` | Marketing page background, card headers (dashboard), section backgrounds |
| `guild-taupe` | `#D7D1BD` | Sidebar background, footer background (marketing) |
| `guild-peach` | `#F6CA9E` | Card top sections (How It Works), alert banners, warm accent cards in grids |
| `guild-mint` | `#2D4A34` | **Dark forest green** — feature cards (For Contractors), accent stat cards, KPI cells. Text on this bg must be white. Icons must be white. |
| `guild-sky` | `#ACE5FD` | Light blue accent (use sparingly) |
| `off-black` | `#170B01` | Card borders (`border-2 border-off-black`), dark pill buttons, body text |
| `primary-container` | `#1A1A1A` | Dark hero cards, metric cards, virtual card mockups |
| `on-primary-container` | `#E7651C` | Orange text/icons on dark backgrounds |
| `tertiary-fixed-dim` | `#E89B3F` | Amber warnings, pending states |
| `on-tertiary-container` | `#8B5E1A` | Text on amber surfaces |

### Color Usage Rules

- **Primary (Guild orange #E7651C):** Pill button accents, icon color on light backgrounds, SVG decorative arcs, progress bar fills, eyebrow borders
- **Guild-mint (dark green #2D4A34):** Feature cards, accent blocks. Always use white text and white icons on this background.
- **Guild-peach (#F6CA9E):** Card top sections in "How It Works" style layouts, alert/pending banners, warm accent in card grids
- **Guild-cream (#F8F2E9):** Marketing page background (uniform — no alternating), card headers in dashboard, sidebar active states
- **Secondary (forest green #3A6B4A):** Success states, funded amounts, progress bars under 80%, "Approve & Fund" buttons in mockups
- **Off-black (#170B01):** Card borders (`border-2`), pill button fills, primary text color. This is the border color — not gray, not taupe.
- **Shadows:** NONE. `shadow-soft` is set to `none`. Cards differentiate by border + background color only.
- **Borders:** Always `border-2 border-off-black`. Thick and visible. Never thin gray borders.

---

## 3. Typography

### Font Stack
- **Headlines & Display:** `font-headline` → Manrope (weights: 600, 700, 800)
- **Body & UI:** `font-sans` / `font-body` → DM Sans (weights: 400, 500, 600, 700)

### Type Scale

| Level | Font | Size | Weight | Tracking | Usage |
|-------|------|------|--------|----------|-------|
| Display | Manrope | 36-48px | 800 | `-0.02em` | Hero numbers, page totals, big monetary amounts |
| H1 | Manrope | 28-32px | 700 | `-0.01em` | Page headings ("Dashboard", "Projects") |
| H2 | Manrope | 20-24px | 700 | `0` | Section headings, card titles |
| H3 | Manrope | 16-18px | 700 | `0` | Sub-section titles, form group labels |
| Body | DM Sans | 14-16px | 400/500 | `0` | Paragraphs, descriptions, form inputs |
| Body Small | DM Sans | 12-13px | 500 | `0` | Secondary text, metadata, table cells |
| Caption | DM Sans | 10-11px | 700 | `0.05-0.1em` | Labels, tags, status indicators (uppercase) |
| Currency | Manrope | varies | 700-800 | `-0.02em` | All dollar amounts at any size |

### Typography Rules
- All monetary amounts use `font-headline` regardless of size.
- Table headers use Caption style: uppercase, wide tracking, small size.
- Never use `font-bold` on body text for emphasis — use `font-medium` (500) or `font-semibold` (600).
- Page titles are floating text (no card wrapper), using H1 with a Body Small subtitle in `text-muted-foreground`.

---

## 4. Navigation (Azure-Inspired)

### Sidebar (Desktop)
- Width: `w-64` (256px), fixed left
- Background: `guild-taupe` (`#D7D1BD`)
- Nav items: Icon (Material Symbols, 20px) + label, `py-3 px-4 rounded-lg`
- Active state: `bg-white text-foreground font-semibold` (no shadow)
- Inactive state: `text-muted-foreground hover:bg-white/50 hover:text-foreground`
- Bottom: Settings + Support links only. No upsell cards.
- Collapsible: On `md` screens, collapse to icon-only mode (`w-16`)

### Breadcrumbs
- Show on all pages deeper than top-level (e.g., `/projects/[id]`, `/projects/new`)
- Format: `Dashboard > Projects > Project Name`
- Separator: `>` or `/` in `text-muted-foreground/50`
- Links: `text-muted-foreground hover:text-foreground`
- Current page: `text-foreground font-semibold` (not a link)

### Top Nav
- Sticky top, white background, subtle bottom border
- Left: Breadcrumbs (desktop) or page title (mobile)
- Right: Search bar (`rounded-full bg-surface-container-low`), notification bell, user avatar, "New Project" CTA button

### Bottom Nav (Mobile Only)
- Fixed bottom, white background, top border
- 4 main nav items + center floating "+" button for quick project creation
- Active: `text-primary`, icon filled (`FILL 1`)
- Inactive: `text-muted-foreground`

---

## 5. Component Patterns

### Card Style (Default)
```
border-2 border-off-black bg-white p-6
```
- **Sharp corners** — `--radius: 0px`. NO border-radius on any card.
- **Thick off-black border** — `border-2 border-off-black`. Not `border`, not `border-off-black/80`. Full thickness, full opacity.
- This is the `<Card>` component default class.

### Split Cards (How It Works Pattern)
Cards with a visual mockup on top and text content on bottom:
```
Top:    bg-guild-peach (1/3 height, fixed 240px) — contains CSS mockup diagram
Bottom: bg-guild-cream (2/3 height, flex-1) — contains step number, title, description
```
- All split cards share the same peach/cream color scheme for consistency.
- Mockup diagrams are CSS-only miniature UI representations (budget builders, donut charts, virtual cards, completion screens).
- Inner mockup containers use `border-2 border-off-black bg-white max-w-[200px]`.

### Dark Green Cards (Feature Cards)
```
bg-guild-mint border-2 border-off-black p-5
```
- Used for: Feature lists (For Contractors section), accent stat cells in KPI grids
- `guild-mint` is dark forest green (`#2D4A34`) — NOT pastel.
- Text must be white (`text-white`). Icons must be white and large (`text-3xl text-white`).
- Stack vertically with `space-y-3` gap between cards.

### Pastel Cards in Grids
When cards sit in a 2x2 or multi-card grid, alternate backgrounds:
- `bg-guild-peach` — warm orange accent
- `bg-white` — clean default
- `bg-guild-mint` — dark green (text/icons white)
- `bg-guild-cream` — neutral

### Icons in Cards
- Icons float freely — **NO colored circles, squares, or backgrounds** behind them.
- On light backgrounds: `text-off-black` or `text-primary`
- On dark backgrounds (guild-mint, off-black): `text-white` always
- Size: `text-2xl` default, `text-3xl` for feature list cards
- Never wrap icons in `bg-*` divs or `rounded-*` containers.

### Eyebrow Label Pattern
```
text-[10px] font-bold tracking-[0.15em] uppercase pb-2 border-b-3 border-primary inline-block
```
- Used above every major heading and stat display
- The 3px bottom border in primary orange is a core Guild design element
- Always uppercase, always with wide tracking

### Text CTA Pattern
```
text-foreground font-semibold underline decoration-2 underline-offset-4 hover:decoration-primary
```
- Preferred over filled buttons in editorial and marketing contexts
- Always ends with arrow: `→`
- Example: `View all projects →`

### Floating Text Sections
Some content should NOT be wrapped in cards:
- Page headers (title + eyebrow + subtitle)
- Section dividers
- Breadcrumbs
- Stat displays on landing pages

### Buttons

| Variant | Classes | Usage |
|---------|---------|-------|
| Primary (pill) | `bg-off-black text-guild-cream px-8 py-3 rounded-full font-semibold hover:bg-transparent hover:text-off-black border border-off-black transition-colors` | Main CTAs — Guild's dark pill button |
| Orange (pill) | `bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-transparent hover:text-primary border border-primary transition-colors` | Secondary CTAs |
| Text CTA | `text-foreground font-semibold underline decoration-2 underline-offset-4 hover:decoration-primary` | Editorial CTAs, "View all →" |
| Ghost | `text-muted-foreground font-semibold hover:text-foreground` | "Cancel", "Back" |
| Destructive | `border border-destructive text-destructive hover:bg-destructive hover:text-white px-5 py-2.5 rounded-full font-semibold` | "Reject", "Delete", "Sign Out" |

### Form Inputs
```
bg-surface-container-low border-none rounded-lg px-4 py-3 text-foreground
placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary focus:bg-white
```
- Labels: `text-sm font-semibold text-foreground mb-1.5` (DM Sans, not uppercase)
- Help text: `text-xs text-muted-foreground mt-1`
- Error state: `ring-1 ring-destructive` with red help text

---

## 6. Layout Composition

### Dashboard Pages (Bento Grid)
```
grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1440px] mx-auto p-6 lg:p-10
```
- Hero metric card: `lg:col-span-5` or `lg:col-span-7`
- Budget utilization grid: `lg:col-span-7` or `lg:col-span-5`
- Recent transactions table: `lg:col-span-8`
- Pending actions sidebar: `lg:col-span-4`
- **Key rule:** No row should have all equal-width cards.

### Detail Pages (Main + Sidebar)
```
grid grid-cols-1 lg:grid-cols-12 gap-8
```
- Main content: `lg:col-span-8`
- Sidebar: `lg:col-span-4 sticky top-24`
- Tabs for sub-content: Budget | Transactions | Change Orders | Documents

### List Pages (Projects, Transactions)
- Full width with table or card grid
- Tables: For dense data (transactions) — see Data Visualization section
- Card grid: For browsable items (projects) — `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`

### Form Pages (Create Project, Setup)
```
grid grid-cols-1 lg:grid-cols-12 gap-8
```
- Form: `lg:col-span-7 xl:col-span-8`
- Live preview/summary: `lg:col-span-5 xl:col-span-4 sticky top-24`

### Spacing Standards
- Page padding: `p-6 lg:p-10`
- Card internal padding: `p-6` (compact) or `p-8` (standard) or `p-10` (hero)
- Section gap: `gap-6` (default) or `gap-8` (between major sections)
- Max content width: `max-w-[1440px]`

---

## 7. Data Visualization

### Progress Bars (Budget Utilization)
```
Container: h-1.5 w-full bg-accent rounded-full overflow-hidden
Fill: h-full rounded-full transition-all duration-500
```
- Under 80%: `bg-secondary` (forest green)
- 80-100%: `bg-tertiary-fixed-dim` (amber)
- Over 100%: `bg-destructive` (red)
- Always show percentage label next to or above the bar

### Metric Displays
- Large currency: `font-headline text-4xl font-bold tracking-tight`
- Supporting metric: `font-headline text-lg font-bold`
- Metric label: `text-[10px] uppercase tracking-wider text-muted-foreground font-bold`
- Delta indicator: Green arrow-up for positive, red arrow-down for negative

### Tables
```
Header row: bg-surface-container-low/50 text-[11px] font-bold uppercase tracking-widest text-muted-foreground
Body rows: hover:bg-muted/30 transition-colors
Dividers: divide-y divide-outline-variant/10
```
- Vendor/merchant column: Show initials avatar (`w-8 h-8 rounded-lg bg-accent font-bold text-primary text-xs flex items-center justify-center`)
- Amount column: Right-aligned, `font-headline font-bold`
- Date column: `text-muted-foreground text-sm`
- Hide non-essential columns on mobile: `hidden md:table-cell`

### Status Badges
```
px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
```

| Status | Background | Text |
|--------|-----------|------|
| ACTIVE | `bg-secondary-container/30` | `text-secondary` |
| DRAFT | `bg-muted` | `text-muted-foreground` |
| PENDING | `bg-tertiary-fixed-dim/20` | `text-on-tertiary-container` |
| COMPLETE | `bg-surface-container` | `text-muted-foreground` |
| REJECTED | `bg-destructive/10` | `text-destructive` |
| FUNDED | `bg-secondary-container/30` | `text-secondary` |

---

## 8. Edge Case Handling

### Empty States
Every list, table, and dashboard section must have a designed empty state:
- Large muted icon (`text-muted-foreground/30`, 48px)
- Primary message: Short, specific (e.g., "No projects yet")
- Supporting text: Explain what will appear here (e.g., "Projects you create will appear here with live budget tracking")
- CTA: Link or button to resolve the empty state (e.g., "Create your first project")
- Center-aligned within the container

### Loading States
- Use skeleton rectangles that match the shape of actual content
- `animate-pulse` on `bg-surface-container rounded-lg`
- Match the exact layout: if the loaded state has 3 cards in a bento grid, show 3 skeleton cards in the same grid
- Never use a centered spinner for page-level content

### Error States
- Inline error banner within the affected section (not a full-page error)
- `bg-destructive/5 border border-destructive/20 rounded-xl p-4`
- Icon + title + description + retry button
- For form validation: inline error text below the field in `text-destructive text-xs`

### First-Time User
- Dashboard: Onboarding card (Card Variant 2) with welcome message and "Create your first project" CTA
- Project list: Illustrated empty state with setup guidance
- Never show raw "0" metrics — show "—" or a contextual message instead

### Returning User
- Show recency signals: "Last activity 2 hours ago", recent transaction previews
- Do NOT show onboarding/setup prompts once the user has active projects

---

## 9. UX Reasoning Rules

### Contractor Workflow
Think through this flow when designing contractor-facing pages:
1. **Create project** → Name, client info, timeline
2. **Define budget** → 2-8 categories with caps, materials focus
3. **Share with client** → Client reviews and approves
4. **Get funded** → Client funds the project
5. **Swipe card** → Virtual card for purchases, auto-categorized
6. **Track expenses** → Real-time dashboard, receipt uploads
7. **Handle overruns** → Change orders with justification
8. **Close project** → Final summary, all receipts, PDF export

### Client Workflow
Think through this flow when designing client-facing pages:
1. **Receive invite** → Email/link to review project proposal
2. **Review budget** → See categories, caps, total
3. **Approve & fund** → Link bank, fund via Stripe
4. **Monitor spending** → Real-time dashboard, push notifications
5. **Approve change orders** → Review justification, approve/reject
6. **Project completion** → Final summary, receipts, PDF export

### Design Questions to Ask
For every screen:
- "What should the user do next?" — There must always be a clear next action.
- "What if this is empty?" — Design the zero state.
- "What if this fails?" — Design the error recovery.
- "What information hierarchy supports the primary action?"
- "Would a contractor on a job site understand this in 3 seconds on their phone?"
- "Would a homeowner trust this interface with their money?"

---

## 10. Mobile Responsive Rules

- Sidebar: `hidden md:flex` — replaced by bottom nav on mobile
- Bottom nav: `flex md:hidden` — 4 items + center FAB
- Grid layouts: `grid-cols-1 lg:grid-cols-12` — single column on mobile
- Cards: Full-width on mobile, maintain `p-6` padding (not `p-8`)
- Tables: Hide non-essential columns (`hidden md:table-cell`), or switch to card list view on mobile
- Headings: Scale down 1 step on mobile (`text-2xl md:text-4xl`)
- Touch targets: Minimum 44x44px for all interactive elements

---

## 11. Icon System

**Material Symbols Outlined** exclusively, via `<Icon />` component.

### Configuration
- Default: `FILL 0, wght 400, GRAD 0, opsz 24`
- Active/selected: `FILL 1` (e.g., active nav items)
- Decorative (empty states): `wght 300, opsz 48`

### Usage Rules
- Every icon must add clarity, not decoration.
- Minimal icons — if text alone communicates the meaning, skip the icon.
- Nav items always have icons. Form labels do not.
- Status badges do not need icons. Alert banners do.
- Do NOT use lucide-react or any other icon library.

### Common Icons
| Context | Icon Name |
|---------|-----------|
| Dashboard | `dashboard` |
| Projects | `folder_open` |
| Transactions | `receipt_long` |
| Budget | `account_balance_wallet` |
| Change Orders | `swap_horiz` |
| Settings | `settings` |
| Add/Create | `add` |
| Search | `search` |
| Notifications | `notifications` |
| User/Profile | `person` |
| Money/Fund | `payments` |
| Success | `check_circle` |
| Warning | `warning` |
| Error | `error` |
| Close | `close` |
| Back | `arrow_back` |
| Expand | `expand_more` |

---

## 12. Do NOT

**Border & Shape Rules:**
- Use `border` (1px) on cards — always use `border-2` (thick)
- Use `border-off-black/80` or any opacity — always full `border-off-black`
- Use `rounded-xl`, `rounded-lg`, or any border-radius on cards — cards are sharp rectangles (`--radius: 0px`)
- Use box shadows on anything — `shadow-soft` is `none`
- Use thin gray borders — borders are always thick off-black

**Icon Rules:**
- Put icons inside colored circles/squares (`bg-primary/10 rounded-md` etc.) — icons float freely
- Use peach (`text-guild-peach`) for icons on dark backgrounds — use `text-white` instead
- Use small icons on feature cards — use `text-3xl` minimum

**Color Rules:**
- Use raw hex colors in JSX — always reference design tokens
- Alternate section background colors on marketing pages — use uniform `bg-guild-cream` for all sections above the footer
- Use light/pastel green for `guild-mint` — it is dark forest green (`#2D4A34`), text must be white on it

**Layout Rules:**
- Create uniform card grids where all cards look identical — mix backgrounds (peach, white, mint, cream)
- Use `gap-0` with shared borders between cards — use `gap-3` or `gap-4` with individual `border-2` on each card
- Alternate section backgrounds on marketing pages — all sections share the same cream background

**Pattern Rules:**
- Hardcode button styles inline — use `<Button variant="pill|pill-orange|pill-destructive">` variants
- Use decorative blur blobs, gradients, or abstract shapes
- Use diagonal stripe patterns for backgrounds — use flowing SVG curve arcs if decorative background needed
- Create floating metric overlays on images
- Use check-circle trust badges or "Powered by" icon grids
- Make the UI look "AI-generated" — no generic hero sections, no vague subheadings
- Duplicate long className strings — extract to CSS modules or component variants
- Skip semantic HTML landmarks or `sizes` attribute on `next/image`

---

## 13. Coding Standards (2026)

### CSS Modules — Styles in Stylesheets, Not JSX
All styling lives in CSS Module files (`.module.css`) using `@apply` with Tailwind utilities. Pages import styles as objects and reference them by class name.

**Architecture:**
- `styles/shared.module.css` — shared patterns (eyebrow, card, table, progress bar, auth page, etc.)
- `app/<route>/<name>.module.css` — page-specific styles, co-located with the page file

**Import convention:**
```tsx
import s from "./dashboard.module.css";       // page-specific
import shared from "@/styles/shared.module.css"; // shared
import { cn } from "@/lib/utils";             // for composing classes
```

**Dynamic backgrounds:** Pass Tailwind utility classes (e.g., `"bg-guild-peach"`) via data and compose with `cn()`:
```tsx
<div className={cn(s.kpiCell, item.bg, i < 3 && s.kpiCellBorderRight)}>
```

### Component-First Buttons
All button patterns use the `<Button>` component with CVA variants. Never write button class strings inline.

**Button variants available:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `text-cta`, `pill` (dark off-black), `pill-orange`, `pill-destructive`.

Example — WRONG:
```tsx
<Link className="bg-off-black text-guild-cream px-8 py-3.5 rounded-full ...">
```

Example — RIGHT:
```tsx
<Button variant="pill" asChild><Link href="/sign-up">Start Your First Project &rarr;</Link></Button>
```

### Semantic HTML
Every page must use proper landmarks:
- `<main>` wrapping primary page content
- `<header>` for page/site headers
- `<nav>` for navigation groups
- `<section>` for distinct content sections (with accessible labels where appropriate)
- `<footer>` for page/site footers

### Image Optimization
All `next/image` with `fill` must include a `sizes` attribute:
```tsx
<Image fill sizes="(max-width: 768px) 100vw, 50vw" ... />
```

### Server Components by Default
- Pages and layouts are Server Components (no `"use client"`)
- Only leaf interactive components (forms, toggles, dropdowns) use `"use client"`
- Data fetching happens in Server Components, not via `useEffect`
