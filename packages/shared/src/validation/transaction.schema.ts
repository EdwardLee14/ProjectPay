import { z } from "zod";

export const createTransactionSchema = z.object({
  projectId: z.string().min(1),
  merchantName: z.string().min(1).max(255),
  amount: z.number().positive(),
  budgetCategoryId: z.string().nullable().optional(),
  categoryCode: z.string().default("receipt"),
  note: z.string().max(500).nullable().optional(),
  receipt: z
    .object({
      storagePath: z.string().min(1),
      fileName: z.string().min(1).max(255),
      mimeType: z.string().min(1).max(100),
      parsedData: z.record(z.unknown()).optional(),
    })
    .optional(),
});
