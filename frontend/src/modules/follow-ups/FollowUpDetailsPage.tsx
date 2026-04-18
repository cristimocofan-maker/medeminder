import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FOLLOW_UP_STATUS_VALUES, type FollowUpStatus } from "../../../../backend/src/shared/enums/follow-up-status.enum";
import { confirmFollowUpStatusChange } from "../../shared/utils/confirm-actions";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";
import { getFollowUpById, updateFollowUpStatus } from "./follow-ups.api";

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const FollowUpDetailsPage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const params = useParams();
  const followUpId = params.follow_up_id === undefined ? null : Number(params.follow_up_id);

  const followUpQuery = useQuery({
    queryKey: ["follow-up", followUpId],
    queryFn: async () => getFollowUpById(followUpId as number),
    enabled: Number.isInteger(followUpId) && (followUpId as number) > 0,
  });

  const [selectedStatus, setSelectedStatus] = useState<FollowUpStatus>(FOLLOW_UP_STATUS_VALUES[0]);

  useEffect(() => {
    if (followUpQuery.data !== undefined) {
      setSelectedStatus(followUpQuery.data.follow_up_status);
    }
  }, [followUpQuery.data]);

  const statusMutation = useMutation({
    mutationFn: async () =>
      updateFollowUpStatus(followUpId as number, {
        follow_up_status: selectedStatus,
      }),
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: "Actualizăm statusul follow-up",
        description: "Trimitem schimbarea către endpointul real al backend-ului.",
      });

      return { toastId };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["follow-ups"] }),
        queryClient.invalidateQueries({ queryKey: ["follow-up", followUpId] }),
      ]);
      await followUpQuery.refetch();
    },
    onError: (error, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut actualiza statusul",
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
          title: "Statusul revenirii a fost actualizat",
          description: "Lista și detaliul au fost reîmprospătate automat.",
        });
      }
    },
  });

  if (!Number.isInteger(followUpId) || (followUpId as number) <= 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Reveniri</span>
        <h2 className="mt-4">ID-ul revenirii nu este valid</h2>
        <p className="mt-3">Deschide din nou lista și selectează o revenire cu `follow_up_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/reveniri">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (followUpQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm detaliile revenirii</span>
        </div>
        <p className="mt-3">Preluăm datele reale din API.</p>
      </section>
    );
  }

  if (followUpQuery.isError || followUpQuery.data === undefined) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Reveniri</span>
            <h2 className="mt-4">Nu am putut deschide revenirea</h2>
            <p className="mt-3">Revenirea poate lipsi din clinică sau nu mai este disponibilă.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void followUpQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/reveniri">
            <ArrowLeft className="h-5 w-5" />
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  const followUp = followUpQuery.data;

  return (
    <section className="space-y-4">
      <div className="panel flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between md:p-8">
        <div>
          <span className="badge-soft">Detaliu revenire</span>
          <h2 className="mt-4">Revenirea #{followUp.follow_up_id}</h2>
          <p className="mt-3">`follow_up_id` și `appointment_id` rămân exclusiv identificatori numerici interni.</p>
        </div>

        <Link className="button-secondary gap-2" to="/reveniri">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la listă
        </Link>
      </div>

      {statusMutation.isError ? (
        <div className="rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">Nu am putut actualiza statusul</p>
              <p className="mt-1 text-sm text-danger/90">
                {statusMutation.error instanceof AxiosError
                  ? ((statusMutation.error.response?.data as ApiErrorResponse | undefined)?.message ?? "Încearcă din nou.")
                  : "Încearcă din nou."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
        <article className="panel p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Actualizare status</h3>
          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="follow_up_status">
                follow_up_status
              </label>
              <select
                className="input-base"
                id="follow_up_status"
                onChange={(event) => setSelectedStatus(event.target.value as FollowUpStatus)}
                value={selectedStatus}
              >
                {FOLLOW_UP_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm text-slate-500">Valorile sunt preluate din enumul real al backend-ului și trimise către endpointul real de update status.</p>
            </div>

            <button className="button-primary gap-2" disabled={statusMutation.isPending || selectedStatus === followUp.follow_up_status} onClick={() => {
              if (!confirmFollowUpStatusChange()) {
                return;
              }

              statusMutation.mutate();
            }} type="button">
              <Save className="h-5 w-5" />
              {statusMutation.isPending ? "Actualizăm..." : "Salvează statusul"}
            </button>
          </div>
        </article>

        <aside className="panel-subtle p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Detalii tehnice</h3>
          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">follow_up_id</dt>
              <dd className="mt-1 text-base text-ink">{followUp.follow_up_id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">appointment_id</dt>
              <dd className="mt-1 text-base text-ink">{followUp.appointment_id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">follow_up_status</dt>
              <dd className="mt-1 text-base text-ink">{followUp.follow_up_status}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">scheduled_for</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(followUp.scheduled_for)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">created_at</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(followUp.created_at)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">updated_at</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(followUp.updated_at)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">follow_up_notes</dt>
              <dd className="mt-1 text-base text-ink whitespace-pre-wrap">{followUp.follow_up_notes?.trim() ? followUp.follow_up_notes : "-"}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
};