import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { getProjectStripeInfo, updateProjectStatus } from "@/lib/dal/projects";
import { rejectProjectSchema } from "@projectpay/shared";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = rejectProjectSchema.parse(await req.json());

    const project = await getProjectStripeInfo(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.clientId !== user.id) {
      return NextResponse.json({ error: "Only the client can reject the project" }, { status: 403 });
    }
    if (project.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `Cannot reject a project with status ${project.status}` },
        { status: 409 }
      );
    }

    const updated = await updateProjectStatus(id, { status: "DRAFT" });
    return NextResponse.json({ ...updated, reason: body.reason ?? null });
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
    console.error("[POST /api/projects/[id]/reject]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
