import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import { getProjectForClose, updateProjectStatus } from "@/lib/dal/projects";
import { getStripe } from "@/lib/stripe";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const project = await getProjectForClose(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (project.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Cannot close a project with status ${project.status}` },
        { status: 409 }
      );
    }
    if (project.changeOrders.length > 0) {
      return NextResponse.json(
        { error: "Resolve all open change orders before closing the project" },
        { status: 409 }
      );
    }
    if (project.topUpRequests.length > 0) {
      return NextResponse.json(
        { error: "Resolve all pending top-up requests before closing the project" },
        { status: 409 }
      );
    }

    if (project.stripeCardId) {
      const stripe = getStripe();
      try {
        await stripe.issuing.cards.update(project.stripeCardId, { status: "canceled" });
      } catch (stripeError) {
        if (
          stripeError instanceof Stripe.errors.StripeInvalidRequestError &&
          stripeError.message.toLowerCase().includes("already been canceled")
        ) {
          // Already canceled — continue
        } else {
          throw stripeError;
        }
      }
    }

    const updated = await updateProjectStatus(id, { status: "COMPLETE", closedAt: new Date() });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects/[id]/close]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
