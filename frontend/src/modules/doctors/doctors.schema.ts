import { z } from "zod";

export const doctorFormSchema = z.object({
  doctor_display_name: z
    .string()
    .trim()
    .min(1, "Introdu numele doctorului.")
    .max(255, "Numele doctorului poate avea cel mult 255 de caractere."),
  specialization_id: z.coerce.number().int().positive("Alege o specializare."),
  is_active: z.boolean(),
});

export type DoctorFormValues = z.infer<typeof doctorFormSchema>;