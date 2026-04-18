import { CheckCircle2, SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import { SMS_TEMPLATE_DEFINITIONS, formatSmsTimestamp, renderSmsMessage } from "../sms-gateway.local";
import type { SmsHistoryItem, SmsMessageContext, SmsTemplateKey } from "../sms-gateway.types";

interface SmsPatientCardProps {
  title?: string;
  subtitle?: string;
  phoneNumber: string;
  patientId: number | null;
  templates: Record<SmsTemplateKey, string>;
  previewContext: SmsMessageContext;
  defaultTemplateKey?: SmsTemplateKey;
  onSend: (payload: {
    patient_id: number;
    phone_number: string;
    type: SmsTemplateKey;
    message: string;
  }) => SmsHistoryItem;
}

export const SmsPatientCard = ({
  title = "SMS pacient",
  subtitle,
  phoneNumber,
  patientId,
  templates,
  previewContext,
  defaultTemplateKey = "confirmation",
  onSend,
}: SmsPatientCardProps): JSX.Element => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<SmsTemplateKey>(defaultTemplateKey);
  const [lastSent, setLastSent] = useState<SmsHistoryItem | null>(null);

  const generatedMessage = useMemo(() => renderSmsMessage(templates[selectedTemplateKey], previewContext), [previewContext, selectedTemplateKey, templates]);

  const canSend = patientId !== null && patientId > 0 && phoneNumber.trim() !== "";

  const sendWithType = (type: SmsTemplateKey): void => {
    if (patientId === null || patientId <= 0) {
      return;
    }

    const message = renderSmsMessage(templates[type], previewContext);
    const nextHistoryItem = onSend({
      patient_id: patientId,
      phone_number: phoneNumber,
      type,
      message,
    });

    setSelectedTemplateKey(type);
    setLastSent(nextHistoryItem);
  };

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <span className="badge-soft">SMS pacient</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {subtitle ?? "Previzualizezi mesajul și îl pregătești exact cu datele reale deja încărcate în pagină."}
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Numărul pacientului</p>
            <p className="mt-2 text-lg font-semibold text-ink">{phoneNumber.trim() === "" ? "Lipseaște numărul pacientului" : phoneNumber}</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={`sms-template-${title}`}>
              Template selectat
            </label>
            <select className="input-base" id={`sms-template-${title}`} onChange={(event) => setSelectedTemplateKey(event.target.value as SmsTemplateKey)} value={selectedTemplateKey}>
              {SMS_TEMPLATE_DEFINITIONS.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="button-primary gap-2"
            disabled={!canSend}
            onClick={() => sendWithType(selectedTemplateKey)}
            type="button"
          >
            <SendHorizonal className="h-4 w-4" />
            Trimite acum
          </button>

          {!canSend ? (
            <p className="text-sm leading-6 text-slate-500">Pentru trimitere este necesar un pacient real cu `patient_id` numeric și un număr de telefon complet.</p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3">
            <button className="button-secondary px-3 py-2 text-sm" disabled={!canSend} onClick={() => sendWithType("confirmation")} type="button">
              Confirmă prin SMS
            </button>
            <button className="button-secondary px-3 py-2 text-sm" disabled={!canSend} onClick={() => sendWithType("reschedule")} type="button">
              Reprogramează prin SMS
            </button>
            <button className="button-secondary px-3 py-2 text-sm" disabled={!canSend} onClick={() => sendWithType("cancel")} type="button">
              Anulează prin SMS
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Preview mesaj</p>
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{generatedMessage}</p>
          </div>

          {lastSent !== null ? (
            <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Ultima acțiune locală
              </div>
              <p className="mt-2">Status: {lastSent.status === "sent" ? "trimis" : lastSent.status === "failed" ? "eșuat" : "în așteptare"}</p>
              <p className="mt-1">Data: {formatSmsTimestamp(lastSent.sent_at)}</p>
              {lastSent.provider_response ? <p className="mt-1 break-words">Răspuns provider: {lastSent.provider_response}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
