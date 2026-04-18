import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, RefreshCw, Send } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { confirmMessageRetry } from "../../shared/utils/confirm-actions";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import { getMessageById, retryMessage } from "./messages.api";

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const MessageDetailsPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const params = useParams();
  const messageId = params.message_id === undefined ? null : Number(params.message_id);

  const messageQuery = useQuery({
    queryKey: ["message", messageId],
    queryFn: async () => getMessageById(messageId as number),
    enabled: Number.isInteger(messageId) && (messageId as number) > 0,
  });

  const retryMutation = useMutation({
    mutationFn: async () => retryMessage(messageId as number),
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: "Retrimitem mesajul",
        description: "Acțiunea folosește endpointul real de retry.",
      });

      return { toastId };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["messages"] }),
        queryClient.invalidateQueries({ queryKey: ["message", messageId] }),
      ]);
      await messageQuery.refetch();
    },
    onError: (error, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut retrimite mesajul",
          description:
            error instanceof AxiosError
              ? ((error.response?.data as ApiErrorResponse | undefined)?.message ?? "Încearcă din nou.")
              : "Încearcă din nou.",
        });
      }
    },
    onSettled: (_data, error, _variables, context) => {
      if (context?.toastId !== undefined && error === null) {
        updateToast(context.toastId, {
          variant: "success",
          title: "Mesajul a fost retrimis",
          description: "Lista și detaliul au fost actualizate automat.",
        });
      }
    },
  });

  if (!Number.isInteger(messageId) || (messageId as number) <= 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Mesaje</span>
        <h2 className="mt-4">ID-ul mesajului nu este valid</h2>
        <p className="mt-3">Deschide din nou lista de mesaje și selectează un mesaj cu `message_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/mesaje">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (messageQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm detaliile mesajului</span>
        </div>
        <p className="mt-3">Preluăm datele reale din API.</p>
      </section>
    );
  }

  if (messageQuery.isError || messageQuery.data === undefined) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Mesaje</span>
            <h2 className="mt-4">Nu am putut deschide mesajul</h2>
            <p className="mt-3">Mesajul poate lipsi din clinică sau nu mai este disponibil. Folosește lista pentru a continua.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void messageQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/mesaje">
            <ArrowLeft className="h-5 w-5" />
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  const message = messageQuery.data;

  return (
    <section className="space-y-4">
      <div className="panel flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between md:p-8">
        <div>
          <span className="badge-soft">Detaliu mesaj</span>
          <h2 className="mt-4">Mesajul #{message.message_id}</h2>
          <p className="mt-3">Relațiile sunt afișate exclusiv prin ID numeric intern. `appointment_id` rămâne numeric, fără lookup textual.</p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" disabled={retryMutation.isPending} onClick={() => {
            if (!confirmMessageRetry()) {
              return;
            }

            retryMutation.mutate();
          }} type="button">
            <Send className="h-5 w-5" />
            {retryMutation.isPending ? "Retrimitem..." : "Retrimite mesajul"}
          </button>
          <Link className="button-secondary gap-2" to="/mesaje">
            <ArrowLeft className="h-5 w-5" />
            Înapoi la listă
          </Link>
        </div>
      </div>

      {retryMutation.isError ? (
        <div className="rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">Nu am putut retrimite mesajul</p>
              <p className="mt-1 text-sm text-danger/90">
                {retryMutation.error instanceof AxiosError
                  ? ((retryMutation.error.response?.data as ApiErrorResponse | undefined)?.message ?? "Încearcă din nou.")
                  : "Încearcă din nou."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
        <article className="panel p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Conținut</h3>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Subiect</p>
              <p className="mt-2 text-base text-ink">{message.message_subject}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Mesaj</p>
              <div className="mt-2 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 text-base leading-7 text-ink whitespace-pre-wrap">
                {message.message_body}
              </div>
            </div>
          </div>
        </article>

        <aside className="panel-subtle p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Detalii tehnice</h3>
          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">message_id</dt>
              <dd className="mt-1 text-base text-ink">{message.message_id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">appointment_id</dt>
              <dd className="mt-1 text-base text-ink">{message.appointment_id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Canal</dt>
              <dd className="mt-1 text-base text-ink">{message.channel_type}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Status</dt>
              <dd className="mt-1 text-base text-ink">{message.message_status}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Creat la</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(message.created_at)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Ultima actualizare</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(message.updated_at)}</dd>
            </div>
            {typeof message.error_details === "string" && message.error_details.trim() !== "" ? (
              <div>
                <dt className="font-semibold text-slate-500">Mesaj tehnic</dt>
                <dd className="mt-1 text-base text-danger">{message.error_details}</dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </div>
    </section>
  );
};