// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import type { User, ProjectStatus } from "@projectpay/db";

export async function getProjectsForUser(user: User) {
  const where = user.role === "CONTRACTOR"
    ? { contractorId: user.id }
    : { clientId: user.id };

  return prisma.project.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalBudget: true,
      fundedAmount: true,
      clientEmail: true,
      createdAt: true,
      updatedAt: true,
      budgetCategories: {
        select: {
          id: true, name: true, allocatedAmount: true, spentAmount: true,
        },
      },
      contractor: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      totalBudget: true,
      fundedAmount: true,
      clientEmail: true,
      stripeCardId: true,
      contractorId: true,
      clientId: true,
      closedAt: true,
      createdAt: true,
      updatedAt: true,
      budgetCategories: {
        select: {
          id: true, name: true, allocatedAmount: true, spentAmount: true, merchantCategoryCodes: true,
        },
      },
      contractor: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function updateProject(projectId: string, data: {
  name?: string;
  description?: string | null;
  clientEmail?: string | null;
}) {
  return prisma.project.update({
    where: { id: projectId },
    data,
    select: {
      id: true, name: true, description: true, status: true,
      totalBudget: true, fundedAmount: true, clientEmail: true,
      createdAt: true, updatedAt: true,
    },
  });
}

export async function cancelProject(projectId: string) {
  return prisma.project.update({
    where: { id: projectId },
    data: { status: "CANCELLED", closedAt: new Date() },
    select: { id: true, name: true, status: true, closedAt: true },
  });
}

export async function createAccessToken(projectId: string, expiresInDays: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  return prisma.clientAccessToken.create({
    data: { projectId, token, expiresAt },
    select: { id: true, token: true, expiresAt: true, createdAt: true },
  });
}

export async function revokeAccessToken(tokenId: string) {
  return prisma.clientAccessToken.update({
    where: { id: tokenId },
    data: { revokedAt: new Date() },
    select: { id: true, revokedAt: true },
  });
}

export async function getAccessToken(tokenId: string) {
  return prisma.clientAccessToken.findUnique({
    where: { id: tokenId },
    select: { id: true, projectId: true, revokedAt: true },
  });
}

export async function getProjectStripeInfo(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      stripeCardId: true,
      contractorId: true,
      clientId: true,
    },
  });
}

export async function updateProjectStatus(
  projectId: string,
  data: {
    status: ProjectStatus;
    stripeCardId?: string;
    closedAt?: Date;
  }
) {
  return prisma.project.update({
    where: { id: projectId },
    data,
    select: {
      id: true,
      status: true,
      stripeCardId: true,
      closedAt: true,
    },
  });
}

export async function getProjectForClose(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      status: true,
      stripeCardId: true,
      contractorId: true,
      clientId: true,
      changeOrders: {
        where: { status: { in: ["PENDING", "COUNTERED"] } },
        select: { id: true, status: true },
      },
      topUpRequests: {
        where: { status: "PENDING" },
        select: { id: true, status: true },
      },
    },
  });
}

export async function getProjectForSummary(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      totalBudget: true,
      fundedAmount: true,
      closedAt: true,
      contractorId: true,
      clientId: true,
      contractor: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, email: true } },
      budgetCategories: {
        select: {
          id: true,
          name: true,
          allocatedAmount: true,
          spentAmount: true,
        },
      },
      transactions: {
        select: {
          id: true,
          merchantName: true,
          amount: true,
          categoryCode: true,
          status: true,
          createdAt: true,
          budgetCategory: { select: { id: true, name: true } },
          receipts: { select: { storagePath: true, fileName: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      summary: {
        select: { pdfStoragePath: true, generatedAt: true },
      },
    },
  });
}

export async function upsertProjectSummary(data: {
  projectId: string;
  pdfStoragePath: string;
  totalSpent: number;
  totalBudget: number;
  categoryBreakdown: object;
  transactionCount: number;
}) {
  return prisma.projectSummary.upsert({
    where: { projectId: data.projectId },
    create: data,
    update: {
      pdfStoragePath: data.pdfStoragePath,
      totalSpent: data.totalSpent,
      totalBudget: data.totalBudget,
      categoryBreakdown: data.categoryBreakdown,
      transactionCount: data.transactionCount,
      generatedAt: new Date(),
    },
    select: { id: true, pdfStoragePath: true, generatedAt: true },
  });
}
