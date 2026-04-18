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
    confirmation_status
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8
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

export const appointmentsOverlappingCountQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM appointments a
  WHERE a.clinic_id = $1
    AND a.doctor_id = $2
    AND ($3::int IS NULL OR a.appointment_id <> $3)
    AND a.start_date_time < $5::timestamptz
    AND a.end_date_time > $4::timestamptz;
`;