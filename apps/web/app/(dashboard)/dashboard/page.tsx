import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ClientDashboard } from "./client-view";
import s from "./dashboard.module.css";
import shared from "@/styles/shared.module.css";

export default async function DashboardPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  // ── Client dashboard ─────────────────────────────────────────────────────
  if (user.role === "CLIENT") {
    const projectIds: string[] = [];

    const clientProjects = await prisma.project.findMany({
      where: {
        clientId: user.id,
        status: { notIn: ["DRAFT", "CANCELLED"] },
      },
      include: { budgetCategories: true, contractor: true },
      orderBy: { createdAt: "desc" },
    });

    clientProjects.forEach((p) => projectIds.push(p.id));

    const [pendingChangeOrders, pendingTopUps] = await Promise.all([
      prisma.changeOrder.findMany({
        where: { projectId: { in: projectIds }, status: "PENDING" },
        include: { project: { select: { name: true } }, budgetCategory: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.topUpRequest.findMany({
        where: { projectId: { in: projectIds }, status: "PENDING" },
        include: { project: { select: { name: true } }, budgetCategory: { select: { name: true } }, requester: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const pendingRequests = [
      ...pendingChangeOrders.map((co) => ({
        id: co.id,
        type: "change_order" as const,
        projectName: co.project.name,
        projectId: co.projectId,
        amount: Number(co.amount),
        reason: co.reason,
        categoryName: co.budgetCategory?.name ?? null,
        requesterName: co.requester.name,
        createdAt: co.createdAt.toISOString(),
      })),
      ...pendingTopUps.map((t) => ({
        id: t.id,
        type: "top_up" as const,
        projectName: t.project.name,
        projectId: t.projectId,
        amount: Number(t.requestedAmount),
        reason: t.reason,
        categoryName: t.budgetCategory?.name ?? null,
        requesterName: t.requester.name,
        createdAt: t.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const REVIEW_STATUSES = new Set(["PENDING_APPROVAL", "COUNTER_PROPOSED"]);

    const projectRequests = clientProjects
      .filter((p) => REVIEW_STATUSES.has(p.status))
      .map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status as "PENDING_APPROVAL" | "COUNTER_PROPOSED",
        totalBudget: Number(p.totalBudget),
        counterBudget: p.counterBudget ? Number(p.counterBudget) : null,
        contractorName: p.contractor.name,
        createdAt: p.createdAt.toISOString(),
        description: p.description ?? null,
        categories: p.budgetCategories.map((c) => ({
          id: c.id,
          name: c.name,
          allocatedAmount: Number(c.allocatedAmount),
        })),
      }));

    const mappedProjects = clientProjects
      .filter((p) => !REVIEW_STATUSES.has(p.status))
      .map((p) => {
        const totalSpent = p.budgetCategories.reduce((s, c) => s + Number(c.spentAmount), 0);
        return {
          id: p.id,
          name: p.name,
          status: p.status,
          totalBudget: Number(p.totalBudget),
          fundedAmount: Number(p.fundedAmount),
          stripeCardId: p.stripeCardId,
          contractorName: p.contractor.name,
          totalSpent,
          categories: p.budgetCategories.map((c) => ({
            id: c.id,
            name: c.name,
            allocatedAmount: Number(c.allocatedAmount),
            spentAmount: Number(c.spentAmount),
          })),
        };
      });

    const totalBudget = mappedProjects.reduce((s, p) => s + p.totalBudget, 0);
    const totalSpent = mappedProjects.reduce((s, p) => s + p.totalSpent, 0);
    const activeCount = mappedProjects.filter((p) => p.status === "ACTIVE").length;

    return (
      <ClientDashboard
        userName={user.name}
        projects={mappedProjects}
        projectRequests={projectRequests}
        pendingRequests={pendingRequests}
        totalBudget={totalBudget}
        totalSpent={totalSpent}
        activeCount={activeCount}
      />
    );
  }

  // ── Contractor dashboard ──────────────────────────────────────────────────
  const projects = await prisma.project.findMany({
    where: { contractorId: user.id, status: { not: "CANCELLED" } },
    include: { budgetCategories: true, client: true },
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

  const awaitingApproval = projects
    .filter((p) => p.status === "PENDING_APPROVAL" || p.status === "COUNTER_PROPOSED")
    .map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status as "PENDING_APPROVAL" | "COUNTER_PROPOSED",
      totalBudget: Number(p.totalBudget),
      counterBudget: p.counterBudget ? Number(p.counterBudget) : null,
      clientName: p.client?.name ?? p.clientEmail ?? "Client",
      createdAt: p.createdAt.toISOString(),
    }));

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

  const pendingTopUps = await prisma.topUpRequest.count({
    where: {
      projectId: { in: projects.map((p) => p.id) },
      status: "PENDING",
    },
  });

  const pendingTotal = pendingOrders + pendingTopUps;

  const hasProjects = projects.length > 0;

  return (
    <main className={shared.dashboardPage}>
      {/* Header */}
      <div className={s.header}>
        <div>
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
      {pendingTotal > 0 && (
        <Link href="/projects" className={s.alertBar}>
          <div className={s.alertBarContent}>
            <Icon name="pending_actions" className={s.alertBarIcon} />
            <span className={s.alertBarText}>
              {pendingTotal} request{pendingTotal !== 1 ? "s" : ""} pending your review
            </span>
          </div>
          <Icon name="arrow_forward" className={s.alertBarArrow} />
        </Link>
      )}

      {/* Awaiting approval / counter-proposed */}
      {awaitingApproval.length > 0 && (
        <div className="bg-white rounded-2xl shadow-elevation-1 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-off-black/5">
            <Icon name="pending_actions" className="text-primary text-lg" />
            <h2 className="text-sm font-bold text-off-black">Awaiting Client Approval</h2>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
              {awaitingApproval.length}
            </span>
          </div>
          <div className="divide-y divide-off-black/5">
            {awaitingApproval.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-off-black/[0.01] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon
                    name={p.status === "COUNTER_PROPOSED" ? "swap_horiz" : "hourglass_top"}
                    className="text-base text-primary"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-off-black truncate">{p.name}</p>
                  <p className="text-xs text-off-black/40">
                    {p.clientName} &middot;{" "}
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-off-black">{formatCurrency(p.totalBudget)}</p>
                  {p.status === "COUNTER_PROPOSED" && p.counterBudget ? (
                    <p className="text-xs text-amber-600 font-medium">
                      Counter: {formatCurrency(p.counterBudget)}
                    </p>
                  ) : (
                    <p className="text-[10px] text-off-black/30">waiting on client</p>
                  )}
                </div>
                <span className={cn(
                  "shrink-0 px-2.5 py-1 text-[10px] font-bold rounded-full border",
                  p.status === "COUNTER_PROPOSED"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-600 border-blue-200"
                )}>
                  {p.status === "COUNTER_PROPOSED" ? "Counter Received" : "Pending Approval"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {hasProjects ? (
        <>
          {/* 1. KPI Row — flat minimal cards */}
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
                },
                {
                  label: "Total Spent",
                  value: formatCurrency(totalSpent),
                  sub: `${spentPct}% of budget`,
                  delta: spentPct > 80 ? "up" : undefined,
                },
                {
                  label: "Budget Remaining",
                  value: formatCurrency(remaining),
                  sub: `${remainPct}% available`,
                  delta: remainPct > 20 ? "up" : remainPct > 0 ? undefined : "down",
                },
                {
                  label: "Total Funded",
                  value: formatCurrency(totalFunded),
                  sub: totalFunded > 0 ? `${fundedPct}% funded` : "awaiting funding",
                  delta: totalFunded > 0 && fundedPct >= 100 ? "up" : undefined,
                },
              ].map((item) => (
                <div key={item.label} className={s.kpiCard}>
                  <div className={s.kpiLabel}>
                    <span className={s.kpiLabelText}>{item.label}</span>
                  </div>
                  <p className={s.kpiValue}>{item.value}</p>
                  <p className={s.kpiSub}>
                    {item.sub}
                    {item.delta === "up" && <span className={s.kpiDelta}>&uarr;</span>}
                    {item.delta === "down" && <span className={s.kpiDeltaDown}>&darr;</span>}
                  </p>
                </div>
              ));
            })()}
          </section>

          {/* 2. Project Cards — active only */}
          {projects.filter((p) => p.status === "ACTIVE" && p.stripeCardId).length > 0 && (
          <section className={s.cardStackSection}>
            <div className={s.cardStackSectionHeader}>
              <h3 className={s.cardStackSectionTitle}>Active Cards</h3>
              <Link href="/projects" className={s.cardStackSectionAction}>
                View all &rarr;
              </Link>
            </div>
            <div className={s.cardStackTrack}>
              {projects.filter((p) => p.status === "ACTIVE" && p.stripeCardId).slice(0, 5).map((project, idx) => {
                const spent = project.budgetCategories.reduce((s, c) => s + Number(c.spentAmount), 0);
                const pct = Number(project.totalBudget) > 0 ? (spent / Number(project.totalBudget)) * 100 : 0;
                const last4 = String(idx + 1).padStart(4, "0");
                const clientName = project.client?.name ?? "Client";
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={s.stackCard}
                  >
                    {/* Virtual card */}
                    <div className={s.virtualCard}>
                      <div className={s.virtualCardTop}>
                        <span className={s.virtualCardName}>VisiBill</span>
                        <span className={s.virtualCardVisa}>VISA</span>
                      </div>
                      <div className={s.virtualCardChipRow}>
                        <div className={s.virtualCardChip}>
                          <div className={s.virtualCardChipLines} />
                        </div>
                      </div>
                      <p className={s.virtualCardNumber}>
                        **** &nbsp; **** &nbsp; **** &nbsp; {last4}
                      </p>
                      <div className={s.virtualCardBottom}>
                        <div className={s.virtualCardHolder}>
                          <p className={s.virtualCardHolderLabel}>Card Holder</p>
                          <p className={s.virtualCardHolderName}>{clientName}</p>
                        </div>
                        <div className={s.virtualCardExpiry}>
                          <p className={s.virtualCardExpiryLabel}>Expiry</p>
                          <p className={s.virtualCardExpiryValue}>12/28</p>
                        </div>
                      </div>
                    </div>

                    {/* Project info below card */}
                    <div className={s.stackCardInfo}>
                      <p className={s.stackCardName}>{project.name}</p>
                      <p className={s.stackCardBudget}>{formatCurrency(Number(project.totalBudget))}</p>
                      <div className={s.stackCardRow}>
                        <span className={project.status === "ACTIVE" ? shared.badgeActive : shared.badgeDefault}>
                          {project.status}
                        </span>
                        <span className={s.stackCardMeta}>{Math.round(pct)}% spent</span>
                      </div>
                      <div className={s.stackCardProgress}>
                        <ProgressBar value={pct} className="h-1.5" trackClassName="bg-peach-100" borderClassName="border border-off-black" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
          )}

          {/* 3. Budget Utilization (5-col) + Activity (7-col) */}
          <section className={s.row2col}>
            <div className={cn(s.utilBanner, s.col5)}>
              {/* Geometric visualization — right side background */}
              <div className={s.utilViz}>
                <svg viewBox="0 0 240 260" preserveAspectRatio="xMaxYMin slice">
                  <defs>
                    {/* Diagonal hatching pattern */}
                    <pattern id="utilHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                      <line x1="0" y1="0" x2="0" y2="6" stroke="#1a1a1a" strokeWidth="0.7" />
                    </pattern>
                    <linearGradient id="utilFadeL" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F6CA9E" />
                      <stop offset="100%" stopColor="#F6CA9E" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="utilFadeB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F6CA9E" stopOpacity="0" />
                      <stop offset="100%" stopColor="#F6CA9E" />
                    </linearGradient>
                    {/* Clip for hatching */}
                    <clipPath id="utilShapeClip">
                      <path d="M0,260 L40,200 L70,120 L110,40 L135,80 L160,15 L195,70 L230,0 L240,0 L240,260 Z" />
                    </clipPath>
                    {/* Blur filter for shadow */}
                    <filter id="utilShadow">
                      <feGaussianBlur stdDeviation="10" />
                    </filter>
                  </defs>

                  {/* Warped geometric shadow */}
                  <g transform="translate(8, 3)">
                    <path
                      d="M60,260 L90,140 L120,55 L148,95 L174,22 L212,85 L250,8 L260,15 L260,260 Z"
                      fill="#1a1a1a"
                      opacity="0.1"
                    />
                  </g>

                  {/* Main shape — gradual slope, tight dip between peaks 1 & 2 */}
                  <path
                    d="M0,260 L40,200 L70,120 L110,40 L135,80 L160,15 L195,70 L230,0 L240,0 L240,260 Z"
                    fill="#D65A0A"
                    opacity="0.75"
                  />

                  {/* Hatching overlay */}
                  <rect
                    x="0" y="0" width="240" height="260"
                    fill="url(#utilHatch)"
                    opacity="0.35"
                    clipPath="url(#utilShapeClip)"
                  />
                </svg>
              </div>

              <div className={s.utilOuterContent}>
                {/* Header text */}
                <div className={s.utilHeader}>
                  <div className={s.utilHeaderText}>
                    <p className={s.utilEyebrow}>Your Company&apos;s</p>
                    <p className={s.utilTitle}>Budget Utilization</p>
                  </div>
                </div>

                {/* Black divider */}
                <div className={s.utilDivider} />

                {/* Inner white card */}
                <div className={s.utilInnerCard}>
                  <div className={s.utilInnerLeft}>
                    <p className={s.utilInnerTitle}>Overall Spend</p>
                    <div className={s.utilProgressRow}>
                      <ProgressBar value={usagePct} className="flex-1" trackClassName="bg-peach-100" borderClassName="border border-off-black" />
                      <span className={s.utilProgressPct}>{Math.round(usagePct)}%</span>
                    </div>
                    <div className={s.utilCardMeta}>
                      <span>{formatCurrency(totalSpent)} spent</span>
                      <span className={s.utilMetaDot} />
                      <span>{formatCurrency(totalBudget)} budget</span>
                    </div>

                    {/* Sub section */}
                    <div className={s.utilSubSection}>
                      <p className={s.utilSubLabel}>
                        {projects.length} project{projects.length !== 1 ? "s" : ""} &middot; {activeCount} active
                      </p>
                      <p className={s.utilSubDesc}>
                        {formatCurrency(remaining)} remaining across all projects
                      </p>
                    </div>
                  </div>

                  {/* Vertical divider */}
                  <div className={s.utilInnerDivider} />

                  {/* Donut chart */}
                  <div className={s.utilInnerRight}>
                    <div className={s.utilDonut}>
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle
                          cx="18" cy="18" r="15.5"
                          fill="none"
                          stroke="hsl(0 0% 0% / 0.08)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="18" cy="18" r="15.5"
                          fill="none"
                          stroke="hsl(22 82% 51%)"
                          strokeWidth="3"
                          strokeDasharray={`${Math.min(usagePct, 100)} ${100 - Math.min(usagePct, 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className={s.utilDonutCenter}>
                        <span className={s.utilDonutPct}>{Math.round(usagePct)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity feed */}
            <div className={cn(s.activityCard, s.col7)}>
              <div className={s.activityHeader}>
                <h3 className={s.activityHeaderTitle}>Activity</h3>
                <span className={s.activityHeaderCount}>
                  {recentTransactions.length > 0
                    ? `${Math.min(recentTransactions.length, 4)} recent`
                    : "No activity"}
                </span>
              </div>
              <div>
                {recentTransactions.length > 0 ? (
                  recentTransactions.slice(0, 4).map((tx) => (
                    <div key={tx.id} className={s.activityRow}>
                      <span className={s.activityDot} />
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
                      <span className={s.activityDot} />
                      <div>
                        <p className={s.activityTitle}>No transactions yet</p>
                        <p className={s.activityMeta}>
                          {user.role === "CONTRACTOR"
                            ? "Spending will appear here once the project is funded"
                            : "Spending will appear here once a project is active"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {pendingOrders > 0 && (
                  <div className={s.activityRow}>
                    <span className={s.activityDot} />
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

          {/* 4. Recent Transactions — Salesforce-style full width */}
          <section className={s.plainCard}>
            <div className={s.plainHeader}>
              <h3 className={s.plainHeaderTitle}>Recent Transactions</h3>
              <div className={s.txToolbar}>
                <button className={shared.toolbarBtn}>
                  <Icon name="filter_list" className="text-off-black/40 text-lg" />
                </button>
                <button className={shared.toolbarBtn}>
                  <Icon name="download" className="text-off-black/40 text-lg" />
                </button>
              </div>
            </div>

            {/* Tab strip */}
            <div className={s.txTabs}>
              <span className={s.txTabActive}>All</span>
              <span className={s.txTab}>Pending</span>
              <span className={s.txTab}>Completed</span>
            </div>

            {recentTransactions.length > 0 ? (
              <>
                <p className={s.txRecordCount}>
                  Showing {recentTransactions.length} transaction{recentTransactions.length !== 1 ? "s" : ""}
                </p>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-off-black/5">
                      <th className={shared.tableHeader}>
                        <span className={s.txSortHeader}>
                          Vendor <Icon name="swap_vert" className="text-[10px] text-off-black/20" />
                        </span>
                      </th>
                      <th className={cn(shared.tableHeader, "hidden md:table-cell")}>
                        <span className={s.txSortHeader}>
                          Project <Icon name="swap_vert" className="text-[10px] text-off-black/20" />
                        </span>
                      </th>
                      <th className={cn(shared.tableHeader, "hidden lg:table-cell")}>Category</th>
                      <th className={cn(shared.tableHeader, "text-right")}>
                        <span className={cn(s.txSortHeader, "justify-end")}>
                          Amount <Icon name="swap_vert" className="text-[10px] text-off-black/20" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx, i) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          i < recentTransactions.length - 1 ? shared.tableRowBorder : shared.tableRow,
                          i % 2 === 1 && "bg-peach-50/30"
                        )}
                      >
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
              </>
            ) : (
              <div className="text-center py-8 lg:py-12">
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
            <p className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.15em] text-white">Get Started</p>
            <h2 className={s.emptyHeroTitle}>Create your first project.</h2>
            <p className={s.emptyHeroDesc}>
              Set up a structured budget, share it with your client, and start tracking every dollar in real time.
            </p>
            <div className="pt-2">
              <Button variant="pill" asChild>
                <Link href="/projects/new">New Project &rarr;</Link>
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
                <Icon name={item.icon} className="text-lg lg:text-xl text-primary flex-shrink-0 mt-0.5" />
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
