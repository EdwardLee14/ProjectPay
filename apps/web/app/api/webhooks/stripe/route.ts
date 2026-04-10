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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
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
        include: { budgetCategories: true },
      });

      if (project) {
        const merchantCategoryCode =
          transaction.merchant_data?.category_code ?? "unknown";
        const amount = Math.abs(transaction.amount) / 100;

        // Match transaction to a budget category by merchant category code
        const matchedCategory = project.budgetCategories.find((cat) =>
          cat.merchantCategoryCodes.includes(merchantCategoryCode)
        );

        await prisma.$transaction([
          prisma.transaction.create({
            data: {
              projectId: project.id,
              budgetCategoryId: matchedCategory?.id ?? null,
              merchantName:
                transaction.merchant_data?.name ?? "Unknown Merchant",
              amount,
              categoryCode: merchantCategoryCode,
              stripeTransactionId: transaction.id,
            },
          }),
          // Update spentAmount on the matched budget category
          ...(matchedCategory
            ? [
                prisma.budgetCategory.update({
                  where: { id: matchedCategory.id },
                  data: { spentAmount: { increment: amount } },
                }),
              ]
            : []),
        ]);
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
