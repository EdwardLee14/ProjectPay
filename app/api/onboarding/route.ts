import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      clerkId: string;
      name: string;
      email: string;
      role: "CONTRACTOR" | "CLIENT";
    };

    const user = await prisma.user.create({
      data: {
        clerkId: body.clerkId,
        name: body.name,
        email: body.email,
        role: body.role,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
