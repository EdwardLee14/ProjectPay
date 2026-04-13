import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        project: {
          select: { contractorId: true, clientId: true },
        },
      },
    });
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

    const receipts = await prisma.receipt.findMany({
      where: { transactionId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        transactionId: true,
        storagePath: true,
        fileName: true,
        mimeType: true,
        parsedData: true,
        uploadedBy: true,
        createdAt: true,
        uploader: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/receipts]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createReceiptSchema = z.object({
  transactionId: z.string().min(1),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createReceiptSchema.parse(await req.json());

    const transaction = await prisma.transaction.findUnique({
      where: { id: body.transactionId },
      select: {
        project: {
          select: { contractorId: true, clientId: true },
        },
      },
    });
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

    const receipt = await prisma.receipt.create({
      data: {
        transactionId: body.transactionId,
        storagePath: body.storagePath,
        fileName: body.fileName,
        mimeType: body.mimeType,
        uploadedBy: user.id,
      },
      select: {
        id: true,
        transactionId: true,
        storagePath: true,
        fileName: true,
        mimeType: true,
        uploadedBy: true,
        createdAt: true,
      },
    });

    return NextResponse.json(receipt, { status: 201 });
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
    console.error("[POST /api/receipts]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
