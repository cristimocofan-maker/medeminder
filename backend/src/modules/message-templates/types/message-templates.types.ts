import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface MessageTemplateRepositoryRecord {
  template_id: number;
  clinic_id: number;
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplatesListRepositoryRow {
  template_id: number;
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  created_at: string;
  updated_at: string;
}