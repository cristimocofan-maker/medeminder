import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, LoaderCircle, Plus, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { confirmFormSave } from "../../shared/utils/confirm-actions";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import {
  createSpecialization,
  createSpecializationService,
  deleteSpecializationService,
  getSpecializationById,
  listSpecializationServices,
  updateSpecialization,
  updateSpecializationService,
} from "./specializations.api";
import { SpecializationServicesEditor } from "./components/SpecializationServicesEditor";
import type { SpecializationServiceMutationPayload } from "./specializations.types";
import { specializationFormSchema, type SpecializationFormValues } from "./specializations.schema";

const defaultValues: SpecializationFormValues = {
  specialization_display_name: "",
};

const mapApiErrorToForm = (
  error: AxiosError<ApiErrorResponse>,
  setError: ReturnType<typeof useForm<SpecializationFormValues>>["setError"],
): void => {
  const fieldErrors = error.response?.data.field_errors ?? [];

  fieldErrors.forEach((fieldError) => {
    if (fieldError.field === "specialization_display_name") {
      setError(fieldError.field, {
        type: "server",
        message: fieldError.message,
      });
    }
  });
};

export const SpecializationsFormPage = (): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const params = useParams();
  const specializationId = params.specialization_id === undefined ? null : Number(params.specialization_id);
  const isEditMode = specializationId !== null;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<SpecializationFormValues>({
    resolver: zodResolver(specializationFormSchema),
    defaultValues,
  });

  const specializationQuery = useQuery({
    queryKey: ["specialization", specializationId],
    queryFn: async () => getSpecializationById(specializationId as number),
    enabled: isEditMode && Number.isInteger(specializationId) && (specializationId as number) > 0,
  });

  const specializationServicesQuery = useQuery({
    queryKey: ["specialization-services", specializationId],
    queryFn: async () => listSpecializationServices(specializationId as number),
    enabled: isEditMode && Number.isInteger(specializationId) && (specializationId as number) > 0,
  });

  useEffect(() => {
    if (specializationQuery.data !== undefined) {
      reset({
        specialization_display_name: specializationQuery.data.specialization_display_name,
      });
    }
  }, [reset, specializationQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: SpecializationFormValues) => {
      if (isEditMode) {
        return updateSpecialization(specializationId as number, values);
      }

      return createSpecialization(values);
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: isEditMode ? "Salvăm modificările specializării" : "Adăugăm specializarea",
        description: "Trimitem datele către endpointul real al backend-ului.",
      });

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["specializations"], refetchType: "all" });
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "success",
          title: isEditMode ? "Specializare actualizată" : "Specializare adăugată",
          description: "Lista se va reîmprospăta din API-ul real.",
        });
      }
      navigate("/specializari", {
        replace: true,
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva specializarea",
          description: error.response?.data.message ?? "Verifică datele introduse și încearcă din nou.",
        });
      }
      mapApiErrorToForm(error, setError);
    },
  });

  const serviceMutation = useMutation({
    mutationFn: async (input: { payload: SpecializationServiceMutationPayload; serviceId?: number }) => {
      if (specializationId === null) {
        throw new Error("Specializarea trebuie salvată înainte de servicii.");
      }

      if (input.serviceId === undefined) {
        return createSpecializationService(specializationId, input.payload);
      }

      return updateSpecializationService(specializationId, input.serviceId, input.payload);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["specialization-services", specializationId], refetchType: "all" });
      showToast({
        variant: "success",
        title: variables.serviceId === undefined ? "Serviciu adăugat" : "Serviciu actualizat",
        description: "Lista serviciilor a fost actualizată din DB.",
      });
    },
    onError: (error: unknown) => {
      showToast({
        variant: "error",
        title: "Nu am putut salva serviciul",
        description: error instanceof AxiosError ? (error.response?.data.message ?? "Încearcă din nou.") : "Încearcă din nou.",
      });
    },
  });

  const serviceDeleteMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      if (specializationId === null) {
        throw new Error("Specializarea trebuie salvată înainte de servicii.");
      }

      return deleteSpecializationService(specializationId, serviceId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["specialization-services", specializationId], refetchType: "all" });
      showToast({
        variant: "success",
        title: "Serviciu șters",
        description: "Lista serviciilor a fost actualizată din DB.",
      });
    },
    onError: (error: unknown) => {
      showToast({
        variant: "error",
        title: "Nu am putut șterge serviciul",
        description: error instanceof AxiosError ? (error.response?.data.message ?? "Încearcă din nou.") : "Încearcă din nou.",
      });
    },
  });

  if (isEditMode && (!Number.isInteger(specializationId) || (specializationId as number) <= 0)) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Specializări</span>
        <h2 className="mt-4">ID-ul specializării nu este valid</h2>
        <p className="mt-3">Deschide din nou lista de specializări și selectează o specializare cu `specialization_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/specializari">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (isEditMode && specializationQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm datele specializării</span>
        </div>
        <p className="mt-3">Pregătim formularul cu datele reale din API.</p>
      </section>
    );
  }

  if (isEditMode && specializationQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2>Nu am putut încărca specializarea</h2>
            <p className="mt-3">Verifică dacă `specialization_id` există în clinică și încearcă din nou.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => void specializationQuery.refetch()} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary" to="/specializari">
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <span className="badge-soft">{isEditMode ? "Editare specializare" : "Specializare nouă"}</span>
          <h2 className="mt-4">{isEditMode ? "Actualizează specializarea" : "Adaugă o specializare nouă"}</h2>
        </div>

        <Link className="button-secondary gap-2" to="/specializari">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la listă
        </Link>
      </div>

      <form className="mt-6 space-y-5" noValidate onSubmit={handleSubmit((values) => {
        if (!confirmFormSave("specializare", isEditMode)) {
          return;
        }

        mutation.mutate(values);
      })}>
        <div>
          <label className="mb-2 block text-base font-semibold text-ink" htmlFor="specialization_display_name">
            Nume specializare
          </label>
          <input
            aria-invalid={errors.specialization_display_name !== undefined}
            className="input-base max-w-2xl"
            id="specialization_display_name"
            placeholder="Exemplu: Cardiologie"
            {...register("specialization_display_name")}
          />
          {errors.specialization_display_name !== undefined ? (
            <p className="mt-2 text-sm font-medium text-danger">{errors.specialization_display_name.message}</p>
          ) : null}
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

        <div className="flex justify-end">
          <button className="button-primary gap-2" disabled={mutation.isPending || isSubmitting} type="submit">
            {mutation.isPending ? "Salvăm..." : isEditMode ? "Salvează modificările" : "Adaugă specializarea"}
            <Save className="h-5 w-5" />
          </button>
        </div>
      </form>

      {isEditMode && specializationId !== null ? (
        <div className="mt-6 border-t border-slate-100 pt-5">
          {specializationServicesQuery.isLoading ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Încărcăm serviciile specializării...
            </div>
          ) : (
            <div className="space-y-3">
              {specializationServicesQuery.isError ? (
                <div className="rounded-[24px] border border-danger/20 bg-orange-50 px-4 py-4 text-sm text-danger">
                  Nu am putut încărca serviciile specializării. Poți încerca din nou sau poți adăuga un serviciu nou.
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-ink">Servicii</h3>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  {specializationServicesQuery.data?.length ?? 0} servicii
                </div>
              </div>
              <SpecializationServicesEditor
                isBusy={serviceMutation.isPending || serviceDeleteMutation.isPending}
                onDeleteService={(serviceId) => serviceDeleteMutation.mutate(serviceId)}
                onSaveService={(payload, serviceId) => serviceMutation.mutate({ payload, serviceId })}
                services={specializationServicesQuery.data ?? []}
                specializationId={specializationId}
                specializationName={specializationQuery.data?.specialization_display_name ?? "Specializare"}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          Salvează mai întâi specializarea, apoi poți adăuga servicii.
        </div>
      )}
    </section>
  );
};