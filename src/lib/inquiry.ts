import { z } from "zod";
import { budgets, projectTypes } from "./content";

// Intentionally reject control characters while permitting tabs and line breaks.
const cleanText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (value) =>
        [...value].every((character) => {
          const code = character.codePointAt(0)!;
          return (code >= 32 && code !== 127) || [9, 10, 13].includes(code);
        }),
      "Please remove unsupported characters.",
    );

export const inquirySchema = z
  .object({
    name: cleanText(100).pipe(z.string().min(2, "Please enter your name.")),
    email: z
      .string()
      .trim()
      .max(254)
      .email("Please enter a valid email address.")
      .refine((value) => !/[\r\n]/.test(value)),
    company: cleanText(120),
    type: z.enum(projectTypes),
    budget: z.enum(budgets),
    details: cleanText(4000).pipe(
      z.string().min(20, "Tell us a little more (at least 20 characters)."),
    ),
    website: z.string().max(200),
    consent: z.literal(true, { error: "Please agree to the privacy notice." }),
  })
  .strict();

export type Inquiry = z.infer<typeof inquirySchema>;
