import { z } from "zod";
import { parsePatientDemographicsFromCnp, normalizePatientCnpInput } from "./patient-demographics";

const emptyStringToNull = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
};

export const patientFormSchema = z.object({
  patient_display_name: z.string().trim().min(1, "Introdu numele pacientului."),
  cnp: z
    .string()
    .transform((value) => normalizePatientCnpInput(value))
    .refine((value) => parsePatientDemographicsFromCnp(value) !== null, "Introdu un CNP valid."),
  city: z.string().trim().min(1, "Introdu orașul pacientului."),
  phone_number: z.string().trim().min(1, "Introdu numărul de telefon."),
  email: z
    .string()
    .transform(emptyStringToNull)
    .refine((value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Introdu o adresă de email validă.")
    .nullable(),
  notes: z.string().transform(emptyStringToNull).nullable(),
  is_active: z.boolean(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;