import { RefreshCcw } from "lucide-react";
import { formatSmsTimestamp } from "../sms-gateway.local";
import type { SmsHistoryItem } from "../sms-gateway.types";

interface SmsHistorySectionProps {
  items: SmsHistoryItem[];
  onRetry: (historyId: string) => void;
}

const getStatusLabel = (status: SmsHistoryItem["status"]): string => {
  if (status === "sent") {
    return "trimis";
  }

  if (status === "failed") {
    return "eșuat";
  }

  return "în așteptare";
};

const getTypeLabel = (type: SmsHistoryItem["type"]): string => {
  switch (type) {
    case "confirmation":
      return "Confirmare";
    case "reminder":
      return "Reminder";
    case "reschedule":
      return "Reprogramare";
    case "cancel":
      return "Anulare";
    case "follow-up":
      return "Follow-up";
    default:
      return type;
  }
};

export const SmsHistorySection = ({ items, onRetry }: SmsHistorySectionProps): JSX.Element => {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <span className="badge-soft">Istoric SMS</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink">Istoric SMS</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">Lista rămâne premium și simplă, fără tabel tehnic, cu retrimitere rapidă pentru fiecare mesaj.</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          Nu există încă SMS-uri trimise pentru acest pacient în fluxul local pregătit pentru integrarea gateway-ului.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <article className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4" key={item.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{getTypeLabel(item.type)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${item.status === "sent" ? "bg-emerald-100 text-emerald-800" : item.status === "failed" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink">{formatSmsTimestamp(item.sent_at)}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.message}</p>
                  {item.provider_response ? <p className="mt-2 text-xs leading-5 text-slate-500">{item.provider_response}</p> : null}
                </div>

                <button className="button-secondary gap-2 self-start" onClick={() => onRetry(item.id)} type="button">
                  <RefreshCcw className="h-4 w-4" />
                  Retrimite
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
