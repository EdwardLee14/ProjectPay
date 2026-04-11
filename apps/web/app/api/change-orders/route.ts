import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  createChangeOrderSchema,
  approveRejectSchema,
} from "@projectpay/shared/validation";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

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

    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId },
      include: { requester: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(changeOrders);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unauthorized: no user found"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/change-orders]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createChangeOrderSchema.parse(await req.json());

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { contractorId: true, clientId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const changeOrder = await prisma.changeOrder.create({
      data: {
        projectId: body.projectId,
        budgetCategoryId: body.budgetCategoryId,
        requestedBy: user.id,
        amount: body.amount,
        reason: body.reason,
      },
    });

    return NextResponse.json(changeOrder, { status: 201 });
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
    console.error("[POST /api/change-orders]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = approveRejectSchema.parse(await req.json());

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id: body.id },
      include: { project: true },
    });

    if (!changeOrder) {
      return NextResponse.json(
        { error: "Change order not found" },
        { status: 404 }
      );
    }

    if (changeOrder.project.clientId !== user.id) {
      return NextResponse.json(
        { error: "Only the client can approve or reject change orders" },
        { status: 403 }
      );
    }

    if (changeOrder.status === "COUNTERED") {
      return NextResponse.json(
        { error: "This change order has a counter offer — use /accept-counter or /reject-counter" },
        { status: 409 }
      );
    }

    if (changeOrder.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending change orders can be approved or rejected" },
        { status: 400 }
      );
    }

    if (body.status === "APPROVED") {
      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.changeOrder.update({
          where: { id: body.id },
          data: { status: "APPROVED", resolvedAt: new Date() },
        });
        await tx.project.update({
          where: { id: changeOrder.projectId },
          data: { totalBudget: { increment: changeOrder.amount } },
        });
        if (changeOrder.budgetCategoryId) {
          await tx.budgetCategory.update({
            where: { id: changeOrder.budgetCategoryId },
            data: { allocatedAmount: { increment: changeOrder.amount } },
          });
        }
        return result;
      });
      return NextResponse.json(updated);
    }

    const updated = await prisma.changeOrder.update({
      where: { id: body.id },
      data: { status: "REJECTED", resolvedAt: new Date() },
    });

    return NextResponse.json(updated);
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
    console.error("[PATCH /api/change-orders]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
