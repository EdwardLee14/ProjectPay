# Frontend Design Skill

## Trigger
Activate when creating, modifying, or reviewing any React component, page, layout, or CSS/Tailwind styling in this project.

## Before You Write Any UI Code

1. **Read `.claude/OVERVIEW.md`** — ground yourself in VisiBill's mission: real-time financial transparency for contractors.
2. **Read `.claude/FRONTEND-DESIGN.md`** — the authoritative design spec. Every component, color, and layout rule lives there.
3. **Identify the PURPOSE** — who uses this screen (contractor or client), what decision does it support?
4. **Choose the LAYOUT** — most screens use master-detail. Full-width only for dashboard and standalone tables.
5. **Check for REUSE** — does a component or CSS Module class already exist in `components/` or `styles/shared.module.css`?

## Design System Summary

### Layout Pattern: Twilio CRM
The app follows the Twilio CRM template structure:
- **White sidebar** (52px collapsed / 200px expanded) with icon navigation, `border-r` divider
- **Warm orange top nav** (h-14, `#D4792A`) with white logo, white icons, avatar
- **White content area** — NO grey canvas, NO floating elevated cards
- **Master-detail** as the primary pattern: left list panel (380px, scrollable, searchable, filterable) + right detail panel (tabbed sections with field grids)

### Color: Single Accent
- **Primary:** `#E7651C` (peach/orange) — the only accent color
- **Top nav:** `#D4792A` (warm burnt orange — muted, professional, not neon)
- **Sidebar:** white with `border-r`
- **All text:** `#170B01` (off-black)
- **Sub-text:** `text-off-black/40`
- **Backgrounds:** pure white. No grey canvas.
- **NEVER** use blue, green, or multi-color accents

### Typography
- **Headlines:** Manrope (600-800 weight) — page titles, entity names, KPI values, monetary amounts
- **Body:** DM Sans (400-700 weight) — labels, descriptions, form inputs
- **Field labels are always bold** — this is the key Twilio CRM pattern
- **Section headers are plain bold text** — NO icons

### Key Components (from Twilio CRM)

**Filter pills:** `rounded-full` pills in horizontal row. Active = `bg-primary text-white`. Used on every list view.

**List items:** Avatar circle + name (bold) + subtitle (muted). Selected = `bg-peach-100 border-l-4 border-primary`.

**Sidebar items:** Icon + optional label. Active = `text-primary border-l-4 border-primary`. Hover = `bg-peach-50`. White background.

**Tab strip:** Horizontal tabs with `border-b`. Active = `text-primary border-b-2 border-primary`.

**Field grid:** 2-3 column grid. Bold label above normal value. The primary way to display entity data.

**Info banner:** `bg-peach-50 border-l-4 border-primary` with icon. For contextual alerts.

**Action icon buttons:** Circular, bordered buttons in detail panel header (phone, settings, email pattern → adapted to project-specific actions).

**Confirmation modals:** Centered on `bg-black/50` overlay. Title + body + Cancel/Confirm buttons.

**Activity timeline:** Vertical timeline with colored dots per event type. Used in dashboard, client history, project history.

### VisiBill-Specific Screen Mapping

| Screen | Layout | List Filter Pills | Detail Tabs |
|--------|--------|-------------------|-------------|
| Dashboard | Full-width | — | — |
| Projects | Master-detail | All / Active / Completed / Pending | Overview / Budget / Transactions / Change Orders |
| Clients | Master-detail | All / Homeowners / Property Mgrs / Business | Details / Projects / Activity |
| Transactions | Full-width table | All / This Week / This Month / Flagged | — |
| Virtual Cards | Grid/stack | — | — |
| Settings | Full-width | — | Tabs for sections |

### Buttons
- `rounded-lg` on all buttons — NOT `rounded-full`, NOT `rounded-xl`
- Primary: `bg-primary text-white`
- Destructive: outlined with burnt orange icon + text, NOT filled red
- Ghost: no background, hover reveals `bg-peach-50`

### Status Colors (peach family only)
- Normal: `bg-primary/20 text-primary`
- Warning: `bg-primary text-white`
- Critical: `bg-peach-800/10 text-peach-800`

## Coding Standards

### CSS Modules
All styling in `.module.css` files with `@apply`. No inline Tailwind in JSX.
```tsx
import s from "./projects.module.css";
import shared from "@/styles/shared.module.css";
```

### Server Components by Default
Only interactive leaves use `"use client"`. Data fetching in Server Components.

### Icons
Material Symbols Outlined via `<Icon />` only. No lucide-react.

## CRITICAL: No Vibe Coding

This is the most important rule. Every screen must look like it was built by a product team at a real fintech company — dense, professional, information-first. If a screen looks like it could be a Dribbble shot, a landing page, or an AI-generated mockup, it is wrong.

**Zero tolerance for:** hero sections, gradient blobs, glassmorphism, oversized padding, centered single-column layouts, decorative illustrations, motivational copy ("Welcome back!"), emoji as UI, large rounded corners (max `rounded-lg`), or any pattern where whitespace exceeds content.

**The test:** Can a contractor glance at this screen on a job site and get the information they need in 2 seconds? If not, it's too decorative.

## Edge Cases — ALWAYS Handle

**Empty state:** Icon (muted) + primary message (bold) + supporting context (muted) + CTA link. Never show a blank screen.

**Loading state:** Skeleton placeholders matching the actual content layout. Use `animate-pulse` on `bg-muted rounded` rectangles. Never a generic spinner.

**Error state:** `bg-destructive/5 rounded-lg p-4` with icon + error title (bold) + recovery instruction + retry button.

**First-time user:** Dashboard with 0 projects shows an onboarding prompt with CTA to create first project. Never show empty metrics.

## Anti-Patterns — NEVER Do These

- Grey canvas background — use white
- Dark navy sidebar — sidebar is white with border-r
- Neon/bright orange top nav — use muted `#D4792A`, not `#E7651C`
- Hero sections, gradient blobs, glassmorphism, oversized padding
- Centered single-column layouts — content fills available space
- Motivational copy, emoji as UI, decorative illustrations
- Large rounded corners (rounded-2xl+) — max is rounded-lg
- Any screen with more whitespace than content
- Shadow-elevation floating cards — use flat sections or bordered containers
- Blue accents — peach/orange only
- Icons next to section headers — plain text
- `rounded-full` on buttons — use `rounded-lg`
- Uppercase labels — sentence case
- Single-panel list without detail — always pair with detail panel
- Decorative blobs, gradients, blur effects
- Inline Tailwind strings in JSX — use CSS Modules