import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const fundProjectSchema = z.object({
  paymentMethodId: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    fundProjectSchema.parse(body);

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

    if (project.status !== "PENDING_FUNDING") {
      return NextResponse.json(
        { error: `Project status must be PENDING_FUNDING, got ${project.status}` },
        { status: 409 }
      );
    }

    // TODO: Stripe Issuing — create cardholder, create card, fund project
    return NextResponse.json(
      { error: "Stripe funding not yet implemented" },
      { status: 501 }
    );
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
    console.error("[POST /api/projects/[id]/fund]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
