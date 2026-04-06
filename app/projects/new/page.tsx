import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CreateProjectForm } from "@/components/projects/create-project-form";

export default async function NewProjectPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();

  if (!user) {
    redirect("/onboarding");
  }

  if (user.role !== "CONTRACTOR") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Define your project, set the budget, and add categories.
        </p>
      </div>
      <CreateProjectForm />
    </div>
  );
}
