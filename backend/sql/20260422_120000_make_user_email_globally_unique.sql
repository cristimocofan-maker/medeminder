DROP INDEX IF EXISTS users_clinic_id_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);