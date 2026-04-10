# Frontend Design Skill

## Trigger
Activate when creating, modifying, or reviewing any React component, page, layout, or CSS/Tailwind styling in this project.

## Before You Write Any UI Code

1. **Read `.claude/OVERVIEW.md`** to ground yourself in the product's mission, business model, and the people who use it. VisiBill replaces opaque invoicing with real-time financial transparency between contractors and their clients. Contractors are on job sites, often on mobile, managing cash flow pressure across multiple projects — they need fast, glanceable, confidence-building interfaces. Clients are watching real money move and need to trust that every dollar is accounted for. Every layout, color choice, hierarchy decision, and interaction pattern must reinforce this core promise: clarity builds trust, trust accelerates payment. If a design choice doesn't serve the contractor's workflow or the client's peace of mind, it doesn't belong.
2. **Read `.claude/FRONTEND-DESIGN.md`** for project-specific design tokens, palette, typography, and component patterns.
3. **Identify the PURPOSE** of this UI element — who uses it, what decision does it support, what is the user's emotional state?
4. **Consider the CONTEXT** — where does this appear in the app flow, what comes before and after?
5. **Check for REUSE** — does a similar component or pattern already exist in `components/`?

## Design Thinking Framework

### Purpose & Intent
- Every UI element must have a clear reason to exist.
- Ask: "What action should the user take?" and "What information hierarchy supports that action?"
- Fintech context: users are dealing with real money. Design must build trust, reduce anxiety, and provide clarity.
- Contractor perspective: they are on job sites, often on mobile, need fast glanceable info.
- Client perspective: they want assurance their money is being spent correctly, need clear breakdowns.

### Tone & Character
- **Professional but approachable** — not sterile, not playful.
- **Confident and editorial** — Guild.com influence: large confident typography, eyebrow labels with wide tracking, text-link CTAs with arrows.
- **Warm and grounded** — Guild palette: orange `#E7651C`, cream `#F8F2E9`, dark forest green `#2D4A34`, peach `#F6CA9E`, off-black `#170B01`.
- **Mixed corner radii** — Cards use `rounded-2xl` for a soft, modern feel. Buttons use `rounded-full` (pill shape). Geometric accent shapes (tags, strips) can be sharp for contrast. The interplay of rounded and sharp forms creates visual depth.
- **Layered, intricate cards** — Cards are NOT flat rectangles with text. They should contain nested elements: accent strips at the top, nested inner cards, geometric shapes, progress bars. Think Guild Grow (accent strip, clean interior with no inner borders) and Guild Academy (outer card with nested card + bar + image).
- **No internal card borders** — Inside a card, use spacing and background color shifts to create hierarchy — never inner outlines or dividers.
- **All text is black** — Every piece of text uses off-black (`text-foreground`). Subtitles, descriptions, metadata — all black. No grey text anywhere except input placeholders.
- **Mixed font weights inline** — Combine bold and normal weight within the same text line. Example: "Your Company's **Leadership Academy**". Use `<span>` and `<strong>` to vary weight mid-sentence.
- **Dark green as signature** — `guild-mint` (`#2D4A34`) is a dark forest green used for feature cards and accent blocks. Text and icons on it are always white.
- **Uniform marketing backgrounds** — All sections on marketing/landing pages share the same `bg-guild-cream`. No alternating section colors.
- The UI should feel like a tool built by people who understand construction finance — not a generic SaaS template.

### Typography Rules
- **Headlines:** Use `font-headline` (Manrope) for ALL headings, section titles, card titles, and monetary amounts.
- **Body:** Use `font-sans` (DM Sans) for paragraphs, labels, descriptions, form inputs.
- Never use the body font for headings or vice versa.
- Strong size contrast between hierarchy levels (minimum 1.5x ratio between adjacent levels).
- Micro-labels (category tags, status indicators): 10-11px, uppercase, wide tracking (`tracking-wider`).
- Currency/number displays: Always use `font-headline` with tight tracking (`tracking-tight`).
- **All text is black.** Never use grey for subtitles or descriptions. `text-foreground` everywhere.
- **Mix bold and normal weight** within the same line for card titles and descriptive text.

