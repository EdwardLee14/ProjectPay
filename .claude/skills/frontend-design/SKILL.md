# Frontend Design Skill

## Trigger
Activate when creating, modifying, or reviewing any React component, page, layout, or CSS/Tailwind styling in this project.

## Before You Write Any UI Code

1. **Read `.claude/OVERVIEW.md`** — ground yourself in VisiBill's mission: real-time financial transparency for contractors. Contractors are on job sites, often on mobile, managing cash flow pressure across multiple projects — they need fast, glanceable, confidence-building interfaces. Clients are watching real money move and need to trust that every dollar is accounted for.
2. **Read `.claude/FRONTEND-DESIGN.md`** — for design tokens, patterns, and component specs.
3. **Identify the PURPOSE** — who uses this element, what decision does it support?
4. **Consider the CONTEXT** — where does this appear in the app flow, what comes before and after?
5. **Check for REUSE** — does a similar component or pattern already exist in `components/`?

## Design Thinking Framework

### Purpose & Intent
- Fintech context: users deal with real money. Design builds trust through clarity and professional polish.
- Salesforce Cosmos philosophy: seamless, responsive, intuitive, trusted, delightful.
- Contractor perspective: on job sites, need fast glanceable info.
- Client perspective: want assurance money is being spent correctly.

### Tone & Character
- **Professional and scientific** — not warm/editorial, not playful.
- **Salesforce Cosmos-inspired**: grey canvas, floating white elevated cards, clean data density.
- **Single accent color**: peach/orange (`#E7651C`) used minimally and intentionally.
- **Elevation hierarchy**: cards float via shadows (`shadow-elevation-1/2/3`), not borders.
- **Data-first**: typography and spacing serve readability, not decoration.
- **Rounded elements**: `rounded-2xl` on cards, `rounded-xl` on buttons, `rounded-full` on avatars/dots.

### Typography Rules
- **Headlines:** `font-headline` (Manrope) for all headings, section titles, card titles, monetary values, and currency amounts.
- **Body:** `font-sans` (DM Sans) for labels, descriptions, form inputs, paragraphs.
- Never use the body font for headings or vice versa.
- **KPI labels:** `text-xs lg:text-sm font-medium text-off-black` — NOT uppercase, NOT tracking-wide.
- **KPI values:** `text-xl lg:text-3xl font-bold tracking-tight`.
- **Section headers:** `text-sm lg:text-base font-bold` — plain text, no icons.
- **Minimum text size:** 10px. Never 9px.
- **All text:** `text-off-black` (`#170B01`). Sub-text/meta: `text-off-black/40`. Never full grey.

### Color Application
- **Primary orange `#E7651C`:** buttons, active states, progress fills, donut charts.
- **Peach scale:** `peach-50` for hovers, `peach-100` for light bg, `peach-600` for dark accent, `peach-800` for critical.
- **Background:** `#f3f3f3` grey canvas for dashboard layout.
- **Cards:** pure white (`bg-white`) with shadow elevation.
- **All text:** `text-off-black` (`#170B01`).
- NEVER use green, blue, or multi-color accents on dashboard.
- NEVER use raw hex values in JSX — use Tailwind tokens.

### Spatial Composition
- Grey canvas with floating white cards — Salesforce pattern.
- Asymmetric grid: `grid-cols-12` with 5/7 splits.
- Page spacing: `space-y-5 lg:space-y-6` between sections.
- Card padding: `p-5 lg:p-6` standardized.
- Card gaps: `gap-3 lg:gap-4`.
- Floating section headers (text without card wrapper) for some sections.

### Card & Container Patterns

1. **Elevated white cards** — `bg-white rounded-2xl shadow-elevation-1` — the default. NO border.
2. **Section cards** (Activity, Transactions) — white elevated + internal header with `border-b` divider.
3. **Budget utilization** — special: peach outer card with geometric SVG viz, black border, inner white card with donut chart.
4. **Project card stack** — virtual Stripe-style cards with dark gradient, 3D perspective overlap.

**Icons in cards:** Use `<Icon />` component only. Icons add clarity, not decoration.
**Buttons:** Position at bottom-left of cards with arrow. Use `rounded-xl`. Never centered.
**AVOID:** Borders as primary card differentiator, flat cards without elevation, nested/layered Guild-style cards, accent strip cards, decorative SVG blobs, gradient backgrounds.

### Motion & Micro-interactions
- Card hover: `hover:shadow-elevation-2` or subtle `translateY(-4px)`.
- Button hover: `hover:bg-transparent hover:text-primary transition-colors`.
- `transition-all duration-200` as default.
- **NO:** Excessive animations, bounce effects, slide-in entrance animations, parallax, confetti.

### Data Visualization (Fintech-Specific)
- **Progress bars:** Use `<ProgressBar value={n} />` component — outlined track, orange fill.
- **Status colors:** All peach-family (normal = `primary/50`, warning = `primary`, critical = `peach-800`).
- **Currency amounts:** Always use `formatCurrency()` with `font-headline`.
- **Tables:** Salesforce-style with tab strips, sort indicators, record counts, alternating rows.
- **Donut charts:** SVG-based, centered percentage.

### Edge Cases — ALWAYS Handle These

**Empty state:**
```tsx
<div className="text-center py-12">
  <Icon name="[contextual_icon]" className="text-off-black/30 mb-3" size={48} />
  <p className="text-sm font-medium text-off-black mb-1">[Primary message]</p>
  <p className="text-xs text-off-black/40 mb-4">[Supporting context]</p>
  <Link href="[action_path]" className="text-sm font-semibold text-primary hover:underline">
    [CTA text] →
  </Link>
</div>
```

