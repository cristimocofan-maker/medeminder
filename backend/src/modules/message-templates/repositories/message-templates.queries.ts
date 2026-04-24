export const messageTemplatesListByFiltersQuery = `
  SELECT
    mt.template_id,
    mt.template_name,
    mt.channel_type,
    mt.message_subject,
    mt.created_at,
    mt.updated_at
  FROM message_templates mt
  WHERE mt.clinic_id = $1
    AND ($2::int IS NULL OR mt.template_id = $2)
    AND ($3::text IS NULL OR mt.channel_type = $3)
  ORDER BY
    CASE WHEN $6 = 'template_id' AND $7 = 'asc' THEN mt.template_id END ASC,
    CASE WHEN $6 = 'template_id' AND $7 = 'desc' THEN mt.template_id END DESC,
    CASE WHEN $6 = 'template_name' AND $7 = 'asc' THEN mt.template_name END ASC,
    CASE WHEN $6 = 'template_name' AND $7 = 'desc' THEN mt.template_name END DESC,
    CASE WHEN $6 = 'channel_type' AND $7 = 'asc' THEN mt.channel_type END ASC,
    CASE WHEN $6 = 'channel_type' AND $7 = 'desc' THEN mt.channel_type END DESC,
    CASE WHEN $6 = 'created_at' AND $7 = 'asc' THEN mt.created_at END ASC,
    CASE WHEN $6 = 'created_at' AND $7 = 'desc' THEN mt.created_at END DESC,
    mt.template_id ASC
  LIMIT $4
  OFFSET $5;
`;

export const messageTemplatesCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM message_templates mt
  WHERE mt.clinic_id = $1
    AND ($2::int IS NULL OR mt.template_id = $2)
    AND ($3::text IS NULL OR mt.channel_type = $3);
`;

export const messageTemplatesGetByIdQuery = `
  SELECT
    mt.template_id,
    mt.clinic_id,
    mt.template_name,
    mt.channel_type,
    mt.message_subject,
    mt.message_body,
    mt.created_at,
    mt.updated_at
  FROM message_templates mt
  WHERE mt.template_id = $1
    AND mt.clinic_id = $2
  LIMIT 1;
`;

export const messageTemplatesGetLatestByChannelTypeQuery = `
  SELECT
    mt.template_id,
    mt.clinic_id,
    mt.template_name,
    mt.channel_type,
    mt.message_subject,
    mt.message_body,
    mt.created_at,
    mt.updated_at
  FROM message_templates mt
  WHERE mt.clinic_id = $1
    AND mt.channel_type = $2
  ORDER BY mt.updated_at DESC, mt.template_id DESC
  LIMIT 1;
`;

export const messageTemplatesCreateInsertQuery = `
  INSERT INTO message_templates (
    clinic_id,
    template_name,
    channel_type,
    message_subject,
    message_body
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
  )
  RETURNING template_id;
`;

export const messageTemplatesUpdateQuery = `
  UPDATE message_templates
  SET
    template_name = $3,
    channel_type = $4,
    message_subject = $5,
    message_body = $6,
    updated_at = CURRENT_TIMESTAMP
  WHERE template_id = $1
    AND clinic_id = $2
  RETURNING template_id;
`;