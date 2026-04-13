import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  allocatedAmount: z.number().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Validate
    const body = await req.json();
    const data = updateSchema.parse(body);

    // 3. Authorize
    const category = await prisma.budgetCategory.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        project: { select: { contractorId: true, clientId: true, status: true } },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (
      category.project.contractorId !== user.id &&
      category.project.clientId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Execute
    const updated = await prisma.budgetCategory.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.allocatedAmount !== undefined && { allocatedAmount: data.allocatedAmount }),
      },
      select: {
        id: true,
        name: true,
        allocatedAmount: true,
        spentAmount: true,
      },
    });

    // 5. Respond
    return NextResponse.json({
      ...updated,
      allocatedAmount: Number(updated.allocatedAmount),
      spentAmount: Number(updated.spentAmount),
    });
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
    console.error("[PATCH /api/budget-categories/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
