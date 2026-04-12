import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { contractorId: true, stripeCardId: true, status: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only the contractor can view card details
    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!project.stripeCardId) {
      return NextResponse.json({ error: "No card issued for this project" }, { status: 404 });
    }

    const stripe = getStripe();

    // Expand number and cvc — available in test mode and with issuing read permissions
    const card = await stripe.issuing.cards.retrieve(project.stripeCardId, {
      expand: ["number", "cvc"],
    });

    return NextResponse.json({
      id: card.id,
      last4: card.last4,
      number: card.number,
      cvc: card.cvc,
      expMonth: card.exp_month,
      expYear: card.exp_year,
      status: card.status,
      spendingLimit: card.spending_controls?.spending_limits?.[0]?.amount ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects/[id]/card-details]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
