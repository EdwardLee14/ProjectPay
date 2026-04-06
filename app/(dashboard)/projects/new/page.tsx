import { redirect } from "next/navigation";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { ProjectSetupForm } from "@/components/projects/project-setup-form";

export default async function NewProjectPage() {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  if (user.role !== "CONTRACTOR") {
    redirect("/dashboard");
  }

  return <ProjectSetupForm />;
}
