import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createProjectSchema } from "@projectpay/shared/validation";

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
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unauthorized: no user found"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    const body = createProjectSchema.parse(await req.json());

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        clientEmail: body.clientEmail || undefined,
        totalBudget: body.totalBudget,
        contractorId: user.id,
        budgetCategories: {
          create: body.categories.map((cat) => ({
            name: cat.name,
            allocatedAmount: cat.allocatedAmount,
            merchantCategoryCodes: cat.merchantCategoryCodes,
          })),
        },
      },
      include: { budgetCategories: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      error.message === "Unauthorized: no user found"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects]", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
