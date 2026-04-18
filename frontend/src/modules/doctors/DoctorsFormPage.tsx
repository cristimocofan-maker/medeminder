import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, Check, LoaderCircle, Save, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import { DoctorServicesOverrides } from "./components/DoctorServicesOverrides";
import { createDoctor, getDoctorById, listSpecializationOptions, updateDoctor } from "./doctors.api";
import { doctorFormSchema, type DoctorFormValues } from "./doctors.schema";

const defaultValues: DoctorFormValues = {
  doctor_display_name: "",
  specialization_id: 0,
  is_active: true,
};

const mapApiErrorToForm = (
  error: AxiosError<ApiErrorResponse>,
  setError: ReturnType<typeof useForm<DoctorFormValues>>["setError"],
): void => {
  const fieldErrors = error.response?.data.field_errors ?? [];

  fieldErrors.forEach((fieldError) => {
    if (fieldError.field === "doctor_display_name" || fieldError.field === "specialization_id" || fieldError.field === "is_active") {
      setError(fieldError.field, {
        type: "server",
        message: fieldError.message,
      });
    }
  });
};

export const DoctorsFormPage = (): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const params = useParams();
  const doctorId = params.doctor_id === undefined ? null : Number(params.doctor_id);
  const isEditMode = doctorId !== null;
  const [showConfirmOverlay, setShowConfirmOverlay] = useState(false);
  const [isConfirmOverlayVisible, setIsConfirmOverlayVisible] = useState(false);
  const [pendingValues, setPendingValues] = useState<DoctorFormValues | null>(null);
  const overlayRoot = typeof document === "undefined" ? null : document.body;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues,
  });

  const selectedSpecializationId = watch("specialization_id");
  const watchedIsActive = watch("is_active");

  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => getDoctorById(doctorId as number),
    enabled: isEditMode && Number.isInteger(doctorId) && (doctorId as number) > 0,
  });

  const specializationsQuery = useQuery({
    queryKey: ["doctor-specializations-options"],
    queryFn: listSpecializationOptions,
  });

  useEffect(() => {
    if (doctorQuery.data !== undefined) {
      reset({
        doctor_display_name: doctorQuery.data.doctor_display_name,
        specialization_id: doctorQuery.data.specialization_id,
        is_active: doctorQuery.data.is_active,
      });
    }
  }, [doctorQuery.data, reset]);

  useEffect(() => {
    if (!showConfirmOverlay) {
      setIsConfirmOverlayVisible(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsConfirmOverlayVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [showConfirmOverlay]);

  const mutation = useMutation({
    mutationFn: async (values: DoctorFormValues) => {
      if (isEditMode) {
        return updateDoctor(doctorId as number, values);
      }

      return createDoctor(values);
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: isEditMode ? "Salvăm modificările doctorului" : "Adăugăm doctorul",
        description: "Trimitem datele către endpointul real al backend-ului.",
      });

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctors"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["doctor", doctorId], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["appointment-doctors-options"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["appointment-specializations-options"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["doctor-specializations-options"], refetchType: "all" }),
      ]);
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "success",
          title: isEditMode ? "Doctor actualizat" : "Doctor adăugat",
          description: "Lista se va reîmprospăta din API-ul real.",
        });
      }
      navigate("/doctori", {
        replace: true,
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva doctorul",
          description: error.response?.data.message ?? "Verifică datele introduse și încearcă din nou.",
        });
      }
      mapApiErrorToForm(error, setError);
    },
  });

  const specializations = specializationsQuery.data ?? [];
  const hasSpecializations = specializations.length > 0;
  const canSave = hasSpecializations && !mutation.isPending && !isSubmitting;
  const selectedSpecializationName = specializations.find((specialization) => specialization.specialization_id === selectedSpecializationId)?.specialization_display_name ?? doctorQuery.data?.specialization_display_name ?? "";

  const submitAfterConfirmation = (): void => {
    if (pendingValues === null) {
      return;
    }

    mutation.mutate(pendingValues);
    setPendingValues(null);
  };

  if (isEditMode && (!Number.isInteger(doctorId) || (doctorId as number) <= 0)) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Doctori</span>
        <h2 className="mt-4">ID-ul doctorului nu este valid</h2>
        <p className="mt-3">Deschide din nou lista de doctori și selectează un doctor cu `doctor_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/doctori">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (isEditMode && doctorQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm datele doctorului</span>
        </div>
        <p className="mt-3">Pregătim formularul cu datele reale din API.</p>
      </section>
    );
  }

  if (isEditMode && doctorQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2>Nu am putut încărca medicul</h2>
            <p className="mt-3">Verifică dacă `doctor_id` există în clinică și încearcă din nou.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => void doctorQuery.refetch()} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary" to="/doctori">
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  if (specializationsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm specializările disponibile</span>
        </div>
        <p className="mt-3">Select-ul este populat exclusiv din endpointul real `/specializations`.</p>
      </section>
    );
  }

  if (specializationsQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Doctori</span>
            <h2 className="mt-4">Nu am putut încărca specializările</h2>
            <p className="mt-3">Fără specializări încărcate din API, formularul nu poate fi folosit în siguranță.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => void specializationsQuery.refetch()} type="button">
            Reîncearcă
          </button>
          <button className="button-secondary cursor-not-allowed opacity-60" disabled type="button">
            Adaugă prima specializare
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="panel p-6 md:p-8">
      {showConfirmOverlay && overlayRoot !== null ? createPortal(
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/48 px-4 backdrop-blur-[8px]">
          <div className={`w-full max-w-md rounded-[32px] border border-emerald-200 bg-white/96 px-7 py-8 text-center shadow-2xl shadow-slate-900/30 ring-1 ring-slate-200/90 transition-all duration-300 ${isConfirmOverlayVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"}`}>
            <div className="mx-auto flex h-24 w-24 items-center justify-center">
              <div className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100/90 transition-all duration-500 ${isConfirmOverlayVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
                <div className={`absolute inset-0 rounded-full border-8 border-emerald-300/40 ${isConfirmOverlayVisible ? "animate-ping" : ""}`} />
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all duration-700 ${isConfirmOverlayVisible ? "scale-100 rotate-0" : "scale-75 -rotate-12"}`}>
                  <Check className={`h-9 w-9 transition-all duration-700 ${isConfirmOverlayVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-2xl font-semibold text-ink">Confirmi salvarea?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isEditMode ? "Modificările vor fi salvate în datele medicului." : "Medicul va fi salvat în sistemul clinicii."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                className="button-primary min-w-[150px] gap-2"
                onClick={() => {
                  setShowConfirmOverlay(false);
                  submitAfterConfirmation();
                }}
                type="button"
              >
                <Check className="h-5 w-5" />
                Confirmă
              </button>
              <button
                className="button-secondary min-w-[150px]"
                onClick={() => {
                  setPendingValues(null);
                  setShowConfirmOverlay(false);
                }}
                type="button"
              >
                Renunță
              </button>
            </div>
          </div>
        </div>,
        overlayRoot,
      ) : null}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="badge-soft">{isEditMode ? "Editare medic" : "Medic nou"}</span>
          <h2 className="mt-4">{isEditMode ? "Actualizează datele medicului" : "Adaugă un medic nou"}</h2>
        </div>

        <Link className="button-secondary shrink-0 whitespace-nowrap gap-2" to="/doctori">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la listă
        </Link>
      </div>

      {!hasSpecializations ? (
        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-amber-900">
          <p className="font-semibold">Formularul nu poate fi salvat încă</p>
          <p className="mt-2 text-sm leading-6">Nu există specializări în DB. Pentru a crea un medic real, este necesară cel puțin o specializare existentă.</p>
          <div className="mt-4">
            <button className="button-secondary cursor-not-allowed opacity-60" disabled type="button">
              Adaugă prima specializare
            </button>
          </div>
        </div>
      ) : null}

      <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit((values) => {
        setPendingValues(values);
        setShowConfirmOverlay(true);
      })}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="doctor_display_name">
              Nume medic
            </label>
            <input
              aria-invalid={errors.doctor_display_name !== undefined}
              className="input-base"
              id="doctor_display_name"
              placeholder="Exemplu: Dr. Ionescu Andrei"
              {...register("doctor_display_name")}
            />
            {errors.doctor_display_name !== undefined ? (
              <p className="mt-2 text-sm font-medium text-danger">{errors.doctor_display_name.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="specialization_id">
              Specializare
            </label>
            <select
              aria-invalid={errors.specialization_id !== undefined}
              className="input-base"
              disabled={!hasSpecializations}
              id="specialization_id"
              {...register("specialization_id", { valueAsNumber: true })}
            >
              <option value="">Alege specializarea</option>
              {specializations.map((specialization) => (
                <option key={specialization.specialization_id} value={specialization.specialization_id}>
                  {specialization.specialization_display_name}
                </option>
              ))}
            </select>
            {errors.specialization_id !== undefined ? (
              <p className="mt-2 text-sm font-medium text-danger">{errors.specialization_id.message}</p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="is_active">
              Status medic
            </label>
            <select
              className="input-base max-w-md"
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

          <div className="flex lg:justify-end">
            <button className="button-primary gap-2" disabled={!canSave} type="submit">
              {mutation.isPending ? "Salvăm..." : isEditMode ? "Salvează modificările" : "Adaugă medicul"}
              <Save className="h-5 w-5" />
            </button>
          </div>
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

      </form>
      </div>

      {isEditMode && doctorQuery.data !== undefined && selectedSpecializationId > 0 ? (
        <DoctorServicesOverrides
          doctor={{
            doctor_display_name: doctorQuery.data.doctor_display_name,
            doctor_id: doctorQuery.data.doctor_id,
            specialization_id: selectedSpecializationId,
          }}
          specializationName={selectedSpecializationName}
        />
      ) : null}
    </section>
  );
};