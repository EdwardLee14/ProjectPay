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

  if (existingUser) redirect("/dashboard");

  const name =
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "User";

  const metaRole = user.user_metadata?.role;

  // Role was captured during sign-up — auto-create and skip selector
  if (metaRole === "CONTRACTOR" || metaRole === "CLIENT") {
    await prisma.user.create({
      data: {
        supabaseId: user.id,
        name,
        email: user.email!,
        role: metaRole,
      },
    });
    redirect("/dashboard");
  }

  // Fallback: show role selector (e.g. OAuth sign-ups or legacy flows)
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
