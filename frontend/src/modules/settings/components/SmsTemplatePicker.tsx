import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SMS_TEMPLATES,
  SMS_TEMPLATE_DEFINITIONS,
  SMS_TEMPLATE_VARIABLES,
  renderSmsMessage,
} from "../sms-gateway.local";
import type { SmsMessageContext, SmsTemplateKey } from "../sms-gateway.types";

interface SmsTemplatePickerProps {
  templates: Record<SmsTemplateKey, string>;
  previewContext?: SmsMessageContext;
  onSave: (templateKey: SmsTemplateKey, content: string) => void;
  onReset: (templateKey: SmsTemplateKey) => void;
}

export const SmsTemplatePicker = ({ templates, previewContext, onSave, onReset }: SmsTemplatePickerProps): JSX.Element => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<SmsTemplateKey>("confirmation");
  const [draft, setDraft] = useState<Record<SmsTemplateKey, string>>(templates);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setDraft(templates);
  }, [templates]);

  const selectedTemplate = useMemo(
    () => SMS_TEMPLATE_DEFINITIONS.find((template) => template.key === selectedTemplateKey) ?? SMS_TEMPLATE_DEFINITIONS[0],
    [selectedTemplateKey],
  );

  const previewMessage = useMemo(
    () => renderSmsMessage(draft[selectedTemplateKey], previewContext ?? {}),
    [draft, previewContext, selectedTemplateKey],
  );

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-2">
        <span className="badge-soft">Template-uri SMS</span>
        <h3 className="text-2xl font-semibold text-ink">Template-uri SMS</h3>
        <p className="text-sm leading-6 text-slate-500">Editezi mesajele implicite și vezi instant previzualizarea exactă a conținutului generat.</p>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-3">
          <div className="space-y-2">
            {SMS_TEMPLATE_DEFINITIONS.map((template) => {
              const isSelected = template.key === selectedTemplateKey;

              return (
                <button
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${isSelected ? "border-primary/30 bg-primarySoft text-primary shadow-sm" : "border-transparent bg-white text-slate-600 hover:border-slate-200 hover:text-ink"}`}
                  key={template.key}
                  onClick={() => setSelectedTemplateKey(template.key)}
                  type="button"
                >
                  <p className="font-semibold">{template.label}</p>
                  <p className="mt-2 text-sm leading-6 opacity-80">{template.description}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcfd_100%)] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-ink">{selectedTemplate.label}</h4>
                <p className="mt-1 text-sm text-slate-500">{selectedTemplate.description}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Editor</span>
            </div>

            <textarea
              className="input-base mt-4 min-h-[280px] resize-y"
              onChange={(event) => {
                const value = event.target.value;
                setDraft((currentValue) => ({
                  ...currentValue,
                  [selectedTemplateKey]: value,
                }));
              }}
              ref={textareaRef}
              value={draft[selectedTemplateKey]}
            />

            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-500">Variabile disponibile</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SMS_TEMPLATE_VARIABLES.map((variable) => (
                  <button
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                    key={variable.token}
                    onClick={() => {
                      const nextToken = variable.token;
                      const textarea = textareaRef.current;

                      if (textarea === null) {
                        setDraft((currentValue) => ({
                          ...currentValue,
                          [selectedTemplateKey]: `${currentValue[selectedTemplateKey]} ${nextToken}`.trim(),
                        }));
                        return;
                      }

                      const selectionStart = textarea.selectionStart;
                      const selectionEnd = textarea.selectionEnd;
                      const currentValue = draft[selectedTemplateKey];
                      const nextValue = `${currentValue.slice(0, selectionStart)}${nextToken}${currentValue.slice(selectionEnd)}`;

                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        [selectedTemplateKey]: nextValue,
                      }));

                      window.requestAnimationFrame(() => {
                        textarea.focus();
                        textarea.setSelectionRange(selectionStart + nextToken.length, selectionStart + nextToken.length);
                      });
                    }}
                    type="button"
                  >
                    {variable.token}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                className="button-secondary gap-2"
                onClick={() => {
                  onReset(selectedTemplateKey);
                  setDraft((currentValue) => ({
                    ...currentValue,
                    [selectedTemplateKey]: DEFAULT_SMS_TEMPLATES[selectedTemplateKey],
                  }));
                  setLastSavedMessage(`Template-ul „${selectedTemplate.label}” a fost resetat.`);
                }}
                type="button"
              >
                <RotateCcw className="h-4 w-4" />
                Resetează template
              </button>
              <button
                className="button-primary gap-2"
                onClick={() => {
                  onSave(selectedTemplateKey, draft[selectedTemplateKey]);
                  setLastSavedMessage(`Template-ul „${selectedTemplate.label}” a fost salvat local.`);
                }}
                type="button"
              >
                <Save className="h-4 w-4" />
                Salvează
              </button>
            </div>

            {lastSavedMessage !== null ? <p className="mt-4 text-sm font-medium text-primary">{lastSavedMessage}</p> : null}
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Preview live</p>
            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Mesaj generat</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">{previewMessage}</p>
            </div>
            <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 text-sm text-slate-500">
              <p className="font-semibold text-ink">Ce vezi aici</p>
              <p className="mt-2 leading-6">Preview-ul folosește valorile reale primite din context când ele există. Variabilele rămase fără date sunt păstrate explicit pentru integrarea backend ulterioară.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
