import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TransactionFeed } from "@/components/transactions/transaction-feed";
import { ChangeOrderList } from "@/components/change-orders/change-order-list";
import { ChangeOrderForm } from "@/components/change-orders/change-order-form";
import s from "./project-detail.module.css";
import shared from "@/styles/shared.module.css";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      budgetCategories: true,
      transactions: { orderBy: { createdAt: "desc" } },
      changeOrders: {
        include: { requester: true },
        orderBy: { createdAt: "desc" },
      },
      contractor: true,
      client: true,
    },
  });

  if (!project) notFound();

  const isAuthorized =
    project.contractorId === user.id || project.clientId === user.id;
  if (!isAuthorized) redirect("/dashboard");

  const totalSpent = project.budgetCategories.reduce(
    (sum, cat) => sum + Number(cat.spentAmount),
    0
  );
  const usagePct =
    Number(project.totalBudget) > 0 ? (totalSpent / Number(project.totalBudget)) * 100 : 0;

  const statusClass = project.status === "ACTIVE" ? shared.badgeActive : shared.badgeDefault;

  return (
    <main className={shared.detailPage}>
      {/* Back + Header */}
      <div>
        <Link href="/dashboard" className={cn(shared.backLink, "group")}>
          <Icon
            name="arrow_back"
            className="text-lg group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        <div className={s.headerRow}>
          <div className="space-y-2">
            <div className={s.titleRow}>
              <h1 className={s.title}>{project.name}</h1>
              <span className={cn(shared.badgePill, statusClass)}>
                {project.status}
              </span>
            </div>
            <p className={s.metaSummary}>
              Budget: {formatCurrency(Number(project.totalBudget))} &middot; Funded:{" "}
              {formatCurrency(Number(project.fundedAmount))} &middot; Spent:{" "}
              {formatCurrency(totalSpent)}
            </p>
          </div>

          <div className={s.actionRow}>
            <Link href={`/projects/${project.id}/payment-mode`} className={s.actionBtn}>
              <Icon name="tune" className="text-base" />
              Payment Mode
            </Link>
            <button className={s.actionBtn}>
              <Icon name="edit" className="text-base" />
              Edit Project
            </button>
          </div>
        </div>
      </div>

      {/* Budget Overview Bar */}
      <div className={s.budgetBar}>
        <div className={s.budgetBarInner}>
          <div className="flex-1 space-y-3">
            <div className={s.budgetMetrics}>
              <div>
                <span className={s.budgetMetricLabel}>Spent</span>
                <span className={s.budgetMetricSpent}>{formatCurrency(totalSpent)}</span>
              </div>
              <div>
                <span className={s.budgetMetricLabel}>Remaining</span>
                <span className={s.budgetMetricRemaining}>
                  {formatCurrency(Number(project.totalBudget) - totalSpent)}
                </span>
              </div>
              <div>
                <span className={s.budgetMetricLabel}>Funded</span>
                <span className={s.budgetMetricFunded}>
                  {formatCurrency(Number(project.fundedAmount))}
                </span>
              </div>
            </div>
            <ProgressBar value={usagePct} />
            <p className={s.budgetUsageText}>
              {Math.round(usagePct)}% of budget used
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList className={s.tabList}>
          <TabsTrigger value="budget">Budget Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <div className={s.budgetPanel}>
            <h3 className={s.budgetPanelTitle}>Budget Categories</h3>
            {project.budgetCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories defined yet.
              </p>
            ) : (
              <div className={s.categoryList}>
                {project.budgetCategories.map((cat) => {
                  const pct =
                    Number(cat.allocatedAmount) > 0
                      ? (Number(cat.spentAmount) / Number(cat.allocatedAmount)) * 100
                      : 0;
                  return (
                    <div key={cat.id} className={s.categoryRow}>
                      <div className={s.categoryHeader}>
                        <span className={s.categoryName}>{cat.name}</span>
                        <span
                          className={cn(
                            s.categoryPct,
                            pct > 100 ? shared.statusCritical : shared.statusNormal,
                          )}
                        >
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <ProgressBar value={pct} className="h-1.5" />
                      <div className={s.categoryMeta}>
                        <span>Spent: {formatCurrency(Number(cat.spentAmount))}</span>
                        <span>Budget: {formatCurrency(Number(cat.allocatedAmount))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionFeed
            projectId={project.id}
            initialTransactions={project.transactions.map((tx) => ({
              id: tx.id,
              projectId: tx.projectId,
              merchantName: tx.merchantName,
              amount: Number(tx.amount),
              categoryCode: tx.categoryCode,
              note: tx.note,
              receiptUrl: null,
              stripeTransactionId: tx.stripeTransactionId,
              createdAt: tx.createdAt.toISOString(),
            }))}
          />
        </TabsContent>

        <TabsContent value="change-orders" className="space-y-4">
          <ChangeOrderList
            changeOrders={project.changeOrders.map((co) => ({
              id: co.id,
              amount: Number(co.amount),
              reason: co.reason,
              status: co.status,
              createdAt: co.createdAt.toISOString(),
              requester: { name: co.requester.name },
            }))}
            userRole={user.role}
          />
          {user.role === "CONTRACTOR" && (
            <ChangeOrderForm projectId={project.id} />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
