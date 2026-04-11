import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import s from "./projects.module.css";
import shared from "@/styles/shared.module.css";
import { ProjectFilterTabs } from "./project-filter-tabs";

export default async function ProjectsPage() {
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

  const isContractor = user.role === "CONTRACTOR";

  const serialized = projects.map((p) => {
    const spent = p.budgetCategories.reduce(
      (sum, c) => sum + Number(c.spentAmount),
      0
    );
    const total = Number(p.totalBudget);
    const pct = total > 0 ? (spent / total) * 100 : 0;
    const otherUser = isContractor
      ? ("client" in p ? p.client : null)
      : ("contractor" in p ? p.contractor : null);

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      otherName: otherUser?.name ?? p.clientEmail ?? "Unassigned",
      spent,
      total,
      pct,
    };
  });

  return (
    <main className={shared.dashboardPage}>
      <div className={s.header}>
        <div>
          <h1 className={shared.pageTitle}>Projects</h1>
          <p className={s.headerMeta}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isContractor && (
          <Button variant="pill-orange" size="sm" className="h-8 px-4 text-xs" asChild>
            <Link href="/projects/new">
              <Icon name="add" className="text-xs" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {projects.length > 0 ? (
        <ProjectFilterTabs projects={serialized} isContractor={isContractor} />
      ) : (
        <div className={s.emptyCard}>
          <Icon name="folder_open" className="text-off-black/10" size={48} />
          <p className={s.emptyTitle}>No projects yet</p>
          <p className={s.emptyDesc}>
            {isContractor
              ? "Create your first project to start tracking budgets and spending."
              : "You haven't been added to any projects yet."}
          </p>
          {isContractor && (
            <Button variant="pill-orange" size="sm" className="h-8 px-4 text-xs mt-4" asChild>
              <Link href="/projects/new">
                <Icon name="add" className="text-xs" />
                New Project
              </Link>
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
