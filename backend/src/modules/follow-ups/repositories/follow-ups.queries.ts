export const followUpsListByFiltersQuery = `
  SELECT
    f.follow_up_id,
    f.appointment_id,
    f.follow_up_status,
    f.scheduled_for,
    f.follow_up_notes,
    f.created_at,
    f.updated_at
  FROM follow_ups f
  WHERE f.clinic_id = $1
    AND ($2::int IS NULL OR f.follow_up_id = $2)
    AND ($3::int IS NULL OR f.appointment_id = $3)
    AND ($4::text IS NULL OR f.follow_up_status = $4)
    AND ($5::timestamptz IS NULL OR f.scheduled_for >= $5)
    AND ($6::timestamptz IS NULL OR f.scheduled_for <= $6)
  ORDER BY
    CASE WHEN $9 = 'follow_up_id' AND $10 = 'asc' THEN f.follow_up_id END ASC,
    CASE WHEN $9 = 'follow_up_id' AND $10 = 'desc' THEN f.follow_up_id END DESC,
    CASE WHEN $9 = 'appointment_id' AND $10 = 'asc' THEN f.appointment_id END ASC,
    CASE WHEN $9 = 'appointment_id' AND $10 = 'desc' THEN f.appointment_id END DESC,
    CASE WHEN $9 = 'follow_up_status' AND $10 = 'asc' THEN f.follow_up_status END ASC,
    CASE WHEN $9 = 'follow_up_status' AND $10 = 'desc' THEN f.follow_up_status END DESC,
    CASE WHEN $9 = 'scheduled_for' AND $10 = 'asc' THEN f.scheduled_for END ASC,
    CASE WHEN $9 = 'scheduled_for' AND $10 = 'desc' THEN f.scheduled_for END DESC,
    CASE WHEN $9 = 'created_at' AND $10 = 'asc' THEN f.created_at END ASC,
    CASE WHEN $9 = 'created_at' AND $10 = 'desc' THEN f.created_at END DESC,
    f.follow_up_id ASC
  LIMIT $7
  OFFSET $8;
`;

export const followUpsCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM follow_ups f
  WHERE f.clinic_id = $1
    AND ($2::int IS NULL OR f.follow_up_id = $2)
    AND ($3::int IS NULL OR f.appointment_id = $3)
    AND ($4::text IS NULL OR f.follow_up_status = $4)
    AND ($5::timestamptz IS NULL OR f.scheduled_for >= $5)
    AND ($6::timestamptz IS NULL OR f.scheduled_for <= $6);
`;

export const followUpsGetByIdQuery = `
  SELECT
    f.follow_up_id,
    f.clinic_id,
    f.appointment_id,
    f.follow_up_status,
    f.scheduled_for,
    f.follow_up_notes,
    f.created_at,
    f.updated_at
  FROM follow_ups f
  WHERE f.follow_up_id = $1
    AND f.clinic_id = $2
  LIMIT 1;
`;

export const followUpsCreateInsertQuery = `
  INSERT INTO follow_ups (
    clinic_id,
    appointment_id,
    follow_up_status,
    scheduled_for,
    follow_up_notes
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
  )
  RETURNING follow_up_id;
`;

export const followUpsUpdateStatusQuery = `
  UPDATE follow_ups
  SET
    follow_up_status = $3,
    updated_at = CURRENT_TIMESTAMP
  WHERE follow_up_id = $1
    AND clinic_id = $2
  RETURNING follow_up_id;
`;