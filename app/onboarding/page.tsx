import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RoleSelector } from "./role-selector";

export default async function OnboardingPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const existingUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (existingUser) {
    redirect("/dashboard");
  }

  const clerkUser = await currentUser();

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <RoleSelector
        clerkId={userId}
        name={clerkUser?.fullName ?? clerkUser?.firstName ?? "User"}
        email={clerkUser?.emailAddresses[0]?.emailAddress ?? ""}
      />
    </div>
  );
}
