import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth";
import {
  getCategoryById,
  getCategoryTotalForProject,
  updateBudgetCategory,
  deleteBudgetCategory,
  countCategoriesForProject,
} from "@/lib/dal/budget-categories";
import { updateBudgetCategorySchema } from "@projectpay/shared";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, catId } = await params;
    const body = updateBudgetCategorySchema.parse(await req.json());

    const category = await getCategoryById(catId);
    if (!category || category.projectId !== id) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (category.project.contractorId !== user.id) {
      return NextResponse.json(
        { error: "Only the contractor can update budget categories" },
        { status: 403 }
      );
    }
    if (!["DRAFT", "PENDING_APPROVAL"].includes(category.project.status)) {
      return NextResponse.json(
        { error: "Categories can only be updated while the project is in draft or pending approval" },
        { status: 409 }
      );
    }

    if (body.allocatedAmount !== undefined) {
      const otherTotal = await getCategoryTotalForProject(id, catId);
      const totalBudget = Number(category.project.totalBudget);
      if (otherTotal + body.allocatedAmount > totalBudget + 0.01) {
        return NextResponse.json(
          { error: "Category allocation would exceed the project total budget" },
          { status: 422 }
        );
      }
    }

    const updated = await updateBudgetCategory(catId, body);
    return NextResponse.json(updated);
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
    console.error("[PATCH /api/projects/[id]/categories/[catId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; catId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, catId } = await params;

    const category = await getCategoryById(catId);
    if (!category || category.projectId !== id) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    if (category.project.contractorId !== user.id) {
      return NextResponse.json(
        { error: "Only the contractor can delete budget categories" },
        { status: 403 }
      );
    }
    if (category.project.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Categories can only be deleted while the project is in draft" },
        { status: 409 }
      );
    }

    const count = await countCategoriesForProject(id);
    if (count <= 2) {
      return NextResponse.json(
        { error: "A project must have at least 2 budget categories" },
        { status: 409 }
      );
    }

    await deleteBudgetCategory(catId);
    return NextResponse.json({ id: catId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/projects/[id]/categories/[catId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
