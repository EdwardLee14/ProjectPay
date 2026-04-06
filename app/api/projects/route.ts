import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();

    const projects =
      user.role === "CONTRACTOR"
        ? await prisma.project.findMany({
            where: { contractorId: user.id },
            include: { budgetCategories: true, client: true },
            orderBy: { createdAt: "desc" },
          })
        : await prisma.project.findMany({
            where: { clientId: user.id },
            include: { budgetCategories: true, contractor: true },
            orderBy: { createdAt: "desc" },
          });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    if (user.role !== "CONTRACTOR") {
      return NextResponse.json(
        { error: "Only contractors can create projects" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      name: string;
      totalBudget: number;
      categories: { name: string; allocatedAmount: number }[];
    };

    const project = await prisma.project.create({
      data: {
        name: body.name,
        totalBudget: body.totalBudget,
        contractorId: user.id,
        budgetCategories: {
          create: body.categories.map((cat) => ({
            name: cat.name,
            allocatedAmount: cat.allocatedAmount,
          })),
        },
      },
      include: { budgetCategories: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
