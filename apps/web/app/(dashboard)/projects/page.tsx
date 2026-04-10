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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const otherUser = isContractor ? (p as any).client : (p as any).contractor;

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      otherName: otherUser?.name ?? p.clientEmail ?? "No client",
      spent,
      total,
      pct,
    };
  });

  return (
    <main className={shared.dashboardPage}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={shared.eyebrow}>Projects</p>
          <h1 className={shared.pageTitle}>
            <span className="font-normal">Your</span> <strong>Projects</strong>
          </h1>
          <p className={s.projectCount}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} total
          </p>
        </div>
        {isContractor && (
          <Button variant="pill" asChild>
            <Link href="/projects/new">New Project &rarr;</Link>
          </Button>
        )}
      </div>

      {projects.length > 0 ? (
        <ProjectFilterTabs
          projects={serialized}
          isContractor={isContractor}
        />
      ) : (
        /* Empty state */
        <div className={s.emptyWrap}>
          <Icon
            name="folder_open"
            className="text-off-black/10"
            size={56}
          />
          <p className={s.emptyTitle}>No projects yet</p>
          <p className={s.emptyDesc}>
            {isContractor
              ? "Create your first project to start tracking budgets and spending."
              : "You haven't been added to any projects yet."}
          </p>
          {isContractor && (
            <Button variant="pill" asChild className="mt-6">
              <Link href="/projects/new">New Project &rarr;</Link>
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
