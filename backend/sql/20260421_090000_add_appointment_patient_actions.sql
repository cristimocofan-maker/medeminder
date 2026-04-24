ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS patient_action_token VARCHAR(64),
ADD COLUMN IF NOT EXISTS patient_action_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS patient_confirmation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS patient_confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS patient_cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS patient_reschedule_requested_at TIMESTAMPTZ;

UPDATE appointments
SET patient_confirmation_status = CASE
  WHEN confirmation_status = 'Răspuns DA' THEN 'confirmed'
  WHEN confirmation_status = 'Răspuns NU' THEN 'cancelled'
  WHEN confirmation_status = 'Răspuns REPROGRAMEAZĂ' THEN 'reschedule_requested'
  ELSE 'pending'
END
WHERE patient_confirmation_status IS NULL
   OR patient_confirmation_status = '';

CREATE UNIQUE INDEX IF NOT EXISTS appointments_patient_action_token_uq
  ON appointments (patient_action_token)
  WHERE patient_action_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS appointments_patient_confirmation_status_idx
  ON appointments (clinic_id, patient_confirmation_status);

CREATE INDEX IF NOT EXISTS appointments_patient_action_token_expires_at_idx
  ON appointments (patient_action_token_expires_at)
  WHERE patient_action_token_expires_at IS NOT NULL;