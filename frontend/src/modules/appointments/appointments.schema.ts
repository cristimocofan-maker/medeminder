import { z } from "zod";

const emptyStringToNull = (value: string): string | null => {
  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
};

const datetimeField = z.string().trim().min(1, "Completează data și ora.");

export const appointmentFormSchema = z
  .object({
    doctor_id: z.coerce.number().int().positive("Alege un doctor."),
    patient_id: z.coerce.number().int().positive("Alege un pacient."),
    start_date_time: datetimeField,
    end_date_time: datetimeField,
    appointment_notes: z.string().transform(emptyStringToNull).nullable(),
  })
  .refine((values) => new Date(values.end_date_time) > new Date(values.start_date_time), {
    message: "Ora de final trebuie să fie după ora de început.",
    path: ["end_date_time"],
  });

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;