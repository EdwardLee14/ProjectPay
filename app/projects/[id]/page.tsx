import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionFeed } from "@/components/transactions/transaction-feed";
import { ChangeOrderList } from "@/components/change-orders/change-order-list";
import { ChangeOrderForm } from "@/components/change-orders/change-order-form";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      budgetCategories: true,
      transactions: { orderBy: { createdAt: "desc" } },
      changeOrders: {
        include: { requester: true },
        orderBy: { createdAt: "desc" },
      },
      contractor: true,
      client: true,
    },
  });

  if (!project) notFound();

  const isAuthorized =
    project.contractorId === user.id || project.clientId === user.id;
  if (!isAuthorized) redirect("/dashboard");

  const totalSpent = project.budgetCategories.reduce(
    (sum, cat) => sum + cat.spentAmount,
    0
  );

  const statusColor: Record<string, "default" | "secondary" | "outline"> = {
    DRAFT: "secondary",
    ACTIVE: "default",
    COMPLETE: "outline",
  };

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <Badge variant={statusColor[project.status]}>
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Budget: {formatCurrency(project.totalBudget)} &middot; Funded:{" "}
            {formatCurrency(project.fundedAmount)} &middot; Spent:{" "}
            {formatCurrency(totalSpent)}
          </p>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {project.budgetCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No categories defined yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {project.budgetCategories.map((cat) => {
                    const pct =
                      cat.allocatedAmount > 0
                        ? (cat.spentAmount / cat.allocatedAmount) * 100
                        : 0;
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{cat.name}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(cat.spentAmount)} /{" "}
                            {formatCurrency(cat.allocatedAmount)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct > 100 ? "bg-destructive" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionFeed
            projectId={project.id}
            initialTransactions={project.transactions.map((tx) => ({
              id: tx.id,
              projectId: tx.projectId,
              merchantName: tx.merchantName,
              amount: tx.amount,
              categoryCode: tx.categoryCode,
              note: tx.note,
              receiptUrl: tx.receiptUrl,
              stripeTransactionId: tx.stripeTransactionId,
              createdAt: tx.createdAt.toISOString(),
            }))}
          />
        </TabsContent>

        <TabsContent value="change-orders" className="space-y-4">
          <ChangeOrderList
            changeOrders={project.changeOrders.map((co) => ({
              id: co.id,
              amount: co.amount,
              reason: co.reason,
              status: co.status,
              createdAt: co.createdAt.toISOString(),
              requester: { name: co.requester.name },
            }))}
            userRole={user.role}
          />
          {user.role === "CONTRACTOR" && (
            <ChangeOrderForm projectId={project.id} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
