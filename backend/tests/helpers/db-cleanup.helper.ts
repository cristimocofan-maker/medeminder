import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { cleanup, queryOne } from "../setup/test-db";
import { ensureTestSchema } from "../setup/test-seed";

export interface CleanupRegistry {
  clinicIds: Set<number>;
}

export interface ClinicFixture {
  clinic_id: number;
  display_name: string;
}

export interface UserFixture {
  user_id: number;
  clinic_id: number;
  email: string;
  password: string;
  password_hash: string;
  user_role_label: string;
  is_active: boolean;
}

export interface SpecializationFixture {
  specialization_id: number;
  clinic_id: number;
  specialization_display_name: string;
}

export interface DoctorFixture {
  doctor_id: number;
  clinic_id: number;
  specialization_id: number;
  doctor_display_name: string;
  is_active: boolean;
}

export interface PatientFixture {
  patient_id: number;
  clinic_id: number;
  patient_display_name: string;
  cnp: string;
  sex: string;
  birth_date: string;
  city: string;
  phone_number: string;
  email: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface AppointmentFixture {
  appointment_id: number;
  clinic_id: number;
  doctor_id: number;
  patient_id: number;
  appointment_status: string;
  confirmation_status: string;
  start_date_time: string;
  end_date_time: string;
  appointment_notes: string | null;
}

export interface MessageFixture {
  message_id: number;
  clinic_id: number;
  appointment_id: number;
  channel_type: string;
  message_subject: string;
  message_body: string;
  message_status: string;
}

export interface FollowUpFixture {
  follow_up_id: number;
  clinic_id: number;
  appointment_id: number;
  follow_up_status: string;
  scheduled_for: string;
  follow_up_notes: string | null;
}

export interface ImportFixture {
  import_id: number;
  clinic_id: number;
  imported_by_user_id: number;
  file_name: string;
  file_type: string;
  import_status: string;
}

export interface MessageTemplateFixture {
  template_id: number;
  clinic_id: number;
  template_name: string;
  channel_type: string;
  message_subject: string;
  message_body: string;
}

export interface ClinicSettingsFixture {
  clinic_id: number;
  timezone: string;
  default_channel_type: string;
  appointment_reminder_hours_before: number;
  follow_up_delay_days: number;
}

export interface ResponseFixture {
  response_id: number;
  clinic_id: number;
  message_id: number;
  response_status: string;
  response_text: string;
}

const buildUniqueValue = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
};

const buildPhoneNumber = (): string => {
  const suffix = randomUUID().replace(/[^0-9]/g, "").padEnd(9, "7").slice(0, 9);

  return `407${suffix}`;
};

const buildValidCnp = (): { birth_date: string; cnp: string; sex: string } => {
  const year = 1980 + Math.floor(Math.random() * 30);
  const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
  const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");
  const sex = Math.random() < 0.5 ? "Masculin" : "Feminin";
  const firstDigit = sex === "Masculin" ? "1" : "2";
  const yearSuffix = String(year).slice(-2);
  const county = "40";
  const serial = String(1 + Math.floor(Math.random() * 999)).padStart(3, "0");
  const firstTwelveDigits = `${firstDigit}${yearSuffix}${month}${day}${county}${serial}`;
  const controlKey = "279146358279";
  const checksum = firstTwelveDigits
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * Number(controlKey[index]), 0);
  const controlDigit = checksum % 11 === 10 ? 1 : checksum % 11;

  return {
    cnp: `${firstTwelveDigits}${controlDigit}`,
    sex,
    birth_date: `${year}-${month}-${day}`,
  };
};

export const createCleanupRegistry = (): CleanupRegistry => ({
  clinicIds: new Set<number>(),
});

