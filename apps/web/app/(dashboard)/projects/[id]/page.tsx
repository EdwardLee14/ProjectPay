import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";
import { TransactionFeed } from "@/components/transactions/transaction-feed";
import { AddTransactionForm } from "@/components/transactions/add-transaction-form";
import { BudgetRequestList } from "@/components/projects/budget-request-list";
import { BudgetRequestForm } from "@/components/projects/budget-request-form";
import { ApproveProjectButton } from "@/components/projects/approve-project-button";
import { SubmitForApprovalButton } from "@/components/projects/submit-for-approval-button";
import { CounterRespondButton } from "@/components/projects/counter-respond-button";
import { SidebarCardReveal } from "@/components/projects/sidebar-card-reveal";
import { BudgetCategoryList } from "@/components/projects/budget-category-list";
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
        include: { requester: true, budgetCategory: { select: { id: true, name: true } } },
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

  // Determine the counterpart user to display in info grid
  const counterpart = isClient ? project.contractor : project.client;
  const counterpartLabel = isClient ? "Contractor" : "Client";

  // Build unified budget requests list
  const budgetRequests = [
    ...project.changeOrders.map((co) => ({
      id: co.id,
      type: "change_order" as const,
      amount: Number(co.amount),
      reason: co.reason,
      status: co.status,
      categoryName: co.budgetCategory?.name ?? null,
      requesterName: co.requester.name,
      createdAt: co.createdAt.toISOString(),
    })),
    ...project.topUpRequests.map((r) => ({
      id: r.id,
      type: "top_up" as const,
      amount: Number(r.requestedAmount),
      reason: r.reason,
      status: r.status,
      categoryName: r.budgetCategory?.name ?? null,
      requesterName: r.requester.name,
      createdAt: r.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className={s.detailLayout}>
      {/* ── CENTER PANEL ── */}
      <div className={s.centerPanel}>
        {/* Back link */}
        <Link href="/projects" className={s.backLink}>
          <Icon name="arrow_back" className="text-base" />
          <span>Back to Projects</span>
        </Link>

        {/* Header */}
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

        {/* Status banners */}
        {isCancelled && (
          <div className={s.cancelledBanner}>
            <div className={s.cancelledIconCircle}>
              <Icon name="block" className={s.cancelledIcon} />
            </div>
            <div>
              <p className={s.cancelledTitle}>Project cancelled</p>
              <p className={s.cancelledDesc}>
                This project was cancelled{project.closedAt ? ` on ${new Date(project.closedAt).toLocaleDateString()}` : ""}. No further changes can be made.
              </p>
            </div>
          </div>
        )}

        {isContractor && project.status === "DRAFT" && (
          <div className={s.draftBanner}>
            <div className={s.draftBannerInfo}>
              <p className={s.draftBannerTitle}>Ready to send?</p>
              <p className={s.draftBannerDesc}>
                Submit this project to {project.client?.name ?? project.clientEmail ?? "your client"} for budget approval.
              </p>
            </div>
            <SubmitForApprovalButton projectId={project.id} />
          </div>
        )}

        {isClient && project.status === "PENDING_APPROVAL" && (
          <div className={s.approvalBanner}>
            <div className={s.approvalBannerInfo}>
              <p className={s.approvalBannerTitle}>Budget approval required</p>
              <p className={s.approvalBannerDesc}>
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

        {isContractor && project.status === "COUNTER_PROPOSED" && project.counterBudget && (
          <div className={s.counterBanner}>
            <p className={s.counterBannerTitle}>Client sent a counter-proposal</p>
            <CounterRespondButton
              projectId={project.id}
              counterBudget={Number(project.counterBudget)}
              originalBudget={Number(project.totalBudget)}
            />
          </div>
        )}

        {isClient && project.status === "COUNTER_PROPOSED" && (
          <div className={s.counterBanner}>
            <p className={s.counterBannerTitle}>Counter proposal sent</p>
            <p className={s.counterBannerDesc}>
              Waiting for {project.contractor.name} to accept or decline your counter.
            </p>
          </div>
        )}

        {isClient && project.status === "ACTIVE" && project.stripeCardId && searchParams.approved === "1" && (
          <div className={s.statusBannerActive}>
            <Icon name="check_circle" className="text-primary text-lg" />
            <p className={s.statusBannerText}>
              Card issued to {project.contractor.name} — capped at {formatCurrency(Number(project.totalBudget))}
            </p>
          </div>
        )}

        {/* Project Information */}
        <h2 className={s.sectionTitle}>Project Information</h2>
        <div className={s.fieldGrid}>
          <div>
            <p className={s.fieldLabel}>{counterpartLabel}</p>
            <p className={s.fieldValue}>
              {counterpart?.name ?? project.clientEmail ?? "Not assigned"}
            </p>
          </div>
          <div>
            <p className={s.fieldLabel}>Email</p>
            <p className={s.fieldValue}>
              {counterpart?.email ?? project.clientEmail ?? "---"}
            </p>
          </div>
          {counterpart?.phone && (
            <div>
              <p className={s.fieldLabel}>Phone</p>
              <p className={s.fieldValue}>{counterpart.phone}</p>
            </div>
          )}
          {counterpart?.companyName && (
            <div>
              <p className={s.fieldLabel}>Company</p>
              <p className={s.fieldValue}>{counterpart.companyName}</p>
            </div>
          )}
          <div>
            <p className={s.fieldLabel}>Status</p>
            <p className={s.fieldValue}>{project.status.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className={s.fieldLabel}>Created</p>
            <p className={s.fieldValue}>
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div>
            <p className={s.fieldLabel}>Address</p>
            <p className={s.fieldValue}>---</p>
          </div>
          <div>
            <p className={s.fieldLabel}>Payment Mode</p>
            <p className={s.fieldValue}>{project.stripeCardId ? "Virtual Card" : "Not configured"}</p>
          </div>
          {project.description && (
            <div className="col-span-2 md:col-span-3">
              <p className={s.fieldLabel}>Description</p>
              <p className={s.fieldValue}>{project.description}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="budget" className="mt-8">
          <TabsList className={s.tabStrip}>
            <TabsTrigger value="budget">
              {isClient ? "Spending" : "Budget Categories"}
            </TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="requests" className="relative">
              Budget Requests
              {pendingCount > 0 && (
                <span className={s.pendingCount}>
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Budget / Spending tab */}
          <TabsContent value="budget" className="mt-6">
            <h3 className={s.sectionTitle}>
              {isClient ? "Spending by Category" : "Budget Categories"}
            </h3>
            <BudgetCategoryList
              categories={project.budgetCategories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                allocatedAmount: Number(cat.allocatedAmount),
                spentAmount: Number(cat.spentAmount),
              }))}
              isClient={isClient}
            />
          </TabsContent>

          {/* Transactions tab */}
          <TabsContent value="transactions" className="mt-6 space-y-4">
            {isContractor && !isCancelled && (
              <AddTransactionForm
                projectId={project.id}
                categories={project.budgetCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                }))}
              />
            )}
            <TransactionFeed
              projectId={project.id}
              categories={project.budgetCategories.map((c) => ({
                id: c.id,
                name: c.name,
              }))}
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

          {/* Budget Requests tab */}
          <TabsContent value="requests" className="space-y-4 mt-6">
            {isContractor && !isCancelled && (
              <BudgetRequestForm
                projectId={project.id}
                categories={project.budgetCategories.map((c) => ({
                  id: c.id,
                  name: c.name,
                }))}
              />
            )}
            <BudgetRequestList
              requests={budgetRequests}
              userRole={user.role}
              isContractor={isContractor}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── RIGHT SIDEBAR ── */}
      <aside className={s.rightSidebar}>
        {/* Virtual Card — contractor only */}
        {isContractor && (
          <div className={s.sidebarSection}>
            <h3 className={s.sidebarSectionTitle}>Virtual Card</h3>
            <SidebarCardReveal
              projectId={project.id}
              projectName={project.name}
              contractorName={project.contractor.name}
              stripeCardId={project.stripeCardId}
              isContractor={isContractor}
            />
          </div>
        )}

        {/* Budget Overview */}
        <div className={s.sidebarSection}>
          <h3 className={s.sidebarSectionTitle}>Budget Overview</h3>
          <div className={s.sidebarMetrics}>
            <div className={s.sidebarMetricRow}>
              <span className={s.sidebarMetricLabel}>Spent</span>
              <span className={s.sidebarMetricValue}>
                {formatCurrency(totalSpent)}
              </span>
            </div>
            <div className={s.sidebarMetricRow}>
              <span className={s.sidebarMetricLabel}>Remaining</span>
              <span className={s.sidebarMetricValue}>
                {formatCurrency(Number(project.totalBudget) - totalSpent)}
              </span>
            </div>
            <div className={s.sidebarMetricRow}>
              <span className={s.sidebarMetricLabel}>Total Budget</span>
              <span className={s.sidebarMetricValue}>
                {formatCurrency(Number(project.totalBudget))}
              </span>
            </div>
          </div>
          <div className={s.sidebarProgressWrap}>
            <ProgressBar value={usagePct} />
            <p className={s.sidebarUsageText}>
              {Math.round(usagePct)}% of budget used
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
