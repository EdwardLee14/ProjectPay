import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";
import s from "./team.module.css";
import shared from "@/styles/shared.module.css";


interface Collaborator {
  id: string;
  name: string;
  email: string;
  companyName: string | null;
  role: "CONTRACTOR" | "CLIENT";
  projectNames: string[];
}

export default async function TeamPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const projects =
    user.role === "CONTRACTOR"
      ? await prisma.project.findMany({
          where: { contractorId: user.id },
          include: { client: true },
        })
      : await prisma.project.findMany({
          where: { clientId: user.id },
          include: { contractor: true },
        });

  // Extract unique collaborators
  const collaboratorMap = new Map<string, Collaborator>();

  for (const project of projects) {
    const person =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      user.role === "CONTRACTOR" ? (project as any).client : (project as any).contractor;
    if (!person) continue;

    const existing = collaboratorMap.get(person.id);
    if (existing) {
      existing.projectNames.push(project.name);
    } else {
      collaboratorMap.set(person.id, {
        id: person.id,
        name: person.name,
        email: person.email,
        companyName: person.companyName,
        role: person.role,
        projectNames: [project.name],
      });
    }
  }

  const collaborators = Array.from(collaboratorMap.values());

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]![0] : "";
    return (first + last).toUpperCase();
  }

  return (
    <main className={shared.dashboardPage}>
      <div>
        <h1 className={shared.pageTitle}>Team</h1>
        {collaborators.length > 0 && (
          <p className={s.pageMeta}>
            {collaborators.length} collaborator
            {collaborators.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className={s.pageCard}>

        {collaborators.length > 0 ? (
          <section className={s.collaboratorList}>
            {collaborators.map((collab) => (
              <div key={collab.id} className={s.collaboratorRow}>
                <div className={s.avatar}>{getInitials(collab.name)}</div>
                <div className={s.nameBlock}>
                  <p className={s.name}>{collab.name}</p>
                  <p className={s.email}>{collab.email}</p>
                  {collab.companyName && <p className={s.company}>{collab.companyName}</p>}
                </div>
                <span className={collab.role === "CONTRACTOR" ? s.roleBadgeContractor : s.roleBadgeClient}>
                  {collab.role}
                </span>
                <span className={s.sharedCount}>
                  {collab.projectNames.length} project{collab.projectNames.length !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </section>
        ) : (
          <section className={s.emptyContainer}>
            <Icon name="group" className={s.emptyIcon} size={48} />
            <p className={s.emptyTitle}>No team members yet</p>
            <p className={s.emptyDesc}>
              Team members appear here when you collaborate on projects
            </p>
            {user.role === "CONTRACTOR" && (
              <Link href="/projects/new">Create a Project &rarr;</Link>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
