import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { listSpecializations } from "./specializations.api";
import { getSpecializationTheme } from "./components/specialization-theme";

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

export const SpecializationsPage = (): JSX.Element | null => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const page = parsePage(searchParams.get("page"));
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const specializationsQuery = useQuery({
    queryKey: ["specializations", { page }],
    queryFn: async () =>
      listSpecializations({
        page,
        page_size: pageSize,
        sort_by: "specialization_id",
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

  const totalPages = specializationsQuery.data === undefined
    ? 1
    : Math.max(1, Math.ceil(specializationsQuery.data.total_count / specializationsQuery.data.page_size));

  const handlePageChange = (nextPage: number): void => {
    setSearchParams({ page: String(nextPage) });
  };

  if (specializationsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Specializări</span>
        <h2 className="mt-4">Încărcăm lista reală de specializări</h2>
        <p className="mt-3">Preluăm datele direct din endpointul real `/specializations`.</p>
      </section>
    );
  }

  if (specializationsQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Specializări</span>
            <h2 className="mt-4">Nu am putut încărca lista de specializări</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void specializationsQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/specializari/nou">
            <Plus className="h-5 w-5" />
            Adaugă specializare
          </Link>
        </div>
      </section>
    );
  }

  const specializationsData = specializationsQuery.data;
  const normalizedSearchValue = searchValue.trim();
  const isNumericSearch = /^\d+$/.test(normalizedSearchValue);

  if (specializationsData === undefined) {
    return null;
  }

  if (specializationsData.items.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Specializări</span>
        <h2 className="mt-4">Nu există încă specializări în clinică</h2>
        <p className="mt-3">Când baza de date nu conține specializări, afișăm acest empty state clar și următorul pas util.</p>
        <Link className="button-primary mt-6 inline-flex gap-2" to="/specializari/nou">
          <Plus className="h-5 w-5" />
          Adaugă prima specializare
        </Link>
      </section>
    );
  }

  const filteredItems = (() => {
    const loweredSearch = normalizedSearchValue.toLocaleLowerCase();

    const nextItems = specializationsData.items.filter((specialization) => {
      if (normalizedSearchValue === "") {
        return true;
      }

      if (isNumericSearch) {
        return String(specialization.specialization_id) === normalizedSearchValue;
      }

      return specialization.specialization_display_name.toLocaleLowerCase().includes(loweredSearch);
    });

    return [...nextItems].sort((leftSpecialization, rightSpecialization) => {
      const comparison = leftSpecialization.specialization_display_name.localeCompare(
        rightSpecialization.specialization_display_name,
        "ro",
        { sensitivity: "base" },
      );

      return comparison;
    });
  })();

  return (
    <section className="space-y-4">
      {successMessage !== undefined ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-success">
          <p className="font-semibold">{successMessage}</p>
        </div>
      ) : null}

      <div className="panel p-6 md:p-8">
        <div>
          <span className="badge-soft">Specializări</span>
          <h2 className="mt-4">Lista completă de specializări ale clinicii</h2>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 md:px-8">
          <div className="w-full max-w-2xl">
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="specializations-local-search">
                Căutare locală în pagina încărcată
              </label>
              <input
                className="input-base"
                id="specializations-local-search"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Caută după specialization_id sau specializarea afișată"
                value={searchValue}
              />
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-8 md:px-8">
            <h3 className="text-lg font-semibold text-ink">Nu există rezultate pentru căutarea curentă</h3>
            <p className="mt-3 text-sm text-slate-500">Ajustează căutarea locală pentru a reveni la specializările deja încărcate.</p>
          </div>
        ) : (
          <div className="grid gap-3 px-6 py-4 md:px-8">
            {filteredItems.map((specialization) => {
              const theme = getSpecializationTheme(specialization.specialization_display_name);

              return (
                <article
                  className={`rounded-[30px] border ${theme.borderClassName} ${theme.surfaceClassName} p-4 md:p-5 shadow-sm`}
                  key={specialization.specialization_id}
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h3 className="text-[1.35rem] font-semibold leading-tight text-ink md:text-[1.5rem]">{specialization.specialization_display_name}</h3>
                    </div>

                    <Link className="button-secondary inline-flex min-h-10 px-4 py-2 text-sm" to={`/specializari/${specialization.specialization_id}`}>
                      Editează
                    </Link>
                  </div>

                </article>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Pagina curentă {specializationsData.page} din {totalPages}. Rezultate după filtre locale: {filteredItems.length}. Total specializări: {specializationsData.total_count}.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="button-secondary gap-2" disabled={page <= 1} onClick={() => handlePageChange(page - 1)} type="button">
              <ArrowLeft className="h-5 w-5" />
              Pagina anterioară
            </button>

            <button className="button-primary gap-2" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} type="button">
              Pagina următoare
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};