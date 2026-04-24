export const clinicSettingsGetByClinicIdQuery = `
  SELECT
    cs.clinic_id,
    cs.timezone,
    cs.default_channel_type,
    cs.appointment_reminder_hours_before,
    cs.follow_up_delay_days,
    cs.sms_provider_name,
    cs.sms_sender_name,
    cs.sms_username,
    cs.sms_password,
    cs.sms_token,
    cs.sms_is_primary_gateway,
    cs.sms_patient_action_base_path,
    cs.sms_last_checked_at,
    cs.created_at,
    cs.updated_at
  FROM clinic_settings cs
  WHERE cs.clinic_id = $1
  LIMIT 1;
`;

export const clinicSettingsUpdateByClinicIdQuery = `
  UPDATE clinic_settings
  SET
    timezone = $2,
    default_channel_type = $3,
    appointment_reminder_hours_before = $4,
    follow_up_delay_days = $5,
    sms_provider_name = $6,
    sms_sender_name = $7,
    sms_username = $8,
    sms_password = $9,
    sms_token = $10,
    sms_is_primary_gateway = $11,
    sms_patient_action_base_path = $12,
    sms_last_checked_at = $13,
    updated_at = CURRENT_TIMESTAMP
  WHERE clinic_id = $1
  RETURNING
    clinic_id,
    timezone,
    default_channel_type,
    appointment_reminder_hours_before,
    follow_up_delay_days,
    sms_provider_name,
    sms_sender_name,
    sms_username,
    sms_password,
    sms_token,
    sms_is_primary_gateway,
    sms_patient_action_base_path,
    sms_last_checked_at,
    created_at,
    updated_at;
`;