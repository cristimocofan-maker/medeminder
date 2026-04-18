import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, ArrowRight, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { listDoctors } from "./doctors.api";

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

export const DoctorsPage = (): JSX.Element | null => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(null);
  const page = parsePage(searchParams.get("page"));
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const doctorsQuery = useQuery({
    queryKey: ["doctors", { page }],
    queryFn: async () =>
      listDoctors({
        page,
        page_size: pageSize,
        sort_by: "doctor_id",
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

  const totalPages = doctorsQuery.data === undefined ? 1 : Math.max(1, Math.ceil(doctorsQuery.data.total_count / doctorsQuery.data.page_size));
  const doctorsItems = doctorsQuery.data?.items ?? [];

  const specializationOptions = useMemo(() => {
    const specializationMap = new Map<number, string>();

    doctorsItems.forEach((doctor) => {
      if (!specializationMap.has(doctor.specialization_id)) {
        specializationMap.set(doctor.specialization_id, doctor.specialization_display_name);
      }
    });

    return Array.from(specializationMap.entries())
      .map(([specialization_id, specialization_display_name]) => ({
        specialization_id,
        specialization_display_name,
      }))
      .sort((leftOption, rightOption) =>
        leftOption.specialization_display_name.localeCompare(rightOption.specialization_display_name, "ro", {
          sensitivity: "base",
        }),
      );
  }, [doctorsItems]);

  useEffect(() => {
    if (selectedSpecializationId === null) {
      return;
    }

    const specializationStillExists = specializationOptions.some(
      (specialization) => specialization.specialization_id === selectedSpecializationId,
    );

    if (!specializationStillExists) {
      setSelectedSpecializationId(null);
    }
  }, [selectedSpecializationId, specializationOptions]);

  const handlePageChange = (nextPage: number): void => {
    setSearchParams({ page: String(nextPage) });
  };

  if (doctorsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Doctori</span>
        <h2 className="mt-4">Încărcăm lista reală de doctori</h2>
        <p className="mt-3">Preluăm datele direct din endpointul real `/doctors`.</p>
      </section>
    );
  }

  if (doctorsQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Doctori</span>
            <h2 className="mt-4">Nu am putut încărca lista de doctori</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary gap-2" onClick={() => void doctorsQuery.refetch()} type="button">
            <RefreshCw className="h-5 w-5" />
            Reîncearcă
          </button>
          <Link className="button-secondary gap-2" to="/doctori/nou">
            <Plus className="h-5 w-5" />
            Adaugă doctor
          </Link>
        </div>
      </section>
    );
  }

  const doctorsData = doctorsQuery.data;

  if (doctorsData === undefined) {
    return null;
  }

  if (doctorsData.items.length === 0) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Doctori</span>
        <h2 className="mt-4">Nu există încă doctori în clinică</h2>
        <p className="mt-3">Când baza de date nu conține doctori, afișăm acest empty state clar și următorul pas util.</p>
        <Link className="button-primary mt-6 inline-flex gap-2" to="/doctori/nou">
          <Plus className="h-5 w-5" />
          Adaugă primul doctor
        </Link>
      </section>
    );
  }

  const filteredItems = doctorsData.items.filter((doctor) => {
    if (selectedSpecializationId === null) {
      return true;
    }

    return doctor.specialization_id === selectedSpecializationId;
  });

  return (
    <section className="space-y-4">
      {successMessage !== undefined ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-success">
          <p className="font-semibold">{successMessage}</p>
        </div>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 md:px-8">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-500">Specializare</p>
            <div className="flex flex-wrap gap-2">
              <button
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedSpecializationId === null ? "border-primary bg-primary text-white shadow-panel" : "border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:text-primary"}`}
                onClick={() => setSelectedSpecializationId(null)}
                type="button"
              >
                Toate
              </button>
              {specializationOptions.map((specialization) => (
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedSpecializationId === specialization.specialization_id ? "border-primary bg-primary text-white shadow-panel" : "border-slate-200 bg-white text-slate-700 hover:border-primary/30 hover:text-primary"}`}
                  key={specialization.specialization_id}
                  onClick={() => setSelectedSpecializationId(specialization.specialization_id)}
                  type="button"
                >
                  {specialization.specialization_display_name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="px-6 py-8 md:px-8">
            <h3 className="text-lg font-semibold text-ink">Nu există medici pentru specializarea selectată</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">ID</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Doctor</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Specializare</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Status</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-slate-500">Actualizat</th>
                <th className="px-4 py-4 text-right text-sm font-semibold text-slate-500">Acțiune</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((doctor) => (
                <tr className="border-t border-slate-100" key={doctor.doctor_id}>
                  <td className="px-4 py-4 text-sm font-semibold text-ink">{doctor.doctor_id}</td>
                  <td className="px-4 py-4 text-sm text-ink">{doctor.doctor_display_name}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{doctor.specialization_display_name}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className={`rounded-full px-3 py-1 font-medium ${doctor.is_active ? "bg-emerald-50 text-success" : "bg-slate-100 text-slate-600"}`}>
                      {doctor.is_active ? "Activ" : "Inactiv"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{formatDate(doctor.updated_at)}</td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link className="button-secondary inline-flex min-h-10 px-4 py-2 text-sm" to={`/doctori/${doctor.doctor_id}/program`}>
                        Program
                      </Link>
                      <Link className="button-secondary inline-flex min-h-10 px-4 py-2 text-sm" to={`/doctori/${doctor.doctor_id}`}>
                        Editează
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">Pagina curentă {doctorsData.page} din {totalPages}. Total doctori: {doctorsData.total_count}.</p>

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