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
import { TopUpRequestList } from "@/components/projects/top-up-request-list";
import { ApproveProjectButton } from "@/components/projects/approve-project-button";
import { SubmitForApprovalButton } from "@/components/projects/submit-for-approval-button";
import { CounterRespondButton } from "@/components/projects/counter-respond-button";
import { IssuedCardDetails } from "@/components/projects/issued-card-details";
import s from "./project-detail.module.css";
import shared from "@/styles/shared.module.css";
import { cn } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { approved?: string };
}) {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      budgetCategories: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        include: { budgetCategory: { select: { id: true, name: true } } },
      },
      changeOrders: {
        include: { requester: true },
        orderBy: { createdAt: "desc" },
      },
      topUpRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          budgetCategory: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
        },
      },
      contractor: true,
      client: true,
    },
  });

  if (!project) notFound();

  const isAuthorized =
    project.contractorId === user.id || project.clientId === user.id;
  if (!isAuthorized) redirect("/dashboard");

  // Clients cannot view a project until it has been submitted
  if (user.role === "CLIENT" && project.status === "DRAFT") redirect("/dashboard");

  const isClient = user.role === "CLIENT";
  const isContractor = user.role === "CONTRACTOR";
  const isCancelled = project.status === "CANCELLED";

  const totalSpent = project.budgetCategories.reduce(
    (sum, cat) => sum + Number(cat.spentAmount),
    0
  );
  const usagePct =
    Number(project.totalBudget) > 0
      ? (totalSpent / Number(project.totalBudget)) * 100
      : 0;

  const statusClass =
    project.status === "ACTIVE" ? shared.badgeActive : shared.badgeDefault;

  const pendingChangeOrders = project.changeOrders.filter(
    (co) => co.status === "PENDING"
  );
  const pendingTopUps = project.topUpRequests.filter(
    (r) => r.status === "PENDING"
  );
  const pendingCount = pendingChangeOrders.length + pendingTopUps.length;

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
              {isClient
                ? `Contractor: ${project.contractor.name}`
                : project.client
                  ? `Client: ${project.client.name}`
                  : project.clientEmail
                    ? `Awaiting: ${project.clientEmail}`
                    : "No client assigned"}
            </p>
          </div>

          {!isCancelled && (
            <div className={s.actionRow}>
              <Link
                href={`/messages?project=${project.id}`}
                className={s.actionBtn}
              >
                <Icon name="chat_bubble_outline" className="text-base" />
                Messages
              </Link>
              {isContractor && (
                <>
                  <Link
                    href={`/projects/${project.id}/payment-mode`}
                    className={s.actionBtn}
                  >
                    <Icon name="tune" className="text-base" />
                    Payment Mode
                  </Link>
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className={s.actionBtn}
                  >
                    <Icon name="edit" className="text-base" />
                    Edit Project
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="bg-white rounded-2xl shadow-elevation-1 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <Icon name="block" className="text-destructive text-xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-off-black">
              Project cancelled
            </p>
            <p className="text-xs text-off-black/50">
              This project was cancelled
              {project.closedAt
                ? ` on ${new Date(project.closedAt).toLocaleDateString()}`
                : ""}
              . No further changes can be made.
            </p>
          </div>
        </div>
      )}

      {/* Contractor: submit DRAFT for approval */}
      {isContractor && project.status === "DRAFT" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-off-black">Ready to send?</p>
            <p className="text-xs text-off-black/60">
              Submit this project to {project.client?.name ?? project.clientEmail ?? "your client"} for budget approval.
            </p>
          </div>
          <SubmitForApprovalButton projectId={project.id} />
        </div>
      )}

      {/* Client: review pending approval */}
      {isClient && project.status === "PENDING_APPROVAL" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-bold text-off-black">
              Budget approval required
            </p>
            <p className="text-xs text-off-black/60">
              {project.contractor.name} has submitted this project for your
              approval. Approving will issue a virtual Stripe card capped at the
              project budget.
            </p>
          </div>
          <ApproveProjectButton
            projectId={project.id}
            totalBudget={Number(project.totalBudget)}
          />
        </div>
      )}

      {/* Contractor: respond to counter-proposal */}
      {isContractor && project.status === "COUNTER_PROPOSED" && project.counterBudget && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
          <p className="text-sm font-bold text-off-black">Client sent a counter-proposal</p>
          <CounterRespondButton
            projectId={project.id}
            counterBudget={Number(project.counterBudget)}
            originalBudget={Number(project.totalBudget)}
          />
        </div>
      )}

      {/* Client: waiting on contractor to respond to counter */}
      {isClient && project.status === "COUNTER_PROPOSED" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-off-black">Counter proposal sent</p>
          <p className="text-xs text-off-black/60 mt-1">
            Waiting for {project.contractor.name} to accept or decline your counter.
          </p>
        </div>
      )}

      {/* Contractor: real card details */}
      {isContractor && project.status === "ACTIVE" && project.stripeCardId && (
        <IssuedCardDetails
          projectId={project.id}
          totalBudget={Number(project.totalBudget)}
          showOnLoad={searchParams.approved === "1"}
        />
      )}

      {/* Client: card issued confirmation */}
      {isClient && project.status === "ACTIVE" && project.stripeCardId && (
        <div className={`bg-white rounded-2xl shadow-elevation-1 p-5 flex items-center gap-4 ${searchParams.approved === "1" ? "ring-2 ring-green-400" : ""}`}>
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Icon name="check_circle" className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-sm font-bold text-off-black">
              {searchParams.approved === "1" ? "Card issued successfully!" : "Virtual card active"}
            </p>
            <p className="text-xs text-off-black/50">
              A virtual card has been issued to {project.contractor.name} capped at{" "}
              {formatCurrency(Number(project.totalBudget))}. All spending appears in transactions below.
            </p>
          </div>
          <span className="ml-auto px-2.5 py-1 text-[10px] font-bold rounded-full bg-green-50 text-green-700 border border-green-200 shrink-0">
            Active
          </span>
        </div>
      )}

      {/* Budget Overview */}
      <div className={s.budgetBar}>
        <div className={s.budgetBarInner}>
          <div className="flex-1 space-y-3">
            <div className={s.budgetMetrics}>
              <div>
                <span className={s.budgetMetricLabel}>Spent</span>
                <span className={s.budgetMetricSpent}>
                  {formatCurrency(totalSpent)}
                </span>
              </div>
              <div>
                <span className={s.budgetMetricLabel}>Remaining</span>
                <span className={s.budgetMetricRemaining}>
                  {formatCurrency(Number(project.totalBudget) - totalSpent)}
                </span>
              </div>
              <div>
                <span className={s.budgetMetricLabel}>Total Budget</span>
                <span className={s.budgetMetricFunded}>
                  {formatCurrency(Number(project.totalBudget))}
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
          <TabsTrigger value="budget">
            {isClient ? "Spending" : "Budget Categories"}
          </TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            {isClient ? "Requests" : "Change Orders"}
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Budget / Spending tab */}
        <TabsContent value="budget">
          <div className={s.budgetPanel}>
            <h3 className={s.budgetPanelTitle}>
              {isClient ? "Spending by Category" : "Budget Categories"}
            </h3>
            {project.budgetCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories defined yet.
              </p>
            ) : (
              <div className={s.categoryList}>
                {project.budgetCategories.map((cat) => {
                  const pct =
                    Number(cat.allocatedAmount) > 0
                      ? (Number(cat.spentAmount) /
                          Number(cat.allocatedAmount)) *
                        100
                      : 0;
                  return (
                    <div key={cat.id} className={s.categoryRow}>
                      <div className={s.categoryHeader}>
                        <span className={s.categoryName}>{cat.name}</span>
                        <span
                          className={cn(
                            s.categoryPct,
                            pct > 100
                              ? shared.statusCritical
                              : shared.statusNormal
                          )}
                        >
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <ProgressBar value={pct} className="h-1.5" />
                      <div className={s.categoryMeta}>
                        <span>
                          Spent: {formatCurrency(Number(cat.spentAmount))}
                        </span>
                        <span>
                          Budget:{" "}
                          {formatCurrency(Number(cat.allocatedAmount))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Transactions tab */}
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
              budgetCategory: tx.budgetCategory ?? null,
            }))}
          />
        </TabsContent>

        {/* Requests / Change Orders tab */}
        <TabsContent value="requests" className="space-y-4">
          {/* Top-up requests — visible to both roles */}
          <TopUpRequestList
            requests={project.topUpRequests.map((r) => ({
              id: r.id,
              requestedAmount: Number(r.requestedAmount),
              reason: r.reason,
              status: r.status as
                | "PENDING"
                | "APPROVED"
                | "REJECTED"
                | "CANCELLED",
              createdAt: r.createdAt.toISOString(),
              budgetCategory: r.budgetCategory,
              requester: r.requester,
            }))}
            userRole={user.role}
          />

          {/* Change orders */}
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

          {isContractor && !isCancelled && <ChangeOrderForm projectId={project.id} />}
        </TabsContent>
      </Tabs>
    </main>
  );
}
