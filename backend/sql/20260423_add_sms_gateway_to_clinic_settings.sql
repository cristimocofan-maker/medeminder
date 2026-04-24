-- Add SMS gateway columns to clinic_settings
ALTER TABLE clinic_settings
  ADD COLUMN IF NOT EXISTS sms_provider_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sms_sender_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sms_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sms_password TEXT,
  ADD COLUMN IF NOT EXISTS sms_token TEXT,
  ADD COLUMN IF NOT EXISTS sms_is_primary_gateway BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sms_patient_action_base_path VARCHAR(255),
  ADD COLUMN IF NOT EXISTS sms_last_checked_at TIMESTAMPTZ;
