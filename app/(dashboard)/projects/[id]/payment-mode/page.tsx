import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser, getCurrentUser } from "@/lib/auth";
import { PaymentModeToggle } from "@/components/projects/payment-mode-toggle";

export default async function PaymentModePage({
  params,
}: {
  params: { id: string };
}) {
  const supabaseUser = await getSupabaseUser();
  if (!supabaseUser) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  if (!project) notFound();

  const isAuthorized =
    project.contractorId === user.id || project.clientId === user.id;
  if (!isAuthorized) redirect("/dashboard");

  return (
    <PaymentModeToggle
      projectId={project.id}
      projectName={project.name}
      recentTransactions={project.transactions.map((tx) => ({
        id: tx.id,
        merchantName: tx.merchantName,
        amount: tx.amount,
        categoryCode: tx.categoryCode,
        stripeTransactionId: tx.stripeTransactionId,
      }))}
    />
  );
}
