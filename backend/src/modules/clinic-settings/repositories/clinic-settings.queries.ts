export const clinicSettingsGetByClinicIdQuery = `
  SELECT
    cs.clinic_id,
    cs.timezone,
    cs.default_channel_type,
    cs.appointment_reminder_hours_before,
    cs.follow_up_delay_days,
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
    updated_at = CURRENT_TIMESTAMP
  WHERE clinic_id = $1
  RETURNING
    clinic_id,
    timezone,
    default_channel_type,
    appointment_reminder_hours_before,
    follow_up_delay_days,
    created_at,
    updated_at;
`;