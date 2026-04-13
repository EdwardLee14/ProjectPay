import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { ProjectListPanel } from "@/components/projects/project-list-panel";
import { ProjectsLayoutShell } from "@/components/projects/projects-layout-shell";

export default async function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const isContractor = user.role === "CONTRACTOR";

  const projects = isContractor
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

  const serialized = projects.map((p) => {
    const spent = p.budgetCategories.reduce(
      (sum, c) => sum + Number(c.spentAmount),
      0
    );
    const total = Number(p.totalBudget);
    const pct = total > 0 ? (spent / total) * 100 : 0;
    const otherUser = isContractor
      ? "client" in p
        ? p.client
        : null
      : "contractor" in p
        ? p.contractor
        : null;

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
    <ProjectsLayoutShell
      listPanel={
        <ProjectListPanel projects={serialized} isContractor={isContractor} />
      }
    >
      {children}
    </ProjectsLayoutShell>
  );
}
