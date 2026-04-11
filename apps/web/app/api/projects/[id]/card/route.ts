import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getProjectStripeInfo, updateProjectStatus } from "@/lib/dal/projects";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function GET(
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
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!project.stripeCardId) {
      return NextResponse.json({ error: "No card associated with this project" }, { status: 422 });
    }

    const stripe = getStripe();
    const card = await stripe.issuing.cards.retrieve(project.stripeCardId);
    return NextResponse.json({
      last4: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      status: card.status,
      brand: card.brand,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects/[id]/card]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Only the contractor can activate the card" }, { status: 403 });
    }
    if (project.status !== "PENDING_FUNDING") {
      return NextResponse.json(
        { error: `Cannot create card for project with status ${project.status}` },
        { status: 409 }
      );
    }
    if (project.stripeCardId) {
      return NextResponse.json({ error: "Card already exists for this project" }, { status: 409 });
    }

    const stripe = getStripe();
    let cardholderId = user.stripeCardholderId;

    if (!cardholderId) {
      // TODO: Collect billing address during onboarding — required by Stripe Issuing.
      // Until then, return a clear error so the frontend can prompt for it.
      return NextResponse.json(
        { error: "Billing address required to issue a card. Please complete your profile." },
        { status: 422 }
      );
    }

    const card = await stripe.issuing.cards.create({
      cardholder: cardholderId,
      currency: "usd",
      type: "virtual",
      metadata: { projectId: id },
    });

    const updated = await updateProjectStatus(id, { status: "ACTIVE", stripeCardId: card.id });
    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects/[id]/card]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
