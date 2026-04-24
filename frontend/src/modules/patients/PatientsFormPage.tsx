import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { confirmFormSave } from "../../shared/utils/confirm-actions";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import { SmsHistorySection } from "../settings/components/SmsHistorySection";
import { SmsPatientCard } from "../settings/components/SmsPatientCard";
import { buildSmsContextForAppointment, useSmsGatewayLocalState } from "../settings/sms-gateway.local";
import { PatientReferralCard } from "./components/PatientReferralCard";
import { PatientVisitResultCard } from "./components/PatientVisitResultCard";
import { PatientVisitServicesCard } from "./components/PatientVisitServicesCard";
import { createPatient, getPatientById, updatePatient } from "./patients.api";
import { calculateAgeLabelFromIsoDate, formatPatientBirthDate, normalizePatientCnpInput, previewPatientDemographicsFromCnp } from "./patient-demographics";
import { patientFormSchema, type PatientFormValues } from "./patients.schema";

const defaultValues: PatientFormValues = {
  patient_display_name: "",
  cnp: "",
  city: "",
  phone_number: "",
  email: null,
  notes: null,
  is_active: true,
};

const mapApiErrorToForm = (
  error: AxiosError<ApiErrorResponse>,
  setError: ReturnType<typeof useForm<PatientFormValues>>["setError"],
): void => {
  const fieldErrors = error.response?.data.field_errors ?? [];

  fieldErrors.forEach((fieldError) => {
    if (
      fieldError.field === "patient_display_name" ||
      fieldError.field === "cnp" ||
      fieldError.field === "city" ||
      fieldError.field === "phone_number" ||
      fieldError.field === "email" ||
      fieldError.field === "notes" ||
      fieldError.field === "is_active"
    ) {
      setError(fieldError.field, {
        type: "server",
        message: fieldError.message,
      });
    }
  });
};

