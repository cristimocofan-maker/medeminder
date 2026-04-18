import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface MessageTemplatesUpdateRequestDto {
  template_name: string;
  channel_type: ChannelType;
  message_subject: string;
  message_body: string;
}