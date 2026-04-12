import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@projectpay/db";

export async function getSupabaseUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) return null;

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  // Link any projects created with this client's email that haven't been linked yet
  if (user?.role === "CLIENT") {
    await prisma.project.updateMany({
      where: { clientEmail: user.email, clientId: null },
      data: { clientId: user.id },
    });
  }

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized: no user found");
  }
  return user;
}
