import { z } from "zod";

export const onboardingSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["CONTRACTOR", "CLIENT"]),
  companyName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  // Billing address for Stripe Issuing cardholder (required for contractors)
  billingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().length(2),
    postalCode: z.string().min(5).max(10),
    country: z.string().default("US"),
  }).optional(),
});
