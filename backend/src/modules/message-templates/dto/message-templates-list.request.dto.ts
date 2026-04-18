import type { ChannelType } from "../../../shared/enums/channel-type.enum";

export interface MessageTemplatesListRequestDto {
  page?: number;
  page_size?: number;
  template_id?: number;
  channel_type?: ChannelType;
  sort_by?: "template_id" | "template_name" | "channel_type" | "created_at";
  sort_direction?: "asc" | "desc";
}