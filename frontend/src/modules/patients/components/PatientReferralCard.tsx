import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarPlus, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../api/client";
import type { ApiSuccessResponse, PaginatedResponse } from "../../../shared/types/api";
import { getDoctorSchedules } from "../../doctor-schedules/doctor-schedules.api";
import type { DoctorScheduleDay } from "../../doctor-schedules/doctor-schedules.types";
import { listDoctors, listSpecializationOptions } from "../../doctors/doctors.api";
import type { DoctorListItem } from "../../doctors/doctors.types";
import type { AppointmentListItem } from "../../appointments/appointments.types";
import { getSpecializationTheme } from "../../specializations/components/specialization-theme";

interface PatientReferralCardProps {
  initialDoctorId?: number | null;
  initialSpecializationId?: number | null;
  prefillPatientId?: number | null;
  onSelectReferralTarget?: ((target: {
    doctorId: number;
    end: string;
    patientId: number | null;
    specializationId: number | null;
    start: string;
  }) => void) | null;
  subtitle?: string;
  title?: string;
}

interface LocalSlotItem {
  dayLabel: string;
  end: string;
  start: string;
  timeLabel: string;
}

const availabilityWeekdayFormatter = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "2-digit",
  month: "short",
});

const loadAllPages = async <TItem,>(
  path: string,
  baseParams: Record<string, string | number | boolean>,
): Promise<TItem[]> => {
  const pageSize = 100;
  let page = 1;
  let items: TItem[] = [];
  let totalCount = 0;

  do {
    const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<TItem>>>(path, {
      params: {
        ...baseParams,
        page,
        page_size: pageSize,
      },
    });

    items = items.concat(response.data.data.items);
    totalCount = response.data.data.total_count;
    page += 1;
  } while (items.length < totalCount);

  return items;
};

const getStartOfDay = (date: Date): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
};

const addDays = (date: Date, amount: number): Date => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);

  return getStartOfDay(nextDate);
};

