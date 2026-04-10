// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

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
