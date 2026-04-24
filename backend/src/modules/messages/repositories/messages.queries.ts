export const messagesListByFiltersQuery = `
  SELECT
    m.message_id,
    m.appointment_id,
    m.channel_type,
    m.message_subject,
    m.message_status,
    m.created_at,
    m.updated_at
  FROM messages m
  WHERE m.clinic_id = $1
    AND ($2::int IS NULL OR m.message_id = $2)
    AND ($3::int IS NULL OR m.appointment_id = $3)
    AND ($4::text IS NULL OR m.channel_type = $4)
    AND ($5::text IS NULL OR m.message_status = $5)
  ORDER BY
    CASE WHEN $8 = 'message_id' AND $9 = 'asc' THEN m.message_id END ASC,
    CASE WHEN $8 = 'message_id' AND $9 = 'desc' THEN m.message_id END DESC,
    CASE WHEN $8 = 'appointment_id' AND $9 = 'asc' THEN m.appointment_id END ASC,
    CASE WHEN $8 = 'appointment_id' AND $9 = 'desc' THEN m.appointment_id END DESC,
    CASE WHEN $8 = 'channel_type' AND $9 = 'asc' THEN m.channel_type END ASC,
    CASE WHEN $8 = 'channel_type' AND $9 = 'desc' THEN m.channel_type END DESC,
    CASE WHEN $8 = 'message_status' AND $9 = 'asc' THEN m.message_status END ASC,
    CASE WHEN $8 = 'message_status' AND $9 = 'desc' THEN m.message_status END DESC,
    CASE WHEN $8 = 'created_at' AND $9 = 'asc' THEN m.created_at END ASC,
    CASE WHEN $8 = 'created_at' AND $9 = 'desc' THEN m.created_at END DESC,
    m.message_id ASC
  LIMIT $6
  OFFSET $7;
`;

export const messagesCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM messages m
  WHERE m.clinic_id = $1
    AND ($2::int IS NULL OR m.message_id = $2)
    AND ($3::int IS NULL OR m.appointment_id = $3)
    AND ($4::text IS NULL OR m.channel_type = $4)
    AND ($5::text IS NULL OR m.message_status = $5);
`;

export const messagesGetByIdQuery = `
  SELECT
    m.message_id,
    m.clinic_id,
    m.appointment_id,
    m.channel_type,
    m.message_subject,
    m.message_body,
    m.message_status,
    m.created_at,
    m.updated_at
  FROM messages m
  WHERE m.message_id = $1
    AND m.clinic_id = $2
  LIMIT 1;
`;

export const messagesGetLatestByAppointmentIdAndChannelTypeQuery = `
  SELECT
    m.message_id,
    m.clinic_id,
    m.appointment_id,
    m.channel_type,
    m.message_subject,
    m.message_body,
    m.message_status,
    m.created_at,
    m.updated_at
  FROM messages m
  WHERE m.clinic_id = $1
    AND m.appointment_id = $2
    AND m.channel_type = $3
  ORDER BY m.created_at DESC, m.message_id DESC
  LIMIT 1;
`;

export const messagesCreateInsertQuery = `
  INSERT INTO messages (
    clinic_id,
    appointment_id,
    channel_type,
    message_subject,
    message_body,
    message_status
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6
  )
  RETURNING message_id;
`;

export const messagesRetryQuery = `
  UPDATE messages
  SET
    message_status = 'În coadă',
    updated_at = CURRENT_TIMESTAMP
  WHERE message_id = $1
    AND clinic_id = $2
  RETURNING message_id;
`;

export const messagesUpdateStatusQuery = `
  UPDATE messages
  SET
    message_status = $3,
    updated_at = CURRENT_TIMESTAMP
  WHERE message_id = $1
    AND clinic_id = $2
  RETURNING message_id;
`;