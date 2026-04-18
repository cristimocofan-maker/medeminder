export const patientsListByFiltersQuery = `
  SELECT
    p.patient_id,
    p.display_name AS patient_display_name,
    p.cnp,
    p.sex,
    TO_CHAR(p.birth_date, 'YYYY-MM-DD') AS birth_date,
    p.city,
    p.phone_number,
    p.email,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM patients p
  WHERE p.clinic_id = $1
    AND ($2::int IS NULL OR p.patient_id = $2)
    AND ($3::boolean IS NULL OR p.is_active = $3)
  ORDER BY
    CASE WHEN $6 = 'patient_id' AND $7 = 'asc' THEN p.patient_id END ASC,
    CASE WHEN $6 = 'patient_id' AND $7 = 'desc' THEN p.patient_id END DESC,
    CASE WHEN $6 = 'patient_display_name' AND $7 = 'asc' THEN p.display_name END ASC,
    CASE WHEN $6 = 'patient_display_name' AND $7 = 'desc' THEN p.display_name END DESC,
    CASE WHEN $6 = 'phone_number' AND $7 = 'asc' THEN p.phone_number END ASC,
    CASE WHEN $6 = 'phone_number' AND $7 = 'desc' THEN p.phone_number END DESC,
    CASE WHEN $6 = 'is_active' AND $7 = 'asc' THEN p.is_active END ASC,
    CASE WHEN $6 = 'is_active' AND $7 = 'desc' THEN p.is_active END DESC,
    CASE WHEN $6 = 'created_at' AND $7 = 'asc' THEN p.created_at END ASC,
    CASE WHEN $6 = 'created_at' AND $7 = 'desc' THEN p.created_at END DESC,
    p.patient_id ASC
  LIMIT $4
  OFFSET $5;
`;

export const patientsCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM patients p
  WHERE p.clinic_id = $1
    AND ($2::int IS NULL OR p.patient_id = $2)
    AND ($3::boolean IS NULL OR p.is_active = $3);
`;

export const patientsGetByIdQuery = `
  SELECT
    p.patient_id,
    p.clinic_id,
    p.display_name AS patient_display_name,
    p.cnp,
    p.sex,
    TO_CHAR(p.birth_date, 'YYYY-MM-DD') AS birth_date,
    p.city,
    p.phone_number,
    p.email,
    p.notes,
    p.is_active,
    p.created_at,
    p.updated_at
  FROM patients p
  WHERE p.patient_id = $1
    AND p.clinic_id = $2
  LIMIT 1;
`;

export const patientsCreateInsertQuery = `
  INSERT INTO patients (
    clinic_id,
    display_name,
    cnp,
    sex,
    birth_date,
    city,
    phone_number,
    email,
    notes,
    is_active
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
    $10
  )
  RETURNING
    patient_id,
    clinic_id,
    display_name AS patient_display_name,
    cnp,
    sex,
    TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
    city,
    phone_number,
    email,
    notes,
    is_active,
    created_at,
    updated_at;
`;

export const patientsUpdateQuery = `
  UPDATE patients
  SET
    display_name = $3,
    cnp = $4,
    sex = $5,
    birth_date = $6,
    city = $7,
    phone_number = $8,
    email = $9,
    notes = $10,
    is_active = $11,
    updated_at = CURRENT_TIMESTAMP
  WHERE patient_id = $1
    AND clinic_id = $2
  RETURNING
    patient_id,
    clinic_id,
    display_name AS patient_display_name,
    cnp,
    sex,
    TO_CHAR(birth_date, 'YYYY-MM-DD') AS birth_date,
    city,
    phone_number,
    email,
    notes,
    is_active,
    created_at,
    updated_at;
`;