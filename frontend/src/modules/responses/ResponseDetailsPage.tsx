import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, LoaderCircle, RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { getResponseById } from "./responses.api";

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const ResponseDetailsPage = (): JSX.Element => {
  const params = useParams();
  const responseId = params.response_id === undefined ? null : Number(params.response_id);

  const responseQuery = useQuery({
    queryKey: ["response", responseId],
    queryFn: async () => getResponseById(responseId as number),
    enabled: Number.isInteger(responseId) && (responseId as number) > 0,
  });

  if (!Number.isInteger(responseId) || (responseId as number) <= 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Răspunsuri</span>
        <h2 className="mt-4">ID-ul răspunsului nu este valid</h2>
        <p className="mt-3">Deschide din nou lista și selectează un răspuns cu `response_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full md:w-auto" to="/raspunsuri">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (responseQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm detaliile răspunsului</span>
        </div>
        <p className="mt-3">Preluăm datele reale din API.</p>
      </section>
    );
  }

  if (responseQuery.isError || responseQuery.data === undefined) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Răspunsuri</span>
            <h2 className="mt-4">Nu am putut deschide răspunsul</h2>
            <p className="mt-3">Răspunsul poate lipsi din clinică sau nu mai este disponibil.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void responseQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/raspunsuri">
            <ArrowLeft className="h-5 w-5" />
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  const response = responseQuery.data;

  return (
    <section className="space-y-4">
      <div className="panel flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between md:p-8">
        <div>
          <span className="badge-soft">Detaliu răspuns</span>
          <h2 className="mt-4">Răspunsul #{response.response_id}</h2>
          <p className="mt-3">`response_id` și `message_id` rămân exclusiv identificatori numerici interni.</p>
        </div>

        <Link className="button-secondary gap-2" to="/raspunsuri">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la listă
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(300px,0.7fr)]">
        <article className="panel p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Conținut răspuns</h3>
          <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 text-base leading-7 text-ink whitespace-pre-wrap">
            {response.response_text}
          </div>
        </article>

        <aside className="panel-subtle p-6 md:p-8">
          <h3 className="text-xl font-semibold text-ink">Detalii tehnice</h3>
          <dl className="mt-6 space-y-4 text-sm text-slate-600">
            <div>
              <dt className="font-semibold text-slate-500">response_id</dt>
              <dd className="mt-1 text-base text-ink">{response.response_id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">message_id</dt>
              <dd className="mt-1 text-base text-ink">{response.message_id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">response_status</dt>
              <dd className="mt-1 text-base text-ink">{response.response_status}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">created_at</dt>
              <dd className="mt-1 text-base text-ink">{formatDate(response.created_at)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
};