import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, ArrowUpDown, CalendarDays, Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listAllAppointments, listAppointments } from "./appointments.api";
import type { AppointmentListItem, AppointmentsListParams } from "./appointments.types";

const pageSize = 10;
const defaultSortBy = "start_date_time";
const defaultSortDirection = "asc";
const allAppointmentsMode = "all";

type AppointmentSortField = Extract<AppointmentsListParams["sort_by"], "start_date_time" | "created_at">;
type AppointmentSortDirection = NonNullable<AppointmentsListParams["sort_direction"]>;

const getTodayDateValue = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const defaultScheduledDate = getTodayDateValue();

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

const parseSortBy = (value: string | null): AppointmentSortField => {
  if (value === "created_at") {
    return "created_at";
  }

  return "start_date_time";
};

const parseSortDirection = (value: string | null): AppointmentSortDirection => {
  if (value === "desc") {
    return "desc";
  }

  return "asc";
};

const parseDateFilter = (value: string | null): string => {
  if (value === null) {
    return defaultScheduledDate;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : defaultScheduledDate;
};

const parseSearchTerm = (value: string | null): string => {
  return value?.trim() ?? "";
};

const parseDateMode = (value: string | null): "day" | "all" => {
  return value === allAppointmentsMode ? "all" : "day";
};

const formatScheduledDateInput = (value: string): string => {
  const [year, month, day] = value.split("-");

  if (year === undefined || month === undefined || day === undefined) {
    return "";
  }

  return `${day}.${month}.${year}`;
};

const normalizeDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const firstPart = digits.slice(0, 2);
  const secondPart = digits.slice(2, 4);
  const thirdPart = digits.slice(4, 8);

  return [firstPart, secondPart, thirdPart].filter((part) => part !== "").join(".");
};

const parseDateInputToIso = (value: string): string | null => {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);

  if (match === null) {
    return null;
  }

  const [, dayValue, monthValue, yearValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const parsedDate = new Date(year, month - 1, day);

  if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month - 1 || parsedDate.getDate() !== day) {
    return null;
  }

  return `${yearValue}-${monthValue}-${dayValue}`;
};

