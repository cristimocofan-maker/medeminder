import { z } from "zod";
import { CHANNEL_TYPE_VALUES } from "../../../../backend/src/shared/enums/channel-type.enum";

export const messageTemplateFormSchema = z.object({
  template_name: z.string().trim().min(1, "Introdu numele template-ului."),
  channel_type: z.enum(CHANNEL_TYPE_VALUES, {
    required_error: "Alege canalul.",
  }),
  message_subject: z.string().trim().min(1, "Introdu subiectul mesajului."),
  message_body: z.string().trim().min(1, "Introdu conținutul template-ului."),
});

export type MessageTemplateFormValues = z.infer<typeof messageTemplateFormSchema>;