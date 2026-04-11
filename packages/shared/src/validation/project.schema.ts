import { z } from "zod";

export const budgetCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  allocatedAmount: z.number().positive("Amount must be positive"),
  merchantCategoryCodes: z.array(z.string()).optional().default([]),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  clientEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  totalBudget: z.number().positive("Budget must be positive").max(10_000_000),
  categories: z
    .array(budgetCategoryInputSchema)
    .min(2, "At least 2 budget categories required")
    .max(8, "Maximum 8 budget categories"),
}).refine(
  (data) => {
    const categoryTotal = data.categories.reduce((sum, c) => sum + c.allocatedAmount, 0);
    return Math.abs(categoryTotal - data.totalBudget) < 0.01;
  },
  { message: "Category allocations must equal the total budget" }
);

export const fundProjectSchema = z.object({
  paymentMethodId: z.string().optional(),
});

export const shareProjectSchema = z.object({
  expiresInDays: z.number().int().positive().max(365).optional().default(30),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  clientEmail: z.string().email().optional().nullable().or(z.literal("")),
});

export const paymentModeSchema = z.object({
  mode: z.enum(["WALLET", "AUTOPAY"]),
});

export const rejectProjectSchema = z.object({
  reason: z.string().max(500).optional(),
});
