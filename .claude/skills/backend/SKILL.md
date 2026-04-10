# Backend Coding Practices Skill

## Trigger
Activate when creating, modifying, or reviewing any API route handler, server action, database query, Stripe integration, webhook handler, or server-side logic in this project.

## Before You Write Any Backend Code

1. **Read `.claude/OVERVIEW.md`** to ground yourself in the product's mission. VisiBill is a fintech platform handling real money through Stripe Issuing. Contractors swipe virtual cards tied to approved budgets; clients watch every dollar move in real time. Every backend decision — validation, error handling, authorization, data shape — carries financial consequences. A missed validation could allow overspend. A leaked field could expose payment data. A race condition could double-process a transaction. Code defensively: this is not a toy app.
2. **Check `packages/shared/src/validation/`** for existing Zod schemas before writing any new validation. Schemas already exist for projects, change orders, top-ups, and auth/onboarding.
3. **Check `apps/web/lib/`** for existing utilities — `auth.ts` (authentication), `prisma.ts` (DB client), `stripe.ts` (Stripe SDK), `supabase/` (Supabase clients).
4. **Check existing route handlers** in `apps/web/app/api/` for established patterns before introducing new conventions.
5. **Check `packages/shared/src/`** for existing types (`types/models.ts`), constants (`constants/`), and utilities (`utils/`) before creating new ones.

## Route Handler Architecture

### Execution Order
Every protected route handler must follow this exact sequence:

```
authenticate -> validate input -> authorize -> execute -> respond
```

Never reorder these steps. Authorization checks must happen AFTER input validation (you need parsed data to check ownership) and BEFORE any database mutations.

