import { useToast } from "../../../shared/ui/toast-provider";
import { SmsAutomationRulesCard } from "../components/SmsAutomationRulesCard";
import { SmsGatewayConnectionCard } from "../components/SmsGatewayConnectionCard";
import { SmsTemplatePicker } from "../components/SmsTemplatePicker";
import { SmsTestCard } from "../components/SmsTestCard";
import {
  buildSmsContextForAppointment,
  useSmsGatewayLocalState,
} from "../sms-gateway.local";

export const SmsGatewaySettingsPage = (): JSX.Element => {
  const { showToast } = useToast();
  const {
    connection,
    templates,
    automations,
    lastTestResult,
    saveConnection,
    markConnectionChecked,
    saveTemplate,
    resetTemplate,
    saveAutomationRule,
    sendTestSms,
  } = useSmsGatewayLocalState();

  const previewContext = buildSmsContextForAppointment({
    appointmentId: null,
    patientName: null,
    doctorName: null,
    specialization: null,
    appointmentStart: null,
    clinicName: null,
    actionBasePath: connection.patient_action_base_path,
  });

  return (
    <div className="space-y-5">
      <SmsGatewayConnectionCard
        connection={connection}
        onCheckConnection={() => {
          const checkedAt = markConnectionChecked();

          showToast({
            variant: "success",
            title: "Conexiunea SMS a fost verificată local",
            description: "Nu a fost trimis niciun request real; starea este pregătită pentru integrarea backend.",
          });

          return checkedAt;
        }}
        onSave={(nextConnection) => {
          saveConnection(nextConnection);
          showToast({
            variant: "success",
            title: "Configurația SMS a fost salvată",
            description: "Datele au fost păstrate local pentru conectarea ulterioară la provider.",
          });
        }}
      />

      <SmsTemplatePicker
        onReset={(templateKey) => {
          resetTemplate(templateKey);
          showToast({
            variant: "success",
            title: "Template resetat",
            description: "Template-ul SMS a revenit la varianta implicită locală.",
          });
        }}
        onSave={(templateKey, content) => {
          saveTemplate(templateKey, content);
          showToast({
            variant: "success",
            title: "Template salvat",
            description: "Conținutul a fost păstrat local pentru integrarea cu gateway-ul SMS.",
          });
        }}
        previewContext={previewContext}
        templates={templates}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <SmsAutomationRulesCard
          automations={automations}
          onSaveRule={(automationKey, rule) => {
            saveAutomationRule(automationKey, rule);
          }}
        />

        <SmsTestCard
          lastResult={lastTestResult}
          onSend={(payload) => {
            const result = sendTestSms(payload);

            showToast({
              variant: result.status === "failed" ? "error" : result.status === "pending" ? "loading" : "success",
              title: result.status === "sent" ? "SMS de test trimis" : result.status === "failed" ? "SMS de test eșuat" : "SMS de test în așteptare",
              description: result.provider_response,
            });

            return result;
          }}
          templates={templates}
        />
      </div>
    </div>
  );
};