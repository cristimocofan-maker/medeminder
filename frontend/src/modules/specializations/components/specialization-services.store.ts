import type { SpecializationServiceMutationPayload } from "../specializations.types";

export const buildEmptySpecializationService = (_specializationId: number): SpecializationServiceMutationPayload => ({
  service_name: "",
  price: 0,
  duration_minutes: undefined,
  description: undefined,
  is_active: true,
});