const toDateValue = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getScheduleWeekdayFromLocalDate = (dateValue: string): number | null => {
  if (dateValue.trim() === "") {
    return null;
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const jsWeekday = date.getDay();

  return jsWeekday === 0 ? 7 : jsWeekday;
};

const buildQuickSlotValue = (dateValue: string, hours: number, minutes: number): string => {
  return `${dateValue}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const addMinutesToLocalValue = (localValue: string, minutesToAdd: number): string => {
  const localDate = new Date(localValue);
  localDate.setMinutes(localDate.getMinutes() + minutesToAdd);

  return `${localValue.slice(0, 11)}${String(localDate.getHours()).padStart(2, "0")}:${String(localDate.getMinutes()).padStart(2, "0")}`;
};

const buildQuickSlots = (
  dateValue: string,
  schedule: Pick<DoctorScheduleDay, "start_time" | "end_time" | "appointment_duration_minutes">,
): Array<{ end: string; start: string; timeLabel: string }> => {
  const slots: Array<{ end: string; start: string; timeLabel: string }> = [];
  const [startHours, startMinutes] = schedule.start_time.split(":").map(Number);
  const [endHours, endMinutes] = schedule.end_time.split(":").map(Number);
  const startBoundaryMinutes = startHours * 60 + startMinutes;
  const endBoundaryMinutes = endHours * 60 + endMinutes;
  const slotDuration = schedule.appointment_duration_minutes;

  for (
    let currentMinutes = startBoundaryMinutes;
    currentMinutes + slotDuration <= endBoundaryMinutes;
    currentMinutes += slotDuration
  ) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const start = buildQuickSlotValue(dateValue, hours, minutes);
    const end = addMinutesToLocalValue(start, slotDuration);

    slots.push({
      start,
      end,
      timeLabel: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    });
  }

  return slots;
};

const intersectsWithAppointment = (
  slot: { start: string; end: string },
  appointment: Pick<AppointmentListItem, "start_date_time" | "end_date_time">,
): boolean => {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  const appointmentStart = new Date(appointment.start_date_time).getTime();
  const appointmentEnd = new Date(appointment.end_date_time).getTime();

  return slotStart < appointmentEnd && slotEnd > appointmentStart;
};

const formatDayLabel = (dateValue: string): string => {
  return availabilityWeekdayFormatter.format(new Date(`${dateValue}T00:00:00`)).replace(/\./g, "");
};

export const PatientReferralCard = ({
  initialDoctorId = null,
  initialSpecializationId = null,
  prefillPatientId = null,
  onSelectReferralTarget = null,
  subtitle = "Selectezi specializarea țintă, medicul și primul slot liber, apoi continui direct în fluxul real de programare.",
  title = "Reprogramare / Trimitere",
}: PatientReferralCardProps): JSX.Element => {
  const navigate = useNavigate();
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(initialSpecializationId);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(initialDoctorId);
  const [selectedSlot, setSelectedSlot] = useState<LocalSlotItem | null>(null);

  const specializationsQuery = useQuery({
    queryKey: ["visit-specializations-options"],
    queryFn: listSpecializationOptions,
  });

  const doctorsQuery = useQuery({
    queryKey: ["appointment-doctors-options"],
    queryFn: async () =>
      listDoctors({
        page: 1,
        page_size: 100,
        sort_by: "doctor_id",
        sort_direction: "asc",
      }),
  });

  const doctors = useMemo(() => (doctorsQuery.data?.items ?? []).filter((doctor) => doctor.is_active), [doctorsQuery.data?.items]);
  const filteredDoctors = useMemo(() => {
    if (selectedSpecializationId === null) {
      return doctors;
    }

    return doctors.filter((doctor) => doctor.specialization_id === selectedSpecializationId);
  }, [doctors, selectedSpecializationId]);
  const selectedSpecializationName = useMemo(
    () => specializationsQuery.data?.find((specialization) => specialization.specialization_id === selectedSpecializationId)?.specialization_display_name ?? null,
    [selectedSpecializationId, specializationsQuery.data],
  );
  const theme = getSpecializationTheme(selectedSpecializationName);

  useEffect(() => {
    if (selectedSpecializationId === null && filteredDoctors.length > 0) {
      setSelectedSpecializationId(filteredDoctors[0].specialization_id);
      return;
    }

    if (filteredDoctors.length === 0) {
      setSelectedDoctorId(null);
      setSelectedSlot(null);
      return;
    }

    const hasCurrentDoctor = selectedDoctorId !== null && filteredDoctors.some((doctor) => doctor.doctor_id === selectedDoctorId);

    if (!hasCurrentDoctor) {
      setSelectedDoctorId(filteredDoctors[0].doctor_id);
      setSelectedSlot(null);
    }
  }, [filteredDoctors, selectedDoctorId, selectedSpecializationId]);

  const doctorSchedulesQuery = useQuery({
    queryKey: ["doctor-schedules", selectedDoctorId],
    queryFn: async () => getDoctorSchedules(selectedDoctorId as number),
    enabled: typeof selectedDoctorId === "number" && Number.isInteger(selectedDoctorId) && selectedDoctorId > 0,
  });

  const appointmentsAvailabilityQuery = useQuery({
    queryKey: ["appointments-availability", selectedDoctorId],
    queryFn: async () => {
      return loadAllPages<AppointmentListItem>("/appointments", {
        sort_by: "start_date_time",
        sort_direction: "asc",
      });
    },
    enabled: typeof selectedDoctorId === "number" && Number.isInteger(selectedDoctorId) && selectedDoctorId > 0,
  });

  const availableSlots = useMemo<LocalSlotItem[]>(() => {
    if (selectedDoctorId === null || doctorSchedulesQuery.data === undefined) {
      return [];
    }

    const appointments = (appointmentsAvailabilityQuery.data ?? []).filter((appointment) => appointment.doctor_id === selectedDoctorId);
    const today = getStartOfDay(new Date());
    const slots: LocalSlotItem[] = [];

    for (let offset = 0; offset < 21 && slots.length < 8; offset += 1) {
      const currentDate = addDays(today, offset);
      const dateValue = toDateValue(currentDate);
      const weekday = getScheduleWeekdayFromLocalDate(dateValue);

      if (weekday === null) {
        continue;
      }

      const schedule = doctorSchedulesQuery.data.schedules.find((item) => item.weekday === weekday && item.is_active);

      if (schedule === undefined) {
        continue;
      }

      const dailySlots = buildQuickSlots(dateValue, schedule).filter((slot) => {
        if (new Date(slot.start).getTime() < Date.now()) {
          return false;
        }

        return !appointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      dailySlots.forEach((slot) => {
        if (slots.length >= 8) {
          return;
        }

        slots.push({
          ...slot,
          dayLabel: formatDayLabel(dateValue),
        });
      });
    }

    return slots;
  }, [appointmentsAvailabilityQuery.data, doctorSchedulesQuery.data, selectedDoctorId]);

  useEffect(() => {
    if (selectedSlot === null) {
      return;
    }

    const slotStillExists = availableSlots.some((slot) => slot.start === selectedSlot.start && slot.end === selectedSlot.end);

    if (!slotStillExists) {
      setSelectedSlot(null);
    }
  }, [availableSlots, selectedSlot]);

  const currentDoctor = filteredDoctors.find((doctor) => doctor.doctor_id === selectedDoctorId) ?? null;
  const isCrossSpecialization = initialSpecializationId !== null && selectedSpecializationId !== null && initialSpecializationId !== selectedSpecializationId;

  return (
    <section className={`rounded-[32px] border ${theme.borderClassName} ${theme.surfaceClassName} p-5 md:p-6`}>
      <div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${theme.badgeClassName}`}>
          Consultația de azi
        </span>
        <h3 className="mt-4 text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`rounded-3xl border ${theme.softPanelClassName} p-4`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Specializare</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(specializationsQuery.data ?? []).map((specialization) => (
              <button
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedSpecializationId === specialization.specialization_id ? theme.selectedChipClassName : theme.idleChipClassName}`}
                key={specialization.specialization_id}
                onClick={() => {
                  setSelectedSpecializationId(specialization.specialization_id);
                  setSelectedSlot(null);
                }}
                type="button"
              >
                {specialization.specialization_display_name}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-3xl border ${theme.softPanelClassName} p-4`}>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Medic</p>
          {filteredDoctors.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-white/70 bg-white/80 px-4 py-6">
              <p className="text-base font-semibold text-ink">Nu există medici disponibili</p>
              <p className="mt-2 text-sm text-slate-500">Schimbă specializarea pentru a continua reprogramarea.</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {filteredDoctors.map((doctor: DoctorListItem) => (
                <button
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedDoctorId === doctor.doctor_id ? theme.selectedChipClassName : theme.idleChipClassName}`}
                  key={doctor.doctor_id}
                  onClick={() => {
                    setSelectedDoctorId(doctor.doctor_id);
                    setSelectedSlot(null);
                  }}
                  type="button"
                >
                  {doctor.doctor_display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Primele sloturi disponibile</p>
          {doctorSchedulesQuery.isLoading || appointmentsAvailabilityQuery.isLoading ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Încărcăm
            </span>
          ) : null}
        </div>

        {selectedDoctorId === null ? (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Alege medicul țintă pentru a vedea sloturile reale disponibile.
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Nu am găsit sloturi libere în intervalul următor.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot?.start === slot.start && selectedSlot.end === slot.end;

              return (
                <button
                  className={`rounded-3xl border px-4 py-4 text-left transition ${isSelected ? theme.selectedChipClassName : theme.idleChipClassName}`}
                  key={slot.start}
                  onClick={() => setSelectedSlot(slot)}
                  type="button"
                >
                  <p className="text-sm font-semibold">{slot.dayLabel}</p>
                  <p className="mt-2 text-lg font-semibold">{slot.timeLabel}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm text-slate-500">Țintă</p>
          <p className="mt-1 text-base font-semibold text-ink">
            {currentDoctor !== null && selectedSlot !== null
              ? `${currentDoctor.doctor_display_name} · ${selectedSlot.dayLabel} · ${selectedSlot.timeLabel}`
              : "Selectează specializarea, medicul și slotul"}
          </p>
        </div>

        <button
          className="button-primary gap-2 whitespace-nowrap"
          disabled={selectedDoctorId === null || selectedSlot === null}
          onClick={() => {
            if (selectedDoctorId === null || selectedSlot === null) {
              return;
            }

            if (onSelectReferralTarget !== null) {
              onSelectReferralTarget({
                doctorId: selectedDoctorId,
                end: selectedSlot.end,
                patientId: prefillPatientId !== null && Number.isInteger(prefillPatientId) && prefillPatientId > 0 ? prefillPatientId : null,
                specializationId: selectedSpecializationId,
                start: selectedSlot.start,
              });
              return;
            }

            const nextSearchParams = new URLSearchParams({
              doctor_id: String(selectedDoctorId),
              start: selectedSlot.start,
              end: selectedSlot.end,
            });

            if (prefillPatientId !== null && Number.isInteger(prefillPatientId) && prefillPatientId > 0) {
              nextSearchParams.set("patient_id", String(prefillPatientId));
            }

            navigate(`/programari/nou?${nextSearchParams.toString()}`);
          }}
          type="button"
        >
          {isCrossSpecialization ? "Trimite către altă specializare" : "Reprogramează"}
          {isCrossSpecialization ? <ArrowRight className="h-5 w-5" /> : <CalendarPlus className="h-5 w-5" />}
        </button>
      </div>
    </section>
  );
};