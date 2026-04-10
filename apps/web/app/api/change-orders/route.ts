import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const changeOrders = await prisma.changeOrder.findMany({
      where: { projectId },
      include: { requester: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(changeOrders);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const body = (await req.json()) as {
      projectId: string;
      amount: number;
      reason: string;
    };

    const changeOrder = await prisma.changeOrder.create({
      data: {
        projectId: body.projectId,
        requestedBy: user.id,
        amount: body.amount,
        reason: body.reason,
      },
    });

    return NextResponse.json(changeOrder, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create change order" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();

    const body = (await req.json()) as {
      id: string;
      status: "APPROVED" | "REJECTED";
    };

    const changeOrder = await prisma.changeOrder.findUnique({
      where: { id: body.id },
      include: { project: true },
    });

    if (!changeOrder) {
      return NextResponse.json(
        { error: "Change order not found" },
        { status: 404 }
      );
    }

    const isClient = changeOrder.project.clientId === user.id;
    if (!isClient) {
      return NextResponse.json(
        { error: "Only the client can approve or reject change orders" },
        { status: 403 }
      );
    }

    const updated = await prisma.changeOrder.update({
      where: { id: body.id },
      data: { status: body.status },
    });

    if (body.status === "APPROVED") {
      await prisma.project.update({
        where: { id: changeOrder.projectId },
        data: {
          totalBudget: { increment: changeOrder.amount },
        },
      });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update change order" },
      { status: 500 }
    );
  }
}
