import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { parseReceipt } from "@/lib/gemini";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await requireUser();

    // 2. Validate
    const formData = await req.formData();
    const file = formData.get("file");
    const projectId = formData.get("projectId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "file is required" },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Accepted: JPEG, PNG, WebP, HEIC` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    // 3. Authorize
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        contractorId: true,
        clientId: true,
        budgetCategories: { select: { id: true, name: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.contractorId !== user.id && project.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Execute
    const fileName = file.name || `receipt.${file.type.split("/")[1]}`;
    const storagePath = `receipts/${projectId}/${Date.now()}_${fileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Run storage upload and Gemini parse in parallel
    const [uploadResult, parseResult] = await Promise.allSettled([
      supabaseAdmin.storage
        .from("receipts")
        .upload(storagePath, buffer, { contentType: file.type, upsert: false }),
      parseReceipt(base64, file.type, project.budgetCategories),
    ]);

    // Check upload
    if (
      uploadResult.status === "rejected" ||
      uploadResult.value.error
    ) {
      const err =
        uploadResult.status === "rejected"
          ? uploadResult.reason
          : uploadResult.value.error;
      console.error("[POST /api/receipts/parse] Storage upload failed:", err);
      return NextResponse.json(
        { error: "Failed to upload receipt" },
        { status: 502 }
      );
    }

    // Check parse
    if (parseResult.status === "rejected") {
      console.error("[POST /api/receipts/parse] Gemini parse failed:", parseResult.reason);
      return NextResponse.json(
        { error: "Failed to parse receipt image" },
        { status: 502 }
      );
    }

    const parsedData = parseResult.value;

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("receipts")
      .getPublicUrl(storagePath);

    // 5. Respond
    return NextResponse.json({
      parsedData,
      storagePath,
      fileName,
      mimeType: file.type,
      storageUrl: urlData.publicUrl,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unauthorized: no user found"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/receipts/parse]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
