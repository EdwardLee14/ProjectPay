// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

export async function getTopUpRequests(projectId: string) {
  return prisma.topUpRequest.findMany({
    where: { projectId },
    select: {
      id: true,
      requestedAmount: true,
      reason: true,
      status: true,
      createdAt: true,
      resolvedAt: true,
      budgetCategory: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTopUpRequest(data: {
  projectId: string;
  budgetCategoryId: string;
  requestedAmount: number;
  reason: string;
  requestedBy: string;
}) {
  return prisma.topUpRequest.create({
    data,
    select: {
      id: true, requestedAmount: true, reason: true, status: true,
      createdAt: true,
      budgetCategory: { select: { id: true, name: true } },
    },
  });
}

export async function approveTopUpRequest(topUpId: string) {
  // Find the request first
  const topUp = await prisma.topUpRequest.findUnique({
    where: { id: topUpId },
    select: { id: true, requestedAmount: true, budgetCategoryId: true, projectId: true, status: true },
  });

  if (!topUp || topUp.status !== "PENDING") return null;

  // Atomic: approve + increment budget
  return prisma.$transaction(async (tx) => {
    const updated = await tx.topUpRequest.update({
      where: { id: topUpId },
      data: { status: "APPROVED", resolvedAt: new Date() },
      select: { id: true, status: true, resolvedAt: true, requestedAmount: true },
    });

    await tx.budgetCategory.update({
      where: { id: topUp.budgetCategoryId },
      data: { allocatedAmount: { increment: topUp.requestedAmount } },
    });

    await tx.project.update({
      where: { id: topUp.projectId },
      data: { totalBudget: { increment: topUp.requestedAmount } },
    });

    return updated;
  });
}

export async function rejectTopUpRequest(topUpId: string) {
  return prisma.topUpRequest.update({
    where: { id: topUpId },
    data: { status: "REJECTED", resolvedAt: new Date() },
    select: { id: true, status: true, resolvedAt: true },
  });
}

export async function getTopUpRequestById(topUpId: string) {
  return prisma.topUpRequest.findUnique({
    where: { id: topUpId },
    select: {
      id: true, projectId: true, budgetCategoryId: true,
      requestedAmount: true, reason: true, status: true, requestedBy: true,
      project: { select: { contractorId: true, clientId: true } },
    },
  });
}
