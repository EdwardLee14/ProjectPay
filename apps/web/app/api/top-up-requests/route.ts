import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

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
      select: { contractorId: true, clientId: true, status: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const topUpRequests = await prisma.topUpRequest.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        projectId: true,
        budgetCategoryId: true,
        requestedAmount: true,
        reason: true,
        status: true,
        requestedBy: true,
        createdAt: true,
        resolvedAt: true,
        budgetCategory: {
          select: { id: true, name: true },
        },
        requester: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(topUpRequests);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/top-up-requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createSchema = z.object({
  projectId: z.string().min(1),
  budgetCategoryId: z.string().min(1),
  requestedAmount: z.number().positive(),
  reason: z.string().min(1).max(500),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());

    if (user.role !== "CONTRACTOR") {
      return NextResponse.json(
        { error: "Only contractors can create top-up requests" },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: {
        contractorId: true,
        clientId: true,
        status: true,
        budgetCategories: { select: { id: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (project.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Project must be active to request a top-up" },
        { status: 400 }
      );
    }

    const categoryBelongsToProject = project.budgetCategories.some(
      (cat) => cat.id === body.budgetCategoryId
    );
    if (!categoryBelongsToProject) {
      return NextResponse.json(
        { error: "Budget category does not belong to this project" },
        { status: 400 }
      );
    }

    const topUpRequest = await prisma.topUpRequest.create({
      data: {
        projectId: body.projectId,
        budgetCategoryId: body.budgetCategoryId,
        requestedAmount: body.requestedAmount,
        reason: body.reason,
        requestedBy: user.id,
      },
      select: {
        id: true,
        projectId: true,
        budgetCategoryId: true,
        requestedAmount: true,
        reason: true,
        status: true,
        requestedBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json(topUpRequest, { status: 201 });
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
    console.error("[POST /api/top-up-requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const approveRejectSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const topUp = await prisma.topUpRequest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!topUp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (topUp.requestedBy !== user.id) {
      return NextResponse.json({ error: "Only the requester can delete" }, { status: 403 });
    }

    if (topUp.status !== "PENDING") {
      return NextResponse.json({ error: "Only pending requests can be deleted" }, { status: 400 });
    }

    await prisma.topUpRequest.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/top-up-requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = approveRejectSchema.parse(await req.json());

    const topUpRequest = await prisma.topUpRequest.findUnique({
      where: { id: body.id },
      select: {
        id: true,
        projectId: true,
        budgetCategoryId: true,
        requestedAmount: true,
        status: true,
        project: {
          select: { clientId: true },
        },
      },
    });

    if (!topUpRequest) {
      return NextResponse.json(
        { error: "Top-up request not found" },
        { status: 404 }
      );
    }

    if (topUpRequest.project.clientId !== user.id) {
      return NextResponse.json(
        { error: "Only the client can approve or reject top-up requests" },
        { status: 403 }
      );
    }

    if (topUpRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be approved or rejected" },
        { status: 400 }
      );
    }

    if (body.status === "APPROVED") {
      const [updated] = await prisma.$transaction([
        prisma.topUpRequest.update({
          where: { id: body.id },
          data: { status: "APPROVED", resolvedAt: new Date() },
          select: {
            id: true,
            status: true,
            resolvedAt: true,
            requestedAmount: true,
          },
        }),
        prisma.budgetCategory.update({
          where: { id: topUpRequest.budgetCategoryId },
          data: {
            allocatedAmount: { increment: topUpRequest.requestedAmount },
          },
        }),
        prisma.project.update({
          where: { id: topUpRequest.projectId },
          data: {
            totalBudget: { increment: topUpRequest.requestedAmount },
          },
        }),
      ]);

      return NextResponse.json(updated);
    }

    const updated = await prisma.topUpRequest.update({
      where: { id: body.id },
      data: { status: "REJECTED", resolvedAt: new Date() },
      select: {
        id: true,
        status: true,
        resolvedAt: true,
      },
    });

    return NextResponse.json(updated);
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
    console.error("[PATCH /api/top-up-requests]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
