import { useCallback, useEffect, useState } from "react";

export interface SpecializationService {
  id: string;
  specialization_id: number;
  name: string;
  price: number;
  duration_minutes?: number;
  description?: string;
  is_active: boolean;
}

type ServicesRegistry = Record<string, SpecializationService[]>;

type RegistryUpdater = ServicesRegistry | ((currentRegistry: ServicesRegistry) => ServicesRegistry);

const storageKey = "medreminder.specialization-services";
const storageEventName = "medreminder-specialization-services-change";

const sanitizeService = (value: unknown): SpecializationService | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<SpecializationService>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.specialization_id !== "number" ||
    !Number.isInteger(candidate.specialization_id) ||
    candidate.specialization_id <= 0 ||
    typeof candidate.name !== "string" ||
    candidate.name.trim() === "" ||
    typeof candidate.price !== "number" ||
    Number.isNaN(candidate.price) ||
    typeof candidate.is_active !== "boolean"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    specialization_id: candidate.specialization_id,
    name: candidate.name.trim(),
    price: candidate.price,
    duration_minutes:
      typeof candidate.duration_minutes === "number" && Number.isFinite(candidate.duration_minutes)
        ? candidate.duration_minutes
        : undefined,
    description: typeof candidate.description === "string" && candidate.description.trim() !== ""
      ? candidate.description.trim()
      : undefined,
    is_active: candidate.is_active,
  };
};

const sortServices = (services: SpecializationService[]): SpecializationService[] => {
  return [...services].sort((leftService, rightService) => {
    if (leftService.is_active !== rightService.is_active) {
      return leftService.is_active ? -1 : 1;
    }

    return leftService.name.localeCompare(rightService.name, "ro", {
      sensitivity: "base",
    });
  });
};

const readRegistry = (): ServicesRegistry => {
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
        const services = Array.isArray(registryValue)
          ? registryValue.map((service) => sanitizeService(service)).filter((service): service is SpecializationService => service !== null)
          : [];

        return [registryKey, sortServices(services)];
      }),
    );
  } catch {
    return {};
  }
};

const writeRegistry = (registry: ServicesRegistry): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(registry));
  window.dispatchEvent(new CustomEvent(storageEventName));
};

const buildRegistryKey = (specializationId: number): string => String(specializationId);

const buildServiceId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `service-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
};

export const buildEmptySpecializationService = (specializationId: number): SpecializationService => ({
  id: buildServiceId(),
  specialization_id: specializationId,
  name: "",
  price: 0,
  duration_minutes: undefined,
  description: undefined,
  is_active: true,
});

export const useSpecializationServicesRegistry = () => {
  const [registry, setRegistry] = useState<ServicesRegistry>(() => readRegistry());

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

  const getServices = useCallback(
    (specializationId: number): SpecializationService[] => {
      return registry[buildRegistryKey(specializationId)] ?? [];
    },
    [registry],
  );

  const upsertService = useCallback(
    (service: SpecializationService): void => {
      updateRegistry((currentRegistry) => {
        const registryKey = buildRegistryKey(service.specialization_id);
        const currentServices = currentRegistry[registryKey] ?? [];
        const existingIndex = currentServices.findIndex((currentService) => currentService.id === service.id);
        const nextServices = [...currentServices];

        if (existingIndex >= 0) {
          nextServices[existingIndex] = service;
        } else {
          nextServices.push(service);
        }

        return {
          ...currentRegistry,
          [registryKey]: sortServices(nextServices),
        };
      });
    },
    [updateRegistry],
  );

  const deleteService = useCallback(
    (specializationId: number, serviceId: string): void => {
      updateRegistry((currentRegistry) => {
        const registryKey = buildRegistryKey(specializationId);
        const currentServices = currentRegistry[registryKey] ?? [];

        return {
          ...currentRegistry,
          [registryKey]: currentServices.filter((service) => service.id !== serviceId),
        };
      });
    },
    [updateRegistry],
  );

  return {
    getServices,
    upsertService,
    deleteService,
  };
};