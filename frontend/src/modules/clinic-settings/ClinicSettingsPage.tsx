import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, CheckCircle2, LoaderCircle, RefreshCw, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CHANNEL_TYPE_VALUES, type ChannelType } from "../../../../backend/src/shared/enums/channel-type.enum";
import { confirmFormSave } from "../../shared/utils/confirm-actions";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import { getClinicSettings, updateClinicSettings } from "./clinic-settings.api";
import { clinicSettingsSchema, type ClinicSettingsFormValues } from "./clinic-settings.schema";
import { SmsGatewaySettingsPage } from "../settings/pages/SmsGatewaySettingsPage";

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const defaultValues: ClinicSettingsFormValues = {
  timezone: "",
  default_channel_type: "WhatsApp",
  appointment_reminder_hours_before: 24,
  follow_up_delay_days: 0,
};

const mapApiErrorToForm = (
  error: AxiosError<ApiErrorResponse>,
  setError: ReturnType<typeof useForm<ClinicSettingsFormValues>>["setError"],
): void => {
  const fieldErrors = error.response?.data.field_errors ?? [];

  fieldErrors.forEach((fieldError) => {
    if (
      fieldError.field === "timezone" ||
      fieldError.field === "default_channel_type" ||
      fieldError.field === "appointment_reminder_hours_before" ||
      fieldError.field === "follow_up_delay_days"
    ) {
      setError(fieldError.field, {
        type: "server",
        message: fieldError.message,
      });
    }
  });
};

export const ClinicSettingsPage = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<"clinic" | "sms-gateway">("clinic");
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues,
  });

  const settingsQuery = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => getClinicSettings(),
  });

  useEffect(() => {
    if (settingsQuery.data !== undefined) {
      reset({
        timezone: settingsQuery.data.timezone,
        default_channel_type: settingsQuery.data.default_channel_type,
        appointment_reminder_hours_before: settingsQuery.data.appointment_reminder_hours_before,
        follow_up_delay_days: settingsQuery.data.follow_up_delay_days,
      });
    }
  }, [reset, settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: ClinicSettingsFormValues) => updateClinicSettings(values),
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: "Salvăm setările clinicii",
        description: "Trimitem modificările către endpointul real al backend-ului.",
      });

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["clinic-settings"] });
      await settingsQuery.refetch();
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "success",
          title: "Setările clinicii au fost salvate",
          description: "Valorile afișate au fost reîmprospătate din API-ul real.",
        });
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva setările",
          description: (error.response?.data as ApiErrorResponse | undefined)?.message ?? "Verifică datele introduse și încearcă din nou.",
        });
      }
      mapApiErrorToForm(error, setError);
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm setările reale ale clinicii</span>
        </div>
        <p className="mt-3">Preluăm datele direct din endpointul real `/clinic-settings`.</p>
      </section>
    );
  }

  if (settingsQuery.isError || settingsQuery.data === undefined) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Setări</span>
            <h2 className="mt-4">Nu am putut încărca setările clinicii</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void settingsQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
        </div>
      </section>
    );
  }

  const settings = settingsQuery.data;

  return (
    <section className="space-y-4">
      <div className="panel p-3 md:p-4">
        <div className="inline-flex rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`min-h-11 rounded-[18px] px-4 py-2 text-sm font-semibold transition ${activeSection === "clinic" ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            onClick={() => setActiveSection("clinic")}
            type="button"
          >
            Setări clinică
          </button>
          <button
            className={`min-h-11 rounded-[18px] px-4 py-2 text-sm font-semibold transition ${activeSection === "sms-gateway" ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            onClick={() => setActiveSection("sms-gateway")}
            type="button"
          >
            SMS Gateway
          </button>
        </div>
      </div>

      {activeSection === "sms-gateway" ? <SmsGatewaySettingsPage /> : null}

      {activeSection === "clinic" ? <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.65fr)]">
        <section className="panel p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-primarySoft p-3 text-primary">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <span className="badge-soft">Setări clinică</span>
              <h2 className="mt-4">Editezi doar câmpurile reale expuse de backend</h2>
              <p className="mt-3">Formularul include exclusiv `timezone`, `default_channel_type`, `appointment_reminder_hours_before` și `follow_up_delay_days`.</p>
            </div>
          </div>

          <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit((values) => {
            if (!confirmFormSave("setările clinicii", true)) {
              return;
            }

            mutation.mutate(values);
          })}>
            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="timezone">
                timezone
              </label>
              <input aria-invalid={errors.timezone !== undefined} className="input-base" id="timezone" placeholder="Exemplu: Europe/Bucharest" {...register("timezone")} />
              {errors.timezone !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.timezone.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="default_channel_type">
                default_channel_type
              </label>
              <select aria-invalid={errors.default_channel_type !== undefined} className="input-base" id="default_channel_type" {...register("default_channel_type")}>
                {CHANNEL_TYPE_VALUES.map((channelType: ChannelType) => (
                  <option key={channelType} value={channelType}>
                    {channelType}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-500">Valorile provin exclusiv din enumul real deja folosit în aplicație: WhatsApp, SMS, Email.</p>
              {errors.default_channel_type !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.default_channel_type.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="appointment_reminder_hours_before">
                appointment_reminder_hours_before
              </label>
              <input aria-invalid={errors.appointment_reminder_hours_before !== undefined} className="input-base" id="appointment_reminder_hours_before" min={1} max={168} step={1} type="number" {...register("appointment_reminder_hours_before")} />
              {errors.appointment_reminder_hours_before !== undefined ? (
                <p className="mt-2 text-sm font-medium text-danger">{errors.appointment_reminder_hours_before.message}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="follow_up_delay_days">
                follow_up_delay_days
              </label>
              <input aria-invalid={errors.follow_up_delay_days !== undefined} className="input-base" id="follow_up_delay_days" min={0} max={365} step={1} type="number" {...register("follow_up_delay_days")} />
              {errors.follow_up_delay_days !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.follow_up_delay_days.message}</p> : null}
            </div>

            {mutation.isError ? (
              <div className="rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">Nu am putut salva setările</p>
                    <p className="mt-1 text-sm text-danger/90">
                      {mutation.error instanceof AxiosError
                        ? ((mutation.error.response?.data as ApiErrorResponse | undefined)?.message ?? "Verifică datele introduse și încearcă din nou.")
                        : "Verifică datele introduse și încearcă din nou."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <button className="button-primary gap-2" disabled={mutation.isPending || isSubmitting} type="submit">
              <Save className="h-5 w-5" />
              {mutation.isPending ? "Salvăm..." : "Salvează setările"}
            </button>
          </form>
        </section>

        <aside className="panel-subtle p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Detalii încărcate din API</h3>
          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">timezone</dt>
              <dd className="mt-1 text-base text-ink">{settings.timezone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">default_channel_type</dt>
              <dd className="mt-1 text-base text-ink">{settings.default_channel_type}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">appointment_reminder_hours_before</dt>
              <dd className="mt-1 text-base text-ink">{settings.appointment_reminder_hours_before}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">follow_up_delay_days</dt>
              <dd className="mt-1 text-base text-ink">{settings.follow_up_delay_days}</dd>
            </div>
            {typeof settings.created_at === "string" ? (
              <div>
                <dt className="font-semibold text-slate-500">created_at</dt>
                <dd className="mt-1 text-base text-ink">{formatDate(settings.created_at)}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-semibold text-slate-500">updated_at</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(settings.updated_at)}</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-slate-500">`clinic_id` este expus de backend în răspuns, dar este exclus intenționat din frontend conform regulilor cerute.</p>
        </aside>
      </div> : null}
    </section>
  );
};