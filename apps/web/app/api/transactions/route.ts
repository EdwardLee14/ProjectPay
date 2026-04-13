import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createTransactionSchema } from "@projectpay/shared/validation";
import { createTransaction } from "@/lib/dal/transactions";

const querySchema = z.object({
  projectId: z.string().min(1),
  budgetCategoryId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);

    const query = querySchema.parse({
      projectId: searchParams.get("projectId") ?? "",
      budgetCategoryId: searchParams.get("budgetCategoryId") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? 20,
    });

    const { projectId, budgetCategoryId, cursor, limit } = query;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { contractorId: true, clientId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = {
      projectId,
      ...(budgetCategoryId ? { budgetCategoryId } : {}),
    };

    const items = await prisma.transaction.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        budgetCategoryId: true,
        merchantName: true,
        amount: true,
        categoryCode: true,
        status: true,
        note: true,
        stripeTransactionId: true,
        stripeAuthorizationId: true,
        createdAt: true,
        budgetCategory: {
          select: { id: true, name: true },
        },
      },
    });

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

    return NextResponse.json({ data, hasMore, nextCursor });
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
    console.error("[GET /api/transactions]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Validate
    const body = await req.json();
    const data = createTransactionSchema.parse(body);

    // 3. Authorize
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
      select: { contractorId: true, clientId: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (project.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Transactions can only be added to active projects" },
        { status: 409 }
      );
    }

    // 4. Execute
    const result = await createTransaction({
      projectId: data.projectId,
      merchantName: data.merchantName,
      amount: data.amount,
      budgetCategoryId: data.budgetCategoryId ?? null,
      categoryCode: data.categoryCode,
      note: data.note ?? null,
      userId: user.id,
      receipt: data.receipt
        ? {
            storagePath: data.receipt.storagePath,
            fileName: data.receipt.fileName,
            mimeType: data.receipt.mimeType,
            parsedData: data.receipt.parsedData,
          }
        : undefined,
    });

    // 5. Respond
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      error.message === "Unauthorized: no user found"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/transactions]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
