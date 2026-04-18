import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, FileStack, LoaderCircle, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CHANNEL_TYPE_VALUES } from "../../../../backend/src/shared/enums/channel-type.enum";
import { confirmFormSave } from "../../shared/utils/confirm-actions";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import {
  createMessageTemplate,
  getMessageTemplateById,
  updateMessageTemplate,
} from "./message-templates.api";
import { messageTemplateFormSchema, type MessageTemplateFormValues } from "./message-templates.schema";

const defaultValues: MessageTemplateFormValues = {
  template_name: "",
  channel_type: "WhatsApp",
  message_subject: "",
  message_body: "",
};

const mapApiErrorToForm = (
  error: AxiosError<ApiErrorResponse>,
  setError: ReturnType<typeof useForm<MessageTemplateFormValues>>["setError"],
): void => {
  const fieldErrors = error.response?.data.field_errors ?? [];

  fieldErrors.forEach((fieldError) => {
    if (
      fieldError.field === "template_name" ||
      fieldError.field === "channel_type" ||
      fieldError.field === "message_subject" ||
      fieldError.field === "message_body"
    ) {
      setError(fieldError.field, {
        type: "server",
        message: fieldError.message,
      });
    }
  });
};

export const MessageTemplatesFormPage = (): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const params = useParams();
  const templateId = params.template_id === undefined ? null : Number(params.template_id);
  const isEditMode = templateId !== null;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<MessageTemplateFormValues>({
    resolver: zodResolver(messageTemplateFormSchema),
    defaultValues,
  });

  const templateQuery = useQuery({
    queryKey: ["message-template", templateId],
    queryFn: async () => getMessageTemplateById(templateId as number),
    enabled: isEditMode && Number.isInteger(templateId) && (templateId as number) > 0,
  });

  useEffect(() => {
    if (templateQuery.data !== undefined) {
      reset({
        template_name: templateQuery.data.template_name,
        channel_type: templateQuery.data.channel_type,
        message_subject: templateQuery.data.message_subject,
        message_body: templateQuery.data.message_body,
      });
    }
  }, [reset, templateQuery.data]);

  const mutation = useMutation({
    mutationFn: async (values: MessageTemplateFormValues) => {
      if (isEditMode) {
        return updateMessageTemplate(templateId as number, values);
      }

      return createMessageTemplate(values);
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: isEditMode ? "Salvăm modificările template-ului" : "Adăugăm template-ul",
        description: "Trimitem datele către endpointul real al backend-ului.",
      });

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["message-templates"] });
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "success",
          title: isEditMode ? "Template actualizat" : "Template adăugat",
          description: "Lista se va reîmprospăta din API-ul real.",
        });
      }
      navigate("/template-uri", {
        replace: true,
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva template-ul",
          description: (error.response?.data as ApiErrorResponse | undefined)?.message ?? "Verifică datele introduse și încearcă din nou.",
        });
      }
      mapApiErrorToForm(error, setError);
    },
  });

  if (isEditMode && (!Number.isInteger(templateId) || (templateId as number) <= 0)) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Template-uri</span>
        <h2 className="mt-4">ID-ul template-ului nu este valid</h2>
        <p className="mt-3">Deschide din nou lista de template-uri și selectează un template cu `template_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/template-uri">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (isEditMode && templateQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm datele template-ului</span>
        </div>
        <p className="mt-3">Pregătim formularul cu datele reale din API.</p>
      </section>
    );
  }

  if (isEditMode && templateQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2>Nu am putut încărca template-ul</h2>
            <p className="mt-3">Verifică dacă `template_id` există în clinică și încearcă din nou.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => void templateQuery.refetch()} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary" to="/template-uri">
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
          <span className="badge-soft">{isEditMode ? "Editare template" : "Template nou"}</span>
          <h2 className="mt-4">{isEditMode ? "Actualizează template-ul" : "Adaugă un template nou"}</h2>
          <p className="mt-3 max-w-3xl">Canalul este selectat exclusiv din enumul real folosit în backend: WhatsApp, SMS, Email.</p>
        </div>

        <Link className="button-secondary gap-2" to="/template-uri">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la listă
        </Link>
      </div>

      <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit((values) => {
        if (!confirmFormSave("template", isEditMode)) {
          return;
        }

        mutation.mutate(values);
      })}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="template_name">
              Nume template
            </label>
            <input
              aria-invalid={errors.template_name !== undefined}
              className="input-base"
              id="template_name"
              placeholder="Exemplu: Confirmare programare"
              {...register("template_name")}
            />
            <p className="mt-2 text-sm text-slate-500">Identificarea rămâne exclusiv prin `template_id` numeric, nu prin nume.</p>
            {errors.template_name !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.template_name.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="channel_type">
              Canal
            </label>
            <select aria-invalid={errors.channel_type !== undefined} className="input-base" id="channel_type" {...register("channel_type")}>
              {CHANNEL_TYPE_VALUES.map((channelType: (typeof CHANNEL_TYPE_VALUES)[number]) => (
                <option key={channelType} value={channelType}>
                  {channelType}
                </option>
              ))}
            </select>
            <p className="mt-2 text-sm text-slate-500">Valorile trimise sunt exclusiv cele acceptate de backend: WhatsApp, SMS, Email.</p>
            {errors.channel_type !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.channel_type.message}</p> : null}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-ink" htmlFor="message_subject">
            Subiect mesaj
          </label>
          <input
            aria-invalid={errors.message_subject !== undefined}
            className="input-base"
            id="message_subject"
            placeholder="Exemplu: Confirmarea vizitei"
            {...register("message_subject")}
          />
          <p className="mt-2 text-sm text-slate-500">Câmp obligatoriu conform contractului real al backend-ului.</p>
          {errors.message_subject !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.message_subject.message}</p> : null}
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-ink" htmlFor="message_body">
            Conținut template
          </label>
          <textarea
            aria-invalid={errors.message_body !== undefined}
            className="input-base min-h-40 resize-y"
            id="message_body"
            placeholder="Scrie conținutul complet al template-ului"
            {...register("message_body")}
          />
          <p className="mt-2 text-sm text-slate-500">Backend-ul nu expune un status activ/inactiv pentru template-uri, deci formularul nu inventează un astfel de câmp.</p>
          {errors.message_body !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.message_body.message}</p> : null}
        </div>

        {mutation.isError ? (
          <div className="rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="font-semibold">Nu am putut salva datele</p>
                <p className="mt-1 text-sm text-danger/90">
                  {mutation.error instanceof AxiosError
                    ? ((mutation.error.response?.data as ApiErrorResponse | undefined)?.message ?? "Verifică datele introduse și încearcă din nou.")
                    : "A apărut o problemă temporară. Încearcă din nou."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FileStack className="h-4 w-4 text-primary" />
            După salvare revii automat la lista reală de template-uri.
          </div>

          <button className="button-primary gap-2" disabled={mutation.isPending || isSubmitting} type="submit">
            {mutation.isPending ? "Salvăm..." : isEditMode ? "Salvează modificările" : "Adaugă template-ul"}
            <Save className="h-5 w-5" />
          </button>
        </div>
      </form>
    </section>
  );
};