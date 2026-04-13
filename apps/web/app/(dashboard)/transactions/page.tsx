import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import shared from "@/styles/shared.module.css";
import s from "./transactions.module.css";
import { TransactionTable } from "@/components/transactions/transaction-table";

export default async function TransactionsPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  // Fetch user's projects
  const projects =
    user.role === "CONTRACTOR"
      ? await prisma.project.findMany({
          where: { contractorId: user.id },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.project.findMany({
          where: { clientId: user.id },
          select: { id: true, name: true },
          orderBy: { createdAt: "desc" },
        });

  const projectIds = projects.map((p) => p.id);

  // Fetch initial transactions (most recent 20)
  const initialTransactions = await prisma.transaction.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      project: { select: { id: true, name: true } },
      budgetCategory: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 21,
  });

  const hasMore = initialTransactions.length > 20;
  const transactions = hasMore
    ? initialTransactions.slice(0, 20)
    : initialTransactions;

  // Total count
  const totalCount = await prisma.transaction.count({
    where: { projectId: { in: projectIds } },
  });

  // Serialize for client component (Decimal -> number, Date -> string)
  const serialized = transactions.map((tx) => ({
    id: tx.id,
    merchantName: tx.merchantName,
    amount: Number(tx.amount),
    categoryCode: tx.categoryCode,
    status: tx.status,
    note: tx.note,
    createdAt: tx.createdAt.toISOString(),
    project: tx.project,
    budgetCategory: tx.budgetCategory,
  }));

  return (
    <main className={shared.dashboardPage}>
      <div className={s.pageHeader}>
        <h1 className={shared.pageTitle}>All Transactions</h1>
        <p className={s.pageMeta}>
          {totalCount} transaction{totalCount !== 1 ? "s" : ""} total
        </p>
      </div>
      <div className={s.contentCard}>
        <TransactionTable
          initialTransactions={serialized}
          initialHasMore={hasMore}
          projects={projects}
        />
      </div>
    </main>
  );
}
