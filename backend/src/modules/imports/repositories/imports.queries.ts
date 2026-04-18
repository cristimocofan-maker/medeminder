export const importsListByFiltersQuery = `
  SELECT
    i.import_id,
    i.imported_by_user_id,
    i.file_name,
    i.file_type,
    i.import_status,
    i.imported_count,
    i.failed_count,
    i.error_details,
    i.created_at,
    i.updated_at
  FROM imports i
  WHERE i.clinic_id = $1
    AND ($2::int IS NULL OR i.import_id = $2)
    AND ($3::int IS NULL OR i.imported_by_user_id = $3)
    AND ($4::text IS NULL OR i.file_type = $4)
    AND ($5::text IS NULL OR i.import_status = $5)
  ORDER BY
    CASE WHEN $8 = 'import_id' AND $9 = 'asc' THEN i.import_id END ASC,
    CASE WHEN $8 = 'import_id' AND $9 = 'desc' THEN i.import_id END DESC,
    CASE WHEN $8 = 'imported_by_user_id' AND $9 = 'asc' THEN i.imported_by_user_id END ASC,
    CASE WHEN $8 = 'imported_by_user_id' AND $9 = 'desc' THEN i.imported_by_user_id END DESC,
    CASE WHEN $8 = 'file_type' AND $9 = 'asc' THEN i.file_type END ASC,
    CASE WHEN $8 = 'file_type' AND $9 = 'desc' THEN i.file_type END DESC,
    CASE WHEN $8 = 'import_status' AND $9 = 'asc' THEN i.import_status END ASC,
    CASE WHEN $8 = 'import_status' AND $9 = 'desc' THEN i.import_status END DESC,
    CASE WHEN $8 = 'created_at' AND $9 = 'asc' THEN i.created_at END ASC,
    CASE WHEN $8 = 'created_at' AND $9 = 'desc' THEN i.created_at END DESC,
    i.import_id ASC
  LIMIT $6
  OFFSET $7;
`;

export const importsCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM imports i
  WHERE i.clinic_id = $1
    AND ($2::int IS NULL OR i.import_id = $2)
    AND ($3::int IS NULL OR i.imported_by_user_id = $3)
    AND ($4::text IS NULL OR i.file_type = $4)
    AND ($5::text IS NULL OR i.import_status = $5);
`;

export const importsGetByIdQuery = `
  SELECT
    i.import_id,
    i.clinic_id,
    i.imported_by_user_id,
    i.file_name,
    i.file_type,
    i.import_status,
    i.imported_count,
    i.failed_count,
    i.error_details,
    i.created_at,
    i.updated_at
  FROM imports i
  WHERE i.import_id = $1
    AND i.clinic_id = $2
  LIMIT 1;
`;

export const importsCreateInsertQuery = `
  INSERT INTO imports (
    clinic_id,
    imported_by_user_id,
    file_name,
    file_type,
    import_status,
    imported_count,
    failed_count,
    error_details,
    created_at,
    updated_at
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING import_id;
`;

export const importsUpdateErrorDetailsQuery = `
  UPDATE imports
  SET
    error_details = $3,
    updated_at = CURRENT_TIMESTAMP
  WHERE import_id = $1
    AND clinic_id = $2
  RETURNING import_id;
`;