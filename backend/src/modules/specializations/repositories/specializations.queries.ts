export const specializationsListByFiltersQuery = `
  SELECT
    s.specialization_id,
    s.display_name AS specialization_display_name,
    s.created_at,
    s.updated_at
  FROM specializations s
  WHERE s.clinic_id = $1
    AND ($2::int IS NULL OR s.specialization_id = $2)
  ORDER BY
    CASE WHEN $5 = 'specialization_id' AND $6 = 'asc' THEN s.specialization_id END ASC,
    CASE WHEN $5 = 'specialization_id' AND $6 = 'desc' THEN s.specialization_id END DESC,
    CASE WHEN $5 = 'specialization_display_name' AND $6 = 'asc' THEN s.display_name END ASC,
    CASE WHEN $5 = 'specialization_display_name' AND $6 = 'desc' THEN s.display_name END DESC,
    CASE WHEN $5 = 'created_at' AND $6 = 'asc' THEN s.created_at END ASC,
    CASE WHEN $5 = 'created_at' AND $6 = 'desc' THEN s.created_at END DESC,
    CASE WHEN $5 = 'updated_at' AND $6 = 'asc' THEN s.updated_at END ASC,
    CASE WHEN $5 = 'updated_at' AND $6 = 'desc' THEN s.updated_at END DESC,
    s.specialization_id ASC
  LIMIT $3
  OFFSET $4;
`;

export const specializationsCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM specializations s
  WHERE s.clinic_id = $1
    AND ($2::int IS NULL OR s.specialization_id = $2);
`;

export const specializationsGetByIdQuery = `
  SELECT
    s.specialization_id,
    s.clinic_id,
    s.display_name AS specialization_display_name,
    s.created_at,
    s.updated_at
  FROM specializations s
  WHERE s.specialization_id = $1
    AND s.clinic_id = $2
  LIMIT 1;
`;

export const specializationsCreateInsertQuery = `
  INSERT INTO specializations (
    clinic_id,
    display_name
  ) VALUES (
    $1,
    $2
  )
  RETURNING
    specialization_id,
    clinic_id,
    display_name AS specialization_display_name,
    created_at,
    updated_at;
`;

export const specializationsUpdateQuery = `
  UPDATE specializations
  SET
    display_name = $3,
    updated_at = CURRENT_TIMESTAMP
  WHERE specialization_id = $1
    AND clinic_id = $2
  RETURNING
    specialization_id,
    clinic_id,
    display_name AS specialization_display_name,
    created_at,
    updated_at;
`;

export const specializationServicesListQuery = `
  SELECT
    service_id,
    clinic_id,
    specialization_id,
    service_name,
    price,
    duration_minutes,
    description,
    is_active,
    created_at,
    updated_at
  FROM specialization_services
  WHERE clinic_id = $1
    AND specialization_id = $2
  ORDER BY is_active DESC, service_name ASC, service_id ASC;
`;

export const specializationServiceGetByIdQuery = `
  SELECT
    service_id,
    clinic_id,
    specialization_id,
    service_name,
    price,
    duration_minutes,
    description,
    is_active,
    created_at,
    updated_at
  FROM specialization_services
  WHERE clinic_id = $1
    AND specialization_id = $2
    AND service_id = $3
  LIMIT 1;
`;

export const specializationServiceCreateQuery = `
  INSERT INTO specialization_services (
    clinic_id,
    specialization_id,
    service_name,
    price,
    duration_minutes,
    description,
    is_active
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7
  )
  RETURNING
    service_id,
    clinic_id,
    specialization_id,
    service_name,
    price,
    duration_minutes,
    description,
    is_active,
    created_at,
    updated_at;
`;

export const specializationServiceUpdateQuery = `
  UPDATE specialization_services
  SET
    service_name = $4,
    price = $5,
    duration_minutes = $6,
    description = $7,
    is_active = $8,
    updated_at = CURRENT_TIMESTAMP
  WHERE clinic_id = $1
    AND specialization_id = $2
    AND service_id = $3
  RETURNING
    service_id,
    clinic_id,
    specialization_id,
    service_name,
    price,
    duration_minutes,
    description,
    is_active,
    created_at,
    updated_at;
`;

export const specializationServiceDeleteQuery = `
  DELETE FROM specialization_services
  WHERE clinic_id = $1
    AND specialization_id = $2
    AND service_id = $3
  RETURNING service_id;
`;