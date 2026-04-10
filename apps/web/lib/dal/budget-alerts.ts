// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

export async function getBudgetAlerts(projectId: string) {
  return prisma.budgetAlert.findMany({
    where: { projectId },
    select: {
      id: true,
      alertType: true,
      triggeredAt: true,
      acknowledgedAt: true,
      budgetCategory: { select: { id: true, name: true } },
    },
    orderBy: { triggeredAt: "desc" },
  });
}

export async function acknowledgeBudgetAlert(alertId: string) {
  return prisma.budgetAlert.update({
    where: { id: alertId },
    data: { acknowledgedAt: new Date() },
    select: { id: true, acknowledgedAt: true },
  });
}

export async function getBudgetAlertById(alertId: string) {
  return prisma.budgetAlert.findUnique({
    where: { id: alertId },
    select: { id: true, projectId: true, acknowledgedAt: true },
  });
}
