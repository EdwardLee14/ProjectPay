import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();

  if (!user) {
    redirect("/onboarding");
  }

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

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user.name}.{" "}
            <span className="capitalize">{user.role.toLowerCase()}</span> view.
          </p>
        </div>
        {user.role === "CONTRACTOR" && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      <Separator />

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {user.role === "CONTRACTOR"
              ? "You haven't created any projects yet."
              : "You haven't been invited to any projects yet."}
          </p>
          {user.role === "CONTRACTOR" && (
            <Button asChild className="mt-4">
              <Link href="/projects/new">Create your first project</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
