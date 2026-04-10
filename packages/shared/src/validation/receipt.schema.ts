import { z } from "zod";

export const createReceiptSchema = z.object({
  transactionId: z.string().min(1),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
});