**Loading state:**
- Skeleton placeholders matching the actual content layout shape.
- Use `animate-pulse` on `bg-muted rounded-2xl` rectangles.
- Never show a generic spinner for page-level loading.

**Error state:**
```tsx
<div className="bg-destructive/5 rounded-2xl p-6 flex items-center gap-4">
  <Icon name="error" className="text-destructive" />
  <div>
    <p className="text-sm font-bold text-destructive">[Error title]</p>
    <p className="text-xs text-off-black">[Recovery instruction]</p>
  </div>
  <Button variant="outline" size="sm" className="ml-auto">Retry</Button>
</div>
```

**First-time user vs returning user:**
- Dashboard with 0 projects: Show onboarding card with CTA.
- Dashboard with 1+ projects: Show standard metrics + recent transactions.
- Never show "No data" as the only content — always provide a forward path.

## Modern Coding Standards (2026)

### CSS Modules — All Styles in Stylesheets
This project uses **CSS Modules** (`.module.css` files) with `@apply` for all page and component styling. Inline Tailwind class strings in JSX are prohibited except for one-off layout utilities.

**File structure:**
- `styles/shared.module.css` — shared patterns reused across pages
- `app/<route>/page.module.css` or `<name>.module.css` — page-specific styles co-located with the page

**How to use:**
```tsx
import s from "./dashboard.module.css";
import shared from "@/styles/shared.module.css";
import { cn } from "@/lib/utils";

<main className={shared.dashboardPage}>
  <div className={cn(s.kpiCell, i < 3 && s.kpiCellBorderRight)}>
```

**Rules:**
- Define all visual patterns as CSS Module classes using `@apply` with Tailwind utilities.
- Import as `s` (page-specific) and `shared` (shared patterns).
- Use `cn()` to compose multiple module classes or add conditional dynamic classes.
- Use `composes:` within CSS Modules for class inheritance.
- `style={{}}` is ONLY for dynamic computed values (e.g., progress bar width percentages).
- Check `styles/shared.module.css` FIRST before creating new classes — many common patterns already exist.

### Component Architecture
- **Server Components by default.** Only add `"use client"` to leaf components that handle clicks, forms, or browser APIs.
- **Push `"use client"` down.** Extract interactive pieces into their own client components. Keep parents as Server Components.
- **Co-locate data fetching.** Fetch data directly in Server Components — no `useEffect` + `useState` for initial data loads.
- **Parallel data fetching.** Use `Promise.all()` for independent data. Let sibling Server Components fetch in parallel.
- **Composition over prop-drilling.** Use children/slots for flexible component composition.

### Semantic HTML & Accessibility (WCAG 2.2)
- Use semantic elements: `<main>`, `<nav>`, `<section>`, `<header>`, `<footer>`.
- `<button>` for actions, `<Link>` for navigation. Never `<div onClick>`.
- 44x44px minimum touch targets.
- 4.5:1 contrast ratio for normal text, 3:1 for large text.
- Keyboard navigation: all interactive elements reachable via Tab, activatable via Enter/Space.

### TypeScript
- **Type component props with `interface`** (prefer over `type` — they're extendable).
- **Never use `any`** — prefer `unknown` with type narrowing.
- **Don't use `React.FC`** — declare functions directly with typed props.
- **Use Zod** for runtime validation at system boundaries (API responses, form data).

### Icon System
Use **Material Symbols Outlined** exclusively via the `<Icon />` component from `components/ui/icon.tsx`.
- Default: `FILL 0, wght 400, GRAD 0, opsz 24`.
- Active/selected states: `FILL 1`.
- Do NOT use lucide-react or other icon libraries.
- Icons should add clarity, not decoration.
- NO icons in section card headers — use plain text only.

## Anti-Patterns — NEVER Do These

**Elevation & Borders:**
- Using borders as primary card differentiator — use shadow elevation
- `shadow-soft: none` is outdated — we now use elevation shadows (`shadow-elevation-1/2/3`)
- Flat cards without elevation — always add `shadow-elevation-1`
- Internal borders/dividers inside standard cards — use spacing

**Text & Typography:**
- Grey text for labels/descriptions — labels are `text-off-black`, sub-text is `text-off-black/40`
- Uppercase KPI labels — use normal case
- Wide letter-spacing on labels — use normal spacing
- Icons in section headers (Activity, Transactions) — plain text only
- Text smaller than 10px
- `text-muted-foreground` for visible text — only for input placeholders

**Color:**
- Multi-color accents (green, blue, yellow) on dashboard — single peach/orange family only
- Guild-mint dark green cards — removed from the design system
- Alternating card background colors — all white with shadow
- Raw hex/rgb values in JSX — use design tokens

**Cards & Layout:**
- Accent strip cards (Guild pattern) — removed
- Layered/nested card patterns — removed
- Borders around standard cards — use shadows
- Centered buttons in cards — bottom-left with arrow
- Decorative SVG blobs, gradient backgrounds
- `rounded-full` on buttons — use `rounded-xl`
- Flat cards with just text — cards need elevation

**Patterns:**
- "Vibe code" aesthetics — generic sections, vague subheadings, uniform card grids
- Decorative icons that don't add information
- Thick borders, heavy outlines as primary visual treatment
- Blur blobs (`bg-white/5 rounded-full blur-3xl`)
- Floating metric overlays on images
- Diagonal stripe patterns, bounce effects, parallax
- Hardcoding button styles — use `<Button>` component variants
