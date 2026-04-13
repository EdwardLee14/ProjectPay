import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  clientEmail: z.string().email().optional().nullable().or(z.literal("")),
});

const CANCELLABLE_STATUSES = ["DRAFT", "PENDING_APPROVAL", "PENDING_FUNDING"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const data = updateProjectSchema.parse(body);

    // Verify contractor owns this project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (project.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot edit a cancelled project" },
        { status: 409 }
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        clientEmail: true,
        totalBudget: true,
        fundedAmount: true,
        createdAt: true,
        updatedAt: true,
        budgetCategories: {
          select: {
            id: true,
            name: true,
            allocatedAmount: true,
            spentAmount: true,
          },
        },
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
    console.error("[PATCH /api/projects/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verify contractor owns this project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!CANCELLABLE_STATUSES.includes(project.status)) {
      return NextResponse.json(
        { error: `Cannot cancel project with status ${project.status}` },
        { status: 409 }
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        status: "CANCELLED",
        closedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
        closedAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/projects/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