export const PatientsFormPage = (): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const { templates: smsTemplates, patientHistoryMap, logPatientSms, retryHistoryItem } = useSmsGatewayLocalState();
  const params = useParams();
  const patientId = params.patient_id === undefined ? null : Number(params.patient_id);
  const isEditMode = patientId !== null;
  const patientFormId = "patient-form";

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  });

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => getPatientById(patientId as number),
    enabled: isEditMode && Number.isInteger(patientId) && (patientId as number) > 0,
  });

  const watchedCnp = watch("cnp");
  const watchedIsActive = watch("is_active");
  const watchedPatientDisplayName = watch("patient_display_name");
  const watchedPhoneNumber = watch("phone_number");
  const derivedDemographics = useMemo(() => previewPatientDemographicsFromCnp(watchedCnp ?? ""), [watchedCnp]);
  const derivedBirthDate = derivedDemographics?.birthDateIso ?? patientQuery.data?.birth_date ?? null;
  const derivedBirthDateDisplay = derivedDemographics?.birthDateDisplay ?? formatPatientBirthDate(patientQuery.data?.birth_date ?? null);
  const derivedSex = derivedDemographics?.sex ?? patientQuery.data?.sex ?? "";
  const ageLabel = useMemo(() => calculateAgeLabelFromIsoDate(derivedBirthDate), [derivedBirthDate]);
  const patientSmsHistory = patientId !== null && patientId > 0 ? patientHistoryMap[patientId] ?? [] : [];
  const patientSmsContext = useMemo(() => buildSmsContextForAppointment({
    appointmentId: null,
    patientName: patientQuery.data?.patient_display_name ?? (watchedPatientDisplayName?.trim() === "" ? null : watchedPatientDisplayName ?? null),
    doctorName: null,
    specialization: null,
    appointmentStart: null,
    clinicName: null,
    actionBasePath: null,
  }), [patientQuery.data?.patient_display_name, watchedPatientDisplayName]);

  useEffect(() => {
    if (patientQuery.data !== undefined) {
      reset({
        patient_display_name: patientQuery.data.patient_display_name,
        cnp: patientQuery.data.cnp ?? "",
        city: patientQuery.data.city ?? "",
        phone_number: patientQuery.data.phone_number,
        email: patientQuery.data.email,
        notes: patientQuery.data.notes,
        is_active: patientQuery.data.is_active,
      });
    }
  }, [patientQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      if (isEditMode) {
        return updatePatient(patientId as number, values);
      }

      return createPatient(values);
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: isEditMode ? "Salvăm modificările pacientului" : "Adăugăm pacientul",
        description: "Trimitem datele către endpointul real al backend-ului.",
      });

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "success",
          title: isEditMode ? "Pacient actualizat" : "Pacient adăugat",
          description: "Lista va afișa datele reale actualizate din API.",
        });
      }
      navigate("/pacienti", {
        replace: true,
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva pacientul",
          description: error.response?.data.message ?? "Verifică datele introduse și încearcă din nou.",
        });
      }
      mapApiErrorToForm(error, setError);
    },
  });

  if (isEditMode && (!Number.isInteger(patientId) || (patientId as number) <= 0)) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Pacienți</span>
        <h2 className="mt-4">ID-ul pacientului nu este valid</h2>
        <p className="mt-3">Deschide din nou lista de pacienți și selectează un pacient cu `patient_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/pacienti">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (isEditMode && patientQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm datele pacientului</span>
        </div>
        <p className="mt-3">Pregătim formularul cu datele reale din API.</p>
      </section>
    );
  }

  if (isEditMode && patientQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2>Nu am putut încărca pacientul</h2>
            <p className="mt-3">Verifică dacă `patient_id` există în clinică și încearcă din nou.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => void patientQuery.refetch()} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary" to="/pacienti">
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="panel p-5 md:p-6 xl:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <span className="badge-soft">{isEditMode ? "Editare pacient" : "Pacient nou"}</span>
          <h2 className="mt-3">{isEditMode ? "Actualizează datele pacientului" : "Adaugă un pacient nou"}</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button className="button-primary gap-2" disabled={mutation.isPending || isSubmitting} form={patientFormId} type="submit">
            {mutation.isPending ? "Salvăm..." : isEditMode ? "Salvează modificările" : "Adaugă pacientul"}
            <Save className="h-5 w-5" />
          </button>
          <Link className="button-secondary gap-2" to="/pacienti">
            <ArrowLeft className="h-5 w-5" />
            Înapoi la listă
          </Link>
        </div>
      </div>

      <form className="mt-6 space-y-5" id={patientFormId} noValidate onSubmit={handleSubmit((values) => {
        if (!confirmFormSave("pacient", isEditMode)) {
          return;
        }

        mutation.mutate(values);
      })}>
        <div className="panel-subtle p-4 md:p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <div className="md:col-span-2 xl:col-span-5">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient_display_name">
              Nume pacient
            </label>
            <input
              aria-invalid={errors.patient_display_name !== undefined}
              className="input-base"
              id="patient_display_name"
              placeholder="Exemplu: Popescu Ana"
              {...register("patient_display_name")}
            />
            {errors.patient_display_name !== undefined ? (
              <p className="mt-2 text-sm font-medium text-danger">{errors.patient_display_name.message}</p>
            ) : null}
          </div>

          <div className="xl:col-span-3">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="cnp">
              CNP
            </label>
            <input
              aria-invalid={errors.cnp !== undefined}
              className="input-base"
              id="cnp"
              inputMode="numeric"
              maxLength={13}
              placeholder="Exemplu: 1960517400018"
              {...register("cnp", {
                setValueAs: (value: string) => (typeof value === "string" ? normalizePatientCnpInput(value) : ""),
              })}
            />
            {errors.cnp !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.cnp.message}</p> : null}
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="phone_number">
              Telefon
            </label>
            <input
              aria-invalid={errors.phone_number !== undefined}
              className="input-base"
              id="phone_number"
              placeholder="Exemplu: 0712345678"
              {...register("phone_number")}
            />
            {errors.phone_number !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.phone_number.message}</p> : null}
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="city">
              Oraș
            </label>
            <input
              aria-invalid={errors.city !== undefined}
              className="input-base"
              id="city"
              placeholder="Exemplu: București"
              {...register("city")}
            />
            {errors.city !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.city.message}</p> : null}
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="derived-sex">
              Sex
            </label>
            <input className="input-base bg-slate-50 text-slate-500" id="derived-sex" readOnly type="text" value={derivedSex} />
          </div>

          <div className="xl:col-span-3">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="derived-birth-date">
              Data nașterii
            </label>
            <input className="input-base bg-slate-50 text-slate-500" id="derived-birth-date" readOnly type="text" value={derivedBirthDateDisplay} />
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="derived-age">
              Vârstă
            </label>
            <input className="input-base bg-slate-50 text-slate-500" id="derived-age" readOnly type="text" value={ageLabel} />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="email">
              Email
            </label>
            <input
              aria-invalid={errors.email !== undefined}
              className="input-base"
              id="email"
              placeholder="opțional"
              type="email"
              {...register("email", {
                setValueAs: (value: string) => (typeof value === "string" ? value : ""),
              })}
            />
            {errors.email !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.email.message}</p> : null}
          </div>

          <div className="xl:col-span-2">
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="is_active">
              Status pacient
            </label>
            <select
              className="input-base"
              id="is_active"
              onChange={(event) => {
                setValue("is_active", event.target.value === "true", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              value={watchedIsActive ? "true" : "false"}
            >
              <option value="true">Activ</option>
              <option value="false">Inactiv</option>
            </select>
            {errors.is_active !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.is_active.message}</p> : null}
          </div>
          </div>
        </div>

        <div className="panel-subtle p-4 md:p-5">
          <label className="mb-2 block text-base font-semibold text-ink" htmlFor="notes">
            Notițe
          </label>
          <textarea
            aria-invalid={errors.notes !== undefined}
            className="input-base min-h-24 resize-y md:min-h-[112px]"
            id="notes"
            placeholder="Adaugă detalii utile pentru echipa clinicii"
            {...register("notes", {
              setValueAs: (value: string) => (typeof value === "string" ? value : ""),
            })}
          />
          {errors.notes !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.notes.message}</p> : null}
        </div>

        {mutation.isError ? (
          <div className="rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="font-semibold">Nu am putut salva datele</p>
                <p className="mt-1 text-sm text-danger/90">
                  {mutation.error instanceof AxiosError
                    ? (mutation.error.response?.data.message ?? "Verifică datele introduse și încearcă din nou.")
                    : "A apărut o problemă temporară. Încearcă din nou."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button className="button-primary gap-2" disabled={mutation.isPending || isSubmitting} type="submit">
            {mutation.isPending ? "Salvăm..." : isEditMode ? "Salvează modificările" : "Adaugă pacientul"}
            <Save className="h-5 w-5" />
          </button>
        </div>
      </form>
      </div>

      {isEditMode && patientId !== null && patientId > 0 ? (
        <div className="space-y-5">
          <SmsPatientCard
            defaultTemplateKey="follow-up"
            onSend={(payload) => {
              const historyItem = logPatientSms(payload);

              showToast({
                variant: historyItem.status === "sent" ? "success" : historyItem.status === "failed" ? "error" : "loading",
                title: historyItem.status === "sent" ? "SMS pacient trimis" : historyItem.status === "failed" ? "SMS pacient eșuat" : "SMS pacient în așteptare",
                description: historyItem.provider_response ?? "Mesajul a fost înregistrat local.",
              });

              return historyItem;
            }}
            patientId={patientId}
            phoneNumber={patientQuery.data?.phone_number ?? watchedPhoneNumber ?? ""}
            previewContext={patientSmsContext}
            subtitle="Poți trimite rapid un follow-up sau orice alt template SMS direct din fișa pacientului."
            templates={smsTemplates}
            title="SMS pacient"
          />

          <SmsHistorySection
            items={patientSmsHistory}
            onRetry={(historyId) => {
              const result = retryHistoryItem(historyId);

              if (result === null) {
                return;
              }

              showToast({
                variant: result.status === "sent" ? "success" : result.status === "failed" ? "error" : "loading",
                title: result.status === "sent" ? "SMS retrimis" : result.status === "failed" ? "Retrimiterea a eșuat" : "SMS retrimis și rămas în așteptare",
                description: result.provider_response ?? "Mesajul a fost actualizat local.",
              });
            }}
          />

          <PatientVisitServicesCard
            allowDoctorSelection
            allowSpecializationSelection
            subtitle="Selectezi specializarea consultației și serviciile efectuate, iar totalul se calculează instant."
          />
          <PatientVisitResultCard />
          <PatientReferralCard prefillPatientId={patientId} />
        </div>
      ) : null}
    </section>
  );
};