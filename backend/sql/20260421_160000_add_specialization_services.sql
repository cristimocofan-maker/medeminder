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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT specialization_services_price_check CHECK (price >= 0),
  CONSTRAINT specialization_services_duration_check CHECK (duration_minutes IS NULL OR duration_minutes > 0)
);

CREATE INDEX IF NOT EXISTS specialization_services_specialization_idx
  ON specialization_services (clinic_id, specialization_id);
