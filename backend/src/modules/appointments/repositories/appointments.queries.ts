export const appointmentsListByFiltersQuery = `
  SELECT
    a.appointment_id,
    a.doctor_id,
    d.display_name AS doctor_display_name,
    a.patient_id,
    p.display_name AS patient_display_name,
    a.appointment_status,
    a.confirmation_status,
    a.start_date_time,
    a.end_date_time,
    a.appointment_notes,
    a.patient_confirmation_status,
    a.created_at,
    a.updated_at
  FROM appointments a
  INNER JOIN doctors d
    ON d.doctor_id = a.doctor_id
   AND d.clinic_id = a.clinic_id
  INNER JOIN patients p
    ON p.patient_id = a.patient_id
   AND p.clinic_id = a.clinic_id
  WHERE a.clinic_id = $1
    AND ($2::int IS NULL OR a.appointment_id = $2)
    AND ($3::int IS NULL OR a.doctor_id = $3)
    AND ($4::int IS NULL OR a.patient_id = $4)
    AND ($5::text IS NULL OR a.appointment_status = $5)
    AND ($6::text IS NULL OR a.confirmation_status = $6)
    AND ($7::timestamptz IS NULL OR a.start_date_time >= $7)
    AND ($8::timestamptz IS NULL OR a.start_date_time <= $8)
  ORDER BY
    CASE WHEN $11 = 'appointment_id' AND $12 = 'asc' THEN a.appointment_id END ASC,
    CASE WHEN $11 = 'appointment_id' AND $12 = 'desc' THEN a.appointment_id END DESC,
    CASE WHEN $11 = 'start_date_time' AND $12 = 'asc' THEN a.start_date_time END ASC,
    CASE WHEN $11 = 'start_date_time' AND $12 = 'desc' THEN a.start_date_time END DESC,
    CASE WHEN $11 = 'doctor_id' AND $12 = 'asc' THEN a.doctor_id END ASC,
    CASE WHEN $11 = 'doctor_id' AND $12 = 'desc' THEN a.doctor_id END DESC,
    CASE WHEN $11 = 'patient_id' AND $12 = 'asc' THEN a.patient_id END ASC,
    CASE WHEN $11 = 'patient_id' AND $12 = 'desc' THEN a.patient_id END DESC,
    CASE WHEN $11 = 'appointment_status' AND $12 = 'asc' THEN a.appointment_status END ASC,
    CASE WHEN $11 = 'appointment_status' AND $12 = 'desc' THEN a.appointment_status END DESC,
    CASE WHEN $11 = 'created_at' AND $12 = 'asc' THEN a.created_at END ASC,
    CASE WHEN $11 = 'created_at' AND $12 = 'desc' THEN a.created_at END DESC,
    a.appointment_id ASC
  LIMIT $9
  OFFSET $10;
`;

export const appointmentsCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM appointments a
  WHERE a.clinic_id = $1
    AND ($2::int IS NULL OR a.appointment_id = $2)
    AND ($3::int IS NULL OR a.doctor_id = $3)
    AND ($4::int IS NULL OR a.patient_id = $4)
    AND ($5::text IS NULL OR a.appointment_status = $5)
    AND ($6::text IS NULL OR a.confirmation_status = $6)
    AND ($7::timestamptz IS NULL OR a.start_date_time >= $7)
    AND ($8::timestamptz IS NULL OR a.start_date_time <= $8);
`;

export const appointmentsGetByIdQuery = `
  SELECT
    a.appointment_id,
    a.clinic_id,
    a.doctor_id,
    d.display_name AS doctor_display_name,
    a.patient_id,
    p.display_name AS patient_display_name,
    a.appointment_status,
    a.confirmation_status,
    a.start_date_time,
    a.end_date_time,
    a.appointment_notes,
    a.patient_action_token,
    a.patient_action_token_expires_at,
    a.patient_confirmation_status,
    a.patient_confirmed_at,
    a.patient_cancelled_at,
    a.patient_reschedule_requested_at,
    a.created_at,
    a.updated_at
  FROM appointments a
  INNER JOIN doctors d
    ON d.doctor_id = a.doctor_id
   AND d.clinic_id = a.clinic_id
  INNER JOIN patients p
    ON p.patient_id = a.patient_id
   AND p.clinic_id = a.clinic_id
  WHERE a.appointment_id = $1
    AND a.clinic_id = $2
  LIMIT 1;
