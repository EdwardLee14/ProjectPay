import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const alert = await prisma.budgetAlert.findUnique({
      where: { id },
      select: {
        id: true,
        acknowledgedAt: true,
        project: {
          select: { contractorId: true, clientId: true },
        },
      },
    });

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (alert.project.contractorId !== user.id && alert.project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (alert.acknowledgedAt) {
      return NextResponse.json(
        { error: "Alert already acknowledged" },
        { status: 400 }
      );
    }

    const updated = await prisma.budgetAlert.update({
      where: { id },
      data: { acknowledgedAt: new Date() },
      select: {
        id: true,
        acknowledgedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PATCH /api/budget-alerts/[id]/acknowledge]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
