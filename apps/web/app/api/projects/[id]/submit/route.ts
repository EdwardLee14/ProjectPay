import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    if (user.role !== "CONTRACTOR") {
      return NextResponse.json(
        { error: "Only contractors can submit projects for approval" },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { contractorId: true, status: true, clientId: true, clientEmail: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (project.status !== "DRAFT" && project.status !== "COUNTER_PROPOSED") {
      return NextResponse.json(
        { error: `Cannot submit project with status ${project.status}` },
        { status: 409 }
      );
    }

    if (!project.clientId && !project.clientEmail) {
      return NextResponse.json(
        { error: "A client email is required before submitting for approval" },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: { status: "PENDING_APPROVAL", counterBudget: null },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects/[id]/submit]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
