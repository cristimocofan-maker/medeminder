export type SmsTemplateKey = "confirmation" | "reminder" | "reschedule" | "cancel" | "follow-up";

export type SmsAutomationKey =
  | "appointment-created"
  | "reminder-24h"
  | "reminder-2h"
  | "reschedule"
  | "cancel"
  | "follow-up";

export type SmsDeliveryStatus = "sent" | "failed" | "pending";

export interface SmsHistoryItem {
  id: string;
  patient_id: number;
  type: SmsTemplateKey;
  phone_number: string;
  message: string;
  sent_at: string;
  status: SmsDeliveryStatus;
  provider_response?: string | null;
}

export interface SmsTemplateDefinition {
  key: SmsTemplateKey;
  label: string;
  description: string;
}

export interface SmsAutomationRule {
  key: SmsAutomationKey;
  label: string;
  description: string;
  enabled: boolean;
  template_key: SmsTemplateKey;
  use_primary_gateway: boolean;
}

export interface SmsGatewayConnectionConfig {
  provider_name: string;
  sender_name: string;
  token?: string;
  username?: string | null;
  password?: string | null;
  is_primary_gateway: boolean;
  patient_action_base_path: string;
  last_checked_at: string | null;
}

export interface SmsGatewayTestResult {
  phone_number: string;
  template_key: SmsTemplateKey;
  message: string;
  status: SmsDeliveryStatus;
  timestamp: string;
  provider_response: string;
}

export interface SmsGatewayState {
  connection: SmsGatewayConnectionConfig;
  templates: Record<SmsTemplateKey, string>;
  automations: Record<SmsAutomationKey, SmsAutomationRule>;
  history: SmsHistoryItem[];
  last_test_result: SmsGatewayTestResult | null;
}

export interface SmsTemplateVariableDefinition {
  token: string;
  label: string;
}

export interface SmsMessageContext {
  patient_name?: string | null;
  doctor_name?: string | null;
  specialization?: string | null;
  appointment_date?: string | null;
  appointment_time?: string | null;
  clinic_name?: string | null;
  confirmation_link?: string | null;
  reschedule_link?: string | null;
  cancel_link?: string | null;
}
