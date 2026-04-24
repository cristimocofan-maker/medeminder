import type { DoctorListItem } from "../doctors.types";
import type { DoctorServiceOverrideRecord } from "./doctor-services.store";
import type { SpecializationService } from "../../specializations/specializations.types";

export interface ResolvedDoctorService {
  description?: string;
  doctor_id: number;
  duration_minutes?: number;
  id: number | string;
  is_active: boolean;
  name: string;
  price: number;
  service_id?: number;
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
      .map((override) => [override.service_id as number, override]),
  );

  const resolvedServices: ResolvedDoctorService[] = specializationServices.map((service) => {
    const override = overrideMap.get(service.service_id);

    if (override === undefined || (override.use_default && override.is_active === undefined)) {
      return {
        id: service.service_id,
        doctor_id: doctor.doctor_id,
        specialization_id: service.specialization_id,
        service_id: service.service_id,
        name: service.service_name,
        price: service.price,
        duration_minutes: service.duration_minutes,
        description: service.description,
        is_active: override?.is_active ?? service.is_active,
        source: "default",
      };
    }

    return {
      id: service.service_id,
      doctor_id: doctor.doctor_id,
      specialization_id: service.specialization_id,
      service_id: service.service_id,
      name: override.custom_name ?? service.service_name,
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