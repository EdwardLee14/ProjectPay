import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, tokenId } = await params;

    // Verify contractor owns this project
    const project = await prisma.project.findUnique({
      where: { id },
      select: { contractorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the token belongs to this project
    const accessToken = await prisma.clientAccessToken.findUnique({
      where: { id: tokenId },
      select: { id: true, projectId: true, revokedAt: true },
    });

    if (!accessToken || accessToken.projectId !== id) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    if (accessToken.revokedAt) {
      return NextResponse.json({ error: "Token already revoked" }, { status: 409 });
    }

    const revoked = await prisma.clientAccessToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    return NextResponse.json(revoked);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/projects/[id]/share/[tokenId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
