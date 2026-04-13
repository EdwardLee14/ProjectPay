import { z } from "zod";

export const sendProjectMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(8000, "Message is too long"),
});