### Color Application
- Refer to `FRONTEND-DESIGN.md` for exact token values.
- **NEVER use raw hex/rgb values** — always use CSS variable tokens or Tailwind tokens.
- **Buttons:** `<Button variant="pill">` (dark off-black) for primary CTAs. `variant="pill-orange"` for secondary. Never hardcode button styles. Include arrow `→` in button text.
- **Feature cards:** `bg-guild-mint` with `text-white` text and `text-white text-3xl` icons. `rounded-2xl`.
- **Card grids:** Mix `bg-white`, `bg-guild-peach`, `bg-guild-mint`, `bg-guild-cream` — never all the same color.
- **Icons on dark backgrounds:** Always `text-white`. Never `text-guild-peach`.
- **Progress bars/success:** Use `secondary` (forest green).
- **Warnings/alerts:** Use `tertiary-fixed-dim` (amber) or `bg-guild-peach`.
- **Destructive:** Use `destructive` sparingly — only for irreversible actions. Pill style with hover fill.
- **All text is off-black** — no grey text for subtitles, descriptions, or metadata.

### Spatial Composition
- **Asymmetric grid layouts** — not all cards the same size.
- Dashboard pages: Use bento grid with varying col-spans on `grid-cols-12` (e.g., 5/7, 4/8, 8/4).
- Detail pages: Use 8/4 or 7/5 main/sidebar splits.
- Generous padding inside cards — `p-8` minimum for primary cards, `p-6` for secondary.
- Use negative space intentionally — not every area needs a card wrapper.
- Allow **floating text sections** (headings + subtext without card backgrounds) for page titles, section intros.
- Guild-inspired: **Mixed rectangle sizes**, some tall, some wide, creating visual variety.

### Card & Container Patterns

1. **Rounded corners on cards** — All cards use `rounded-2xl`. Buttons use `rounded-full`. Geometric accents (tags, strips) can use sharp corners for contrast.
2. **Accent strip cards (Guild Grow)** — Thin color strip (`h-2`) at the top of the card in `bg-primary`, `bg-guild-peach`, or `bg-guild-mint`. Card interior is clean with NO inner borders or dividers. Use spacing to separate content.
3. **Layered cards (Guild Academy)** — Outer card (`bg-guild-cream rounded-2xl p-6`) contains a nested inner card (`bg-white rounded-xl p-4`) with its own content. Include geometric elements: progress bars, images, colored tags.
4. **Geometric shape cards (Guild Navigator)** — Cards containing scattered/offset tag shapes (`bg-guild-cream rounded-lg px-3 py-1.5`). Mix rounded pills with rectangular tags. Some tags have accent backgrounds (`bg-primary text-white`).
5. **Mixed backgrounds in grids** — Alternate `bg-white`, `bg-guild-peach`, `bg-guild-mint` (dark green), `bg-guild-cream` within the same grid.
6. **Dark green feature cards** — `bg-guild-mint rounded-2xl` with `text-white` text and `text-white text-3xl` icons. Stacked vertically with `space-y-3`.
7. **No internal outlines** — Inside cards, separate content with spacing (`space-y-4`, `gap-4`), not borders or dividers. Card interiors are clean.
8. **Card grids** — Use `gap-3` or `gap-4` between cards. Never `gap-0` with shared borders.

**Icons in cards:** Float freely. NO `bg-*` wrappers. On light bg: `text-off-black` or `text-primary`. On dark bg: `text-white` always. Can be positioned geometrically at card corners or alongside accent shapes.
**Buttons:** Use `<Button variant="pill">` component. Never hardcode button classes. Position buttons at bottom-left of cards, not centered. Include `→` arrow in button text.
**Decorative backgrounds:** Flowing SVG `<path>` arcs in primary orange at low opacity. Never blurs, gradients, or diagonal stripes.
**AVOID:** Thin borders, grey text on subtitles, icon backgrounds, shadows, uniform card colors, flat/boring cards without layered elements, centered buttons in cards.

### Motion & Micro-interactions
- Hover on buttons: `hover:bg-transparent hover:text-off-black transition-colors`.
- `active:scale-[0.98]` on buttons (brief press feedback).
- `group-hover` effects for linked elements (arrow slides, text underlines).
- `transition-all duration-200` as default transition.
- **NO:** Excessive animations, bounce effects, slide-in entrance animations, parallax, confetti.

### Data Visualization (Fintech-Specific)
- **Budget progress bars:** `rounded-full`, `h-1.5`, colored by status:
  - Under 80%: `bg-secondary` (green)
  - 80-100%: `bg-tertiary-fixed-dim` (amber)
  - Over 100%: `bg-destructive` (red)
- **Currency amounts:** Always use `formatCurrency()` from `lib/utils.ts`, display with `font-headline`.
- **Percentage badges:** Small, bold, colored by threshold.
- **Tables:** Clean horizontal dividers only (`divide-y divide-outline-variant/10`), generous row padding, `hover:bg-muted/30`, vendor initials as avatar squares (`w-8 h-8 rounded-lg bg-accent`).

