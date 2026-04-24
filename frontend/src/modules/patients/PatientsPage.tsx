import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { listPatients } from "./patients.api";

const pageSize = 10;

const parsePage = (value: string | null): number => {
  if (value === null) {
    return 1;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return 1;
  }

  return parsedValue;
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const PatientsPage = (): JSX.Element | null => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const page = parsePage(searchParams.get("page"));
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const patientsQuery = useQuery({
    queryKey: ["patients", { page }],
    queryFn: async () =>
      listPatients({
        page,
        page_size: pageSize,
        sort_by: "patient_id",
        sort_direction: "asc",
      }),
  });

  useEffect(() => {
    if (successMessage !== undefined) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.search, navigate, successMessage]);

  const totalPages = patientsQuery.data === undefined ? 1 : Math.max(1, Math.ceil(patientsQuery.data.total_count / patientsQuery.data.page_size));

  const handlePageChange = (nextPage: number): void => {
    setSearchParams({ page: String(nextPage) });
  };

  if (patientsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Pacienți</span>
        <h2 className="mt-4">Încărcăm lista reală de pacienți</h2>
        <p className="mt-3">Preluăm datele direct din endpointul real `/patients`.</p>
      </section>
    );
  }

  if (patientsQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Pacienți</span>
            <h2 className="mt-4">Nu am putut încărca lista de pacienți</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void patientsQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/pacienti/nou">
            <Plus className="h-5 w-5" />
            Adaugă pacient
          </Link>
        </div>
      </section>
    );
  }

  const patientsData = patientsQuery.data;
  const normalizedSearchValue = searchValue.trim();
  const isNumericSearch = /^\d+$/.test(normalizedSearchValue);

  if (patientsData === undefined) {
    return null;
  }

  if (patientsData.items.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Pacienți</span>
        <h2 className="mt-4">Nu există încă pacienți în clinică</h2>
        <p className="mt-3">
          Când baza de date nu conține pacienți, afișăm acest empty state clar. Următorul pas este să adaugi primul pacient.
        </p>
        <Link className="button-primary mt-6 inline-flex gap-2" to="/pacienti/nou">
          <Plus className="h-5 w-5" />
          Adaugă primul pacient
        </Link>
      </section>
    );
  }

  const filteredItems = (() => {
    const loweredSearch = normalizedSearchValue.toLocaleLowerCase();

    const nextItems = patientsData.items.filter((patient) => {
      if (normalizedSearchValue === "") {
        return true;
      }

      if (isNumericSearch) {
        return String(patient.patient_id) === normalizedSearchValue;
      }

      return patient.patient_display_name.toLocaleLowerCase().includes(loweredSearch);
    });

    return nextItems;
  })();

  const hasLocalFilters = normalizedSearchValue !== "";
  const activeCount = patientsData.items.filter((patient) => patient.is_active).length;
  const inactiveCount = patientsData.items.length - activeCount;

  return (
    <section className="space-y-4">
      {successMessage !== undefined ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-success">
          <p className="font-semibold">{successMessage}</p>
        </div>
      ) : null}

      <div className="panel p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="badge-soft">Pacienți</span>
            <h2 className="mt-3 text-3xl md:text-[2.3rem] md:leading-tight">Registrul pacienților</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="button-primary gap-2 px-4 py-3" to="/pacienti/nou">
              <Plus className="h-5 w-5" />
              Pacient nou
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:max-w-3xl">
          <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{patientsData.total_count}</p>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Activi</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{activeCount}</p>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Inactivi</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{inactiveCount}</p>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-4 md:px-6">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_auto] xl:items-end">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="patients-local-search">
                Căutare
              </label>
              <input
                className="input-base"
                id="patients-local-search"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Caută după ID sau pacient"
                value={searchValue}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500">Acțiune rapidă</label>
              <Link className="button-secondary w-full gap-2 xl:min-w-[180px]" to="/pacienti/nou">
                <Plus className="h-5 w-5" />
                Adaugă pacient
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {filteredItems.length} afișați
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {patientsData.total_count} total
            </span>
            {hasLocalFilters ? (
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                Filtre active
              </span>
            ) : null}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-8 md:px-8">
            <h3 className="text-lg font-semibold text-ink">Nu există rezultate pentru căutarea curentă</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
            <thead className="bg-slate-50/90">
              <tr>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">ID</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pacient</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Telefon</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Actualizat</th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((patient) => (
                <tr className="border-t border-slate-100 align-middle hover:bg-slate-50/60" key={patient.patient_id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-ink">#{patient.patient_id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-ink">{patient.patient_display_name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{patient.phone_number}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{patient.email ?? "-"}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${patient.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                      {patient.is_active ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(patient.updated_at)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <Link className="button-secondary inline-flex min-h-10 min-w-[110px] justify-center px-4 py-2 text-sm" to={`/pacienti/${patient.patient_id}`}>
                      Editează
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Pagina {patientsData.page} / {totalPages}</span>
            <span>{filteredItems.length} rezultate</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="button-secondary gap-2"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
              Pagina anterioară
            </button>

            <button
              className="button-primary gap-2"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              type="button"
            >
              Pagina următoare
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};