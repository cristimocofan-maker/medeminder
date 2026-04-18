export const authGetByEmailAndClinicIdQuery = `
  SELECT
    u.user_id,
    u.clinic_id,
    u.email,
    u.password_hash,
    u.user_role_label,
    u.is_active
  FROM users u
  WHERE u.email = $1
    AND u.clinic_id = $2
  LIMIT 1;
`;