import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listResponses } from "./responses.api";

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

export const ResponsesPage = (): JSX.Element | null => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const page = parsePage(searchParams.get("page"));

  const responsesQuery = useQuery({
    queryKey: ["responses", { page }],
    queryFn: async () =>
      listResponses({
        page,
        page_size: pageSize,
        sort_by: "response_id",
        sort_direction: "asc",
      }),
  });

  const handlePageChange = (nextPage: number): void => {
    setSearchParams({ page: String(nextPage) });
  };

  if (responsesQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Răspunsuri</span>
        <h2 className="mt-4">Încărcăm lista reală de răspunsuri</h2>
        <p className="mt-3">Preluăm datele direct din endpointul real `/responses`.</p>
      </section>
    );
  }

  if (responsesQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Răspunsuri</span>
            <h2 className="mt-4">Nu am putut încărca lista de răspunsuri</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void responsesQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
        </div>
      </section>
    );
  }

  const responsesData = responsesQuery.data;
  const normalizedSearchValue = searchValue.trim();
  const isNumericSearch = /^\d+$/.test(normalizedSearchValue);

  if (responsesData === undefined) {
    return null;
  }

  if (responsesData.items.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Răspunsuri</span>
        <h2 className="mt-4">Nu există răspunsuri în clinică</h2>
        <p className="mt-3">Când baza de date nu conține responses, afișăm un empty state clar, fără date artificiale.</p>
      </section>
    );
  }

  const totalPages = Math.max(1, Math.ceil(responsesData.total_count / responsesData.page_size));
  const filteredItems = (() => {
    const loweredSearch = normalizedSearchValue.toLocaleLowerCase();

    const nextItems = responsesData.items.filter((response) => {
      if (normalizedSearchValue === "") {
        return true;
      }

      if (isNumericSearch) {
        return String(response.response_id) === normalizedSearchValue;
      }

      return response.response_status.toLocaleLowerCase().includes(loweredSearch);
    });

    return [...nextItems].sort((leftResponse, rightResponse) => {
      const comparison = leftResponse.response_status.localeCompare(rightResponse.response_status, "ro", {
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
      <div className="panel flex flex-col gap-4 p-6 md:p-8">
        <div>
          <span className="badge-soft">Răspunsuri</span>
          <h2 className="mt-4">Lista completă de responses</h2>
          <p className="mt-3">Datele sunt citite exclusiv din `/responses`, iar `response_id` și `message_id` sunt folosite exclusiv numeric.</p>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full max-w-2xl">
              <label className="mb-2 block text-sm font-semibold text-slate-500" htmlFor="responses-local-search">
                Căutare locală în pagina încărcată
              </label>
              <input
                className="input-base"
                id="responses-local-search"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Caută după response_id sau statusul afișat"
                value={searchValue}
              />
              <p className="mt-2 text-sm text-slate-500">Filtrarea rămâne locală. Caută strict după ID numeric sau după statusul afișat în listă.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="button-secondary gap-2" onClick={() => setSortDirection((currentDirection) => currentDirection === "asc" ? "desc" : "asc")} type="button">
                Sortează după status: {sortDirection === "asc" ? "A-Z" : "Z-A"}
              </button>
              <button className="button-secondary gap-2" disabled={!hasLocalFilters} onClick={clearLocalFilters} type="button">
                Șterge filtrele
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Rezultate afișate: {filteredItems.length} din {responsesData.items.length} încărcate pe pagina curentă. Total în listă: {responsesData.total_count}.
          </p>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-8 md:px-8">
            <h3 className="text-lg font-semibold text-ink">Nu există rezultate pentru căutarea curentă</h3>
            <p className="mt-3 text-sm text-slate-500">Ajustează căutarea locală sau apasă „Șterge filtrele” pentru a reveni la răspunsurile deja încărcate.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">response_id</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">message_id</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">response_status</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">created_at</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-500">Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((response) => (
                <tr className="border-t border-slate-100" key={response.response_id}>
                  <td className="px-4 py-4 text-sm font-semibold text-ink">{response.response_id}</td>
                  <td className="px-4 py-4 text-sm text-ink">{response.message_id}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{response.response_status}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDate(response.created_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <Link className="button-secondary inline-flex min-h-10 px-4 py-2 text-sm" to={`/raspunsuri/${response.response_id}`}>
                      Deschide
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
            Pagina curentă {responsesData.page} din {totalPages}. Rezultate după filtre locale: {filteredItems.length}. Total răspunsuri: {responsesData.total_count}.
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