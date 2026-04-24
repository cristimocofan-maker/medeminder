import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { listDoctors, listSpecializationOptions } from "../../doctors/doctors.api";
import { useDoctorServiceOverridesRegistry } from "../../doctors/components/doctor-services.store";
import { resolveDoctorServices } from "../../doctors/components/resolve-doctor-services";
import type { DoctorListItem, SpecializationOption } from "../../doctors/doctors.types";
import { listSpecializationServices } from "../../specializations/specializations.api";
import { getSpecializationTheme } from "../../specializations/components/specialization-theme";

interface PatientVisitServicesCardProps {
  allowDoctorSelection?: boolean;
  allowSpecializationSelection?: boolean;
  initialDoctorId?: number | null;
  initialSpecializationId?: number | null;
  initialSpecializationName?: string | null;
  subtitle?: string;
  title?: string;
}

interface LocalServiceVisitState {
  finalPrice: number;
  notes: string;
  performed: boolean;
}

const formatPrice = (price: number): string => {
  return `${new Intl.NumberFormat("ro-RO").format(price)} lei`;
};

export const PatientVisitServicesCard = ({
  allowDoctorSelection = false,
  allowSpecializationSelection = false,
  initialDoctorId = null,
  initialSpecializationId = null,
  initialSpecializationName = null,
  subtitle = "Serviciile disponibile sunt rezolvate pentru medicul selectat, iar medicul poate ajusta prețul final și observațiile pe fiecare serviciu.",
  title = "Servicii efectuate",
}: PatientVisitServicesCardProps): JSX.Element => {
  const { getOverrides } = useDoctorServiceOverridesRegistry();
  const specializationsQuery = useQuery({
    queryKey: ["visit-specializations-options"],
    queryFn: listSpecializationOptions,
  });
  const doctorsQuery = useQuery({
    queryKey: ["appointment-doctors-options"],
    queryFn: async () =>
      listDoctors({
        page: 1,
        page_size: 100,
        sort_by: "doctor_id",
        sort_direction: "asc",
      }),
  });

  const specializationOptions = specializationsQuery.data ?? [];
  const allDoctors = useMemo(() => (doctorsQuery.data?.items ?? []).filter((doctor) => doctor.is_active), [doctorsQuery.data?.items]);
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(initialSpecializationId);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(initialDoctorId);
  const [serviceStateById, setServiceStateById] = useState<Record<string, LocalServiceVisitState>>({});

  useEffect(() => {
    if (!allowSpecializationSelection) {
      setSelectedSpecializationId(initialSpecializationId);
    }
  }, [allowSpecializationSelection, initialSpecializationId]);

  useEffect(() => {
    if (!allowDoctorSelection) {
      setSelectedDoctorId(initialDoctorId);
    }
  }, [allowDoctorSelection, initialDoctorId]);

  const filteredDoctors = useMemo(() => {
    if (selectedSpecializationId === null) {
      return allDoctors;
    }

    return allDoctors.filter((doctor) => doctor.specialization_id === selectedSpecializationId);
  }, [allDoctors, selectedSpecializationId]);

  useEffect(() => {
    if (!allowDoctorSelection) {
      return;
    }

    if (filteredDoctors.length === 0) {
      setSelectedDoctorId(null);
      return;
    }

    const doctorStillVisible = selectedDoctorId !== null && filteredDoctors.some((doctor) => doctor.doctor_id === selectedDoctorId);

    if (!doctorStillVisible) {
      setSelectedDoctorId(filteredDoctors[0].doctor_id);
    }
  }, [allowDoctorSelection, filteredDoctors, selectedDoctorId]);

  const selectedDoctor = useMemo(() => {
    if (selectedDoctorId === null) {
      return null;
    }

    return allDoctors.find((doctor) => doctor.doctor_id === selectedDoctorId) ?? null;
  }, [allDoctors, selectedDoctorId]);

  const resolvedSpecializationId = selectedDoctor?.specialization_id ?? selectedSpecializationId;
  const resolvedSpecializationName = useMemo(() => {
    if (selectedDoctor !== null) {
      return selectedDoctor.specialization_display_name;
    }

    if (allowSpecializationSelection) {
      return specializationOptions.find((specialization: SpecializationOption) => specialization.specialization_id === selectedSpecializationId)?.specialization_display_name ?? null;
    }

    return initialSpecializationName;
  }, [allowSpecializationSelection, initialSpecializationName, selectedDoctor, selectedSpecializationId, specializationOptions]);
  const theme = getSpecializationTheme(resolvedSpecializationName);
  const specializationServicesQuery = useQuery({
    queryKey: ["specialization-services", resolvedSpecializationId],
    queryFn: async () => listSpecializationServices(resolvedSpecializationId as number),
    enabled: resolvedSpecializationId !== null,
  });

  const resolvedServices = useMemo(() => {
    if (selectedDoctor === null || resolvedSpecializationId === null) {
      return [];
    }

    return resolveDoctorServices(
      selectedDoctor,
      specializationServicesQuery.data ?? [],
      getOverrides(selectedDoctor.doctor_id),
    );
  }, [getOverrides, resolvedSpecializationId, selectedDoctor, specializationServicesQuery.data]);

  useEffect(() => {
    setServiceStateById((currentValue) => {
      const nextValue: Record<string, LocalServiceVisitState> = {};

      resolvedServices.forEach((service) => {
        const currentState = currentValue[service.id];
        nextValue[service.id] = {
          performed: currentState?.performed ?? false,
          finalPrice: currentState?.finalPrice ?? service.price,
          notes: currentState?.notes ?? "",
        };
      });

      return nextValue;
    });
  }, [resolvedServices]);

  const performedServices = resolvedServices.filter((service) => serviceStateById[service.id]?.performed);
  const subtotalPrice = performedServices.reduce((total, service) => total + service.price, 0);
  const totalPrice = performedServices.reduce((total, service) => total + (serviceStateById[service.id]?.finalPrice ?? service.price), 0);

  return (
    <section className={`rounded-[32px] border ${theme.borderClassName} ${theme.surfaceClassName} p-5 md:p-6`}>
      <div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${theme.badgeClassName}`}>
          Consultația de azi
        </span>
        <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      {allowSpecializationSelection ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-slate-500">Specializare</p>
          <div className="flex flex-wrap gap-2">
            {specializationOptions.map((specialization: SpecializationOption) => (
              <button
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedSpecializationId === specialization.specialization_id ? theme.selectedChipClassName : theme.idleChipClassName}`}
                key={specialization.specialization_id}
                onClick={() => setSelectedSpecializationId(specialization.specialization_id)}
                type="button"
              >
                {specialization.specialization_display_name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {allowDoctorSelection ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-slate-500">Medic</p>
          {filteredDoctors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
              Nu există medici disponibili pentru specializarea selectată.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {filteredDoctors.map((doctor: DoctorListItem) => (
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedDoctorId === doctor.doctor_id ? theme.selectedChipClassName : theme.idleChipClassName}`}
                  key={doctor.doctor_id}
                  onClick={() => setSelectedDoctorId(doctor.doctor_id)}
                  type="button"
                >
                  {doctor.doctor_display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_320px]">
        <div className={`rounded-3xl border ${theme.softPanelClassName} p-4`}>
          {selectedDoctor === null ? (
            <div className="rounded-3xl border border-dashed border-white/70 bg-white/75 px-4 py-6 text-sm text-slate-500">
              Alege medicul pentru a vedea serviciile efective disponibile.
            </div>
          ) : resolvedServices.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/70 bg-white/75 px-4 py-6 text-sm text-slate-500">
              Nu există servicii active disponibile pentru medicul selectat.
            </div>
          ) : (
            <div className="space-y-3">
              {resolvedServices.map((service) => {
                const currentState = serviceStateById[service.id] ?? {
                  performed: false,
                  finalPrice: service.price,
                  notes: "",
                };

                return (
                  <div className="rounded-3xl border border-white/70 bg-white/90 px-4 py-4 shadow-sm" key={service.id}>
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-ink">{service.name}</p>
                          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${theme.badgeClassName}`}>{formatPrice(service.price)}</span>
                          {service.duration_minutes !== undefined ? (
                            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${theme.subtleBadgeClassName}`}>{service.duration_minutes} min</span>
                          ) : null}
                        </div>
                        {service.description !== undefined ? <p className="mt-2 text-sm text-slate-500">{service.description}</p> : null}
                      </div>

                      <button
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${currentState.performed ? theme.selectedChipClassName : theme.idleChipClassName}`}
                        onClick={() => setServiceStateById((currentValue) => ({
                          ...currentValue,
                          [service.id]: {
                            ...currentState,
                            performed: !currentState.performed,
                          },
                        }))}
                        type="button"
                      >
                        {currentState.performed ? "Efectuat" : "Marchează efectuat"}
                      </button>
                    </div>

                    {currentState.performed ? (
                      <div className="mt-4 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 md:grid-cols-[160px_minmax(0,1fr)]">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`service-final-price-${service.id}`}>
                            Preț final
                          </label>
                          <input
                            className="input-base"
                            id={`service-final-price-${service.id}`}
                            inputMode="decimal"
                            onChange={(event) => setServiceStateById((currentValue) => ({
                              ...currentValue,
                              [service.id]: {
                                ...currentState,
                                finalPrice: Number(event.target.value.replace(/,/g, ".")) || 0,
                              },
                            }))}
                            value={String(currentState.finalPrice)}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`service-notes-${service.id}`}>
                            Observații
                          </label>
                          <textarea
                            className="input-base min-h-24 resize-y"
                            id={`service-notes-${service.id}`}
                            onChange={(event) => setServiceStateById((currentValue) => ({
                              ...currentValue,
                              [service.id]: {
                                ...currentState,
                                notes: event.target.value,
                              },
                            }))}
                            value={currentState.notes}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={`rounded-3xl border ${theme.softPanelClassName} p-4`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rezumat financiar</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-3xl bg-white/90 px-4 py-4">
              <p className="text-sm text-slate-500">Servicii efectuate</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{performedServices.length}</p>
            </div>
            <div className="rounded-3xl bg-white/90 px-4 py-4">
              <p className="text-sm text-slate-500">Subtotal</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatPrice(subtotalPrice)}</p>
            </div>
            <div className="rounded-3xl bg-white/90 px-4 py-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatPrice(totalPrice)}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};