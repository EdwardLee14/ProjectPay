import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getChangeOrderWithProject } from "@/lib/dal/change-orders";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const changeOrder = await getChangeOrderWithProject(id);
    if (!changeOrder) {
      return NextResponse.json({ error: "Change order not found" }, { status: 404 });
    }
    if (
      changeOrder.project.contractorId !== user.id &&
      changeOrder.project.clientId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(changeOrder);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/change-orders/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
