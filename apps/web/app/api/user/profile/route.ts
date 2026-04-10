import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  companyName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

export async function GET() {
  try {
    const user = await requireUser();

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        stripeAccountId: true,
        stripeCardholderId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized: no user found") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/user/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        stripeAccountId: true,
        stripeCardholderId: true,
        createdAt: true,
      },
    });

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
    console.error("[PATCH /api/user/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
