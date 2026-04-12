import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const respondSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

// Contractor accepts or rejects the client's counter-proposal.
// Accept: update totalBudget to counterBudget, move back to PENDING_APPROVAL
//         so the client still has to click Approve to issue the card.
// Reject: move back to DRAFT so contractor can edit and resubmit.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    if (user.role !== "CONTRACTOR") {
      return NextResponse.json(
        { error: "Only contractors can respond to counter-proposals" },
        { status: 403 }
      );
    }

    const body = respondSchema.parse(await req.json());

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { contractorId: true, status: true, counterBudget: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (project.status !== "COUNTER_PROPOSED") {
      return NextResponse.json(
        { error: `Project must be COUNTER_PROPOSED, got ${project.status}` },
        { status: 409 }
      );
    }

    if (body.action === "reject") {
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: { status: "DRAFT", counterBudget: null },
        select: { id: true, status: true },
      });
      return NextResponse.json(updated);
    }

    // Accept: apply counter budget and put back in PENDING_APPROVAL
    if (!project.counterBudget) {
      return NextResponse.json(
        { error: "No counter budget found" },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        totalBudget: project.counterBudget,
        counterBudget: null,
        status: "PENDING_APPROVAL",
      },
      select: { id: true, status: true, totalBudget: true },
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
    console.error("[POST /api/projects/[id]/counter-respond]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
