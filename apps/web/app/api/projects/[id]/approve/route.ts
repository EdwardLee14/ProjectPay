import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "counter"]),
  counterBudget: z.number().positive().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    if (user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only clients can review projects" },
        { status: 403 }
      );
    }

    const body = reviewSchema.parse(await req.json());

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { contractor: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (project.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: `Project must be PENDING_APPROVAL, got ${project.status}` },
        { status: 409 }
      );
    }

    // ── Reject ───────────────────────────────────────────────────────────────
    if (body.action === "reject") {
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: { status: "CANCELLED", closedAt: new Date() },
        select: { id: true, status: true },
      });
      return NextResponse.json(updated);
    }

    // ── Counter ──────────────────────────────────────────────────────────────
    if (body.action === "counter") {
      if (!body.counterBudget) {
        return NextResponse.json(
          { error: "counterBudget is required for a counter proposal" },
          { status: 400 }
        );
      }
      const updated = await prisma.project.update({
        where: { id: params.id },
        data: { status: "COUNTER_PROPOSED", counterBudget: body.counterBudget },
        select: { id: true, status: true, counterBudget: true },
      });
      return NextResponse.json(updated);
    }

    // ── Approve: create Stripe cardholder + card with spending controls ───────
    const stripe = getStripe();

    let cardholderId = project.contractor.stripeCardholderId;

    if (!cardholderId) {
      const cardholder = await stripe.issuing.cardholders.create({
        name: project.contractor.name,
        email: project.contractor.email,
        type: "individual",
        billing: {
          address: {
            line1: "123 Main St",
            city: "San Francisco",
            state: "CA",
            postal_code: "94102",
            country: "US",
          },
        },
      });
      cardholderId = cardholder.id;

      await prisma.user.update({
        where: { id: project.contractor.id },
        data: { stripeCardholderId: cardholderId },
      });
    }

    const budgetCents = Math.round(Number(project.totalBudget) * 100);

    const card = await stripe.issuing.cards.create({
      cardholder: cardholderId,
      currency: "usd",
      type: "virtual",
      spending_controls: {
        spending_limits: [
          { amount: budgetCents, interval: "all_time" },
        ],
      },
      metadata: { projectId: project.id },
    });

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
        stripeCardId: card.id,
        fundedAmount: project.totalBudget,
        counterBudget: null,
      },
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
    console.error("[POST /api/projects/[id]/approve]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
