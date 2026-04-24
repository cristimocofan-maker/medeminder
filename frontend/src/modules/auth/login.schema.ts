import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Introdu o adresă de email validă."),
  password: z.string().min(1, "Introdu parola."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;