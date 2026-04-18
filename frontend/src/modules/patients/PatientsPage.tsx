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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
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

    return [...nextItems].sort((leftPatient, rightPatient) => {
      const comparison = leftPatient.patient_display_name.localeCompare(rightPatient.patient_display_name, "ro", {
        sensitivity: "base",
      });

      return sortDirection === "asc" ? comparison : -comparison;
    });
  })();

  const hasLocalFilters = normalizedSearchValue !== "" || sortDirection !== "asc";

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

      <div className="panel flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <span className="badge-soft">Pacienți</span>
          <h2 className="mt-4">Lista completă de pacienți ai clinicii</h2>
          <p className="mt-3">Datele sunt citite exclusiv din `/patients`, cu paginare reală și identificare doar prin `patient_id` numeric.</p>
        </div>

        <Link className="button-primary gap-2" to="/pacienti/nou">
          <Plus className="h-5 w-5" />
          Pacient nou
        </Link>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-2xl">
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="patients-local-search">
                Căutare locală în pagina încărcată
              </label>
              <input
                className="input-base"
                id="patients-local-search"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Caută după patient_id sau numele afișat"
                value={searchValue}
              />
              <p className="mt-2 text-sm text-slate-500">Filtrarea nu schimbă requestul către backend. Caută strict după ID numeric sau după numele afișat.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="button-secondary gap-2" onClick={() => setSortDirection((currentDirection) => currentDirection === "asc" ? "desc" : "asc")} type="button">
                Sortează după pacient: {sortDirection === "asc" ? "A-Z" : "Z-A"}
              </button>
              <button className="button-secondary gap-2" disabled={!hasLocalFilters} onClick={clearLocalFilters} type="button">
                Șterge filtrele
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Rezultate afișate: {filteredItems.length} din {patientsData.items.length} încărcate pe pagina curentă. Total în listă: {patientsData.total_count}.
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-8 md:px-8">
            <h3 className="text-lg font-semibold text-ink">Nu există rezultate pentru căutarea curentă</h3>
            <p className="mt-3 text-sm text-slate-500">Ajustează căutarea locală sau apasă „Șterge filtrele” pentru a reveni la rezultatele deja încărcate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">ID</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Pacient</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Telefon</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Email</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Status</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Actualizat</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-500">Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((patient) => (
                <tr className="border-t border-slate-100" key={patient.patient_id}>
                  <td className="px-4 py-4 text-sm font-semibold text-ink">{patient.patient_id}</td>
                  <td className="px-4 py-4 text-sm text-ink">{patient.patient_display_name}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{patient.phone_number}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{patient.email ?? "-"}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`rounded-full px-3 py-1 font-medium ${patient.is_active ? "bg-emerald-50 text-success" : "bg-slate-100 text-slate-600"}`}>
                      {patient.is_active ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDate(patient.updated_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <Link className="button-secondary inline-flex min-h-10 px-4 py-2 text-sm" to={`/pacienti/${patient.patient_id}`}>
                      Editează
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Pagina curentă {patientsData.page} din {totalPages}. Rezultate după filtre locale: {filteredItems.length}. Total pacienți: {patientsData.total_count}.
          </p>

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