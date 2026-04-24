import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { DoctorListItem } from "../../doctors/doctors.types";
import { useDoctorServiceOverridesRegistry } from "../../doctors/components/doctor-services.store";
import { resolveDoctorServices } from "../../doctors/components/resolve-doctor-services";
import { listSpecializationServices } from "../../specializations/specializations.api";
import { getSpecializationTheme } from "../../specializations/components/specialization-theme";

interface AppointmentServicesSelectorProps {
  compact?: boolean;
  doctor: DoctorListItem | null;
  slotDurationMinutes: number | null;
  subtitle?: string;
  title?: string;
}

const formatPrice = (price: number): string => {
  return `${new Intl.NumberFormat("ro-RO").format(price)} lei`;
};

export const AppointmentServicesSelector = ({
  compact = false,
  doctor,
  slotDurationMinutes,
  subtitle = "Serviciile afișate sunt cele efective pentru medicul selectat, după aplicarea override-urilor locale.",
  title = "Servicii medicale",
}: AppointmentServicesSelectorProps): JSX.Element => {
  const { getOverrides } = useDoctorServiceOverridesRegistry();
  const [searchValue, setSearchValue] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<Array<number | string>>([]);
  const theme = getSpecializationTheme(doctor?.specialization_display_name ?? null);
  const specializationServicesQuery = useQuery({
    queryKey: ["specialization-services", doctor?.specialization_id],
    queryFn: async () => listSpecializationServices(doctor!.specialization_id),
    enabled: doctor !== null,
  });

  const resolvedServices = useMemo(() => {
    if (doctor === null) {
      return [];
    }

    return resolveDoctorServices(doctor, specializationServicesQuery.data ?? [], getOverrides(doctor.doctor_id));
  }, [doctor, getOverrides, specializationServicesQuery.data]);

  const selectedServices = useMemo(
    () => resolvedServices.filter((service) => selectedServiceIds.includes(service.id)),
    [resolvedServices, selectedServiceIds],
  );

  const normalizedSearchValue = searchValue.trim().toLocaleLowerCase("ro-RO");
  const filteredServices = useMemo(() => {
    if (normalizedSearchValue === "") {
      return resolvedServices;
    }

    return resolvedServices.filter((service) => service.name.toLocaleLowerCase("ro-RO").includes(normalizedSearchValue));
  }, [normalizedSearchValue, resolvedServices]);

  const totalPrice = selectedServices.reduce((total, service) => total + service.price, 0);
  const totalDurationMinutes = selectedServices.reduce((total, service) => total + (service.duration_minutes ?? 0), 0);
  const exceedsSlotDuration = slotDurationMinutes !== null && totalDurationMinutes > slotDurationMinutes;

  const toggleService = (serviceId: number | string): void => {
    setSelectedServiceIds((currentValue) => {
      if (currentValue.includes(serviceId)) {
        return currentValue.filter((currentServiceId) => currentServiceId !== serviceId);
      }

      return [...currentValue, serviceId];
    });
  };

  return (
    <section className={`rounded-[32px] border ${theme.borderClassName} ${theme.surfaceClassName} ${compact ? "h-full p-4" : "p-5 md:p-6"}`}>
      <div>
        <h3 className={`${compact ? "text-lg" : "mt-4 text-xl"} font-semibold text-ink`}>{title}</h3>
        {compact ? null : <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>

      {doctor === null ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
          Alege medicul pentru a vedea serviciile efective disponibile.
        </div>
      ) : resolvedServices.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
          Nu există servicii active disponibile pentru medicul selectat.
        </div>
      ) : (
        <>
          <div className="mt-4">
            <label className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500" htmlFor={`appointment-services-search-${compact ? "compact" : "default"}`}>
              Căutare servicii
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className={`input-base pl-11 ${compact ? "min-h-11 py-2.5 text-sm" : ""}`}
                id={`appointment-services-search-${compact ? "compact" : "default"}`}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Caută după nume serviciu"
                value={searchValue}
              />
            </div>
          </div>

          <div className={`mt-4 ${compact ? "max-h-[252px] overflow-y-auto pr-1" : "max-h-[360px] overflow-y-auto pr-1"}`}>
            <div className="space-y-2">
              {filteredServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                const compactRowClassName = isSelected
                  ? "border-slate-500 bg-slate-200 text-ink shadow-sm ring-1 ring-slate-300"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";

                return (
                  <button
                    className={`w-full border text-left transition ${compact ? "rounded-[20px] px-3 py-2" : "rounded-[24px] px-4 py-3"} ${compact ? compactRowClassName : isSelected ? theme.selectedChipClassName : theme.idleChipClassName}`}
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    type="button"
                  >
                    <div className={`grid items-center gap-2 ${compact ? "grid-cols-[minmax(0,1fr)_72px_52px_68px]" : "grid-cols-[minmax(0,1fr)_88px_64px_84px]"}`}>
                      <span className={`truncate font-semibold ${compact ? "text-[13px] leading-5" : "text-sm"}`}>{service.name}</span>
                      <span className={`text-right font-semibold text-slate-500 ${compact ? "text-[11px]" : "text-xs"}`}>{formatPrice(service.price)}</span>
                      <span className={`text-right font-semibold text-slate-500 ${compact ? "text-[11px]" : "text-xs"}`}>
                        {service.duration_minutes !== undefined ? `${service.duration_minutes} min` : "-"}
                      </span>
                      <span className={`inline-flex w-full items-center justify-center rounded-full font-semibold ${compact ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"} ${isSelected ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                        {isSelected ? "Selectat" : "Alege"}
                      </span>
                    </div>
                  </button>
                );
              })}

              {filteredServices.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
                  Nu există servicii care corespund căutării curente.
                </div>
              ) : null}
            </div>
          </div>

          <div className={`mt-4 rounded-3xl border ${theme.softPanelClassName} ${compact ? "p-3" : "p-4"}`}>
            <div className={`grid gap-3 ${compact ? "md:grid-cols-3" : "xl:grid-cols-[minmax(0,1fr)_280px]"}`}>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Selecție curentă</p>
                {selectedServices.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Selectează unul sau mai multe servicii pentru această programare.</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedServices.map((service) => (
                      <button
                        className={`rounded-full ${compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"} font-semibold ${theme.badgeClassName}`}
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        type="button"
                      >
                        {service.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={`grid gap-2 ${compact ? "md:col-span-2 md:grid-cols-3" : "grid-cols-3"}`}>
                <div className={`rounded-3xl bg-white/90 ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
                  <p className="text-sm text-slate-500">Total servicii</p>
                  <p className={`${compact ? "mt-1 text-xl" : "mt-1 text-2xl"} font-semibold text-ink`}>{selectedServices.length}</p>
                </div>
                <div className={`rounded-3xl bg-white/90 ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
                  <p className="text-sm text-slate-500">Total lei</p>
                  <p className={`${compact ? "mt-1 text-xl" : "mt-1 text-2xl"} font-semibold text-ink`}>{formatPrice(totalPrice)}</p>
                </div>
                <div className={`rounded-3xl bg-white/90 ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
                  <p className="text-sm text-slate-500">Durată</p>
                  <p className={`${compact ? "mt-1 text-xl" : "mt-1 text-2xl"} font-semibold text-ink`}>{totalDurationMinutes} min</p>
                </div>
              </div>
            </div>
            {exceedsSlotDuration ? (
              <div className="mt-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Durata serviciilor selectate depășește slotul ales. Poți continua, dar verifică manual planificarea.
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
};