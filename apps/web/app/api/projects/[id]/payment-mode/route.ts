import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const paymentModeSchema = z.object({
  mode: z.enum(["WALLET", "AUTOPAY"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true, clientId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // TODO: Read from a paymentMode field once the schema migration is added
    return NextResponse.json({ mode: "WALLET" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects/[id]/payment-mode]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { mode } = paymentModeSchema.parse(body);

    // Verify contractor owns this project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // TODO: Persist payment mode once a paymentMode field is added to the Project schema
    return NextResponse.json({ mode, projectId: id });
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
    console.error("[POST /api/projects/[id]/payment-mode]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
