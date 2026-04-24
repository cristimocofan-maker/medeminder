export const clinicsListActiveForLoginQuery = `
  SELECT
    c.clinic_id,
    c.display_name
  FROM clinics c
  WHERE c.is_active = TRUE
  ORDER BY c.display_name ASC, c.clinic_id ASC;
`;

export const clinicsGetByClinicIdQuery = `
  SELECT
    c.clinic_id,
    c.display_name
  FROM clinics c
  WHERE c.clinic_id = $1
  LIMIT 1;
`;

export const clinicsUpdateDisplayNameByClinicIdQuery = `
  UPDATE clinics
  SET
    display_name = $2
  WHERE clinic_id = $1
  RETURNING
    clinic_id,
    display_name;
`;