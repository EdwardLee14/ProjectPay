import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import {
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "@/lib/dal/transactions";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Execute + Authorize
    const transaction = await getTransactionById(params.id);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (
      transaction.project.contractorId !== user.id &&
      transaction.project.clientId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Respond — serialize for client consumption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { project, ...rest } = transaction;
    return NextResponse.json({
      ...rest,
      amount: Number(rest.amount),
      createdAt: rest.createdAt.toISOString(),
      receiptUrl: null,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unauthorized: no user found"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/transactions/[id]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const updateSchema = z.object({
  merchantName: z.string().min(1).max(255).optional(),
  amount: z.number().positive().optional(),
  budgetCategoryId: z.string().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = updateSchema.parse(body);

    const transaction = await getTransactionById(params.id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    if (
      transaction.project.contractorId !== user.id &&
      transaction.project.clientId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await updateTransaction(params.id, data);
    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      amount: Number(updated.amount),
      createdAt: updated.createdAt.toISOString(),
    });
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
    console.error("[PATCH /api/transactions/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const transaction = await getTransactionById(params.id);
    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    if (
      transaction.project.contractorId !== user.id &&
      transaction.project.clientId !== user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteTransaction(params.id);

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/transactions/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
