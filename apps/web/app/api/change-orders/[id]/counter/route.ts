import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { getChangeOrderById, counterChangeOrder } from "@/lib/dal/change-orders";
import { counterChangeOrderSchema } from "@projectpay/shared";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = counterChangeOrderSchema.parse(await req.json());

    const changeOrder = await getChangeOrderById(id);
    if (!changeOrder) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }
    if (changeOrder.project.clientId !== user.id) {
      return NextResponse.json(
        { error: "Only the client can counter change orders" },
        { status: 403 }
      );
    }
    if (changeOrder.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot counter a change order with status ${changeOrder.status}` },
        { status: 409 }
      );
    }

    const updated = await counterChangeOrder(id, {
      counterAmount: body.counterAmount,
      counterReason: body.reason,
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
    console.error("[POST /api/change-orders/[id]/counter]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
