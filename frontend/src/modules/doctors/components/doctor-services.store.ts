import { useCallback, useEffect, useState } from "react";

export interface DoctorServiceOverride {
  doctor_id: number;
  service_id?: string;
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
type RegistryUpdater = OverridesRegistry | ((currentRegistry: OverridesRegistry) => OverridesRegistry);

const storageKey = "medreminder.doctor-service-overrides";
const storageEventName = "medreminder-doctor-service-overrides-change";

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
    service_id: typeof candidate.service_id === "string" && candidate.service_id.trim() !== "" ? candidate.service_id : undefined,
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

    const leftLabel = leftOverride.custom_name ?? leftOverride.service_id ?? "";
    const rightLabel = rightOverride.custom_name ?? rightOverride.service_id ?? "";

    return leftLabel.localeCompare(rightLabel, "ro", {
      sensitivity: "base",
    });
  });
};

const readRegistry = (): OverridesRegistry => {
  if (typeof window === "undefined") {
    return {};
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (rawValue === null) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsedValue).map(([registryKey, registryValue]) => {
        const overrides = Array.isArray(registryValue)
          ? registryValue
              .map((overrideValue) => sanitizeOverride(overrideValue))
              .filter((overrideValue): overrideValue is DoctorServiceOverrideRecord => overrideValue !== null)
          : [];

        return [registryKey, sortOverrides(overrides)];
      }),
    );
  } catch {
    return {};
  }
};

const writeRegistry = (registry: OverridesRegistry): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(registry));
  window.dispatchEvent(new CustomEvent(storageEventName));
};

const buildRegistryKey = (doctorId: number): string => String(doctorId);

export const buildDoctorServiceOverrideId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `doctor-service-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

export const useDoctorServiceOverridesRegistry = () => {
  const [registry, setRegistry] = useState<OverridesRegistry>(() => readRegistry());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncRegistry = (): void => {
      setRegistry(readRegistry());
    };

    window.addEventListener("storage", syncRegistry);
    window.addEventListener(storageEventName, syncRegistry);

    return () => {
      window.removeEventListener("storage", syncRegistry);
      window.removeEventListener(storageEventName, syncRegistry);
    };
  }, []);

  const updateRegistry = useCallback((updater: RegistryUpdater) => {
    setRegistry((currentRegistry) => {
      const nextRegistry = typeof updater === "function" ? updater(currentRegistry) : updater;
      writeRegistry(nextRegistry);

      return nextRegistry;
    });
  }, []);

  const getOverrides = useCallback(
    (doctorId: number): DoctorServiceOverrideRecord[] => {
      return registry[buildRegistryKey(doctorId)] ?? [];
    },
    [registry],
  );

  const upsertOverride = useCallback(
    (override: DoctorServiceOverrideRecord): void => {
      updateRegistry((currentRegistry) => {
        const registryKey = buildRegistryKey(override.doctor_id);
        const currentOverrides = currentRegistry[registryKey] ?? [];
        const existingIndex = currentOverrides.findIndex((currentOverride) => currentOverride.id === override.id);
        const nextOverrides = [...currentOverrides];

        if (existingIndex >= 0) {
          nextOverrides[existingIndex] = override;
        } else {
          nextOverrides.push(override);
        }

        return {
          ...currentRegistry,
          [registryKey]: sortOverrides(nextOverrides),
        };
      });
    },
    [updateRegistry],
  );

  const deleteOverride = useCallback(
    (doctorId: number, overrideId: string): void => {
      updateRegistry((currentRegistry) => {
        const registryKey = buildRegistryKey(doctorId);
        const currentOverrides = currentRegistry[registryKey] ?? [];

        return {
          ...currentRegistry,
          [registryKey]: currentOverrides.filter((override) => override.id !== overrideId),
        };
      });
    },
    [updateRegistry],
  );

  return {
    getOverrides,
    upsertOverride,
    deleteOverride,
  };
};