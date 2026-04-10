import Link from "next/link";
import type { Project, BudgetCategory, User } from "@projectpay/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

type ProjectWithRelations = Project & {
  budgetCategories: BudgetCategory[];
  contractor?: User | null;
  client?: User | null;
};

const statusColor: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  ACTIVE: "default",
  COMPLETE: "outline",
};

export function ProjectCard({ project }: { project: ProjectWithRelations }) {
  const totalSpent = project.budgetCategories.reduce(
    (sum, cat) => sum + Number(cat.spentAmount),
    0
  );

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <Badge variant={statusColor[project.status]}>
              {project.status}
            </Badge>
          </div>
          <CardDescription>
            Budget: {formatCurrency(Number(project.totalBudget))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Funded: {formatCurrency(Number(project.fundedAmount))}</span>
            <span>Spent: {formatCurrency(totalSpent)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{
                width: `${Math.min((totalSpent / Number(project.totalBudget)) * 100, 100)}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