### Edge Cases — ALWAYS Handle These

**Empty state:**
```tsx
<div className="text-center py-12">
  <Icon name="[contextual_icon]" className="text-foreground/30 mb-3" size={48} />
  <p className="text-sm font-medium text-foreground mb-1">[Primary message]</p>
  <p className="text-xs text-foreground mb-4">[Supporting context]</p>
  <Link href="[action_path]" className="text-sm font-semibold text-primary hover:underline">
    [CTA text] →
  </Link>
</div>
```

**Loading state:**
- Skeleton placeholders that match the actual content layout shape.
- Use `animate-pulse` on `bg-surface-container rounded-2xl` rectangles.
- Never show a generic spinner for page-level loading.

**Error state:**
```tsx
<div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 flex items-center gap-4">
  <Icon name="error" className="text-destructive" />
  <div>
    <p className="text-sm font-bold text-destructive">[Error title]</p>
    <p className="text-xs text-foreground">[Recovery instruction]</p>
  </div>
  <Button variant="outline" size="sm" className="ml-auto">Retry</Button>
</div>
```

**First-time user vs returning user:**
- Dashboard with 0 projects: Show an onboarding card (layered card pattern with accent strip) with illustration and "Create your first project →" CTA.
- Dashboard with 1+ projects: Show standard metrics + recent transactions.
- Never show "No data" as the only content — always provide a forward path.

## Modern Coding Standards (2026)

### CSS Modules — All Styles in Stylesheets
This project uses **CSS Modules** (`.module.css` files) with `@apply` for all page and component styling. Inline Tailwind class strings in JSX are prohibited except for one-off layout utilities (e.g., `className="w-full"`).

**File structure:**
- `styles/shared.module.css` — shared patterns reused across pages (eyebrow, card, table, progress bar, auth, etc.)
- `app/<route>/page.module.css` or `<name>.module.css` — page-specific styles co-located with the page

**How to use:**
```tsx
import s from "./dashboard.module.css";
import shared from "@/styles/shared.module.css";
import { cn } from "@/lib/utils";

<main className={shared.dashboardPage}>
  <p className={shared.eyebrow}>Dashboard</p>
  <div className={cn(s.kpiCell, "bg-guild-peach", i < 3 && s.kpiCellBorderRight)}>
```

**Rules:**
- Define all visual patterns as CSS Module classes using `@apply` with Tailwind utilities
- Import as `s` (page-specific) and `shared` (shared patterns)
- Use `cn()` to compose multiple module classes or add conditional dynamic classes (like background colors from data)
- Use `composes:` within CSS Modules for class inheritance
- `style={{}}` is ONLY for dynamic computed values (e.g., progress bar width percentages)
- Check `styles/shared.module.css` FIRST before creating new classes — many common patterns already exist

### No Hardcoded Styles — Use the Design System
- **NEVER write long Tailwind class strings inline in JSX.** Extract to CSS Module classes.
- **NEVER use inline `style={{}}` props** for static values. Only use `style` for truly dynamic, computed values (e.g., progress bar widths from calculations).
- **NEVER use raw hex/rgb values** in JSX — always reference CSS variable tokens (`text-primary`, `bg-guild-cream`) or Tailwind config tokens.
- **Use Button component variants** for all buttons. The project's `Button` component uses CVA — add new variants there instead of writing raw class strings. Available variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `text-cta`, `pill`, `pill-orange`, `pill-destructive`.
- **Use Card component** for all card patterns. Don't recreate card borders/padding manually.

