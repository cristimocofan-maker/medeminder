import { SendHorizonal } from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_SMS_TEMPLATES, SMS_TEMPLATE_DEFINITIONS, formatSmsTimestamp, renderSmsMessage } from "../sms-gateway.local";
import type { SmsGatewayTestResult, SmsMessageContext, SmsTemplateKey } from "../sms-gateway.types";

interface SmsTestCardProps {
  templates: Record<SmsTemplateKey, string>;
  lastResult: SmsGatewayTestResult | null;
  onSend: (payload: { phone_number: string; template_key: SmsTemplateKey; message: string }) => SmsGatewayTestResult;
}

export const SmsTestCard = ({ templates, lastResult, onSend }: SmsTestCardProps): JSX.Element => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<SmsTemplateKey>("confirmation");
  const [localResult, setLocalResult] = useState<SmsGatewayTestResult | null>(null);

  const testContext: SmsMessageContext = {
    confirmation_link: null,
    reschedule_link: null,
    cancel_link: null,
  };

  const generatedMessage = useMemo(() => {
    const template = templates[selectedTemplateKey] ?? DEFAULT_SMS_TEMPLATES[selectedTemplateKey];

    return renderSmsMessage(template, testContext);
  }, [selectedTemplateKey, templates]);

  const result = localResult ?? lastResult;

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <span className="badge-soft">Test SMS</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink">Testează trimiterea unui SMS</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">Flux local strict UI. Payload-ul este păstrat exact în forma necesară pentru integrarea ulterioară, fără request real.</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="sms-test-phone-number">
            Număr telefon
          </label>
          <input
            className="input-base"
            id="sms-test-phone-number"
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="07xxxxxxxx"
            value={phoneNumber}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="sms-test-template">
            Template
          </label>
          <select className="input-base" id="sms-test-template" onChange={(event) => setSelectedTemplateKey(event.target.value as SmsTemplateKey)} value={selectedTemplateKey}>
            {SMS_TEMPLATE_DEFINITIONS.map((template) => (
              <option key={template.key} value={template.key}>
                {template.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 block text-sm font-semibold text-ink">Mesaj generat</p>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="whitespace-pre-wrap text-sm leading-7 text-ink">{generatedMessage}</p>
          </div>
        </div>

        <button
          className="button-primary gap-2"
          onClick={() => {
            const nextResult = onSend({
              phone_number: phoneNumber,
              template_key: selectedTemplateKey,
              message: generatedMessage,
            });
            setLocalResult(nextResult);
          }}
          type="button"
        >
          <SendHorizonal className="h-4 w-4" />
          Trimite SMS de test
        </button>

        {result !== null ? (
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            <p className="font-semibold text-ink">Rezultat</p>
            <p className="mt-2">Status: {result.status === "sent" ? "trimis cu succes" : result.status === "failed" ? "eroare" : "în așteptare"}</p>
            <p className="mt-1">Timestamp: {formatSmsTimestamp(result.timestamp)}</p>
            <p className="mt-1 break-words">Răspuns provider: {result.provider_response}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
};
