import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionFeed } from "@/components/transactions/transaction-feed";
import { ChangeOrderList } from "@/components/change-orders/change-order-list";
import { ChangeOrderForm } from "@/components/change-orders/change-order-form";

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
    (sum, cat) => sum + cat.spentAmount,
    0
  );
  const usagePct =
    project.totalBudget > 0 ? (totalSpent / project.totalBudget) * 100 : 0;

  const statusStyle: Record<string, string> = {
    DRAFT: "bg-muted text-muted-foreground",
    ACTIVE: "bg-secondary-container/30 text-secondary",
    COMPLETE: "bg-surface-container text-muted-foreground",
  };

  return (
    <div className="p-8 lg:p-12 max-w-[1440px] mx-auto w-full space-y-10">
      {/* Back + Header */}
      <div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <Icon
            name="arrow_back"
            className="text-lg group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="font-headline text-3xl font-bold text-foreground">
                {project.name}
              </h1>
              <span
                className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${statusStyle[project.status]}`}
              >
                {project.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Budget: {formatCurrency(project.totalBudget)} &middot; Funded:{" "}
              {formatCurrency(project.fundedAmount)} &middot; Spent:{" "}
              {formatCurrency(totalSpent)}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/projects/${project.id}/payment-mode`}
              className="bg-surface-container-low border border-outline-variant/20 text-foreground px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-accent transition-colors"
            >
              <Icon name="settings" className="text-lg" />
              Payment Mode
            </Link>
          </div>
        </div>
      </div>

      {/* Budget Overview Bar */}
      <div className="bg-primary-container rounded-xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-8 text-sm">
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                  Spent
                </span>
                <span className="text-lg font-bold text-secondary-fixed">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                  Remaining
                </span>
                <span className="text-lg font-bold">
                  {formatCurrency(project.totalBudget - totalSpent)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                  Funded
                </span>
                <span className="text-lg font-bold text-primary-fixed-dim">
                  {formatCurrency(project.fundedAmount)}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary-fixed rounded-full transition-all"
                style={{ width: `${Math.min(usagePct, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {Math.round(usagePct)}% of budget used
            </p>
          </div>
        </div>
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="budget" className="space-y-6">
        <TabsList className="bg-surface-container-low p-1 rounded-lg">
          <TabsTrigger value="budget">Budget Categories</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <div className="bg-card rounded-xl shadow-soft p-8">
            <h3 className="font-headline text-lg font-bold mb-6">
              Budget Categories
            </h3>
            {project.budgetCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories defined yet.
              </p>
            ) : (
              <div className="space-y-5">
                {project.budgetCategories.map((cat) => {
                  const pct =
                    cat.allocatedAmount > 0
                      ? (cat.spentAmount / cat.allocatedAmount) * 100
                      : 0;
                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground">{cat.name}</span>
                        <span
                          className={
                            pct > 100
                              ? "text-destructive font-bold"
                              : "text-secondary font-bold"
                          }
                        >
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct > 100 ? "bg-destructive" : "bg-secondary"
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>Spent: {formatCurrency(cat.spentAmount)}</span>
                        <span>
                          Budget: {formatCurrency(cat.allocatedAmount)}
                        </span>
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
              amount: tx.amount,
              categoryCode: tx.categoryCode,
              note: tx.note,
              receiptUrl: tx.receiptUrl,
              stripeTransactionId: tx.stripeTransactionId,
              createdAt: tx.createdAt.toISOString(),
            }))}
          />
        </TabsContent>

        <TabsContent value="change-orders" className="space-y-4">
          <ChangeOrderList
            changeOrders={project.changeOrders.map((co) => ({
              id: co.id,
              amount: co.amount,
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
    </div>
  );
}
