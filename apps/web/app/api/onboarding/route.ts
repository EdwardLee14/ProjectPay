import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      supabaseId: string;
      name: string;
      email: string;
      role: "CONTRACTOR" | "CLIENT";
    };

    const user = await prisma.user.upsert({
      where: { email: body.email },
      update: {
        supabaseId: body.supabaseId,
        name: body.name,
        role: body.role,
      },
      create: {
        supabaseId: body.supabaseId,
        name: body.name,
        email: body.email,
        role: body.role,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Onboarding error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
