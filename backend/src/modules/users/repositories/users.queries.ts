export const usersListByFiltersQuery = `
  SELECT
    u.user_id,
    u.email,
    u.user_role_label,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.clinic_id = $1
    AND ($2::int IS NULL OR u.user_id = $2)
    AND ($3::boolean IS NULL OR u.is_active = $3)
  ORDER BY
    CASE WHEN $6 = 'user_id' AND $7 = 'asc' THEN u.user_id END ASC,
    CASE WHEN $6 = 'user_id' AND $7 = 'desc' THEN u.user_id END DESC,
    CASE WHEN $6 = 'email' AND $7 = 'asc' THEN u.email END ASC,
    CASE WHEN $6 = 'email' AND $7 = 'desc' THEN u.email END DESC,
    CASE WHEN $6 = 'user_role_label' AND $7 = 'asc' THEN u.user_role_label END ASC,
    CASE WHEN $6 = 'user_role_label' AND $7 = 'desc' THEN u.user_role_label END DESC,
    CASE WHEN $6 = 'is_active' AND $7 = 'asc' THEN u.is_active END ASC,
    CASE WHEN $6 = 'is_active' AND $7 = 'desc' THEN u.is_active END DESC,
    CASE WHEN $6 = 'created_at' AND $7 = 'asc' THEN u.created_at END ASC,
    CASE WHEN $6 = 'created_at' AND $7 = 'desc' THEN u.created_at END DESC,
    CASE WHEN $6 = 'updated_at' AND $7 = 'asc' THEN u.updated_at END ASC,
    CASE WHEN $6 = 'updated_at' AND $7 = 'desc' THEN u.updated_at END DESC,
    u.user_id ASC
  LIMIT $4
  OFFSET $5;
`;

export const usersCountByFiltersQuery = `
  SELECT COUNT(*)::int AS total_count
  FROM users u
  WHERE u.clinic_id = $1
    AND ($2::int IS NULL OR u.user_id = $2)
    AND ($3::boolean IS NULL OR u.is_active = $3);
`;

export const usersGetByIdQuery = `
  SELECT
    u.user_id,
    u.clinic_id,
    u.email,
    u.password_hash,
    u.user_role_label,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.user_id = $1
    AND u.clinic_id = $2
  LIMIT 1;
`;

export const usersGetByEmailQuery = `
  SELECT
    u.user_id,
    u.clinic_id,
    u.email,
    u.password_hash,
    u.user_role_label,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.email = $1
  LIMIT 1;
`;

export const usersGetByEmailExcludingUserQuery = `
  SELECT
    u.user_id,
    u.clinic_id,
    u.email,
    u.password_hash,
    u.user_role_label,
    u.is_active,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.email = $1
    AND u.user_id <> $2
  LIMIT 1;
`;

export const usersCreateInsertQuery = `
  INSERT INTO users (
    clinic_id,
    email,
    password_hash,
    user_role_label,
    is_active
  ) VALUES (
    $1,
    $2,
    $3,
    $4,
    $5
  )
  RETURNING
    user_id,
    clinic_id,
    email,
    password_hash,
    user_role_label,
    is_active,
    created_at,
    updated_at;
`;

export const usersUpdateQuery = `
  UPDATE users
  SET
    email = $3,
    password_hash = COALESCE($4, password_hash),
    user_role_label = $5,
    is_active = $6,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = $1
    AND clinic_id = $2
  RETURNING
    user_id,
    clinic_id,
    email,
    password_hash,
    user_role_label,
    is_active,
    created_at,
    updated_at;
`;