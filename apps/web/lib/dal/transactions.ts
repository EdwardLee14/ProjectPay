// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import type { Prisma } from "@prisma/client";

export async function getTransactions(params: {
  projectId: string;
  budgetCategoryId?: string;
  cursor?: string;
  limit: number;
}) {
  const { projectId, budgetCategoryId, cursor, limit } = params;

  const where: Record<string, unknown> = { projectId };
  if (budgetCategoryId) where.budgetCategoryId = budgetCategoryId;

  const items = await prisma.transaction.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      merchantName: true,
      amount: true,
      categoryCode: true,
      status: true,
      note: true,
      createdAt: true,
      budgetCategory: { select: { id: true, name: true } },
    },
  });

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore ? data[data.length - 1]?.id : undefined;

  return { data, hasMore, nextCursor };
}

export async function getTransactionById(transactionId: string) {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      projectId: true,
      merchantName: true,
      amount: true,
      categoryCode: true,
      status: true,
      note: true,
      stripeTransactionId: true,
      createdAt: true,
      budgetCategory: { select: { id: true, name: true } },
      project: { select: { contractorId: true, clientId: true } },
    },
  });
}

export async function createTransaction(data: {
  projectId: string;
  merchantName: string;
  amount: number;
  budgetCategoryId: string | null;
  categoryCode: string;
  note: string | null;
  userId: string;
  receipt?: {
    storagePath: string;
    fileName: string;
    mimeType: string;
    parsedData?: Record<string, unknown>;
  };
}) {
  const stripeTransactionId = `receipt_${nanoid()}`;

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        projectId: data.projectId,
        merchantName: data.merchantName,
        amount: data.amount,
        budgetCategoryId: data.budgetCategoryId,
        categoryCode: data.categoryCode,
        note: data.note,
        stripeTransactionId,
      },
      select: {
        id: true,
        projectId: true,
        merchantName: true,
        amount: true,
        categoryCode: true,
        note: true,
        stripeTransactionId: true,
        createdAt: true,
        budgetCategory: { select: { id: true, name: true } },
      },
    });

    if (data.budgetCategoryId) {
      await tx.budgetCategory.update({
        where: { id: data.budgetCategoryId },
        data: { spentAmount: { increment: data.amount } },
      });
    }

    let receipt = null;
    if (data.receipt) {
      receipt = await tx.receipt.create({
        data: {
          transactionId: transaction.id,
          storagePath: data.receipt.storagePath,
          fileName: data.receipt.fileName,
          mimeType: data.receipt.mimeType,
          parsedData: (data.receipt.parsedData as Prisma.InputJsonValue) ?? undefined,
          uploadedBy: data.userId,
        },
        select: {
          id: true,
          storagePath: true,
          fileName: true,
          createdAt: true,
        },
      });
    }

    return { transaction, receipt };
  });
}

export async function updateTransaction(
  transactionId: string,
  data: {
    merchantName?: string;
    amount?: number;
    budgetCategoryId?: string | null;
    note?: string | null;
  }
) {
  // Fetch existing transaction to handle budget adjustments
  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      amount: true,
      budgetCategoryId: true,
    },
  });

  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    // Reverse old budget category spend
    if (existing.budgetCategoryId) {
      await tx.budgetCategory.update({
        where: { id: existing.budgetCategoryId },
        data: { spentAmount: { decrement: Number(existing.amount) } },
      });
    }

    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        ...(data.merchantName !== undefined && { merchantName: data.merchantName }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.budgetCategoryId !== undefined && { budgetCategoryId: data.budgetCategoryId }),
        ...(data.note !== undefined && { note: data.note }),
      },
      select: {
        id: true,
        projectId: true,
        merchantName: true,
        amount: true,
        categoryCode: true,
        note: true,
        stripeTransactionId: true,
        createdAt: true,
        budgetCategory: { select: { id: true, name: true } },
      },
    });

    // Apply new budget category spend
    const newCategoryId = data.budgetCategoryId !== undefined ? data.budgetCategoryId : existing.budgetCategoryId;
    const newAmount = data.amount !== undefined ? data.amount : Number(existing.amount);
    if (newCategoryId) {
      await tx.budgetCategory.update({
        where: { id: newCategoryId },
        data: { spentAmount: { increment: newAmount } },
      });
    }

    return updated;
  });
}

export async function deleteTransaction(transactionId: string) {
  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      amount: true,
      budgetCategoryId: true,
      projectId: true,
      project: { select: { contractorId: true, clientId: true } },
    },
  });

  if (!existing) return null;

  return prisma.$transaction(async (tx) => {
    // Reverse budget category spend
    if (existing.budgetCategoryId) {
      await tx.budgetCategory.update({
        where: { id: existing.budgetCategoryId },
        data: { spentAmount: { decrement: Number(existing.amount) } },
      });
    }

    // Delete receipts first (cascade would handle this, but explicit is clearer)
    await tx.receipt.deleteMany({ where: { transactionId } });

    await tx.transaction.delete({ where: { id: transactionId } });

    return existing;
  });
}
