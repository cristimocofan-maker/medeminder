import { CheckCircle2, Radio, Save } from "lucide-react";
import { useEffect, useState } from "react";
import type { SmsGatewayConnectionConfig } from "../sms-gateway.types";
import { formatSmsTimestamp } from "../sms-gateway.local";

interface SmsGatewayConnectionCardProps {
  connection: SmsGatewayConnectionConfig;
  onSave: (connection: SmsGatewayConnectionConfig) => void;
  onCheckConnection: () => string;
}

export const SmsGatewayConnectionCard = ({ connection, onSave, onCheckConnection }: SmsGatewayConnectionCardProps): JSX.Element => {
  const [draft, setDraft] = useState<SmsGatewayConnectionConfig>(connection);
  const [lastAction, setLastAction] = useState<string | null>(null);

  useEffect(() => {
    setDraft(connection);
  }, [connection]);

  return (
    <section className="rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafc_100%)] p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span className="badge-soft">SMS Gateway</span>
          <h3 className="mt-4 text-2xl font-semibold text-ink">Conexiunea SMS într-un singur card clar</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Configurația rămâne locală până când backend-ul expune endpointurile dedicate pentru gateway. Nu trimitem request-uri reale în această etapă.
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Stare gateway</p>
          <p className="mt-1">{draft.provider_name.trim() === "" ? "Pregătit local pentru integrare" : `Configurat local: ${draft.provider_name}`}</p>
          {connection.last_checked_at !== null ? <p className="mt-1 text-xs text-emerald-800">Ultima verificare: {formatSmsTimestamp(connection.last_checked_at)}</p> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="sms-provider-name">
            Provider SMS
          </label>
          <input
            className="input-base"
            id="sms-provider-name"
            onChange={(event) => setDraft((currentValue) => ({ ...currentValue, provider_name: event.target.value }))}
            placeholder="Ex. gateway-ul clinicii"
            value={draft.provider_name}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="sms-sender-name">
            Nume expeditor
          </label>
          <input
            className="input-base"
            id="sms-sender-name"
            onChange={(event) => setDraft((currentValue) => ({ ...currentValue, sender_name: event.target.value }))}
            placeholder="Ex. Clinica"
            value={draft.sender_name}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="sms-action-base-path">
            Cale internă pentru linkurile pacientului
          </label>
          <input
            className="input-base"
            id="sms-action-base-path"
            onChange={(event) => setDraft((currentValue) => ({ ...currentValue, patient_action_base_path: event.target.value }))}
            placeholder="/pacient/sms"
            value={draft.patient_action_base_path}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          <input
            checked={draft.is_primary_gateway}
            className="h-4 w-4"
            onChange={(event) => setDraft((currentValue) => ({ ...currentValue, is_primary_gateway: event.target.checked }))}
            type="checkbox"
          />
          Folosește acest gateway ca gateway principal
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className="button-secondary gap-2"
            onClick={() => {
              const checkedAt = onCheckConnection();
              setLastAction(`Conexiunea locală a fost verificată la ${formatSmsTimestamp(checkedAt)}.`);
            }}
            type="button"
          >
            <Radio className="h-4 w-4" />
            Verifică conexiunea
          </button>
          <button
            className="button-primary gap-2"
            onClick={() => {
              onSave(draft);
              setLastAction("Configurația SMS a fost salvată local pentru integrarea ulterioară.");
            }}
            type="button"
          >
            <Save className="h-4 w-4" />
            Salvează
          </button>
        </div>
      </div>

      {lastAction !== null ? (
        <div className="mt-4 flex items-center gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          {lastAction}
        </div>
      ) : null}
    </section>
  );
};