export const cleanupRegisteredData = async (registry: CleanupRegistry): Promise<void> => {
  const clinicIds = [...registry.clinicIds];

  if (clinicIds.length === 0) {
    return;
  }

  await cleanup([
    { text: "DELETE FROM responses WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM imports WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM follow_ups WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM messages WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM appointments WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM doctors WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM patients WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM specializations WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM message_templates WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM clinic_settings WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM users WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
    { text: "DELETE FROM clinics WHERE clinic_id = ANY($1::int[]);", values: [clinicIds] },
  ]);
};

export const createClinicFixture = async (
  registry: CleanupRegistry,
  displayName = buildUniqueValue("clinic"),
): Promise<ClinicFixture> => {
  await ensureTestSchema();

  const clinic = await queryOne<ClinicFixture>(
    `
      INSERT INTO clinics (display_name)
      VALUES ($1)
      RETURNING clinic_id, display_name;
    `,
    [displayName],
  );

  if (clinic === null) {
    throw new Error("Nu s-a putut crea clinica de test.");
  }

  registry.clinicIds.add(clinic.clinic_id);

  return clinic;
};

export const createClinicSettingsFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<ClinicSettingsFixture> = {},
): Promise<ClinicSettingsFixture> => {
  const clinicSettings = await queryOne<ClinicSettingsFixture>(
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
      RETURNING
        clinic_id,
        timezone,
        default_channel_type,
        appointment_reminder_hours_before,
        follow_up_delay_days;
    `,
    [
      clinicId,
      overrides.timezone ?? "Europe/Bucharest",
      overrides.default_channel_type ?? "Email",
      overrides.appointment_reminder_hours_before ?? 24,
      overrides.follow_up_delay_days ?? 3,
    ],
  );

  if (clinicSettings === null) {
    throw new Error("Nu s-au putut crea setările clinicii de test.");
  }

  registry.clinicIds.add(clinicId);

  return clinicSettings;
};

export const createUserFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<Omit<UserFixture, "user_id" | "clinic_id" | "password_hash">> & { password?: string } = {},
): Promise<UserFixture> => {
  const password = overrides.password ?? buildUniqueValue("Password");
  const email = overrides.email ?? `${buildUniqueValue("user")}@test.local`;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await queryOne<Omit<UserFixture, "password">>(
    `
      INSERT INTO users (
        clinic_id,
        email,
        password_hash,
        user_role_label,
        is_active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING user_id, clinic_id, email, password_hash, user_role_label, is_active;
    `,
    [
      clinicId,
      email,
      passwordHash,
      overrides.user_role_label ?? "administrator",
      overrides.is_active ?? true,
    ],
  );

  if (user === null) {
    throw new Error("Nu s-a putut crea utilizatorul de test.");
  }

  registry.clinicIds.add(clinicId);

  return {
    ...user,
    password,
  };
};

export const createSpecializationFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  specializationDisplayName = buildUniqueValue("specialization"),
): Promise<SpecializationFixture> => {
  const specialization = await queryOne<SpecializationFixture>(
    `
      INSERT INTO specializations (clinic_id, display_name)
      VALUES ($1, $2)
      RETURNING specialization_id, clinic_id, display_name AS specialization_display_name;
    `,
    [clinicId, specializationDisplayName],
  );

  if (specialization === null) {
    throw new Error("Nu s-a putut crea specializarea de test.");
  }

  registry.clinicIds.add(clinicId);

  return specialization;
};

export const createDoctorFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<DoctorFixture> = {},
): Promise<DoctorFixture> => {
  const specializationId =
    overrides.specialization_id ?? (await createSpecializationFixture(registry, clinicId)).specialization_id;
  const doctor = await queryOne<DoctorFixture>(
    `
      INSERT INTO doctors (
        clinic_id,
        display_name,
        specialization_id,
        is_active
      ) VALUES ($1, $2, $3, $4)
      RETURNING doctor_id, clinic_id, display_name AS doctor_display_name, specialization_id, is_active;
    `,
    [
      clinicId,
      overrides.doctor_display_name ?? buildUniqueValue("doctor"),
      specializationId,
      overrides.is_active ?? true,
    ],
  );

  if (doctor === null) {
    throw new Error("Nu s-a putut crea doctorul de test.");
  }

  registry.clinicIds.add(clinicId);

  return doctor;
};

export const createPatientFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<PatientFixture> = {},
): Promise<PatientFixture> => {
  const generatedDemographics = buildValidCnp();
  const patient = await queryOne<PatientFixture>(
    `
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        is_active;
    `,
    [
      clinicId,
      overrides.patient_display_name ?? buildUniqueValue("patient"),
      overrides.cnp ?? generatedDemographics.cnp,
      overrides.sex ?? generatedDemographics.sex,
      overrides.birth_date ?? generatedDemographics.birth_date,
      overrides.city ?? buildUniqueValue("city"),
      overrides.phone_number ?? buildPhoneNumber(),
      overrides.email ?? `${buildUniqueValue("patient")}@test.local`,
      overrides.notes ?? null,
      overrides.is_active ?? true,
    ],
  );

  if (patient === null) {
    throw new Error("Nu s-a putut crea pacientul de test.");
  }

  registry.clinicIds.add(clinicId);

  return patient;
};

export const createAppointmentFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<AppointmentFixture> = {},
): Promise<AppointmentFixture> => {
  const doctorId = overrides.doctor_id ?? (await createDoctorFixture(registry, clinicId)).doctor_id;
  const patientId = overrides.patient_id ?? (await createPatientFixture(registry, clinicId)).patient_id;
  const startDateTime = overrides.start_date_time ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const endDateTime = overrides.end_date_time ?? new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
  const appointment = await queryOne<AppointmentFixture>(
    `
      INSERT INTO appointments (
        clinic_id,
        doctor_id,
        patient_id,
        start_date_time,
        end_date_time,
        appointment_notes,
        appointment_status,
        confirmation_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        appointment_id,
        clinic_id,
        doctor_id,
        patient_id,
        appointment_status,
        confirmation_status,
        start_date_time,
        end_date_time,
        appointment_notes;
    `,
    [
      clinicId,
      doctorId,
      patientId,
      startDateTime,
      endDateTime,
      overrides.appointment_notes ?? null,
      overrides.appointment_status ?? "Programată",
      overrides.confirmation_status ?? "Fără răspuns",
    ],
  );

  if (appointment === null) {
    throw new Error("Nu s-a putut crea programarea de test.");
  }

  registry.clinicIds.add(clinicId);

  return appointment;
};

export const createMessageFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<MessageFixture> = {},
): Promise<MessageFixture> => {
  const appointmentId = overrides.appointment_id ?? (await createAppointmentFixture(registry, clinicId)).appointment_id;
  const message = await queryOne<MessageFixture>(
    `
      INSERT INTO messages (
        clinic_id,
        appointment_id,
        channel_type,
        message_subject,
        message_body,
        message_status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        message_id,
        clinic_id,
        appointment_id,
        channel_type,
        message_subject,
        message_body,
        message_status;
    `,
    [
      clinicId,
      appointmentId,
      overrides.channel_type ?? "Email",
      overrides.message_subject ?? buildUniqueValue("subject"),
      overrides.message_body ?? buildUniqueValue("body"),
      overrides.message_status ?? "În coadă",
    ],
  );

  if (message === null) {
    throw new Error("Nu s-a putut crea mesajul de test.");
  }

  registry.clinicIds.add(clinicId);

  return message;
};

export const createFollowUpFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<FollowUpFixture> = {},
): Promise<FollowUpFixture> => {
  const appointmentId = overrides.appointment_id ?? (await createAppointmentFixture(registry, clinicId)).appointment_id;
  const followUp = await queryOne<FollowUpFixture>(
    `
      INSERT INTO follow_ups (
        clinic_id,
        appointment_id,
        follow_up_status,
        scheduled_for,
        follow_up_notes
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING
        follow_up_id,
        clinic_id,
        appointment_id,
        follow_up_status,
        scheduled_for,
        follow_up_notes;
    `,
    [
      clinicId,
      appointmentId,
      overrides.follow_up_status ?? "Mesaj trimis",
      overrides.scheduled_for ?? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      overrides.follow_up_notes ?? null,
    ],
  );

  if (followUp === null) {
    throw new Error("Nu s-a putut crea follow-up-ul de test.");
  }

  registry.clinicIds.add(clinicId);

  return followUp;
};

export const createImportFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<ImportFixture> = {},
): Promise<ImportFixture> => {
  const importedByUserId = overrides.imported_by_user_id ?? (await createUserFixture(registry, clinicId)).user_id;
  const importRow = await queryOne<ImportFixture>(
    `
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
      ) VALUES ($1, $2, $3, $4, $5, 0, 0, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING import_id, clinic_id, imported_by_user_id, file_name, file_type, import_status;
    `,
    [
      clinicId,
      importedByUserId,
      overrides.file_name ?? `${buildUniqueValue("import")}.csv`,
      overrides.file_type ?? "csv",
      overrides.import_status ?? "success",
    ],
  );

  if (importRow === null) {
    throw new Error("Nu s-a putut crea importul de test.");
  }

  registry.clinicIds.add(clinicId);

  return importRow;
};

export const createMessageTemplateFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<MessageTemplateFixture> = {},
): Promise<MessageTemplateFixture> => {
  const template = await queryOne<MessageTemplateFixture>(
    `
      INSERT INTO message_templates (
        clinic_id,
        template_name,
        channel_type,
        message_subject,
        message_body
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING template_id, clinic_id, template_name, channel_type, message_subject, message_body;
    `,
    [
      clinicId,
      overrides.template_name ?? buildUniqueValue("template"),
      overrides.channel_type ?? "Email",
      overrides.message_subject ?? buildUniqueValue("template-subject"),
      overrides.message_body ?? buildUniqueValue("template-body"),
    ],
  );

  if (template === null) {
    throw new Error("Nu s-a putut crea template-ul de test.");
  }

  registry.clinicIds.add(clinicId);

  return template;
};

export const createResponseFixture = async (
  registry: CleanupRegistry,
  clinicId: number,
  overrides: Partial<ResponseFixture> = {},
): Promise<ResponseFixture> => {
  const messageId = overrides.message_id ?? (await createMessageFixture(registry, clinicId)).message_id;
  const response = await queryOne<ResponseFixture>(
    `
      INSERT INTO responses (
        clinic_id,
        message_id,
        response_status,
        response_text
      ) VALUES ($1, $2, $3, $4)
      RETURNING response_id, clinic_id, message_id, response_status, response_text;
    `,
    [
      clinicId,
      messageId,
      overrides.response_status ?? "Răspuns DA",
      overrides.response_text ?? buildUniqueValue("response"),
    ],
  );

  if (response === null) {
    throw new Error("Nu s-a putut crea răspunsul de test.");
  }

  registry.clinicIds.add(clinicId);

  return response;
};