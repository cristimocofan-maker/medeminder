import { useToast } from "../../../shared/ui/toast-provider";
import { SmsAutomationRulesCard } from "../components/SmsAutomationRulesCard";
import { SmsGatewayConnectionCard } from "../components/SmsGatewayConnectionCard";
import { SmsTemplatePicker } from "../components/SmsTemplatePicker";
import { SmsTestCard } from "../components/SmsTestCard";
import {
  buildSmsContextForAppointment,
  useSmsGatewayLocalState,
} from "../sms-gateway.local";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClinicSettings, updateClinicSettings } from "../../clinic-settings/clinic-settings.api";
import type { ClinicSettingsDetails } from "../../clinic-settings/clinic-settings.types";

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

  const queryClient = useQueryClient();
  const settingsQuery = useQuery<ClinicSettingsDetails>({ queryKey: ["clinic-settings"], queryFn: async () => getClinicSettings() });

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
        onSave={async (nextConnection) => {
          saveConnection(nextConnection);

          // persist to backend clinic settings
          const currentSettings = settingsQuery.data;

          if (!currentSettings) {
            showToast({ variant: "error", title: "Nu am putut salva", description: "Setările clinicii nu sunt încărcate." });
            return;
          }

          try {
            await updateClinicSettings({
              timezone: currentSettings.timezone,
              default_channel_type: currentSettings.default_channel_type,
              appointment_reminder_hours_before: currentSettings.appointment_reminder_hours_before,
              follow_up_delay_days: currentSettings.follow_up_delay_days,
              sms_provider_name: nextConnection.provider_name ?? null,
              sms_sender_name: nextConnection.sender_name ?? null,
              sms_username: nextConnection.username ?? null,
              sms_password: nextConnection.password ?? null,
              sms_token: nextConnection.token ?? null,
              sms_is_primary_gateway: nextConnection.is_primary_gateway,
              sms_patient_action_base_path: nextConnection.patient_action_base_path ?? null,
            });

            await queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });

            showToast({
              variant: "success",
              title: "Configurația SMS a fost salvată",
              description: "Datele au fost persistate în baza de date.",
            });
          } catch (err) {
            showToast({ variant: "error", title: "Eroare salvare", description: "Nu am putut salva setările pe backend." });
          }
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