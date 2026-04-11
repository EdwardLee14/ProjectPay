import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getProjectStripeInfo, updateProjectStatus } from "@/lib/dal/projects";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const project = await getProjectStripeInfo(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.clientId !== user.id) {
      return NextResponse.json({ error: "Only the client can approve the project" }, { status: 403 });
    }
    if (project.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `Cannot approve a project with status ${project.status}` },
        { status: 409 }
      );
    }

    const updated = await updateProjectStatus(id, { status: "PENDING_FUNDING" });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects/[id]/approve]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
