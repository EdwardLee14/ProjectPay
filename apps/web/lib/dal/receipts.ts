// import "server-only"; // TODO: install `server-only` package
import { prisma } from "@/lib/prisma";

export async function getReceipts(transactionId: string) {
  return prisma.receipt.findMany({
    where: { transactionId },
    select: {
      id: true,
      storagePath: true,
      fileName: true,
      mimeType: true,
      createdAt: true,
      uploader: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createReceipt(data: {
  transactionId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
}) {
  return prisma.receipt.create({
    data,
    select: {
      id: true, storagePath: true, fileName: true, mimeType: true, createdAt: true,
    },
  });
}

export async function getTransactionWithProject(transactionId: string) {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
    select: {
      id: true,
      projectId: true,
      project: { select: { contractorId: true, clientId: true } },
    },
  });
}
