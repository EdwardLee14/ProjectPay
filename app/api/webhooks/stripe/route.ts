import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "issuing_transaction.created": {
      const transaction = event.data.object as Stripe.Issuing.Transaction;
      const cardId =
        typeof transaction.card === "string"
          ? transaction.card
          : transaction.card?.id;

      if (!cardId) break;

      const project = await prisma.project.findFirst({
        where: { stripeCardId: cardId },
      });

      if (project) {
        await prisma.transaction.create({
          data: {
            projectId: project.id,
            merchantName: transaction.merchant_data?.name ?? "Unknown Merchant",
            amount: Math.abs(transaction.amount) / 100,
            categoryCode: transaction.merchant_data?.category_code ?? "unknown",
            stripeTransactionId: transaction.id,
          },
        });
      }
      break;
    }

    case "issuing_card.created": {
      const card = event.data.object as Stripe.Issuing.Card;
      const metadata = card.metadata;

      if (metadata?.projectId) {
        await prisma.project.update({
          where: { id: metadata.projectId },
          data: { stripeCardId: card.id },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
