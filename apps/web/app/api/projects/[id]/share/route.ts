import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const shareProjectSchema = z.object({
  expiresInDays: z.number().int().positive().max(365).optional().default(30),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { expiresInDays } = shareProjectSchema.parse(body);

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

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const accessToken = await prisma.clientAccessToken.create({
      data: {
        projectId: id,
        token,
        expiresAt,
      },
      select: {
        id: true,
        token: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(accessToken, { status: 201 });
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
    console.error("[POST /api/projects/[id]/share]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
