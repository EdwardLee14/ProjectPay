import { z } from "zod";

export const createBudgetCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  allocatedAmount: z.number().positive("Amount must be positive"),
  merchantCategoryCodes: z.array(z.string()).optional().default([]),
});

export const updateBudgetCategorySchema = createBudgetCategorySchema.partial();
