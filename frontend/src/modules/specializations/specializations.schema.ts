import { z } from "zod";

export const specializationFormSchema = z.object({
  specialization_display_name: z
    .string()
    .trim()
    .min(1, "Introdu numele specializării.")
    .max(255, "Numele specializării poate avea cel mult 255 de caractere."),
});

export type SpecializationFormValues = z.infer<typeof specializationFormSchema>;