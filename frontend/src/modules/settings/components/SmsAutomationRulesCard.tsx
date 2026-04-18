import type { SmsAutomationKey, SmsAutomationRule, SmsTemplateKey } from "../sms-gateway.types";
import { SMS_TEMPLATE_DEFINITIONS } from "../sms-gateway.local";

interface SmsAutomationRulesCardProps {
  automations: Record<SmsAutomationKey, SmsAutomationRule>;
  onSaveRule: (automationKey: SmsAutomationKey, rule: SmsAutomationRule) => void;
}

export const SmsAutomationRulesCard = ({ automations, onSaveRule }: SmsAutomationRulesCardProps): JSX.Element => {
  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div>
        <span className="badge-soft">Automatizări SMS</span>
        <h3 className="mt-4 text-2xl font-semibold text-ink">Trimiteri automate</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">Fiecare regulă poate fi activată local și legată imediat de un template și de gateway-ul principal.</p>
      </div>

      <div className="mt-6 space-y-4">
        {(Object.entries(automations) as Array<[SmsAutomationKey, SmsAutomationRule]>).map(([automationKey, rule]) => (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4" key={automationKey}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <label className="flex items-start gap-3 text-sm font-semibold text-ink">
                  <input
                    checked={rule.enabled}
                    className="mt-1 h-4 w-4"
                    onChange={(event) => onSaveRule(automationKey, { ...rule, enabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>
                    <span className="block">{rule.label}</span>
                    <span className="mt-1 block text-sm font-normal leading-6 text-slate-500">{rule.description}</span>
                  </span>
                </label>
              </div>

              {rule.enabled ? (
                <div className="grid w-full gap-3 md:grid-cols-2 lg:max-w-[520px]">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500" htmlFor={`automation-template-${automationKey}`}>
                      Template folosit
                    </label>
                    <select
                      className="input-base"
                      id={`automation-template-${automationKey}`}
                      onChange={(event) => onSaveRule(automationKey, {
                        ...rule,
                        template_key: event.target.value as SmsTemplateKey,
                      })}
                      value={rule.template_key}
                    >
                      {SMS_TEMPLATE_DEFINITIONS.map((template) => (
                        <option key={template.key} value={template.key}>
                          {template.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Gateway</label>
                    <label className="flex min-h-[52px] items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink">
                      <input
                        checked={rule.use_primary_gateway}
                        className="h-4 w-4"
                        onChange={(event) => onSaveRule(automationKey, {
                          ...rule,
                          use_primary_gateway: event.target.checked,
                        })}
                        type="checkbox"
                      />
                      Folosește gateway-ul principal
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
