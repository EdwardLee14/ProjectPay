import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import s from "./dashboard.module.css";
import shared from "@/styles/shared.module.css";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const projects =
    user.role === "CONTRACTOR"
      ? await prisma.project.findMany({
          where: { contractorId: user.id },
          include: { budgetCategories: true, client: true },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.project.findMany({
          where: { clientId: user.id },
          include: { budgetCategories: true, contractor: true },
          orderBy: { createdAt: "desc" },
        });

  const totalBudget = projects.reduce((s, p) => s + p.totalBudget, 0);
  const totalFunded = projects.reduce((s, p) => s + p.fundedAmount, 0);
  const totalSpent = projects.reduce(
    (s, p) => s + p.budgetCategories.reduce((cs, c) => cs + c.spentAmount, 0),
    0
  );
  const remaining = totalBudget - totalSpent;
  const usagePct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;

  const recentTransactions = await prisma.transaction.findMany({
    where: { projectId: { in: projects.map((p) => p.id) } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const pendingOrders = await prisma.changeOrder.count({
    where: {
      projectId: { in: projects.map((p) => p.id) },
      status: "PENDING",
    },
  });

  const hasProjects = projects.length > 0;

  const pctColor = (pct: number) =>
    pct > 100 ? shared.statusRed : pct >= 80 ? shared.statusAmber : shared.statusGreen;

  const barColor = (pct: number) =>
    pct > 100 ? shared.progressRed : pct >= 80 ? shared.progressAmber : shared.progressGreen;

  return (
    <main className={shared.dashboardPage}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={shared.eyebrow}>Dashboard</p>
          <h1 className={shared.pageTitle}>
            Welcome back, {user.name?.split(" ")[0] ?? "there"}.
          </h1>
        </div>
        {hasProjects && (
          <p className={s.headerMeta}>
            {activeCount} active &middot; {projects.length} total
          </p>
        )}
      </div>

      {/* Pending alert */}
      {pendingOrders > 0 && (
        <Link href="/projects" className={shared.alertBanner}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="pending_actions" className="text-xl text-off-black" />
              <span className="text-sm font-semibold text-off-black">
                {pendingOrders} change order{pendingOrders !== 1 ? "s" : ""} pending review
              </span>
            </div>
            <Icon name="arrow_forward" className={shared.iconArrow} />
          </div>
        </Link>
      )}

      {hasProjects ? (
        <>
          {/* KPI Row */}
          <section className={s.kpiGrid}>
            {[
              { label: "Total Budget", value: formatCurrency(totalBudget), bg: "bg-white", dark: false },
              { label: "Spent", value: formatCurrency(totalSpent), bg: "bg-guild-peach", dark: false },
              { label: "Remaining", value: formatCurrency(remaining), bg: "bg-white", dark: false },
              { label: "Funded", value: formatCurrency(totalFunded), bg: "bg-guild-mint", dark: true },
            ].map((item, i) => (
              <div
                key={item.label}
                className={cn(
                  s.kpiCell,
                  item.bg,
                  i < 3 && s.kpiCellBorderRight,
                  i < 2 && s.kpiCellBorderBottom,
                )}
              >
                <p className={item.dark ? shared.metricLabelLight : shared.metricLabelDark}>
                  {item.label}
                </p>
                <p className={item.dark ? shared.metricValueLight : shared.metricValue}>
                  {item.value}
                </p>
              </div>
            ))}
          </section>

          {/* Utilization */}
          <section className={s.utilization}>
            <div className={s.utilizationHeader}>
              <p className={s.utilizationLabel}>Budget Utilization</p>
              <span className={cn(s.utilizationPct, pctColor(usagePct))}>
                {Math.round(usagePct)}%
              </span>
            </div>
            <div className={shared.progressTrack}>
              <div
                className={barColor(usagePct)}
                style={{ width: `${Math.min(usagePct, 100)}%` }}
              />
            </div>
          </section>

          {/* Content Grid */}
          <section className={s.contentGrid}>
            {/* Projects */}
            <div className={s.projectsPanel}>
              <div className={shared.cardHeader}>
                <h3 className={shared.cardHeaderTitle}>
                  <Icon name="folder_open" className={shared.iconMuted} />
                  Projects
                </h3>
                <Link href="/projects" className={shared.viewAllLink}>
                  View all &rarr;
                </Link>
              </div>
              <div>
                {projects.slice(0, 5).map((project, i) => {
                  const spent = project.budgetCategories.reduce((s, c) => s + c.spentAmount, 0);
                  const pct = project.totalBudget > 0 ? (spent / project.totalBudget) * 100 : 0;
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className={cn("group", i < Math.min(projects.length, 5) - 1 ? s.projectRowBorder : s.projectRow)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={s.projectName}>{project.name}</span>
                          <span className={project.status === "ACTIVE" ? shared.badgeActive : shared.badgeDefault}>
                            {project.status}
                          </span>
                        </div>
                        <span className={cn("text-xs font-bold", pctColor(pct))}>
                          {Math.round(pct)}%
                        </span>
                      </div>
                      <div className={shared.progressTrackSmall}>
                        <div className={barColor(pct)} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <div className={s.projectMeta}>
                        <span>{formatCurrency(spent)} spent</span>
                        <span>{formatCurrency(project.totalBudget)} budget</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className={s.sidebar}>
              {/* Quick Actions */}
              <div className={shared.card}>
                <div className={shared.cardHeader}>
                  <h3 className={shared.cardHeaderTitle}>
                    <Icon name="bolt" className={shared.iconMuted} />
                    Quick Actions
                  </h3>
                </div>
                <div className={shared.listDivided}>
                  <Link href="/projects/new" className={cn(s.actionRow, "group")}>
                    <Icon name="add_circle" className="text-xl text-primary" />
                    <div className="flex-1">
                      <p className={s.actionTitle}>New Project</p>
                      <p className={s.actionDesc}>Create and define budget</p>
                    </div>
                    <Icon name="arrow_forward" className={shared.iconArrow} />
                  </Link>
                  <Link href="/projects" className={cn(s.actionRow, "group")}>
                    <Icon name="folder_open" className="text-xl text-secondary" />
                    <div className="flex-1">
                      <p className={s.actionTitle}>All Projects</p>
                      <p className={s.actionDesc}>Manage active and drafts</p>
                    </div>
                    <Icon name="arrow_forward" className={shared.iconArrow} />
                  </Link>
                </div>
              </div>

              {/* Summary */}
              <div className={shared.card}>
                <div className={shared.cardHeader}>
                  <h3 className={shared.cardHeaderTitle}>
                    <Icon name="monitoring" className={shared.iconMuted} />
                    Summary
                  </h3>
                </div>
                <div className={shared.listDivided}>
                  {[
                    { label: "Active Projects", value: activeCount },
                    { label: "Pending Orders", value: pendingOrders },
                    { label: "Funding Rate", value: `${totalBudget > 0 ? Math.round((totalFunded / totalBudget) * 100) : 0}%` },
                    { label: "Total Projects", value: projects.length },
                  ].map((row) => (
                    <div key={row.label} className={s.summaryRow}>
                      <span className={s.summaryLabel}>{row.label}</span>
                      <span className={s.summaryValue}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Transactions */}
          <section className={s.transactionsPanel}>
            <div className={shared.cardHeader}>
              <h3 className={shared.cardHeaderTitle}>
                <Icon name="receipt_long" className={shared.iconMuted} />
                Recent Transactions
              </h3>
              <div className={s.txToolbar}>
                <button className={shared.toolbarBtn}>
                  <Icon name="filter_list" className="text-off-black/40 text-lg" />
                </button>
                <button className={shared.toolbarBtn}>
                  <Icon name="download" className="text-off-black/40 text-lg" />
                </button>
              </div>
            </div>

            {recentTransactions.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-off-black/20">
                    <th className={shared.tableHeader}>Vendor</th>
                    <th className={cn(shared.tableHeader, "hidden md:table-cell")}>Project</th>
                    <th className={cn(shared.tableHeader, "hidden lg:table-cell")}>Category</th>
                    <th className={cn(shared.tableHeader, "text-right")}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, i) => (
                    <tr key={tx.id} className={i < recentTransactions.length - 1 ? shared.tableRowBorder : shared.tableRow}>
                      <td className={shared.tableCell}>
                        <p className={s.txVendor}>{tx.merchantName}</p>
                        <p className={s.txDate}>
                          {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </td>
                      <td className={cn(shared.tableCell, "hidden md:table-cell")}>
                        <p className={s.txProject}>{tx.project.name}</p>
                      </td>
                      <td className={cn(shared.tableCell, "hidden lg:table-cell")}>
                        <span className={s.txCategory}>{tx.categoryCode}</span>
                      </td>
                      <td className={cn(shared.tableCell, "text-right")}>
                        <p className={s.txAmount}>{formatCurrency(tx.amount)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={shared.emptyState}>
                <Icon name="receipt_long" className={shared.emptyIcon} size={40} />
                <p className="text-sm text-off-black/40">No transactions yet</p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* Empty State */
        <section className={s.emptyGrid}>
          <div className={s.emptyHero}>
            <p className={shared.eyebrowLight}>Get Started</p>
            <h2 className={s.emptyHeroTitle}>Create your first project.</h2>
            <p className={s.emptyHeroDesc}>
              Set up a structured budget, share it with your client, and start tracking every dollar in real time.
            </p>
            <Link
              href="/projects/new"
              className="inline-block bg-white text-off-black px-8 py-3 rounded-full text-sm font-semibold border border-white hover:bg-transparent hover:text-white transition-colors"
            >
              New Project &rarr;
            </Link>
          </div>

          <div className={s.emptySteps}>
            {[
              { icon: "edit_note", title: "Define your budget", desc: "2-8 categories, each with a dollar cap." },
              { icon: "share", title: "Share with your client", desc: "They review and approve before funding." },
              { icon: "credit_card", title: "Spend transparently", desc: "Every dollar tracked and visible." },
            ].map((item, i) => (
              <div key={item.title} className={i < 2 ? s.emptyStepBorder : s.emptyStep}>
                <Icon name={item.icon} className="text-xl text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className={s.emptyStepTitle}>{item.title}</p>
                  <p className={s.emptyStepDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
