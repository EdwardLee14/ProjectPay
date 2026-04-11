import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { requireUser } from "@/lib/auth";
import { getProjectStripeInfo } from "@/lib/dal/projects";
import { getStripe } from "@/lib/stripe";

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
    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Only the contractor can deactivate the card" }, { status: 403 });
    }
    if (project.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Cannot deactivate card for project with status ${project.status}` },
        { status: 409 }
      );
    }
    if (!project.stripeCardId) {
      return NextResponse.json({ error: "No card associated with this project" }, { status: 422 });
    }

    const stripe = getStripe();
    try {
      await stripe.issuing.cards.update(project.stripeCardId, { status: "canceled" });
    } catch (stripeError) {
      if (
        stripeError instanceof Stripe.errors.StripeInvalidRequestError &&
        stripeError.message.toLowerCase().includes("already been canceled")
      ) {
        // Card is already canceled — treat as success
      } else {
        throw stripeError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects/[id]/card/deactivate]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
