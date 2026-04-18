import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { listAppointments } from "./appointments.api";

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

const getStatusBadgeClassName = (value: string): string => {
  if (value === "Confirmată" || value === "Finalizată") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "Anulată") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
};

const getConfirmationBadgeClassName = (value: string): string => {
  if (value === "Răspuns DA") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "Răspuns NU") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (value === "Fără răspuns") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
};

export const AppointmentsPage = (): JSX.Element | null => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const page = parsePage(searchParams.get("page"));
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", { page }],
    queryFn: async () =>
      listAppointments({
        page,
        page_size: pageSize,
        sort_by: "appointment_id",
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

  const totalPages = appointmentsQuery.data === undefined
    ? 1
    : Math.max(1, Math.ceil(appointmentsQuery.data.total_count / appointmentsQuery.data.page_size));

  const handlePageChange = (nextPage: number): void => {
    setSearchParams({ page: String(nextPage) });
  };

  if (appointmentsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Programări</span>
        <h2 className="mt-4">Încărcăm lista reală de programări</h2>
        <p className="mt-3">Preluăm datele direct din endpointul real `/appointments`.</p>
      </section>
    );
  }

  if (appointmentsQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Programări</span>
            <h2 className="mt-4">Nu am putut încărca lista de programări</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void appointmentsQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/programari/nou_1">
            <Plus className="h-5 w-5" />
            Adaugă programare
          </Link>
        </div>
      </section>
    );
  }

  const appointmentsData = appointmentsQuery.data;
  const normalizedSearchValue = searchValue.trim();
  const isNumericSearch = /^\d+$/.test(normalizedSearchValue);

  if (appointmentsData === undefined) {
    return null;
  }

  if (appointmentsData.items.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Programări</span>
        <h2 className="mt-4">Nu există încă programări în clinică</h2>
        <p className="mt-3">Când baza de date nu conține programări, afișăm acest empty state clar și îți oferim următorul pas util.</p>
        <Link className="button-primary mt-6 inline-flex gap-2" to="/programari/nou_1">
          <Plus className="h-5 w-5" />
          Adaugă prima programare
        </Link>
      </section>
    );
  }

  const filteredItems = (() => {
    const loweredSearch = normalizedSearchValue.toLocaleLowerCase();

    const nextItems = appointmentsData.items.filter((appointment) => {
      if (normalizedSearchValue === "") {
        return true;
      }

      if (isNumericSearch) {
        return String(appointment.appointment_id) === normalizedSearchValue;
      }

      return appointment.doctor_display_name.toLocaleLowerCase().includes(loweredSearch);
    });

    return [...nextItems].sort((leftAppointment, rightAppointment) => {
      const comparison = leftAppointment.doctor_display_name.localeCompare(rightAppointment.doctor_display_name, "ro", {
        sensitivity: "base",
      });

      return sortDirection === "asc" ? comparison : -comparison;
    });
  })();

  const hasLocalFilters = normalizedSearchValue !== "" || sortDirection !== "asc";
  const confirmedCount = appointmentsData.items.filter((appointment) => appointment.confirmation_status === "Răspuns DA").length;
  const pendingCount = appointmentsData.items.filter((appointment) => appointment.confirmation_status === "Fără răspuns").length;
  const todayCount = appointmentsData.items.filter((appointment) => {
    const date = new Date(appointment.start_date_time);
    const today = new Date();

    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }).length;

  const clearLocalFilters = (): void => {
    setSearchValue("");
    setSortDirection("asc");
  };

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
          <span className="badge-soft">Programări</span>
            <h2 className="mt-3 text-3xl md:text-[2.3rem] md:leading-tight">Agenda programărilor</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="button-primary gap-2 px-4 py-3" to="/programari/nou_1">
              <Plus className="h-5 w-5" />
              Programare nouă
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3 xl:max-w-3xl">
          <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Astăzi</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{todayCount}</p>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Confirmate</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{confirmedCount}</p>
          </div>
          <div className="rounded-[22px] bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">În așteptare</p>
            <p className="mt-1 text-2xl font-semibold text-ink">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-4 md:px-6">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_auto_auto] xl:items-end">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="appointments-local-search">
                Căutare
              </label>
              <input
                className="input-base"
                id="appointments-local-search"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Caută după ID sau doctor"
                value={searchValue}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500">Sortare</label>
              <button className="button-secondary w-full gap-2 xl:min-w-[190px]" onClick={() => setSortDirection((currentDirection) => currentDirection === "asc" ? "desc" : "asc")} type="button">
                Doctor {sortDirection === "asc" ? "A-Z" : "Z-A"}
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-500">Acțiuni</label>
              <button className="button-secondary w-full gap-2 xl:min-w-[140px]" disabled={!hasLocalFilters} onClick={clearLocalFilters} type="button">
                Șterge filtrele
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {filteredItems.length} afișate
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {appointmentsData.total_count} total
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
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Doctor</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Pacient</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Confirmare</th>
                <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Început</th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((appointment) => (
                <tr className="border-t border-slate-100 align-middle hover:bg-slate-50/60" key={appointment.appointment_id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-ink">#{appointment.appointment_id}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-ink">{appointment.doctor_display_name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-ink">{appointment.patient_display_name}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClassName(appointment.appointment_status)}`}>
                      {appointment.appointment_status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getConfirmationBadgeClassName(appointment.confirmation_status)}`}>
                      {appointment.confirmation_status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">{formatDate(appointment.start_date_time)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right">
                    <Link className="button-secondary inline-flex min-h-10 min-w-[110px] justify-center px-4 py-2 text-sm" to={`/programari/${appointment.appointment_id}`}>
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
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-600">Pagina {appointmentsData.page} / {totalPages}</span>
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