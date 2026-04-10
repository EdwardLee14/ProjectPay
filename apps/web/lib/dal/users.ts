// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      companyName: true,
      stripeAccountId: true,
      stripeCardholderId: true,
      createdAt: true,
    },
  });
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  companyName?: string | null;
  phone?: string | null;
}) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      companyName: true,
      createdAt: true,
    },
  });
}
