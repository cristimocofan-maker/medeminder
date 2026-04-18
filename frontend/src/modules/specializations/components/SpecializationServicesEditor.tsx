import { PenLine, Plus, Power, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { buildEmptySpecializationService, type SpecializationService } from "./specialization-services.store";
import { getSpecializationTheme } from "./specialization-theme";

interface SpecializationServicesEditorProps {
  specializationId: number;
  specializationName: string;
  services: SpecializationService[];
  onDeleteService: (serviceId: string) => void;
  onSaveService: (service: SpecializationService) => void;
}

const formatPrice = (price: number): string => {
  return `${new Intl.NumberFormat("ro-RO").format(price)} lei`;
};

export const SpecializationServicesEditor = ({
  specializationId,
  specializationName,
  services,
  onDeleteService,
  onSaveService,
}: SpecializationServicesEditorProps): JSX.Element => {
  const theme = getSpecializationTheme(specializationName);
  const overlayRoot = typeof document === "undefined" ? null : document.body;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [draftService, setDraftService] = useState<SpecializationService>(buildEmptySpecializationService(specializationId));

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
    setIsDrawerOpen(true);
  };

  const openForEdit = (service: SpecializationService): void => {
    setDraftService(service);
    setIsDrawerOpen(true);
  };

  const closeDrawer = (): void => {
    setIsDrawerOpen(false);
  };

  const canSave = draftService.name.trim() !== "" && Number.isFinite(draftService.price) && draftService.price >= 0;

  return (
    <div className={`rounded-[28px] border ${theme.borderClassName} ${theme.surfaceClassName} p-5`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-ink">Servicii implicite</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
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

        <button className="button-primary gap-2 whitespace-nowrap" onClick={openForCreate} type="button">
          <Plus className="h-5 w-5" />
          Adaugă serviciu
        </button>
      </div>

      {services.length === 0 ? (
        <div className={`mt-4 rounded-3xl border border-dashed ${theme.borderClassName} bg-white/80 px-5 py-6`}>
          <p className="text-base font-semibold text-ink">Nu există încă servicii adăugate</p>
          <p className={`mt-2 text-sm ${theme.accentTextClassName}`}>Adaugă primele servicii medicale pentru această specializare.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {services.map((service) => (
            <div
              className={`rounded-3xl border p-4 transition ${service.is_active ? `bg-white ${theme.borderClassName}` : `${theme.mutedRowClassName} opacity-70`}`}
              key={service.id}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(240px,1.4fr)_140px_120px_auto] xl:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-ink">{service.name}</p>
                  </div>
                  {service.description !== undefined ? (
                    <p className="mt-2 text-sm text-slate-500">{service.description}</p>
                  ) : null}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">Preț</p>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${theme.badgeClassName}`}>
                    {formatPrice(service.price)}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 xl:hidden">Durată</p>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${theme.subtleBadgeClassName}`}>
                    {service.duration_minutes !== undefined ? `${service.duration_minutes} min` : "-"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                  <button
                    aria-label={service.is_active ? "Dezactivează serviciul" : "Activează serviciul"}
                    className={`relative inline-flex h-10 w-[58px] items-center rounded-full border transition ${service.is_active ? "border-primary/40 bg-primarySoft" : "border-slate-200 bg-slate-100"}`}
                    onClick={() => onSaveService({ ...service, is_active: !service.is_active })}
                    type="button"
                  >
                    <span
                      className={`absolute left-1 flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition ${service.is_active ? "translate-x-[18px] bg-primary" : "translate-x-0 bg-slate-400"}`}
                    >
                      <Power className="h-4 w-4" />
                    </span>
                  </button>
                  <button className="button-secondary min-h-10 px-3 py-2 text-sm" onClick={() => openForEdit(service)} type="button">
                    <PenLine className="h-4 w-4" />
                  </button>
                  <button className="button-secondary min-h-10 px-3 py-2 text-sm text-danger" onClick={() => onDeleteService(service.id)} type="button">
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
                  {draftService.name.trim() === "" ? "Serviciu nou" : "Editare serviciu"}
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
                  onChange={(event) => setDraftService((currentValue) => ({ ...currentValue, name: event.target.value }))}
                  placeholder="Consult inițial"
                  value={draftService.name}
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
                disabled={!canSave}
                onClick={() => {
                  onSaveService({
                    ...draftService,
                    name: draftService.name.trim(),
                    price: Number.isFinite(draftService.price) ? draftService.price : 0,
                  });
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