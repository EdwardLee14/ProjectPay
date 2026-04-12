import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendProjectMessageSchema } from "@projectpay/shared/validation";

async function assertProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { contractorId: true, clientId: true },
  });
  if (!project) return { error: "not_found" as const };
  const allowed =
    project.contractorId === userId || project.clientId === userId;
  if (!allowed) return { error: "forbidden" as const };
  return { project };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const access = await assertProjectAccess(params.id, user.id);
    if (access.error === "not_found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (access.error === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.projectMessage.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        sender: { select: { name: true } },
      },
    });

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        senderId: m.senderId,
        senderName: m.sender.name,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/projects/[id]/messages]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const access = await assertProjectAccess(params.id, user.id);
    if (access.error === "not_found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (access.error === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = sendProjectMessageSchema.parse(await req.json());

    const message = await prisma.projectMessage.create({
      data: {
        projectId: params.id,
        senderId: user.id,
        body: body.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        sender: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        message: {
          id: message.id,
          body: message.body,
          createdAt: message.createdAt.toISOString(),
          senderId: message.senderId,
          senderName: message.sender.name,
        },
      },
      { status: 201 }
    );
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
    console.error("[POST /api/projects/[id]/messages]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