### Component Architecture
- **Server Components by default.** Every component is a Server Component unless it needs interactivity. Only add `"use client"` to leaf components that handle clicks, forms, or browser APIs.
- **Push `"use client"` down.** Don't put `"use client"` on layouts or page-level wrappers. Extract the interactive piece into its own client component and keep the parent as a Server Component.
- **Co-locate data fetching.** Fetch data directly in Server Components — no `useEffect` + `useState` for initial data loads.
- **Parallel data fetching.** Avoid sequential `await` chains when data is independent. Use `Promise.all()` or let sibling Server Components fetch in parallel.
- **Composition over prop-drilling.** Use children/slots for flexible component composition. Use Radix `Slot` pattern (like Button's `asChild`) for polymorphic behavior.

### Semantic HTML & Accessibility (WCAG 2.2)
- **Always use semantic elements:** `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<article>` where appropriate.
- **Every page must have a `<main>` landmark** wrapping primary content for screen reader navigation.
- **Use `<button>` for actions, `<a>`/`<Link>` for navigation.** Never use `<div onClick>`.
- **All interactive elements must have 44x44px minimum touch targets.**
- **Color contrast:** 4.5:1 minimum for normal text, 3:1 for large text.
- **Keyboard navigation:** All interactive elements reachable via Tab, activatable via Enter/Space.
- **Alt text on all images.** Decorative images get `alt=""`. Informational images get descriptive alt text.
- **Respect `prefers-reduced-motion`** — keep transitions subtle and functional.

### Image Optimization
- **Always provide `sizes` attribute** on `next/image` with `fill` prop. Example: `sizes="(max-width: 768px) 100vw, 50vw"`.
- **Use `priority` only for above-the-fold LCP images** (hero images). All other images lazy-load by default.
- **Specify `width` and `height`** on non-fill images to prevent layout shift.

### TypeScript
- **Type component props with `interface`** (prefer `interface` over `type` for props — they're extendable).
- **Type all state explicitly:** `useState<User | null>(null)`.
- **Never use `any`** — prefer `unknown` with type narrowing.
- **Don't use `React.FC`** — declare functions directly with typed props.
- **Use Zod** for runtime validation at system boundaries (API responses, form data).

### File Organization
- **Route files only in `app/`** — pages, layouts, loading, error, not-found.
- **Shared components in `components/`** — `ui/` for primitives, `layout/` for shell, `features/` for domain-specific.
- **Every route group should have `loading.tsx` and `error.tsx`** for proper streaming and error boundaries.
- **Co-locate feature-specific components** near the routes that use them if they're not shared.

### CSS & Tailwind Patterns
- **Single source of truth for colors.** Semantic tokens live in CSS variables (`:root` in `globals.css`). Guild palette tokens live in `tailwind.config.ts`. Never define the same color in both places.
- **Use `cn()` utility** (clsx + tailwind-merge) for conditional class composition.
- **Prefer component extraction over `@apply`** — if you need a reusable style, make a component.
- **Keep class strings readable.** If a className exceeds ~120 characters, extract it to a variable or component variant.

## Anti-Patterns — NEVER Do These

**Borders & Shapes:**
- Box shadows on anything — `shadow-soft` is `none`
- Thin gray borders as the primary differentiator — use background color, accent strips, and layered interiors
- Internal borders/dividers inside cards — use spacing to separate content

**Text:**
- Grey text on subtitles or descriptions — ALL text is black (`text-foreground`)
- Uniform font weight in headings — mix bold and normal weight within the same line
- `text-muted-foreground` for any visible text — only for input placeholders

**Icons:**
- Icons inside colored circles/squares (`bg-primary/10 rounded-md`) — icons float freely
- `text-guild-peach` for icons on dark backgrounds — always `text-white`
- Small icons on feature cards — use `text-3xl` minimum

**Colors & Backgrounds:**
- Alternating section background colors on marketing pages — all sections use uniform `bg-guild-cream`
- Using light/pastel green — `guild-mint` is dark forest green `#2D4A34`
- Using `gap-0` with shared borders — use `gap-3`/`gap-4` with individual cards
- Hardcoded hex/rgb values in JSX — use design tokens

**Cards:**
- Flat, boring cards with just text — cards should be layered with accent strips, nested elements, geometric shapes
- Centering buttons in cards — buttons sit at bottom-left with `→` arrows

**Patterns:**
- Diagonal stripe patterns for decorative backgrounds — use flowing SVG curve arcs instead
- Blur blobs (`bg-white/5 rounded-full blur-3xl`) — never
- Floating metric overlays on images
- Check-circle trust badges or "Powered by" icon grids
- Hardcoding button styles — use `<Button variant="pill|pill-orange|pill-destructive">`
- "AI slop" aesthetics: generic hero sections, uniform card grids, vague subheadings
- Gradient backgrounds, decorative SVG blobs, abstract floating shapes

## Icon System

Use **Material Symbols Outlined** exclusively via the `<Icon />` component from `components/ui/icon.tsx`.
- Default: `FILL 0, wght 400, GRAD 0, opsz 24`
- Active/selected states: `FILL 1`
- Do NOT use lucide-react or other icon libraries — keep the system unified.
- Icons should be minimal but intentional — every icon must add clarity, not decoration.
- Icons can be positioned geometrically within cards for compositional interest.
