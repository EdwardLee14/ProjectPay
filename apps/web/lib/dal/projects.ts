// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import type { User } from "@projectpay/db";

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
