import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { EditProjectForm } from "@/components/projects/edit-project-form";

export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  if (user.role !== "CONTRACTOR") {
    redirect("/dashboard");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      description: true,
      clientEmail: true,
      status: true,
      contractorId: true,
      client: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!project) notFound();

  if (project.contractorId !== user.id) {
    redirect("/dashboard");
  }

  if (project.status === "CANCELLED") {
    redirect(`/projects/${project.id}`);
  }

  return (
    <EditProjectForm
      project={{
        id: project.id,
        name: project.name,
        description: project.description,
        clientEmail: project.clientEmail,
        status: project.status,
        clientName: project.client?.name ?? null,
        clientPhone: project.client?.phone ?? null,
      }}
    />
  );
}
