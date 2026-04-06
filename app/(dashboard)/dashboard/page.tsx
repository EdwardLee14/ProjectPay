import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

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

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      projectId: { in: projects.map((p) => p.id) },
    },
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingOrders = await prisma.changeOrder.count({
    where: {
      projectId: { in: projects.map((p) => p.id) },
      status: "PENDING",
    },
  });

  return (
    <div className="p-8 lg:p-12 space-y-10 max-w-[1440px] mx-auto w-full">
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-muted-foreground text-[11px] font-bold tracking-[0.1em] uppercase">
            Executive Overview
          </h2>
          <h1 className="font-headline text-3xl font-bold text-foreground">
            Welcome back, {user.name}.
          </h1>
          <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
            You have{" "}
            <span className="text-primary font-semibold">
              {projects.length} active project{projects.length !== 1 ? "s" : ""}
            </span>{" "}
            tracking across your dashboard today.
          </p>
        </div>

        {pendingOrders > 0 && (
          <div className="bg-tertiary-fixed-dim/10 border border-tertiary-fixed-dim/20 rounded-xl p-4 flex items-center gap-4 max-w-md">
            <div className="bg-tertiary-fixed-dim p-2 rounded-lg shadow-sm">
              <Icon name="priority_high" className="text-on-tertiary-fixed" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-tertiary-fixed-variant">
                Approvals Pending
              </p>
              <p className="text-[11px] text-on-tertiary-container/80">
                {pendingOrders} change order{pendingOrders !== 1 ? "s" : ""}{" "}
                require your immediate review.
              </p>
            </div>
            <Link
              href="/projects"
              className="ml-auto text-xs font-bold underline underline-offset-4 decoration-tertiary-fixed-dim/50 text-on-tertiary-fixed-variant"
            >
              Review
            </Link>
          </div>
        )}
      </section>

      {/* Budget Bento Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Total Budget Card */}
        <div className="lg:col-span-5 bg-primary-container rounded-xl p-8 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-8">
            <div>
              <p className="text-slate-400 text-xs font-medium mb-1">
                Total Allocated Budget
              </p>
              <h3 className="font-headline text-4xl font-bold tracking-tight">
                {formatCurrency(totalBudget)}
              </h3>
            </div>
            <div className="flex items-center gap-12">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                  Spent to Date
                </p>
                <p className="text-lg font-bold text-secondary-fixed">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                  Remaining
                </p>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(remaining)}
                </p>
              </div>
            </div>
            <div className="pt-4">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-fixed rounded-full transition-all"
                  style={{ width: `${Math.min(usagePct, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-3 flex justify-between">
                <span>{Math.round(usagePct)}% of allocation used</span>
                <span className="text-secondary-fixed">
                  {formatCurrency(totalFunded)} funded
                </span>
              </p>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
        </div>

        {/* Budget Utilization */}
        <div className="lg:col-span-7 bg-surface-container-low rounded-xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-headline text-lg font-bold text-foreground">
              Budget Utilization
            </h4>
            <Link
              href="/projects"
              className="text-[11px] font-bold text-primary flex items-center gap-1 hover:underline"
            >
              View All Projects
              <Icon name="chevron_right" className="text-sm" />
            </Link>
          </div>
          <div className="space-y-5">
            {projects.slice(0, 3).map((project) => {
              const spent = project.budgetCategories.reduce(
                (s, c) => s + c.spentAmount,
                0
              );
              const pct =
                project.totalBudget > 0
                  ? (spent / project.totalBudget) * 100
                  : 0;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block space-y-2 group"
                >
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-foreground group-hover:underline">
                      {project.name}
                    </span>
                    <span className="text-secondary font-bold">
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                    <span>Spent: {formatCurrency(spent)}</span>
                    <span>Budget: {formatCurrency(project.totalBudget)}</span>
                  </div>
                </Link>
              );
            })}
            {projects.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No projects yet.
                </p>
                <Link
                  href="/projects/new"
                  className="text-sm font-semibold text-secondary hover:underline mt-2 inline-block"
                >
                  Create your first project
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Transactions Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-foreground">
            Recent Transactions
          </h3>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors border border-outline-variant/10">
              <Icon name="filter_list" className="text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors border border-outline-variant/10">
              <Icon name="download" className="text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
          {recentTransactions.length > 0 ? (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-outline-variant/10">
                      Vendor
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-outline-variant/10 hidden md:table-cell">
                      Project
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-outline-variant/10 hidden lg:table-cell">
                      Category
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-outline-variant/10">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentTransactions.map((tx) => {
                    const initials = tx.merchantName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr
                        key={tx.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-primary text-xs">
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {tx.merchantName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden md:table-cell">
                          <p className="text-sm text-foreground font-medium">
                            {tx.project.name}
                          </p>
                        </td>
                        <td className="px-6 py-5 hidden lg:table-cell">
                          <span className="px-2 py-1 bg-surface-container text-[10px] font-bold rounded text-muted-foreground">
                            {tx.categoryCode}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-foreground">
                            {formatCurrency(tx.amount)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant/10 text-center">
                <button className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                  View All Transaction History
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Icon
                name="receipt_long"
                className="text-muted-foreground/30 mb-3"
                size={48}
              />
              <p className="text-sm text-muted-foreground">
                No transactions yet. They&apos;ll appear here in real time.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
