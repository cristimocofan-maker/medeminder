import { PenLine, Plus, Power, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buildEmptySpecializationService } from "./specialization-services.store";
import { getSpecializationTheme } from "./specialization-theme";
import type { SpecializationService, SpecializationServiceMutationPayload } from "../specializations.types";

interface SpecializationServicesEditorProps {
  specializationId: number;
  specializationName: string;
  services: SpecializationService[];
  isBusy?: boolean;
  onDeleteService: (serviceId: number) => void;
  onSaveService: (service: SpecializationServiceMutationPayload, serviceId?: number) => void;
}

const formatPrice = (price: number): string => {
  return `${new Intl.NumberFormat("ro-RO").format(price)} lei`;
};

export const SpecializationServicesEditor = ({
  specializationId,
  specializationName,
  services,
  isBusy = false,
  onDeleteService,
  onSaveService,
}: SpecializationServicesEditorProps): JSX.Element => {
  const theme = getSpecializationTheme(specializationName);
  const overlayRoot = typeof document === "undefined" ? null : document.body;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | undefined>(undefined);
  const [draftService, setDraftService] = useState<SpecializationServiceMutationPayload>(buildEmptySpecializationService(specializationId));

  useEffect(() => {
    if (!isDrawerOpen) {
      setIsDrawerVisible(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsDrawerVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [isDrawerOpen]);

  const inactiveServicesCount = useMemo(() => services.filter((service) => !service.is_active).length, [services]);

  const openForCreate = (): void => {
    setDraftService(buildEmptySpecializationService(specializationId));
    setEditingServiceId(undefined);
    setIsDrawerOpen(true);
  };

  const openForEdit = (service: SpecializationService): void => {
    setEditingServiceId(service.service_id);
    setDraftService({
      service_name: service.service_name,
      price: service.price,
      duration_minutes: service.duration_minutes,
      description: service.description,
      is_active: service.is_active,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
  };

  const canSave = draftService.service_name.trim() !== "" && Number.isFinite(draftService.price) && draftService.price >= 0;

  return (
    <div className={`rounded-[24px] border ${theme.borderClassName} ${theme.surfaceClassName} p-3.5 md:p-4`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-base font-semibold text-ink md:text-lg">Servicii implicite</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-3 py-1 font-semibold ${theme.badgeClassName}`}>
              {services.length} {services.length === 1 ? "serviciu" : "servicii"}
            </span>
            {inactiveServicesCount > 0 ? (
              <span className={`rounded-full px-3 py-1 font-semibold ${theme.subtleBadgeClassName}`}>
                {inactiveServicesCount} inactive
              </span>
            ) : null}
          </div>
        </div>

        <button className="button-primary gap-2 whitespace-nowrap px-4 py-2 text-sm" disabled={isBusy} onClick={openForCreate} type="button">
          <Plus className="h-4 w-4" />
          Adaugă serviciu
        </button>
      </div>

      {services.length === 0 ? (
        <div className={`mt-3 rounded-[24px] border border-dashed ${theme.borderClassName} bg-white/80 px-4 py-4`}>
          <p className="text-base font-semibold text-ink">Nu există încă servicii adăugate</p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-[22px] border border-slate-200 bg-white/90">
          <div className="hidden grid-cols-[minmax(0,1.9fr)_110px_96px_90px_156px] gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 md:grid">
            <span>Serviciu</span>
            <span>Preț</span>
            <span>Durată</span>
            <span className="text-center">Status</span>
            <span className="text-center">Acțiuni</span>
          </div>
          {services.map((service) => (
            <div
              className={`grid gap-2.5 border-t border-slate-100 px-4 py-2.5 first:border-t-0 md:grid-cols-[minmax(0,1.9fr)_110px_96px_90px_156px] md:items-center ${service.is_active ? "bg-white" : "bg-slate-50 text-slate-500"}`}
              key={service.service_id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[15px] font-semibold text-ink">{service.service_name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                    ID {service.service_id}
                  </span>
                </div>
                {service.description !== undefined ? <p className="mt-0.5 truncate text-[11px] text-slate-500">{service.description}</p> : null}
              </div>

              <div className="text-sm font-semibold text-ink">{formatPrice(service.price)}</div>
              <div className="text-sm font-semibold text-slate-600">{service.duration_minutes !== undefined ? `${service.duration_minutes} min` : "-"}</div>
              <div className="flex justify-start md:justify-center">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${service.is_active ? theme.badgeClassName : "bg-slate-200 text-slate-600"}`}>
                  {service.is_active ? "Activ" : "Inactiv"}
                </span>
              </div>

              <div className="flex items-center justify-start md:justify-center">
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
                <button
                  aria-label={service.is_active ? "Dezactivează serviciul" : "Activează serviciul"}
                  className={`relative inline-flex h-8 w-[50px] items-center rounded-full border transition ${service.is_active ? "border-primary/40 bg-primarySoft" : "border-slate-200 bg-slate-100"}`}
                  disabled={isBusy}
                  onClick={() => onSaveService({
                    service_name: service.service_name,
                    price: service.price,
                    duration_minutes: service.duration_minutes,
                    description: service.description,
                    is_active: !service.is_active,
                  }, service.service_id)}
                  type="button"
                >
                  <span className={`absolute left-1 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm transition ${service.is_active ? "translate-x-[17px] bg-primary" : "translate-x-0 bg-slate-400"}`}>
                    <Power className="h-3 w-3" />
                  </span>
                </button>
                <button className="button-secondary min-h-8 rounded-full px-2.5 py-1.5 text-sm" disabled={isBusy} onClick={() => openForEdit(service)} type="button">
                  <PenLine className="h-4 w-4" />
                </button>
                <button className="button-secondary min-h-8 rounded-full px-2.5 py-1.5 text-sm text-danger" disabled={isBusy} onClick={() => onDeleteService(service.service_id)} type="button">
                  <Trash2 className="h-4 w-4" />
                </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isDrawerOpen && overlayRoot !== null ? createPortal(
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/30 px-4 py-6 backdrop-blur-[6px]">
          <div className={`flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[34px] border ${theme.borderClassName} bg-white shadow-2xl transition-all duration-300 ${isDrawerVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"}`}>
            <div className="px-6 py-6 md:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${theme.badgeClassName}`}>
                  {editingServiceId === undefined ? "Serviciu nou" : `Editare serviciu #${editingServiceId}`}
                </span>
                <h3 className="mt-3 text-2xl font-semibold text-ink">{specializationName}</h3>
              </div>
              <button className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-ink" onClick={closeDrawer} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            </div>

            <div className="grid gap-4 overflow-y-auto px-6 pb-6 md:px-7">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`service-name-${specializationId}`}>
                  Nume serviciu
                </label>
                <input
                  className="input-base"
                  id={`service-name-${specializationId}`}
                  onChange={(event) => setDraftService((currentValue) => ({ ...currentValue, service_name: event.target.value }))}
                  placeholder="Consult inițial"
                  value={draftService.service_name}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`service-price-${specializationId}`}>
                    Preț
                  </label>
                  <input
                    className="input-base"
                    id={`service-price-${specializationId}`}
                    inputMode="decimal"
                    onChange={(event) => setDraftService((currentValue) => ({
                      ...currentValue,
                      price: Number(event.target.value.replace(/,/g, ".")) || 0,
                    }))}
                    placeholder="250"
                    value={String(draftService.price)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`service-duration-${specializationId}`}>
                    Durată estimată
                  </label>
                  <input
                    className="input-base"
                    id={`service-duration-${specializationId}`}
                    inputMode="numeric"
                    onChange={(event) => {
                      const nextValue = event.target.value.trim();

                      setDraftService((currentValue) => ({
                        ...currentValue,
                        duration_minutes: nextValue === "" ? undefined : Number(nextValue),
                      }));
                    }}
                    placeholder="30"
                    value={draftService.duration_minutes === undefined ? "" : String(draftService.duration_minutes)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor={`service-description-${specializationId}`}>
                  Descriere
                </label>
                <textarea
                  className="input-base min-h-28 resize-y"
                  id={`service-description-${specializationId}`}
                  onChange={(event) => setDraftService((currentValue) => ({
                    ...currentValue,
                    description: event.target.value.trim() === "" ? undefined : event.target.value,
                  }))}
                  placeholder="Detalii scurte pentru utilizarea în cabinet"
                  value={draftService.description ?? ""}
                />
              </div>

              <div className={`rounded-3xl border ${theme.softPanelClassName} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Status serviciu</p>
                    <p className="mt-1 text-sm text-slate-500">Serviciile inactive rămân vizibile, dar estompate.</p>
                  </div>
                  <button
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${draftService.is_active ? theme.selectedChipClassName : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                    onClick={() => setDraftService((currentValue) => ({ ...currentValue, is_active: !currentValue.is_active }))}
                    type="button"
                  >
                    {draftService.is_active ? "Activ" : "Inactiv"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 bg-white px-6 py-5 sm:flex-row sm:justify-end md:px-7">
              <button className="button-secondary" onClick={closeDrawer} type="button">
                Renunță
              </button>
              <button
                className="button-primary"
                disabled={!canSave || isBusy}
                onClick={() => {
                  onSaveService({
                    ...draftService,
                    service_name: draftService.service_name.trim(),
                    price: Number.isFinite(draftService.price) ? draftService.price : 0,
                  }, editingServiceId);
                  closeDrawer();
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
    </div>
  );
};