import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getChangeOrderById, acceptCounterChangeOrder } from "@/lib/dal/change-orders";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const changeOrder = await getChangeOrderById(id);
    if (!changeOrder) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }
    if (changeOrder.project.contractorId !== user.id) {
      return NextResponse.json(
        { error: "Only the contractor can accept a counter offer" },
        { status: 403 }
      );
    }
    if (changeOrder.status !== "COUNTERED") {
      return NextResponse.json(
        { error: `Cannot accept counter on a change order with status ${changeOrder.status}` },
        { status: 409 }
      );
    }

    const updated = await acceptCounterChangeOrder(id);
    if (!updated) {
      return NextResponse.json({ error: "Failed to accept counter" }, { status: 500 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/change-orders/[id]/accept-counter]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
