// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

export async function getCategoriesForProject(projectId: string) {
  return prisma.budgetCategory.findMany({
    where: { projectId },
    select: {
      id: true,
      projectId: true,
      name: true,
      allocatedAmount: true,
      spentAmount: true,
      merchantCategoryCodes: true,
    },
  });
}

export async function getCategoryById(categoryId: string) {
  return prisma.budgetCategory.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      projectId: true,
      name: true,
      allocatedAmount: true,
      spentAmount: true,
      merchantCategoryCodes: true,
      project: {
        select: {
          contractorId: true,
          clientId: true,
          status: true,
          totalBudget: true,
        },
      },
    },
  });
}

export async function getCategoryTotalForProject(
  projectId: string,
  excludeCategoryId?: string
): Promise<number> {
  const result = await prisma.budgetCategory.aggregate({
    where: {
      projectId,
      ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {}),
    },
    _sum: { allocatedAmount: true },
  });
  return result._sum.allocatedAmount?.toNumber() ?? 0;
}

export async function createBudgetCategory(data: {
  projectId: string;
  name: string;
  allocatedAmount: number;
  merchantCategoryCodes: string[];
}) {
  return prisma.budgetCategory.create({
    data,
    select: {
      id: true,
      projectId: true,
      name: true,
      allocatedAmount: true,
      spentAmount: true,
      merchantCategoryCodes: true,
    },
  });
}

export async function updateBudgetCategory(
  categoryId: string,
  data: {
    name?: string;
    allocatedAmount?: number;
    merchantCategoryCodes?: string[];
  }
) {
  return prisma.budgetCategory.update({
    where: { id: categoryId },
    data,
    select: {
      id: true,
      projectId: true,
      name: true,
      allocatedAmount: true,
      spentAmount: true,
      merchantCategoryCodes: true,
    },
  });
}

export async function deleteBudgetCategory(categoryId: string) {
  return prisma.budgetCategory.delete({
    where: { id: categoryId },
    select: { id: true },
  });
}

export async function countCategoriesForProject(projectId: string): Promise<number> {
  return prisma.budgetCategory.count({ where: { projectId } });
}
