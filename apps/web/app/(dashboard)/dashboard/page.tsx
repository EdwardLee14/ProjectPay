import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import s from "./dashboard.module.css";
import shared from "@/styles/shared.module.css";

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

  const totalBudget = projects.reduce((s, p) => s + Number(p.totalBudget), 0);
  const totalFunded = projects.reduce((s, p) => s + Number(p.fundedAmount), 0);
  const totalSpent = projects.reduce(
    (s, p) => s + p.budgetCategories.reduce((cs, c) => cs + Number(c.spentAmount), 0),
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
        <Link href="/projects" className="block bg-guild-peach border-2 border-off-black rounded-2xl p-4 hover:bg-guild-peach/80 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="pending_actions" className="text-xl text-off-black" />
              <span className="text-sm font-semibold text-off-black">
                {pendingOrders} change order{pendingOrders !== 1 ? "s" : ""} pending review
              </span>
            </div>
            <Icon name="arrow_forward" className="text-off-black text-sm" />
          </div>
        </Link>
      )}

      {hasProjects ? (
        <>
          {/* 1. KPI Row */}
          <section className={s.kpiGrid}>
            {(() => {
              const fundedPct = totalBudget > 0 ? Math.round((totalFunded / totalBudget) * 100) : 0;
              const remainPct = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0;
              const spentPct = Math.round(usagePct);

              return [
                {
                  label: "Total Budget",
                  value: formatCurrency(totalBudget),
                  sub: `across ${projects.length} project${projects.length !== 1 ? "s" : ""}`,
                  accent: "bg-primary", accentLight: true,
                  icon: "account_balance_wallet",
                  dark: false,
                },
                {
                  label: "Total Spent",
                  value: formatCurrency(totalSpent),
                  sub: `${spentPct}% of budget`,
                  delta: spentPct > 80 ? "up" : undefined,
                  accent: "bg-guild-peach", accentLight: false,
                  icon: "trending_down",
                  dark: false,
                },
                {
                  label: "Budget Remaining",
                  value: formatCurrency(remaining),
                  sub: `${remainPct}% available`,
                  delta: remainPct > 20 ? "up" : remainPct > 0 ? undefined : "down",
                  accent: "bg-secondary", accentLight: true,
                  icon: "savings",
                  dark: false,
                },
                {
                  label: "Total Funded",
                  value: formatCurrency(totalFunded),
                  sub: totalFunded > 0 ? `${fundedPct}% funded` : "awaiting funding",
                  delta: totalFunded > 0 && fundedPct >= 100 ? "up" : undefined,
                  accent: "bg-guild-mint", accentLight: true,
                  icon: "payments",
                  dark: false,
                },
              ].map((item) => (
                <div key={item.label} className={s.kpiCard}>
                  <div className={cn(s.kpiAccent, item.accent)}>
                    <p className={item.accentLight ? s.kpiAccentLabel : s.kpiAccentLabelDark}>
                      <span className="font-normal">{item.label.split(" ")[0]}</span>{" "}
                      <strong>{item.label.split(" ").slice(1).join(" ")}</strong>
                    </p>
                    <Icon name={item.icon} className={item.accentLight ? s.kpiAccentIcon : s.kpiAccentIconDark} />
                  </div>
                  <div className={s.kpiBody}>
                    <p className={s.kpiValue}>{item.value}</p>
                    <p className={s.kpiSub}>
                      {item.sub}
                      {item.delta === "up" && <span className={s.kpiDeltaUp}>&uarr;</span>}
                      {item.delta === "down" && <span className={s.kpiDeltaDown}>&darr;</span>}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </section>

          {/* 2. Budget Utilization (5-col) + Activity (7-col) */}
          <section className={s.row2col}>
            <div className={cn(s.utilBanner, s.col5)}>
              {/* Header with shapes next to title */}
              <div className={s.utilHeader}>
                <div>
                  <p className={s.utilTitle}>
                    <span className="font-normal">Budget</span>{" "}
                    <strong>Utilization</strong>
                  </p>
                  <p className={s.utilSubtitle}>
                    {projects.length} project{projects.length !== 1 ? "s" : ""} &middot; {activeCount} active
                  </p>
                </div>
                {/* Geometric shapes next to header */}
                <svg width="80" height="45" viewBox="0 0 80 45" fill="none" className="flex-shrink-0 opacity-35">
                  <rect x="0" y="5" width="28" height="28" rx="6" fill="#E7651C" />
                  <circle cx="40" cy="19" r="14" fill="#2D4A34" />
                  <rect x="52" y="0" width="28" height="45" rx="14" fill="#170B01" opacity="0.6" />
                </svg>
              </div>

              {/* Inner card with border */}
              <div className={s.utilCard}>
                <div className={s.utilCardRow}>
                  <p className={s.utilCardLabel}>Overall Spend</p>
                  <p className={cn(s.utilCardPct, pctColor(usagePct))}>{Math.round(usagePct)}%</p>
                </div>
                <div className={s.utilProgressTrack}>
                  <div
                    className={cn(barColor(usagePct), "h-full rounded-full transition-all duration-500")}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
                <div className={s.utilCardMeta}>
                  <span>{formatCurrency(totalSpent)} spent</span>
                  <span>{formatCurrency(totalBudget)} budget</span>
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div className={cn(s.activityCard, s.col7)}>
              <div className={s.activityHeader}>
                <h3 className={s.activityHeaderTitle}>
                  <Icon name="notifications" className="text-lg text-primary" />
                  Activity
                </h3>
              </div>
              <div>
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 4).map((tx) => (
                    <div key={tx.id} className={s.activityRow}>
                      <span className={cn(s.activityDot, "bg-primary")} />
                      <div>
                        <p className={s.activityTitle}>
                          {tx.merchantName} &mdash; {formatCurrency(Number(tx.amount))}
                        </p>
                        <p className={s.activityMeta}>
                          {tx.project.name} &middot;{" "}
                          {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className={s.activityRow}>
                      <span className={cn(s.activityDot, "bg-secondary")} />
                      <div>
                        <p className={s.activityTitle}>Project created</p>
                        <p className={s.activityMeta}>Your first project is ready to fund</p>
                      </div>
                    </div>
                    <div className={s.activityRow}>
                      <span className={cn(s.activityDot, "bg-guild-peach")} />
                      <div>
                        <p className={s.activityTitle}>No transactions yet</p>
                        <p className={s.activityMeta}>Spending will appear here once the project is funded</p>
                      </div>
                    </div>
                  </>
                )}
                {pendingOrders > 0 && (
                  <div className={s.activityRow}>
                    <span className={cn(s.activityDot, "bg-tertiary-fixed-dim")} />
                    <div>
                      <p className={s.activityTitle}>
                        {pendingOrders} change order{pendingOrders !== 1 ? "s" : ""} pending
                      </p>
                      <p className={s.activityMeta}>Awaiting review</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 3. Navigate Quick Links */}
          <section className={s.navGrid}>
            {[
              { href: "/projects/new", title: "New Project", desc: "Create and define budget", bg: "bg-primary", dark: true },
              { href: "/projects", title: "All Projects", desc: "Manage active and drafts", bg: "bg-guild-cream", dark: false },
              { href: "/projects", title: "Change Orders", desc: "Review pending requests", bg: "bg-guild-mint", dark: true },
              { href: "/transactions", title: "Transactions", desc: "View recent activity", bg: "bg-secondary", dark: true },
            ].map((nav) => (
              <Link key={nav.title} href={nav.href} className={cn(s.navCard, nav.bg, "group")}>
                <p className={nav.dark ? s.navCardTitleLight : s.navCardTitle}>{nav.title}</p>
                <p className={nav.dark ? s.navCardDescLight : s.navCardDesc}>{nav.desc}</p>
                <Icon name="arrow_forward" className={nav.dark ? s.navCardArrowLight : s.navCardArrow} />
              </Link>
            ))}
          </section>

          {/* 4. Projects + Summary */}
          <section className={s.row2col}>
            <div className={cn(s.plainCard, s.col7)}>
              <div className={s.plainHeader}>
                <h3 className={s.plainHeaderTitle}>
                  <Icon name="folder_open" className="text-lg text-primary" />
                  Projects
                </h3>
                <Link href="/projects" className={s.plainHeaderAction}>
                  View all &rarr;
                </Link>
              </div>
              <div>
                {projects.slice(0, 5).map((project, i) => {
                  const spent = project.budgetCategories.reduce((s, c) => s + Number(c.spentAmount), 0);
                  const pct = Number(project.totalBudget) > 0 ? (spent / Number(project.totalBudget)) * 100 : 0;
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
                        <span>{formatCurrency(Number(project.totalBudget))} budget</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={cn(s.plainCard, s.col5)}>
              <div className={s.plainHeader}>
                <h3 className={s.plainHeaderTitle}>
                  <Icon name="monitoring" className="text-lg text-primary" />
                  Summary
                </h3>
              </div>
              <div className="space-y-0">
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
          </section>

          {/* 5. Recent Transactions — full width */}
          <section className={s.plainCard}>
            <div className={s.plainHeader}>
              <h3 className={s.plainHeaderTitle}>
                <Icon name="receipt_long" className="text-lg text-primary" />
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
                        <p className={s.txAmount}>{formatCurrency(Number(tx.amount))}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12">
                <Icon name="receipt_long" className="text-off-black/10 mb-2" size={40} />
                <p className="text-sm text-off-black">No transactions yet</p>
              </div>
            )}
          </section>
        </>
      ) : (
        /* Empty State */
        <section className={s.emptyGrid}>
          <div className={s.emptyHero}>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-white">Get Started</p>
            <h2 className={s.emptyHeroTitle}>Create your first project.</h2>
            <p className={s.emptyHeroDesc}>
              Set up a structured budget, share it with your client, and start tracking every dollar in real time.
            </p>
            <div className="pt-2">
              <Button variant="pill" asChild>
                <Link href="/projects/new">
                  New Project &rarr;
                </Link>
              </Button>
            </div>
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
