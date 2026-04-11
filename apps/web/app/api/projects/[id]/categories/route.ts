import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCategoriesForProject,
  createBudgetCategory,
  getCategoryTotalForProject,
} from "@/lib/dal/budget-categories";
import { createBudgetCategorySchema } from "@projectpay/shared";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true, clientId: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const categories = await getCategoriesForProject(id);
    return NextResponse.json(categories);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects/[id]/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = createBudgetCategorySchema.parse(await req.json());

    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true, clientId: true, status: true, totalBudget: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id) {
      return NextResponse.json(
        { error: "Only the contractor can add budget categories" },
        { status: 403 }
      );
    }
    if (!["DRAFT", "PENDING_APPROVAL"].includes(project.status)) {
      return NextResponse.json(
        { error: "Categories can only be added while the project is in draft or pending approval" },
        { status: 409 }
      );
    }

    const currentTotal = await getCategoryTotalForProject(id);
    const totalBudget = Number(project.totalBudget);
    if (currentTotal + body.allocatedAmount > totalBudget + 0.01) {
      return NextResponse.json(
        { error: "Category allocation would exceed the project total budget" },
        { status: 422 }
      );
    }

    const category = await createBudgetCategory({
      projectId: id,
      name: body.name,
      allocatedAmount: body.allocatedAmount,
      merchantCategoryCodes: body.merchantCategoryCodes,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/projects/[id]/categories]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
