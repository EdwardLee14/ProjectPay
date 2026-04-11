// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

export async function getChangeOrders(projectId: string) {
  return prisma.changeOrder.findMany({
    where: { projectId },
    select: {
      id: true,
      amount: true,
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

export async function getChangeOrderById(changeOrderId: string) {
  return prisma.changeOrder.findUnique({
    where: { id: changeOrderId },
    select: {
      id: true, projectId: true, budgetCategoryId: true,
      amount: true, reason: true, status: true, requestedBy: true,
      counterAmount: true, counterReason: true,
      project: { select: { contractorId: true, clientId: true, status: true } },
    },
  });
}

export async function getChangeOrderWithProject(changeOrderId: string) {
  return prisma.changeOrder.findUnique({
    where: { id: changeOrderId },
    select: {
      id: true,
      projectId: true,
      budgetCategoryId: true,
      requestedBy: true,
      amount: true,
      reason: true,
      status: true,
      counterAmount: true,
      counterReason: true,
      createdAt: true,
      resolvedAt: true,
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          contractorId: true,
          clientId: true,
        },
      },
      budgetCategory: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true } },
    },
  });
}

export async function createChangeOrder(data: {
  projectId: string;
  budgetCategoryId?: string;
  requestedBy: string;
  amount: number;
  reason: string;
}) {
  return prisma.changeOrder.create({
    data,
    select: {
      id: true, amount: true, reason: true, status: true, createdAt: true,
      budgetCategory: { select: { id: true, name: true } },
    },
  });
}

export async function approveChangeOrder(changeOrderId: string) {
  const co = await prisma.changeOrder.findUnique({
    where: { id: changeOrderId },
    select: { id: true, amount: true, projectId: true, budgetCategoryId: true, status: true },
  });

  if (!co || co.status !== "PENDING") return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.changeOrder.update({
      where: { id: changeOrderId },
      data: { status: "APPROVED", resolvedAt: new Date() },
      select: { id: true, status: true, resolvedAt: true },
    });

    await tx.project.update({
      where: { id: co.projectId },
      data: { totalBudget: { increment: co.amount } },
    });

    if (co.budgetCategoryId) {
      await tx.budgetCategory.update({
        where: { id: co.budgetCategoryId },
        data: { allocatedAmount: { increment: co.amount } },
      });
    }

    return updated;
  });
}

export async function rejectChangeOrder(changeOrderId: string) {
  return prisma.changeOrder.update({
    where: { id: changeOrderId },
    data: { status: "REJECTED", resolvedAt: new Date() },
    select: { id: true, status: true, resolvedAt: true },
  });
}

export async function counterChangeOrder(
  changeOrderId: string,
  data: { counterAmount: number; counterReason: string }
) {
  return prisma.changeOrder.update({
    where: { id: changeOrderId },
    data: {
      status: "COUNTERED",
      counterAmount: data.counterAmount,
      counterReason: data.counterReason,
    },
    select: {
      id: true, status: true, counterAmount: true, counterReason: true,
    },
  });
}

export async function acceptCounterChangeOrder(changeOrderId: string) {
  return prisma.$transaction(async (tx) => {
    const co = await tx.changeOrder.findUnique({
      where: { id: changeOrderId },
      select: {
        id: true,
        status: true,
        counterAmount: true,
        projectId: true,
        budgetCategoryId: true,
      },
    });

    if (!co || co.status !== "COUNTERED" || !co.counterAmount) return null;

    const updated = await tx.changeOrder.update({
      where: { id: changeOrderId },
      data: { status: "APPROVED", resolvedAt: new Date() },
      select: { id: true, status: true, resolvedAt: true },
    });

    await tx.project.update({
      where: { id: co.projectId },
      data: { totalBudget: { increment: co.counterAmount } },
    });

    if (co.budgetCategoryId) {
      await tx.budgetCategory.update({
        where: { id: co.budgetCategoryId },
        data: { allocatedAmount: { increment: co.counterAmount } },
      });
    }

    return updated;
  });
}
