import { z } from "zod";

export const createChangeOrderSchema = z.object({
  projectId: z.string().min(1),
  budgetCategoryId: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(500),
});

export const approveRejectSchema = z.object({
  id: z.string().min(1, "Change order ID is required"),
  status: z.enum(["APPROVED", "REJECTED"]),
});

export const counterChangeOrderSchema = z.object({
  counterAmount: z.number().positive("Counter amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(500),
});
