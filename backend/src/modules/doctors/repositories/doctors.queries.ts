export const doctorsListByFiltersQuery = `
  SELECT
    d.doctor_id,
    d.display_name AS doctor_display_name,
    d.specialization_id,
    s.display_name AS specialization_display_name,
    d.is_active,
    d.created_at,
    d.updated_at
  FROM doctors d
  INNER JOIN specializations s
    ON s.specialization_id = d.specialization_id
   AND s.clinic_id = d.clinic_id
  WHERE d.clinic_id = $1
    AND ($2::int IS NULL OR d.doctor_id = $2)
    AND ($3::int IS NULL OR d.specialization_id = $3)
    AND ($4::boolean IS NULL OR d.is_active = $4)
  ORDER BY
    CASE WHEN $7 = 'doctor_id' AND $8 = 'asc' THEN d.doctor_id END ASC,
    CASE WHEN $7 = 'doctor_id' AND $8 = 'desc' THEN d.doctor_id END DESC,
    CASE WHEN $7 = 'doctor_display_name' AND $8 = 'asc' THEN d.display_name END ASC,
    CASE WHEN $7 = 'doctor_display_name' AND $8 = 'desc' THEN d.display_name END DESC,
    CASE WHEN $7 = 'specialization_id' AND $8 = 'asc' THEN d.specialization_id END ASC,
    CASE WHEN $7 = 'specialization_id' AND $8 = 'desc' THEN d.specialization_id END DESC,
    CASE WHEN $7 = 'is_active' AND $8 = 'asc' THEN d.is_active END ASC,
    CASE WHEN $7 = 'is_active' AND $8 = 'desc' THEN d.is_active END DESC,
    CASE WHEN $7 = 'created_at' AND $8 = 'asc' THEN d.created_at END ASC,
    CASE WHEN $7 = 'created_at' AND $8 = 'desc' THEN d.created_at END DESC,
    d.doctor_id ASC
  LIMIT $5
  OFFSET $6;
`;

export const doctorsCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM doctors d
  WHERE d.clinic_id = $1
    AND ($2::int IS NULL OR d.doctor_id = $2)
    AND ($3::int IS NULL OR d.specialization_id = $3)
    AND ($4::boolean IS NULL OR d.is_active = $4);
`;

export const doctorsGetByIdQuery = `
  SELECT
    d.doctor_id,
    d.clinic_id,
    d.display_name AS doctor_display_name,
    d.specialization_id,
    s.display_name AS specialization_display_name,
    d.is_active,
    d.created_at,
    d.updated_at
  FROM doctors d
  INNER JOIN specializations s
    ON s.specialization_id = d.specialization_id
   AND s.clinic_id = d.clinic_id
  WHERE d.doctor_id = $1
    AND d.clinic_id = $2
  LIMIT 1;
`;

export const doctorsCreateInsertQuery = `
  INSERT INTO doctors (
    clinic_id,
    display_name,
    specialization_id,
    is_active
  ) VALUES (
    $1,
    $2,
    $3,
    $4
  )
  RETURNING
    doctor_id,
    clinic_id,
    display_name AS doctor_display_name,
    specialization_id,
    is_active,
    created_at,
    updated_at;
`;

export const doctorsUpdateQuery = `
  UPDATE doctors
  SET
    display_name = $3,
    specialization_id = $4,
    is_active = $5,
    updated_at = CURRENT_TIMESTAMP
  WHERE doctor_id = $1
    AND clinic_id = $2
  RETURNING
    doctor_id,
    clinic_id,
    display_name AS doctor_display_name,
    specialization_id,
    is_active,
    created_at,
    updated_at;
`;