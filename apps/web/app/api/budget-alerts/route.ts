import { NextRequest, NextResponse } from "next/server";
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
      select: { contractorId: true, clientId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const alerts = await prisma.budgetAlert.findMany({
      where: { projectId },
      orderBy: { triggeredAt: "desc" },
      select: {
        id: true,
        projectId: true,
        budgetCategoryId: true,
        alertType: true,
        triggeredAt: true,
        acknowledgedAt: true,
        budgetCategory: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/budget-alerts]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
