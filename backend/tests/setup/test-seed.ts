import { randomUUID } from "node:crypto";
import { BcryptPasswordHasher } from "../../src/shared/auth/password-hasher";
import { queryOne } from "./test-db";

export interface SeededTestIdentity {
  clinic_id: number;
  user_id: number;
  email: string;
  password: string;
}

const TEST_SEED_NAME = "default_auth";

const createUniqueEmail = (): string => {
  return `test-auth-${randomUUID().slice(0, 12)}@medreminder.test`;
};

const createUniquePassword = (): string => {
  return `TestPassword-${randomUUID()}`;
};

export const ensureTestSchema = async (): Promise<void> => {
  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS clinics (
        clinic_id SERIAL PRIMARY KEY,
        display_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        email VARCHAR(320) NOT NULL,
        password_hash TEXT NOT NULL,
        user_role_label VARCHAR(100) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS specializations (
        specialization_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        display_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS doctors (
        doctor_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        display_name VARCHAR(255) NOT NULL,
        specialization_id INT NOT NULL REFERENCES specializations(specialization_id) ON DELETE RESTRICT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS specialization_services (
        service_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        specialization_id INT NOT NULL REFERENCES specializations(specialization_id) ON DELETE CASCADE,
        service_name VARCHAR(255) NOT NULL,
        price NUMERIC(12, 2) NOT NULL DEFAULT 0,
        duration_minutes INT,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS patients (
        patient_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        display_name VARCHAR(255) NOT NULL,
        cnp VARCHAR(13),
        sex VARCHAR(20),
        birth_date DATE,
        city VARCHAR(255),
        phone_number VARCHAR(32) NOT NULL,
        email VARCHAR(320),
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS cnp VARCHAR(13),
      ADD COLUMN IF NOT EXISTS sex VARCHAR(20),
      ADD COLUMN IF NOT EXISTS birth_date DATE,
      ADD COLUMN IF NOT EXISTS city VARCHAR(255);
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS appointments (
        appointment_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
        patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE RESTRICT,
        start_date_time TIMESTAMPTZ NOT NULL,
        end_date_time TIMESTAMPTZ NOT NULL,
        appointment_notes TEXT,
        appointment_status VARCHAR(100) NOT NULL,
        confirmation_status VARCHAR(100) NOT NULL,
        patient_action_token VARCHAR(64),
        patient_action_token_expires_at TIMESTAMPTZ,
        patient_confirmation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
        patient_confirmed_at TIMESTAMPTZ,
        patient_cancelled_at TIMESTAMPTZ,
        patient_reschedule_requested_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS patient_action_token VARCHAR(64),
      ADD COLUMN IF NOT EXISTS patient_action_token_expires_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS patient_confirmation_status VARCHAR(50) NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS patient_confirmed_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS patient_cancelled_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS patient_reschedule_requested_at TIMESTAMPTZ;
    `,
  );

  await queryOne(
    `
      CREATE UNIQUE INDEX IF NOT EXISTS appointments_patient_action_token_uq
      ON appointments (patient_action_token)
      WHERE patient_action_token IS NOT NULL;
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS messages (
        message_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        appointment_id INT NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
        channel_type VARCHAR(50) NOT NULL,
        message_subject VARCHAR(255) NOT NULL,
        message_body TEXT NOT NULL,
        message_status VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS follow_ups (
        follow_up_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        appointment_id INT NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
        follow_up_status VARCHAR(100) NOT NULL,
        scheduled_for TIMESTAMPTZ NOT NULL,
        follow_up_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS imports (
        import_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        imported_by_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
        file_name VARCHAR(255) NOT NULL,
        file_type VARCHAR(20) NOT NULL,
        import_status VARCHAR(50) NOT NULL,
        imported_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        error_details TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS message_templates (
        template_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        template_name VARCHAR(255) NOT NULL,
        channel_type VARCHAR(50) NOT NULL,
        message_subject VARCHAR(255) NOT NULL,
        message_body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS clinic_settings (
        clinic_id INT PRIMARY KEY REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        timezone VARCHAR(100) NOT NULL,
        default_channel_type VARCHAR(50) NOT NULL,
        appointment_reminder_hours_before INT NOT NULL,
        follow_up_delay_days INT NOT NULL,
        sms_provider_name VARCHAR(255),
        sms_sender_name VARCHAR(255),
        sms_username VARCHAR(255),
        sms_password TEXT,
        sms_token TEXT,
        sms_is_primary_gateway BOOLEAN DEFAULT TRUE,
        sms_patient_action_base_path VARCHAR(255),
        sms_last_checked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS responses (
        response_id SERIAL PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        message_id INT NOT NULL REFERENCES messages(message_id) ON DELETE CASCADE,
        response_status VARCHAR(100) NOT NULL,
        response_text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );

  await queryOne(
    `
      CREATE TABLE IF NOT EXISTS test_seed_metadata (
        seed_name VARCHAR(100) PRIMARY KEY,
        clinic_id INT NOT NULL REFERENCES clinics(clinic_id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        email VARCHAR(320) NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `,
  );
};

const getExistingSeedIdentity = async (): Promise<SeededTestIdentity | null> => {
  const metadata = await queryOne<SeededTestIdentity>(
    `
      SELECT m.clinic_id, m.user_id, m.email, m.password
      FROM test_seed_metadata m
      WHERE m.seed_name = $1
      LIMIT 1;
    `,
    [TEST_SEED_NAME],
  );

  if (metadata === null) {
    return null;
  }

  const userExists = await queryOne<{ user_id: number }>(
    `
      SELECT u.user_id
      FROM users u
      INNER JOIN clinics c
        ON c.clinic_id = u.clinic_id
      WHERE u.user_id = $1
        AND u.clinic_id = $2
        AND u.is_active = TRUE
        AND c.is_active = TRUE
      LIMIT 1;
    `,
    [metadata.user_id, metadata.clinic_id],
  );

  if (userExists === null) {
    return null;
  }

  return metadata;
};

export const ensureSeededTestIdentity = async (): Promise<SeededTestIdentity> => {
  await ensureTestSchema();

  const existingSeed = await getExistingSeedIdentity();

  if (existingSeed !== null) {
    return existingSeed;
  }

  const email = createUniqueEmail();
  const password = createUniquePassword();
  const passwordHasher = new BcryptPasswordHasher();
  const passwordHash = await passwordHasher.hash(password);

  const clinic = await queryOne<{ clinic_id: number }>(
    `
      INSERT INTO clinics (display_name, is_active)
      VALUES ($1, TRUE)
      RETURNING clinic_id;
    `,
    ["Test Infrastructure Clinic"],
  );

  if (clinic === null) {
    throw new Error("Nu s-a putut crea clinica seed pentru test.");
  }

  const user = await queryOne<{ user_id: number }>(
    `
      INSERT INTO users (
        clinic_id,
        email,
        password_hash,
        user_role_label,
        is_active
      ) VALUES ($1, $2, $3, $4, TRUE)
      RETURNING user_id;
    `,
    [clinic.clinic_id, email, passwordHash, "administrator"],
  );

  if (user === null) {
    throw new Error("Nu s-a putut crea utilizatorul seed pentru test.");
  }

  await queryOne(
    `
      INSERT INTO clinic_settings (
        clinic_id,
        timezone,
        default_channel_type,
        appointment_reminder_hours_before,
        follow_up_delay_days
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (clinic_id) DO UPDATE
      SET
        timezone = EXCLUDED.timezone,
        default_channel_type = EXCLUDED.default_channel_type,
        appointment_reminder_hours_before = EXCLUDED.appointment_reminder_hours_before,
        follow_up_delay_days = EXCLUDED.follow_up_delay_days,
        updated_at = CURRENT_TIMESTAMP
      RETURNING clinic_id;
    `,
    [clinic.clinic_id, "Europe/Bucharest", "Email", 24, 3],
  );

  const seedIdentity = await queryOne<SeededTestIdentity>(
    `
      INSERT INTO test_seed_metadata (seed_name, clinic_id, user_id, email, password)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (seed_name) DO UPDATE
      SET
        clinic_id = EXCLUDED.clinic_id,
        user_id = EXCLUDED.user_id,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        updated_at = CURRENT_TIMESTAMP
      RETURNING clinic_id, user_id, email, password;
    `,
    [TEST_SEED_NAME, clinic.clinic_id, user.user_id, email, password],
  );

  if (seedIdentity === null) {
    throw new Error("Nu s-a putut salva metadata seed pentru test.");
  }

  return seedIdentity;
};