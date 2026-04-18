export const responsesListByFiltersQuery = `
  SELECT
    r.response_id,
    r.message_id,
    r.response_status,
    r.response_text,
    r.created_at
  FROM responses r
  WHERE r.clinic_id = $1
    AND ($2::int IS NULL OR r.response_id = $2)
    AND ($3::int IS NULL OR r.message_id = $3)
    AND ($4::text IS NULL OR r.response_status = $4)
  ORDER BY
    CASE WHEN $7 = 'response_id' AND $8 = 'asc' THEN r.response_id END ASC,
    CASE WHEN $7 = 'response_id' AND $8 = 'desc' THEN r.response_id END DESC,
    CASE WHEN $7 = 'message_id' AND $8 = 'asc' THEN r.message_id END ASC,
    CASE WHEN $7 = 'message_id' AND $8 = 'desc' THEN r.message_id END DESC,
    CASE WHEN $7 = 'created_at' AND $8 = 'asc' THEN r.created_at END ASC,
    CASE WHEN $7 = 'created_at' AND $8 = 'desc' THEN r.created_at END DESC,
    r.response_id ASC
  LIMIT $5
  OFFSET $6;
`;

export const responsesCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM responses r
  WHERE r.clinic_id = $1
    AND ($2::int IS NULL OR r.response_id = $2)
    AND ($3::int IS NULL OR r.message_id = $3)
    AND ($4::text IS NULL OR r.response_status = $4);
`;

export const responsesGetByIdQuery = `
  SELECT
    r.response_id,
    r.clinic_id,
    r.message_id,
    r.response_status,
    r.response_text,
    r.created_at
  FROM responses r
  WHERE r.response_id = $1
    AND r.clinic_id = $2
  LIMIT 1;
`;

export const responsesCreateInsertQuery = `
  INSERT INTO responses (
    clinic_id,
    message_id,
    response_status,
    response_text
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  )
  RETURNING response_id;
`;