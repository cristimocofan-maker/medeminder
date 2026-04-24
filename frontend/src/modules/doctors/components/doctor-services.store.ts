import { useCallback, useSyncExternalStore } from "react";

export interface DoctorServiceOverride {
  doctor_id: number;
  service_id?: number;
  custom_name?: string;
  custom_price?: number;
  custom_duration_minutes?: number;
  is_active?: boolean;
  use_default: boolean;
}

export interface DoctorServiceOverrideRecord extends DoctorServiceOverride {
  id: string;
}

type OverridesRegistry = Record<string, DoctorServiceOverrideRecord[]>;

let overridesRegistry: OverridesRegistry = {};
const registryListeners = new Set<() => void>();

const emitRegistryChange = (): void => {
  registryListeners.forEach((listener) => listener());
};

const subscribeToRegistry = (listener: () => void): (() => void) => {
  registryListeners.add(listener);

  return () => {
    registryListeners.delete(listener);
  };
};

const getRegistrySnapshot = (): OverridesRegistry => overridesRegistry;

const sanitizeOverride = (value: unknown): DoctorServiceOverrideRecord | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<DoctorServiceOverrideRecord>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.doctor_id !== "number" ||
    !Number.isInteger(candidate.doctor_id) ||
    candidate.doctor_id <= 0 ||
    typeof candidate.use_default !== "boolean"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    doctor_id: candidate.doctor_id,
    service_id: typeof candidate.service_id === "number" && Number.isInteger(candidate.service_id) && candidate.service_id > 0
      ? candidate.service_id
      : undefined,
    custom_name: typeof candidate.custom_name === "string" && candidate.custom_name.trim() !== "" ? candidate.custom_name.trim() : undefined,
    custom_price: typeof candidate.custom_price === "number" && Number.isFinite(candidate.custom_price) ? candidate.custom_price : undefined,
    custom_duration_minutes:
      typeof candidate.custom_duration_minutes === "number" && Number.isFinite(candidate.custom_duration_minutes)
        ? candidate.custom_duration_minutes
        : undefined,
    is_active: typeof candidate.is_active === "boolean" ? candidate.is_active : undefined,
    use_default: candidate.use_default,
  };
};

const sortOverrides = (overrides: DoctorServiceOverrideRecord[]): DoctorServiceOverrideRecord[] => {
  return [...overrides].sort((leftOverride, rightOverride) => {
    if (leftOverride.service_id === undefined && rightOverride.service_id !== undefined) {
      return 1;
    }

    if (leftOverride.service_id !== undefined && rightOverride.service_id === undefined) {
      return -1;
    }

    const leftLabel = leftOverride.custom_name ?? String(leftOverride.service_id ?? "");
    const rightLabel = rightOverride.custom_name ?? String(rightOverride.service_id ?? "");

    return leftLabel.localeCompare(rightLabel, "ro", {
      sensitivity: "base",
    });
  });
};

const buildRegistryKey = (doctorId: number): string => String(doctorId);

export const buildDoctorServiceOverrideId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `doctor-service-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

export const useDoctorServiceOverridesRegistry = () => {
  const registry = useSyncExternalStore(subscribeToRegistry, getRegistrySnapshot, getRegistrySnapshot);

  const getOverrides = useCallback(
    (doctorId: number): DoctorServiceOverrideRecord[] => {
      return registry[buildRegistryKey(doctorId)] ?? [];
    },
    [registry],
  );

  const upsertOverride = useCallback(
    (override: DoctorServiceOverrideRecord): void => {
      const sanitizedOverride = sanitizeOverride(override);

      if (sanitizedOverride === null) {
        return;
      }

      const registryKey = buildRegistryKey(sanitizedOverride.doctor_id);
      const doctorOverrides = overridesRegistry[registryKey] ?? [];
      const existingIndex = doctorOverrides.findIndex((currentOverride) => currentOverride.id === sanitizedOverride.id);
      const nextOverrides = [...doctorOverrides];

      if (existingIndex >= 0) {
        nextOverrides[existingIndex] = sanitizedOverride;
      } else {
        nextOverrides.push(sanitizedOverride);
      }

      overridesRegistry = {
        ...overridesRegistry,
        [registryKey]: sortOverrides(nextOverrides),
      };
      emitRegistryChange();
    },
    [],
  );

  const deleteOverride = useCallback(
    (doctorId: number, overrideId: string): void => {
      const registryKey = buildRegistryKey(doctorId);
      const doctorOverrides = overridesRegistry[registryKey] ?? [];
      const nextOverrides = doctorOverrides.filter((override) => override.id !== overrideId);

      overridesRegistry = nextOverrides.length === 0
        ? Object.fromEntries(Object.entries(overridesRegistry).filter(([key]) => key !== registryKey))
        : {
            ...overridesRegistry,
            [registryKey]: nextOverrides,
          };
      emitRegistryChange();
    },
    [],
  );

  return {
    getOverrides,
    upsertOverride,
    deleteOverride,
  };
};