### Canonical Route Handler Template

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createChangeOrderSchema } from "@projectpay/shared/validation";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Validate input
    const body = await req.json();
    const data = createChangeOrderSchema.parse(body);

    // 3. Authorize
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { id: true, contractorId: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Execute
    const changeOrder = await prisma.changeOrder.create({
      data: {
        projectId: data.projectId,
        requesterId: user.id,
        amount: data.amount,
        reason: data.reason,
      },
      select: {
        id: true,
        amount: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    // 5. Respond
    return NextResponse.json(changeOrder, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[POST /api/change-orders]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Input Validation

### Always Validate with Zod
Every request body and query parameter MUST be validated at runtime using Zod schemas. Type assertions (`as { ... }`) provide zero runtime safety and are prohibited as a substitute for validation.

**Request bodies:**
```typescript
import { createProjectSchema } from "@projectpay/shared/validation";

const body = await req.json();
const data = createProjectSchema.parse(body); // throws ZodError if invalid
```

**Query parameters:**
```typescript
import { z } from "zod";

const querySchema = z.object({
  projectId: z.string().uuid(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const params = querySchema.parse(
  Object.fromEntries(req.nextUrl.searchParams)
);
```

**Zod error responses:**
```typescript
if (error instanceof ZodError) {
  return NextResponse.json(
    { error: "Validation failed", details: error.flatten().fieldErrors },
    { status: 400 }
  );
}
```

### Schema Location
- **Shared schemas** (used by web + future mobile): `packages/shared/src/validation/`
- **Route-specific schemas** (query params, internal-only shapes): co-locate in the route file or a nearby `schemas.ts`
- Use `z.infer<typeof schema>` to derive TypeScript types from schemas — never maintain parallel type definitions.

## Data Access Layer (DAL)

### Why
Direct Prisma calls in route handlers mix data access with HTTP concerns. As the app grows, this leads to duplicated queries, inconsistent field selection, and authorization checks scattered across routes.

### Structure
Place DAL functions in `apps/web/lib/dal/` organized by domain:

```
apps/web/lib/dal/
  projects.ts      # Project queries and mutations
  change-orders.ts # Change order queries and mutations
  transactions.ts  # Transaction queries
  users.ts         # User queries
  index.ts         # Re-exports
```

### Rules
1. **Mark server-only.** Every DAL file must start with `import 'server-only'` to prevent accidental client bundling.
2. **Accept authenticated user.** DAL functions receive the authenticated user as a parameter — they don't call `requireUser()` themselves (the route handler does that).
3. **Return plain objects.** Use Prisma `select` to return only needed fields. Never return raw Prisma model instances with all fields — especially not `supabaseId`, tokens, or internal IDs that clients don't need.
4. **Handle Prisma errors.** Catch Prisma-specific error codes and translate them into meaningful results:
   - `P2002` (unique constraint) -> return `null` or throw a domain-specific error
   - `P2025` (record not found) -> return `null`
5. **Encapsulate complex queries.** Multi-step operations (e.g., approve change order + update budget + create transaction) belong in DAL functions, wrapped in `prisma.$transaction()` when atomicity is required.

### Example DAL Function

```typescript
// apps/web/lib/dal/projects.ts
import "server-only";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export async function getProjectsForUser(user: User) {
  const where =
    user.role === "CONTRACTOR"
      ? { contractorId: user.id }
      : { clientId: user.id };

  return prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      totalBudget: true,
      status: true,
      createdAt: true,
      budgetCategories: {
        select: {
          id: true,
          name: true,
          allocatedAmount: true,
          spentAmount: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

## Error Handling

### Response Shape
All error responses must follow this structure:

```typescript
{ error: string }                                    // Simple errors
{ error: string, details: Record<string, string[]> } // Validation errors (Zod)
{ error: string, code: string }                      // Machine-readable errors
```

### HTTP Status Code Map

| Status | When to Use |
|--------|-------------|
| `200`  | Successful read or update |
| `201`  | Successful resource creation |
| `400`  | Invalid input (Zod validation failure, malformed request) |
| `401`  | Not authenticated (no valid session) |
| `403`  | Authenticated but not authorized (wrong role, not owner) |
| `404`  | Resource not found |
| `409`  | Conflict (duplicate, state transition violation) |
| `500`  | Unexpected server error |

### Error Handling Rules
- **Never expose stack traces** or internal error messages to clients. Log them server-side, return a generic message.
- **Always log errors** with route context: `console.error("[METHOD /api/route]", error)`.
- **Catch Prisma errors** by checking `error.code`:
  ```typescript
  import { Prisma } from "@prisma/client";

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Resource already exists", code: "DUPLICATE" }, { status: 409 });
    }
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
  }
  ```
- **Never swallow errors** with empty catch blocks. At minimum, log and return 500.

## Authentication & Authorization

### Authentication
- Use `requireUser()` from `lib/auth.ts` for all protected routes. It returns the authenticated `User` or throws.
- Public routes (webhooks, client access token routes) skip `requireUser()` but must have their own verification (e.g., Stripe signature, token lookup).

### Authorization Patterns

**Role-based:**
```typescript
if (user.role !== "CONTRACTOR") {
  return NextResponse.json({ error: "Only contractors can create projects" }, { status: 403 });
}
```

**Ownership-based (always check both role AND ownership):**
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  select: { contractorId: true, clientId: true },
});

if (!project) {
  return NextResponse.json({ error: "Project not found" }, { status: 404 });
}

// Check ownership — don't just check role
const isOwner =
  (user.role === "CONTRACTOR" && project.contractorId === user.id) ||
  (user.role === "CLIENT" && project.clientId === user.id);

if (!isOwner) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

**State-based (prevent invalid transitions):**
```typescript
if (project.status !== "ACTIVE") {
  return NextResponse.json(
    { error: "Change orders can only be submitted on active projects" },
    { status: 409 }
  );
}
```

## Stripe & Webhook Security

### Webhook Handlers
1. **Always verify signatures** using `stripe.webhooks.constructEvent()`:
   ```typescript
   const signature = req.headers.get("stripe-signature");
   if (!signature) {
     return NextResponse.json({ error: "Missing signature" }, { status: 400 });
   }

   const body = await req.text();
   const event = stripe.webhooks.constructEvent(
     body,
     signature,
     process.env.STRIPE_WEBHOOK_SECRET!
   );
   ```

2. **Make handlers idempotent.** Stripe may deliver the same event multiple times. Before processing, check if the event has already been handled:
   ```typescript
   const existing = await prisma.transaction.findFirst({
     where: { stripeEventId: event.id },
   });
   if (existing) {
     return NextResponse.json({ received: true }); // Already processed
   }
   ```

3. **Store the Stripe event ID** on every record created from a webhook to enable idempotency checks.

4. **Never fulfill based on redirects.** Always use webhooks for confirming payments, card creation, and transaction recording. Redirect URLs are for UX, not business logic.

### Stripe Data Rules
- **Never store raw card numbers, CVVs, or PANs.** Store only Stripe object IDs (`card_xxx`, `pm_xxx`, `pi_xxx`).
- **Handle amounts in cents.** Stripe sends amounts in the smallest currency unit. Convert at the API boundary only:
  ```typescript
  const amountInDollars = Math.abs(transaction.amount) / 100;
  ```
- **Handle both string and object references.** Stripe webhook payloads may contain expanded objects or just IDs:
  ```typescript
  const cardId = typeof transaction.card === "string"
    ? transaction.card
    : transaction.card.id;
  ```

## Fintech-Specific Rules

### Monetary Values
- **Store all monetary values as integers (cents) in the database.** This avoids floating-point precision errors. Use `Int` in Prisma schema, not `Float` or `Decimal`.
- **Convert at the API boundary only.** Routes accept and return dollar amounts for client convenience; DAL and database operate in cents.
- **Use `formatCurrency()` from `@projectpay/shared`** for display formatting — never hand-roll currency strings.

### Budget Enforcement
- **Always re-check budget limits before approving spend.** Never trust cached or stale budget data for authorization decisions. Query the current `allocatedAmount` and `spentAmount` at decision time.
- **Use database transactions for budget mutations.** When approving a change order or processing a top-up, wrap the budget update and status change in `prisma.$transaction()` to prevent race conditions.
- **Enforce category caps at the application layer** in addition to card-level controls. Defense in depth.

### State Transitions
- **Validate state transitions explicitly.** Define allowed transitions and reject invalid ones:
  ```typescript
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ["PENDING_APPROVAL"],
    PENDING_APPROVAL: ["PENDING_FUNDING", "CANCELLED"],
    PENDING_FUNDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETE", "CANCELLED"],
  };

  if (!ALLOWED_TRANSITIONS[project.status]?.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from ${project.status} to ${newStatus}` },
      { status: 409 }
    );
  }
  ```

### Audit Trail
- Log all financial state transitions (project status changes, change order approvals, budget adjustments) with the acting user, timestamp, and previous/new values.
- Webhook-created records should store the Stripe event ID and event type for traceability.

## Database Patterns (Prisma)

### Query Optimization
- **Always use `select` or `include` explicitly.** Never fetch all fields when you only need a subset. This reduces data transfer and prevents leaking sensitive fields.
  ```typescript
  // Good
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, role: true },
  });

  // Bad — fetches supabaseId, stripeAccountId, deviceTokens, etc.
  const user = await prisma.user.findUnique({ where: { id } });
  ```

- **Avoid N+1 queries.** Use `include` to fetch related data in a single query instead of looping:
  ```typescript
  // Good — single query
  const projects = await prisma.project.findMany({
    where: { contractorId: user.id },
    include: { budgetCategories: true },
  });

  // Bad — N+1
  const projects = await prisma.project.findMany({ where: { contractorId: user.id } });
  for (const p of projects) {
    p.categories = await prisma.budgetCategory.findMany({ where: { projectId: p.id } });
  }
  ```

- **Use cursor-based pagination for lists.** Offset pagination degrades on large datasets:
  ```typescript
  const transactions = await prisma.transaction.findMany({
    where: { projectId },
    take: limit + 1, // Fetch one extra to detect hasMore
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
  });

  const hasMore = transactions.length > limit;
  const items = hasMore ? transactions.slice(0, -1) : transactions;
  ```

### Transactions
Use `prisma.$transaction()` for operations that must be atomic:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.changeOrder.update({
    where: { id: changeOrderId },
    data: { status: "APPROVED" },
  });

  await tx.budgetCategory.update({
    where: { id: categoryId },
    data: { allocatedAmount: { increment: amount } },
  });

  await tx.project.update({
    where: { id: projectId },
    data: { totalBudget: { increment: amount } },
  });
});
```

### Parallel Queries
When fetching independent data, use `Promise.all()`:
```typescript
const [project, changeOrders, transactions] = await Promise.all([
  prisma.project.findUnique({ where: { id: projectId } }),
  prisma.changeOrder.findMany({ where: { projectId } }),
  prisma.transaction.findMany({ where: { projectId } }),
]);
```

## TypeScript Standards

- **Never use `any`.** Prefer `unknown` with type narrowing, or use specific types.
- **Type function parameters and return types** on all exported functions.
- **Use `z.infer<typeof schema>`** to derive types from Zod schemas — don't maintain separate interfaces that duplicate schema definitions.
- **Use Prisma-generated types** for database entities. Import from `@prisma/client`.
- **Validate environment variables at startup**, not at usage sites:
  ```typescript
  // lib/env.ts
  import { z } from "zod";

  const envSchema = z.object({
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    DATABASE_URL: z.string().url(),
  });

  export const env = envSchema.parse(process.env);
  ```

## Performance

- **Use `select` to fetch only needed fields** — reduces payload size and prevents sensitive data leaks.
- **Use `Promise.all()`** for independent parallel queries within a single request.
- **Offload heavy computation** to background jobs or worker threads — never block the request thread with CPU-intensive work.
- **Use cursor-based pagination** for transaction feeds and other large, chronologically ordered lists.
- **Cache expensive, rarely-changing queries** (e.g., merchant category mappings) using Next.js `unstable_cache` or module-level variables.

## Anti-Patterns — NEVER Do These

**Validation:**
- `as { field: string }` type assertions on request bodies — always use Zod `.parse()`
- Trusting client-side validation as a security control — validate server-side independently
- Maintaining separate TypeScript interfaces that duplicate Zod schemas

**Data Access:**
- Direct `prisma.*` calls in route handler functions — use DAL functions
- `prisma.$queryRawUnsafe()` or `$executeRawUnsafe()` with user-provided input
- Fetching all fields when only a few are needed — always use `select`
- N+1 query loops — use `include` or batch queries

**Security:**
- Storing card numbers, CVVs, PANs, or raw payment data — store Stripe IDs only
- Fulfilling orders or activating cards based on redirect URLs — use webhooks
- Returning full Prisma objects that may contain `supabaseId`, tokens, or hashes
- `process.env.SECRET!` non-null assertions scattered across files — validate env vars at startup
- Empty catch blocks that swallow errors silently
- Exposing stack traces or internal error details in API responses

**Financial Logic:**
- Using floating-point arithmetic for monetary values — use integer cents
- Trusting cached budget amounts for spend authorization — always re-query
- Processing financial mutations without `prisma.$transaction()` for atomicity
- Skipping idempotency checks in webhook handlers
