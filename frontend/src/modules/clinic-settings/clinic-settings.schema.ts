import { z } from "zod";
import { CHANNEL_TYPE_VALUES } from "../../../../backend/src/shared/enums/channel-type.enum";

export const clinicSettingsSchema = z.object({
  timezone: z.string().trim().min(1, "Introdu timezone-ul clinicii.").max(100, "Timezone-ul poate avea cel mult 100 de caractere."),
  default_channel_type: z.enum(CHANNEL_TYPE_VALUES, {
    required_error: "Alege canalul implicit.",
  }),
  appointment_reminder_hours_before: z.coerce
    .number({ invalid_type_error: "Introdu un număr întreg." })
    .int("Valoarea trebuie să fie număr întreg.")
    .min(1, "Valoarea trebuie să fie între 1 și 168.")
    .max(168, "Valoarea trebuie să fie între 1 și 168."),
  follow_up_delay_days: z.coerce
    .number({ invalid_type_error: "Introdu un număr întreg." })
    .int("Valoarea trebuie să fie număr întreg.")
    .min(0, "Valoarea trebuie să fie între 0 și 365.")
    .max(365, "Valoarea trebuie să fie între 0 și 365."),
});

export type ClinicSettingsFormValues = z.infer<typeof clinicSettingsSchema>;