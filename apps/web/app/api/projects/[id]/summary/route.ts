import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getProjectForSummary, upsertProjectSummary } from "@/lib/dal/projects";
import { createClient } from "@/lib/supabase/server";
import { generateProjectSummaryPDF } from "@/lib/pdf/project-summary";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const project = await getProjectForSummary(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (project.status !== "COMPLETE") {
      return NextResponse.json(
        { error: "Summary is only available after the project is closed" },
        { status: 409 }
      );
    }

    const pdfBuffer = await generateProjectSummaryPDF(project);

    const storagePath = `${id}/summary-${Date.now()}.pdf`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from("project-summaries")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      console.error("[GET /api/projects/[id]/summary] upload error", uploadError);
      return NextResponse.json({ error: "Failed to store summary" }, { status: 500 });
    }

    const totalSpent = project.budgetCategories.reduce(
      (sum, c) => sum + c.spentAmount.toNumber(),
      0
    );
    const categoryBreakdown = project.budgetCategories.map((c) => ({
      id: c.id,
      name: c.name,
      allocatedAmount: c.allocatedAmount.toNumber(),
      spentAmount: c.spentAmount.toNumber(),
    }));

    const summary = await upsertProjectSummary({
      projectId: id,
      pdfStoragePath: storagePath,
      totalSpent,
      totalBudget: project.totalBudget.toNumber(),
      categoryBreakdown,
      transactionCount: project.transactions.length,
    });

    const { data: signedData } = await supabase.storage
      .from("project-summaries")
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      url: signedData?.signedUrl ?? null,
      generatedAt: summary.generatedAt,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects/[id]/summary]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