const buildDayBounds = (value: string): { start: string; end: string } => {
  const [year, month, day] = value.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day, 23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const buildAppointmentsFilterParams = (
  sortBy: AppointmentSortField,
  sortDirection: AppointmentSortDirection,
  dateMode: "day" | "all",
  scheduledDate: string,
): Omit<AppointmentsListParams, "page" | "page_size"> => {
  const params: Omit<AppointmentsListParams, "page" | "page_size"> = {
    sort_by: sortBy,
    sort_direction: sortDirection,
  };

  if (dateMode === "all") {
    return params;
  }

  const bounds = buildDayBounds(scheduledDate);

  params.start_date_time_from = bounds.start;
  params.start_date_time_to = bounds.end;

  return params;
};

const buildAppointmentsParams = (
  page: number,
  sortBy: AppointmentSortField,
  sortDirection: AppointmentSortDirection,
  dateMode: "day" | "all",
  scheduledDate: string,
): AppointmentsListParams => {
  return {
    page,
    page_size: pageSize,
    ...buildAppointmentsFilterParams(sortBy, sortDirection, dateMode, scheduledDate),
  };
};

const sortButtonClassName = (isActive: boolean): string => {
  return isActive ? "button-primary px-4 py-2" : "button-secondary px-4 py-2 text-slate-600";
};

const formatDate = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const matchesAppointmentSearch = (appointment: AppointmentListItem, searchTerm: string): boolean => {
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase("ro-RO");

  if (normalizedSearchTerm === "") {
    return true;
  }

  return [
    String(appointment.appointment_id),
    appointment.doctor_display_name,
    appointment.patient_display_name,
    appointment.appointment_status,
    appointment.confirmation_status,
  ].some((value) => value.toLocaleLowerCase("ro-RO").includes(normalizedSearchTerm));
};

export const AppointmentsPage = (): JSX.Element | null => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const sortBy = parseSortBy(searchParams.get("sort_by"));
  const sortDirection = parseSortDirection(searchParams.get("sort_direction"));
  const dateMode = parseDateMode(searchParams.get("date_mode"));
  const scheduledDate = parseDateFilter(searchParams.get("scheduled_date"));
  const searchTerm = parseSearchTerm(searchParams.get("search"));
  const hasSearch = searchTerm !== "";
  const filterParams = buildAppointmentsFilterParams(sortBy, sortDirection, dateMode, scheduledDate);
  const queryParams = buildAppointmentsParams(page, sortBy, sortDirection, dateMode, scheduledDate);
  const [dateInputValue, setDateInputValue] = useState(() => formatScheduledDateInput(scheduledDate));

  useEffect(() => {
    setDateInputValue(formatScheduledDateInput(scheduledDate));
  }, [scheduledDate]);

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", queryParams],
    queryFn: async () => listAppointments(queryParams),
    enabled: !hasSearch,
  });

  const allAppointmentsQuery = useQuery({
    queryKey: ["appointments-search", filterParams],
    queryFn: async () => listAllAppointments(filterParams),
    enabled: hasSearch,
  });

  const searchedItems = (allAppointmentsQuery.data ?? []).filter((appointment) => matchesAppointmentSearch(appointment, searchTerm));
  const visibleItems = hasSearch
    ? searchedItems.slice((page - 1) * pageSize, page * pageSize)
    : (appointmentsQuery.data?.items ?? []);
  const totalPages = hasSearch
    ? Math.max(1, Math.ceil(searchedItems.length / pageSize))
    : appointmentsQuery.data === undefined
      ? 1
      : Math.max(1, Math.ceil(appointmentsQuery.data.total_count / appointmentsQuery.data.page_size));

  const handlePageChange = (nextPage: number): void => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  };

  const handleSortByChange = (nextSortBy: AppointmentSortField): void => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("page", "1");

    if (nextSortBy === defaultSortBy) {
      nextParams.delete("sort_by");
    } else {
      nextParams.set("sort_by", nextSortBy);
    }

    setSearchParams(nextParams);
  };

  const handleSortDirectionToggle = (): void => {
    const nextParams = new URLSearchParams(searchParams);
    const nextDirection = sortDirection === "asc" ? "desc" : "asc";

    nextParams.set("page", "1");

    if (nextDirection === defaultSortDirection) {
      nextParams.delete("sort_direction");
    } else {
      nextParams.set("sort_direction", nextDirection);
    }

    setSearchParams(nextParams);
  };

  const handleSearchChange = (nextValue: string): void => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("page", "1");

    if (nextValue.trim() === "") {
      nextParams.delete("search");
    } else {
      nextParams.set("search", nextValue);
    }

    setSearchParams(nextParams);
  };

  const updateScheduledDate = (nextValue: string): void => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("page", "1");
    nextParams.delete("date_mode");
    nextParams.set("scheduled_date", nextValue);
    setSearchParams(nextParams);
  };

  const handleShowAllAppointments = (): void => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("page", "1");
    nextParams.set("date_mode", allAppointmentsMode);
    setSearchParams(nextParams);
  };

  const handleScheduledDateInputChange = (nextValue: string): void => {
    const formattedValue = normalizeDateInput(nextValue);

    setDateInputValue(formattedValue);

    const normalizedDate = parseDateInputToIso(formattedValue);

    if (normalizedDate !== null) {
      updateScheduledDate(normalizedDate);
    }
  };

  const handleScheduledDateInputBlur = (): void => {
    const normalizedDate = parseDateInputToIso(dateInputValue);

    if (normalizedDate !== null) {
      updateScheduledDate(normalizedDate);
      return;
    }

    setDateInputValue(formatScheduledDateInput(scheduledDate));
  };

  const clearFilters = (): void => {
    setSearchParams({ page: "1" });
  };

  if ((hasSearch && allAppointmentsQuery.isLoading) || (!hasSearch && appointmentsQuery.isLoading)) {
    return (
      <section className="panel p-6">
        <h2>Se încarcă programările...</h2>
      </section>
    );
  }

  if ((hasSearch && allAppointmentsQuery.isError) || (!hasSearch && appointmentsQuery.isError)) {
    return (
      <section className="panel p-6">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle />
          Eroare la încărcare
        </div>
      </section>
    );
  }

  const data = appointmentsQuery.data;
  const hasActiveFilters =
    sortBy !== defaultSortBy ||
    sortDirection !== defaultSortDirection ||
    searchTerm !== "" ||
    scheduledDate !== defaultScheduledDate ||
    dateMode === "all";

  return (
    <section className="space-y-4">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Agenda programărilor</h2>
          </div>

          <Link className="button-primary flex items-center gap-2" to="/programari/nou_1">
            <Plus className="h-5 w-5" />
            Programare nouă
          </Link>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 md:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-1 flex-col gap-4 xl:max-w-4xl">
              <div className="w-full max-w-xl">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500" htmlFor="appointments-search">
                  <Search className="h-4 w-4" />
                  Caută programare
                </label>

                <input
                  className="input-base"
                  id="appointments-search"
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="ID, pacient, doctor, status"
                  type="text"
                  value={searchTerm}
                />
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-slate-500">Sortare</span>

                <div className="flex flex-wrap gap-2">
                  <button
                    className={sortButtonClassName(sortBy === "start_date_time")}
                    onClick={() => handleSortByChange("start_date_time")}
                    type="button"
                  >
                    După programare
                  </button>

                  <button
                    className={sortButtonClassName(sortBy === "created_at")}
                    onClick={() => handleSortByChange("created_at")}
                    type="button"
                  >
                    După data adăugării
                  </button>

                  <button
                    className="button-secondary flex items-center gap-2 px-4 py-2"
                    onClick={handleSortDirectionToggle}
                    type="button"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortDirection === "asc" ? "Crescător" : "Descrescător"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <button
                className={sortButtonClassName(dateMode === "all")}
                onClick={handleShowAllAppointments}
                type="button"
              >
                Toate programările
              </button>

              <div className="min-w-56">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500" htmlFor="appointments-date-filter">
                  <CalendarDays className="h-4 w-4" />
                  Filtrează după dată
                </label>

                <input
                  className="input-base"
                  id="appointments-date-filter"
                  inputMode="numeric"
                  onBlur={handleScheduledDateInputBlur}
                  onChange={(event) => handleScheduledDateInputChange(event.target.value)}
                  placeholder="zz.ll.aaaa"
                  type="text"
                  value={dateInputValue}
                />
              </div>

              <button
                className="button-secondary flex items-center justify-center gap-2 px-4 py-2"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Resetează
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {visibleItems.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500 md:px-8">
              {searchTerm !== "" ? "Nu există programări care corespund căutării curente." : "Nu există programări pentru data selectată."}
            </div>
          ) : (
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs">ID</th>
                  <th className="px-4 py-3 text-left text-xs">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs">Pacient</th>
                  <th className="px-4 py-3 text-left text-xs">Status</th>
                  <th className="px-4 py-3 text-left text-xs">Confirmare</th>
                  <th className="px-4 py-3 text-left text-xs">Început</th>
                  <th className="px-4 py-3 text-right text-xs">Acțiune</th>
                </tr>
              </thead>

              <tbody>
                {visibleItems.map((appointment) => (
                  <tr key={appointment.appointment_id} className="border-t">
                    <td className="px-4 py-3">#{appointment.appointment_id}</td>
                    <td className="px-4 py-3">{appointment.doctor_display_name}</td>
                    <td className="px-4 py-3">{appointment.patient_display_name}</td>
                    <td className="px-4 py-3">{appointment.appointment_status}</td>
                    <td className="px-4 py-3">{appointment.confirmation_status}</td>
                    <td className="px-4 py-3">{formatDate(appointment.start_date_time)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="button-secondary px-3 py-1" to={`/programari/${appointment.appointment_id}`}>
                        Editează
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t">
          <button
            className="button-secondary flex items-center gap-2"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Înapoi
          </button>

          <span>
            Pagina {hasSearch ? Math.min(page, totalPages) : (data?.page ?? page)} / {totalPages}
          </span>

          <button
            className="button-primary flex items-center gap-2"
            disabled={page >= totalPages || visibleItems.length === 0}
            onClick={() => handlePageChange(page + 1)}
          >
            Înainte
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};