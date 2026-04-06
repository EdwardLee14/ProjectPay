import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoleSelector } from "./role-selector";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const existingUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  if (existingUser) {
    redirect("/dashboard");
  }

  const name =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <RoleSelector
        supabaseId={user.id}
        name={name}
        email={user.email ?? ""}
      />
    </div>
  );
}
