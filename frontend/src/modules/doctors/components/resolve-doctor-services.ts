import type { DoctorListItem } from "../doctors.types";
import type { DoctorServiceOverrideRecord } from "./doctor-services.store";
import type { SpecializationService } from "../../specializations/components/specialization-services.store";

export interface ResolvedDoctorService {
  description?: string;
  doctor_id: number;
  duration_minutes?: number;
  id: string;
  is_active: boolean;
  name: string;
  price: number;
  service_id?: string;
  source: "default" | "override" | "exclusive";
  specialization_id: number;
}

export const resolveDoctorServices = (
  doctor: Pick<DoctorListItem, "doctor_id" | "specialization_id">,
  specializationServices: SpecializationService[],
  doctorOverrides: DoctorServiceOverrideRecord[],
): ResolvedDoctorService[] => {
  const overrideMap = new Map(
    doctorOverrides
      .filter((override) => override.service_id !== undefined)
      .map((override) => [override.service_id as string, override]),
  );

  const resolvedServices: ResolvedDoctorService[] = specializationServices.map((service) => {
    const override = overrideMap.get(service.id);

    if (override === undefined || override.use_default) {
      return {
        id: service.id,
        doctor_id: doctor.doctor_id,
        specialization_id: service.specialization_id,
        service_id: service.id,
        name: service.name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        description: service.description,
        is_active: service.is_active,
        source: "default",
      };
    }

    return {
      id: service.id,
      doctor_id: doctor.doctor_id,
      specialization_id: service.specialization_id,
      service_id: service.id,
      name: override.custom_name ?? service.name,
      price: override.custom_price ?? service.price,
      duration_minutes: override.custom_duration_minutes ?? service.duration_minutes,
      description: service.description,
      is_active: override.is_active ?? service.is_active,
      source: "override",
    };
  });

  const exclusiveServices = doctorOverrides
    .filter((override) => override.service_id === undefined && override.use_default === false)
    .map((override) => ({
      id: override.id,
      doctor_id: doctor.doctor_id,
      specialization_id: doctor.specialization_id,
      service_id: undefined,
      name: override.custom_name ?? "Serviciu exclusiv",
      price: override.custom_price ?? 0,
      duration_minutes: override.custom_duration_minutes,
      description: undefined,
      is_active: override.is_active ?? true,
      source: "exclusive" as const,
    }));

  return [...resolvedServices, ...exclusiveServices]
    .filter((service) => service.is_active)
    .sort((leftService, rightService) => {
      const leftLabel = leftService.name.toLocaleLowerCase();
      const rightLabel = rightService.name.toLocaleLowerCase();

      return leftLabel.localeCompare(rightLabel, "ro", {
        sensitivity: "base",
      });
    });
};