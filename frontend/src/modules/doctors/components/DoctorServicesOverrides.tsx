import { useQuery } from "@tanstack/react-query";
import { PenLine, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { DoctorListItem } from "../doctors.types";
import { listSpecializationServices } from "../../specializations/specializations.api";
import { getSpecializationTheme } from "../../specializations/components/specialization-theme";
import {
  buildDoctorServiceOverrideId,
  type DoctorServiceOverrideRecord,
  useDoctorServiceOverridesRegistry,
} from "./doctor-services.store";
import { resolveDoctorServices } from "./resolve-doctor-services";

interface DoctorServicesOverridesProps {
  canSave: boolean;
  doctor: Pick<DoctorListItem, "doctor_display_name" | "doctor_id" | "specialization_id">;
  formId: string;
  isSaving: boolean;
  specializationName: string;
}

const formatPrice = (price: number): string => {
  return `${new Intl.NumberFormat("ro-RO").format(price)} lei`;
};

const buildExclusiveDraft = (doctorId: number): DoctorServiceOverrideRecord => ({
  id: buildDoctorServiceOverrideId(),
  doctor_id: doctorId,
  use_default: false,
  custom_name: "",
  custom_price: 0,
  custom_duration_minutes: undefined,
  is_active: true,
});

const resolveServiceAvailability = (
  service: { is_active: boolean },
  override?: DoctorServiceOverrideRecord,
): boolean => {
  if (override === undefined) {
    return service.is_active;
  }

  if (override.use_default && override.is_active === undefined) {
    return service.is_active;
  }

  return override.is_active ?? service.is_active;
};

export const DoctorServicesOverrides = ({ canSave, doctor, formId, isSaving, specializationName }: DoctorServicesOverridesProps): JSX.Element => {
  const overlayRoot = typeof document === "undefined" ? null : document.body;
  const theme = getSpecializationTheme(specializationName);
  const { deleteOverride, getOverrides, upsertOverride } = useDoctorServiceOverridesRegistry();
  const specializationServicesQuery = useQuery({
    queryKey: ["specialization-services", doctor.specialization_id],
    queryFn: async () => listSpecializationServices(doctor.specialization_id),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [exclusiveDraft, setExclusiveDraft] = useState<DoctorServiceOverrideRecord>(buildExclusiveDraft(doctor.doctor_id));

  useEffect(() => {
    if (!isModalOpen) {
      setIsModalVisible(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsModalVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isModalOpen]);

  const specializationServices = specializationServicesQuery.data ?? [];
  const overrides = useMemo(() => getOverrides(doctor.doctor_id), [doctor.doctor_id, getOverrides]);
  const resolvedServices = useMemo(() => resolveDoctorServices(doctor, specializationServices, overrides), [doctor, overrides, specializationServices]);

  const inheritedOverrides = useMemo(
    () => overrides.filter((override) => override.service_id !== undefined),
    [overrides],
  );
  const exclusiveOverrides = useMemo(
    () => overrides.filter((override) => override.service_id === undefined),
    [overrides],
  );

  const updateDefaultOverride = (serviceId: number, nextPartial: Partial<DoctorServiceOverrideRecord>): void => {
    const currentOverride = inheritedOverrides.find((override) => override.service_id === serviceId);

    upsertOverride({
      id: currentOverride?.id ?? buildDoctorServiceOverrideId(),
      doctor_id: doctor.doctor_id,
      service_id: serviceId,
      use_default: currentOverride?.use_default ?? false,
      custom_name: currentOverride?.custom_name,
      custom_price: currentOverride?.custom_price,
      custom_duration_minutes: currentOverride?.custom_duration_minutes,
      is_active: currentOverride?.is_active,
      ...nextPartial,
    });
  };

  return (
    <section className={`rounded-[28px] border ${theme.borderClassName} ${theme.surfaceClassName} p-4 md:p-5`}>
      <div className="flex justify-end">
        <button
          className="button-primary gap-2 whitespace-nowrap px-4 py-2 text-sm"
          onClick={() => {
            setExclusiveDraft(buildExclusiveDraft(doctor.doctor_id));
            setIsModalOpen(true);
          }}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Adaugă serviciu exclusiv pentru acest medic
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Servicii moștenite din specializare</p>
        </div>

        <div className="hidden rounded-[20px] border border-slate-200/80 bg-white/70 px-4 py-2.5 xl:grid xl:grid-cols-[minmax(0,1fr)_160px_124px_112px_auto] xl:items-center xl:gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Serviciu</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Preț</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Durată</span>
          <span className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Prestează</span>
          <span className="text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Configurare</span>
        </div>

        {specializationServices.map((service) => {
          const override = inheritedOverrides.find((currentOverride) => currentOverride.service_id === service.service_id);
          const usesDefault = override === undefined || override.use_default;
          const isPerformedByDoctor = resolveServiceAvailability(service, override);
          const hasCustomConfiguration = override !== undefined && override.use_default === false;
          const resolvedService = resolvedServices.find((currentService) => currentService.service_id === service.service_id);

          return (
            <div className={`rounded-[26px] border border-white/80 px-4 py-3 shadow-sm transition ${isPerformedByDoctor ? "bg-white/85" : "bg-slate-50/95"}`} key={service.service_id}>
              <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_160px_124px_112px_auto] xl:items-center">
                <div className="min-w-0">
                  <p className={`text-[15px] font-semibold ${isPerformedByDoctor ? "text-ink" : "text-slate-500"}`}>{service.service_name}</p>
                  {service.description !== undefined ? <p className="mt-1 text-xs text-slate-500">{service.description}</p> : null}
                </div>

                <div className="flex flex-col gap-1 xl:items-start">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${theme.badgeClassName}`}>
                    implicit {formatPrice(service.price)}
                  </span>
                </div>

                <div className="flex flex-col gap-1 xl:items-start">
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${theme.subtleBadgeClassName}`}>
                    {service.duration_minutes !== undefined ? `${service.duration_minutes} min` : "durată liberă"}
                  </span>
                </div>

                <div className="flex items-center gap-2 xl:justify-center">
                  <button
                    aria-label={isPerformedByDoctor ? "Medicul prestează serviciul" : "Medicul nu prestează serviciul"}
                    className={`relative inline-flex h-8 w-[50px] items-center rounded-full border transition ${isPerformedByDoctor ? "border-primary/40 bg-primarySoft" : "border-slate-200 bg-slate-100"}`}
                    onClick={() => updateDefaultOverride(service.service_id, {
                      use_default: override?.use_default ?? true,
                      custom_name: override?.custom_name,
                      custom_price: override?.custom_price,
                      custom_duration_minutes: override?.custom_duration_minutes,
                      is_active: !isPerformedByDoctor,
                    })}
                    type="button"
                  >
                    <span className={`absolute left-1 h-6 w-6 rounded-full shadow-sm transition ${isPerformedByDoctor ? "translate-x-[18px] bg-primary" : "translate-x-0 bg-slate-400"}`} />
                  </button>
                  <span className={`text-xs font-semibold ${isPerformedByDoctor ? "text-primary" : "text-slate-500"}`}>
                    {isPerformedByDoctor ? "Da" : "Nu"}
                  </span>
                </div>

                <div className="flex xl:justify-end">
                  <button
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition xl:self-center ${hasCustomConfiguration ? theme.idleChipClassName : theme.selectedChipClassName}`}
                    onClick={() => {
                      if (usesDefault) {
                        updateDefaultOverride(service.service_id, {
                          use_default: false,
                          custom_name: undefined,
                          custom_price: service.price,
                          custom_duration_minutes: service.duration_minutes,
                          is_active: override?.is_active ?? service.is_active,
                        });
                        return;
                      }

                      updateDefaultOverride(service.service_id, {
                        use_default: true,
                        custom_name: undefined,
                        custom_price: undefined,
                        custom_duration_minutes: undefined,
                        is_active: undefined,
                      });
                    }}
                    type="button"
                  >
                    {hasCustomConfiguration ? "Revino la implicit" : "Setează pentru medic"}
                  </button>
                </div>
              </div>

              {hasCustomConfiguration && override !== undefined ? (
                <div className={`mt-3 grid gap-3 rounded-[24px] border ${theme.softPanelClassName} p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_160px_124px_112px_auto] xl:items-end`}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`doctor-service-name-${override.id}`}>
                      Nume serviciu
                    </label>
                    <input
                      className="input-base"
                      id={`doctor-service-name-${override.id}`}
                      onChange={(event) => updateDefaultOverride(service.service_id, { custom_name: event.target.value, use_default: false })}
                      value={override.custom_name ?? service.service_name}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`doctor-service-price-${override.id}`}>
                      Preț personalizat
                    </label>
                    <input
                      className="input-base"
                      id={`doctor-service-price-${override.id}`}
                      inputMode="decimal"
                      onChange={(event) => updateDefaultOverride(service.service_id, { custom_price: Number(event.target.value.replace(/,/g, ".")) || 0, use_default: false })}
                      value={String(override.custom_price ?? service.price)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`doctor-service-duration-${override.id}`}>
                      Durată
                    </label>
                    <input
                      className="input-base"
                      id={`doctor-service-duration-${override.id}`}
                      inputMode="numeric"
                      onChange={(event) => {
                        const nextValue = event.target.value.trim();
                        updateDefaultOverride(service.service_id, {
                          custom_duration_minutes: nextValue === "" ? undefined : Number(nextValue),
                          use_default: false,
                        });
                      }}
                      value={String(override.custom_duration_minutes ?? service.duration_minutes ?? "")}
                    />
                  </div>

                  <div className="hidden xl:block" />
                  <div className="flex items-end justify-start xl:justify-end">
                    <button
                      className="button-secondary min-h-10 rounded-full px-4 py-2 text-sm"
                      onClick={() => updateDefaultOverride(service.service_id, {
                        use_default: true,
                        custom_name: undefined,
                        custom_price: undefined,
                        custom_duration_minutes: undefined,
                        is_active: override.is_active,
                      })}
                      type="button"
                    >
                      Anulează personalizarea
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {exclusiveOverrides.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Servicii exclusive</p>
            {exclusiveOverrides.map((override) => (
              <div className="rounded-3xl border border-white/80 bg-white/85 p-4 shadow-sm" key={override.id}>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_160px_124px_112px_auto] xl:items-center">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink">{override.custom_name ?? "Serviciu exclusiv"}</p>
                  </div>

                  <div className="flex xl:justify-start">
                    <span className={`rounded-full px-3 py-1 font-semibold ${theme.badgeClassName}`}>{formatPrice(override.custom_price ?? 0)}</span>
                  </div>

                  <div className="flex xl:justify-start">
                    {override.custom_duration_minutes !== undefined ? (
                      <span className={`rounded-full px-3 py-1 font-semibold ${theme.subtleBadgeClassName}`}>{override.custom_duration_minutes} min</span>
                    ) : null}
                  </div>

                  <div className="hidden xl:block" />

                  <div className="flex shrink-0 gap-2 self-end md:self-auto xl:justify-end">
                    <button className="button-secondary min-h-10 px-3 py-2 text-sm" onClick={() => {
                      setExclusiveDraft(override);
                      setIsModalOpen(true);
                    }} type="button">
                      <PenLine className="h-4 w-4" />
                    </button>
                    <button className="button-secondary min-h-10 px-3 py-2 text-sm text-danger" onClick={() => deleteOverride(doctor.doctor_id, override.id)} type="button">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <button className="button-primary gap-2" disabled={!canSave} form={formId} type="submit">
            {isSaving ? "Salvăm..." : "Salvează modificările"}
            <Save className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isModalOpen && overlayRoot !== null ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-[6px]">
          <div className={`w-full max-w-2xl rounded-[34px] border ${theme.borderClassName} bg-white shadow-2xl transition-all duration-300 ${isModalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}>
            <div className="flex items-start justify-between gap-4 px-6 py-6 md:px-7">
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${theme.badgeClassName}`}>
                  Serviciu exclusiv
                </span>
                <h3 className="mt-3 text-2xl font-semibold text-ink">{doctor.doctor_display_name}</h3>
              </div>
              <button className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-ink" onClick={() => setIsModalOpen(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 px-6 pb-6 md:px-7">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`exclusive-name-${doctor.doctor_id}`}>
                  Nume serviciu
                </label>
                <input
                  className="input-base"
                  id={`exclusive-name-${doctor.doctor_id}`}
                  onChange={(event) => setExclusiveDraft((currentValue) => ({ ...currentValue, custom_name: event.target.value, use_default: false }))}
                  value={exclusiveDraft.custom_name ?? ""}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`exclusive-price-${doctor.doctor_id}`}>
                    Preț
                  </label>
                  <input
                    className="input-base"
                    id={`exclusive-price-${doctor.doctor_id}`}
                    inputMode="decimal"
                    onChange={(event) => setExclusiveDraft((currentValue) => ({
                      ...currentValue,
                      custom_price: Number(event.target.value.replace(/,/g, ".")) || 0,
                    }))}
                    value={String(exclusiveDraft.custom_price ?? 0)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`exclusive-duration-${doctor.doctor_id}`}>
                    Durată
                  </label>
                  <input
                    className="input-base"
                    id={`exclusive-duration-${doctor.doctor_id}`}
                    inputMode="numeric"
                    onChange={(event) => {
                      const nextValue = event.target.value.trim();
                      setExclusiveDraft((currentValue) => ({
                        ...currentValue,
                        custom_duration_minutes: nextValue === "" ? undefined : Number(nextValue),
                      }));
                    }}
                    value={String(exclusiveDraft.custom_duration_minutes ?? "")}
                  />
                </div>
              </div>

              <div className={`rounded-3xl border ${theme.softPanelClassName} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Activ</p>
                    <p className="mt-1 text-sm text-slate-500">Serviciul apare doar în lista acestui medic.</p>
                  </div>
                  <button
                    className={`relative inline-flex h-10 w-[58px] items-center rounded-full border transition ${(exclusiveDraft.is_active ?? true) ? "border-primary/40 bg-primarySoft" : "border-slate-200 bg-slate-100"}`}
                    onClick={() => setExclusiveDraft((currentValue) => ({ ...currentValue, is_active: !(currentValue.is_active ?? true) }))}
                    type="button"
                  >
                    <span className={`absolute left-1 h-8 w-8 rounded-full shadow-sm transition ${(exclusiveDraft.is_active ?? true) ? "translate-x-[18px] bg-primary" : "translate-x-0 bg-slate-400"}`} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end md:px-7">
              <button className="button-secondary" onClick={() => setIsModalOpen(false)} type="button">
                Renunță
              </button>
              <button
                className="button-primary"
                disabled={(exclusiveDraft.custom_name ?? "").trim() === ""}
                onClick={() => {
                  upsertOverride({
                    ...exclusiveDraft,
                    doctor_id: doctor.doctor_id,
                    service_id: undefined,
                    use_default: false,
                    custom_name: exclusiveDraft.custom_name?.trim() ?? "",
                  });
                  setIsModalOpen(false);
                }}
                type="button"
              >
                Salvează serviciul
              </button>
            </div>
          </div>
        </div>,
        overlayRoot,
      ) : null}
    </section>
  );
};