`;

export const appointmentsCreateInsertQuery = `
  INSERT INTO appointments (
    clinic_id,
    doctor_id,
    patient_id,
    start_date_time,
    end_date_time,
    appointment_notes,
    appointment_status,
    confirmation_status,
    patient_action_token,
    patient_action_token_expires_at,
    patient_confirmation_status
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    $9,
    $10,
    $11
  )
  RETURNING appointment_id;
`;

export const appointmentsUpdateQuery = `
  UPDATE appointments
  SET
    doctor_id = $3,
    patient_id = $4,
    start_date_time = $5,
    end_date_time = $6,
    appointment_notes = $7,
    updated_at = CURRENT_TIMESTAMP
  WHERE appointment_id = $1
    AND clinic_id = $2
  RETURNING appointment_id;
`;

export const appointmentsConfirmQuery = `
  UPDATE appointments
  SET
    confirmation_status = $3,
    appointment_status = $4,
    updated_at = CURRENT_TIMESTAMP
  WHERE appointment_id = $1
    AND clinic_id = $2
  RETURNING appointment_id;
`;

export const appointmentsGetByPatientActionTokenQuery = `
  SELECT
    a.appointment_id,
    a.clinic_id,
    a.doctor_id,
    d.display_name AS doctor_display_name,
    a.patient_id,
    p.display_name AS patient_display_name,
    p.email AS patient_email,
    a.appointment_status,
    a.confirmation_status,
    a.start_date_time,
    a.end_date_time,
    a.appointment_notes,
    a.patient_action_token,
    a.patient_action_token_expires_at,
    a.patient_confirmation_status,
    a.patient_confirmed_at,
    a.patient_cancelled_at,
    a.patient_reschedule_requested_at,
    latest_message.message_id AS latest_email_message_id,
    a.created_at,
    a.updated_at
  FROM appointments a
  INNER JOIN doctors d
    ON d.doctor_id = a.doctor_id
   AND d.clinic_id = a.clinic_id
  INNER JOIN patients p
    ON p.patient_id = a.patient_id
   AND p.clinic_id = a.clinic_id
  LEFT JOIN LATERAL (
    SELECT m.message_id
    FROM messages m
    WHERE m.clinic_id = a.clinic_id
      AND m.appointment_id = a.appointment_id
      AND m.channel_type = 'Email'
    ORDER BY m.created_at DESC, m.message_id DESC
    LIMIT 1
  ) latest_message ON TRUE
  WHERE a.patient_action_token = $1
  LIMIT 1;
`;

export const appointmentsMarkPatientConfirmedQuery = `
  UPDATE appointments
  SET
    patient_confirmation_status = 'confirmed',
    patient_confirmed_at = COALESCE(patient_confirmed_at, CURRENT_TIMESTAMP),
    confirmation_status = 'Răspuns DA',
    appointment_status = 'Confirmată',
    updated_at = CURRENT_TIMESTAMP
  WHERE appointment_id = $1
    AND clinic_id = $2
  RETURNING appointment_id;
`;

export const appointmentsMarkPatientCancelledQuery = `
  UPDATE appointments
  SET
    patient_confirmation_status = 'cancelled',
    patient_cancelled_at = COALESCE(patient_cancelled_at, CURRENT_TIMESTAMP),
    confirmation_status = 'Răspuns NU',
    appointment_status = 'Anulată',
    updated_at = CURRENT_TIMESTAMP
  WHERE appointment_id = $1
    AND clinic_id = $2
  RETURNING appointment_id;
`;

export const appointmentsMarkPatientRescheduleRequestedQuery = `
  UPDATE appointments
  SET
    patient_confirmation_status = 'reschedule_requested',
    patient_reschedule_requested_at = COALESCE(patient_reschedule_requested_at, CURRENT_TIMESTAMP),
    confirmation_status = 'Răspuns REPROGRAMEAZĂ',
    appointment_status = 'Cerere de reprogramare',
    updated_at = CURRENT_TIMESTAMP
  WHERE appointment_id = $1
    AND clinic_id = $2
  RETURNING appointment_id;
`;

export const appointmentsOverlappingCountQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM appointments a
  WHERE a.clinic_id = $1
    AND a.doctor_id = $2
    AND ($3::int IS NULL OR a.appointment_id <> $3)
    AND a.start_date_time < $5::timestamptz
    AND a.end_date_time > $4::timestamptz;
`;