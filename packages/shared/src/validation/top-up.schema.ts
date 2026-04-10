import { z } from "zod";

export const createTopUpRequestSchema = z.object({
  requestedAmount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(500),
});
