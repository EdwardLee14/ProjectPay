import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getSupabaseUser } from "@/lib/auth";
import { onboardingSchema } from "@projectpay/shared/validation";

export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await getSupabaseUser();
    if (!supabaseUser || !supabaseUser.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = onboardingSchema.parse(await req.json());

    const user = await prisma.user.upsert({
      where: { email: supabaseUser.email },
      update: {
        supabaseId: supabaseUser.id,
        name: body.name,
        role: body.role,
        companyName: body.companyName,
        phone: body.phone,
      },
      create: {
        supabaseId: supabaseUser.id,
        name: body.name,
        email: supabaseUser.email,
        role: body.role,
        companyName: body.companyName,
        phone: body.phone,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    console.error("Onboarding error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
