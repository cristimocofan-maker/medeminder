import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarPlus, ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
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
  dayValue: string;
  end: string;
  start: string;
  timeLabel: string;
}

interface AvailabilityDay {
  value: string;
  title: string;
  display: string;
  dayNumber: string;
  fullLabel: string;
  allSlots: Array<{ start: string; end: string; label: string }>;
  availableSlots: Array<{ start: string; end: string; label: string }>;
  schedule: DoctorScheduleDay | null;
  isToday: boolean;
}

type AvailabilityViewMode = "week" | "month";

const availabilityWeekdayFormatter = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "2-digit",
  month: "short",
});

const availabilityWeekdayOnlyFormatter = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
});

const availabilityDayMonthFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
});

const availabilityFullDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const availabilityPeriodLabelFormatter = new Intl.DateTimeFormat("ro-RO", {
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

const capitalizeText = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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

const formatAvailabilityWeekday = (date: Date): string => {
  return capitalizeText(availabilityWeekdayOnlyFormatter.format(date).replace(/\./g, ""));
};

const formatAvailabilityDayMonth = (date: Date): string => {
  return capitalizeText(availabilityDayMonthFormatter.format(date).replace(/\./g, ""));
};

const formatAvailabilityFullLabel = (date: Date): string => {
  return capitalizeText(availabilityFullDateFormatter.format(date));
};

const buildAvailabilityRangeFromStart = (startDate: Date, dayCount: number): Array<{
  value: string;
  title: string;
  display: string;
  dayNumber: string;
  fullLabel: string;
  isToday: boolean;
}> => {
  const today = getStartOfDay(new Date());

  return Array.from({ length: dayCount }, (_value, index) => {
    const currentDate = addDays(startDate, index);

    return {
      value: toDateValue(currentDate),
      title: formatAvailabilityWeekday(currentDate),
      display: formatAvailabilityDayMonth(currentDate),
      dayNumber: String(currentDate.getDate()).padStart(2, "0"),
      fullLabel: formatAvailabilityFullLabel(currentDate),
      isToday: toDateValue(currentDate) === toDateValue(today),
    };
  });
};

const buildAvailabilityPeriodLabel = (days: Array<{ value: string }>): string => {
  if (days.length === 0) {
    return "";
  }

  const startDate = new Date(`${days[0].value}T00:00:00`);
  const endDate = new Date(`${days[days.length - 1].value}T00:00:00`);

  return `${capitalizeText(availabilityPeriodLabelFormatter.format(startDate).replace(/\./g, ""))} - ${capitalizeText(availabilityPeriodLabelFormatter.format(endDate).replace(/\./g, ""))}`;
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
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState("");
  const [availabilityViewMode, setAvailabilityViewMode] = useState<AvailabilityViewMode>("week");
  const [availabilityPeriodIndex, setAvailabilityPeriodIndex] = useState(0);

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

  const doctorAppointments = useMemo(() => {
    if (selectedDoctorId === null) {
      return [];
    }

    return (appointmentsAvailabilityQuery.data ?? []).filter((appointment) => appointment.doctor_id === selectedDoctorId);
  }, [appointmentsAvailabilityQuery.data, selectedDoctorId]);

  const availabilityAnchorDate = useMemo(() => {
    const today = getStartOfDay(new Date());

    if (selectedDoctorId === null || doctorSchedulesQuery.data === undefined) {
      return today;
    }

    const searchCandidates = buildAvailabilityRangeFromStart(today, 90);

    for (const dayOption of searchCandidates) {
      const weekday = getScheduleWeekdayFromLocalDate(dayOption.value);
      const schedule = doctorSchedulesQuery.data.schedules.find((item) => item.weekday === weekday) ?? null;

      if (schedule === null || !schedule.is_active) {
        continue;
      }

      const nextAvailableSlots = buildQuickSlots(dayOption.value, schedule).filter((slot) => {
        const isSelectedCurrentSlot = selectedSlot?.start === slot.start && selectedSlot.end === slot.end;

        if (!isSelectedCurrentSlot && new Date(slot.start).getTime() < Date.now()) {
          return false;
        }

        return !doctorAppointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      if (nextAvailableSlots.length > 0) {
        return new Date(`${dayOption.value}T00:00:00`);
      }
    }

    return today;
  }, [doctorAppointments, doctorSchedulesQuery.data, selectedDoctorId, selectedSlot]);

  const availabilityRange = useMemo(() => {
    const periodLength = availabilityViewMode === "week" ? 7 : 30;
    const periodStart = addDays(availabilityAnchorDate, availabilityPeriodIndex * periodLength);

    return buildAvailabilityRangeFromStart(periodStart, periodLength);
  }, [availabilityAnchorDate, availabilityPeriodIndex, availabilityViewMode]);

  const availabilityDays = useMemo<AvailabilityDay[]>(() => {
    if (selectedDoctorId === null || doctorSchedulesQuery.data === undefined) {
      return [];
    }

    return availabilityRange.map((dayOption) => {
      const weekday = getScheduleWeekdayFromLocalDate(dayOption.value);
      const schedule = doctorSchedulesQuery.data.schedules.find((item) => item.weekday === weekday) ?? null;

      if (schedule === null || !schedule.is_active) {
        return {
          ...dayOption,
          schedule,
          allSlots: [],
          availableSlots: [],
        };
      }

      const scheduleSlots = buildQuickSlots(dayOption.value, schedule);
      const nextAvailableSlots = scheduleSlots.filter((slot) => {
        const isSelectedCurrentSlot = selectedSlot?.start === slot.start && selectedSlot.end === slot.end;

        if (!isSelectedCurrentSlot && new Date(slot.start).getTime() < Date.now()) {
          return false;
        }

        return !doctorAppointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      return {
        ...dayOption,
        schedule,
        allSlots: scheduleSlots.map((slot) => ({ start: slot.start, end: slot.end, label: slot.timeLabel })),
        availableSlots: nextAvailableSlots.map((slot) => ({ start: slot.start, end: slot.end, label: slot.timeLabel })),
      };
    });
  }, [availabilityRange, doctorAppointments, doctorSchedulesQuery.data, selectedDoctorId, selectedSlot]);

  const hasAvailableSlotsInDisplayedPeriod = availabilityDays.some((day) => day.availableSlots.length > 0);
  const availabilityTimeLabels = useMemo(() => {
    const seenLabels = new Set<string>();
    const orderedLabels: string[] = [];

    availabilityDays.forEach((day) => {
      day.allSlots.forEach((slot) => {
        if (seenLabels.has(slot.label)) {
          return;
        }

        seenLabels.add(slot.label);
        orderedLabels.push(slot.label);
      });
    });

    return orderedLabels;
  }, [availabilityDays]);

  const availabilitySlotsByDay = useMemo(() => {
    return new Map(
      availabilityDays.map((day) => [
        day.value,
        {
          all: new Map(day.allSlots.map((slot) => [slot.label, slot])),
          available: new Map(day.availableSlots.map((slot) => [slot.label, slot])),
        },
      ]),
    );
  }, [availabilityDays]);

  const availabilityPeriodLabel = useMemo(() => buildAvailabilityPeriodLabel(availabilityRange), [availabilityRange]);
  const activeAvailabilityDay = selectedSlot?.dayValue ?? selectedAvailabilityDay;

  const availableSlots = useMemo<LocalSlotItem[]>(() => {
    if (selectedDoctorId === null || doctorSchedulesQuery.data === undefined) {
      return [];
    }

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

        return !doctorAppointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      dailySlots.forEach((slot) => {
        if (slots.length >= 8) {
          return;
        }

        slots.push({
          ...slot,
          dayLabel: formatDayLabel(dateValue),
          dayValue: dateValue,
        });
      });
    }

    return slots;
  }, [doctorAppointments, doctorSchedulesQuery.data, selectedDoctorId]);

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

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-ink">Alege intervalul</h4>
          {selectedDoctorId !== null ? <span className="text-sm text-slate-500">Săptămână / lună</span> : null}
        </div>

        <div className="min-h-[320px]">
          {selectedDoctorId === null ? (
            <div className="flex min-h-[220px] items-center rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
              <p className="font-semibold">Alege mai întâi medicul pentru a vedea calendarul complet.</p>
            </div>
          ) : doctorSchedulesQuery.isLoading || appointmentsAvailabilityQuery.isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary">
              <div className="flex items-center gap-3">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                <span className="font-semibold">Încărcăm programul doctorului și intervalele ocupate</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="inline-flex rounded-2xl bg-[#edf7f6] p-1">
                  <button
                    className={`min-h-11 rounded-2xl px-4 py-2 text-sm font-semibold transition ${availabilityViewMode === "week" ? "bg-[#2f8885] text-white shadow-md shadow-[#2f8885]/20" : "text-[#406b69] hover:bg-white/70"}`}
                    onClick={() => {
                      setAvailabilityViewMode("week");
                      setAvailabilityPeriodIndex(0);
                    }}
                    type="button"
                  >
                    Săptămână
                  </button>
                  <button
                    className={`min-h-11 rounded-2xl px-4 py-2 text-sm font-semibold transition ${availabilityViewMode === "month" ? "bg-[#2f8885] text-white shadow-md shadow-[#2f8885]/20" : "text-[#406b69] hover:bg-white/70"}`}
                    onClick={() => {
                      setAvailabilityViewMode("month");
                      setAvailabilityPeriodIndex(0);
                    }}
                    type="button"
                  >
                    Lună
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="rounded-full bg-[#eef7f6] px-3 py-1.5 font-semibold text-[#285f5c]">{availabilityPeriodLabel}</span>
                  <button
                    className="button-secondary min-h-11 gap-2 px-4 py-2"
                    onClick={() => setAvailabilityPeriodIndex((currentValue) => currentValue - 1)}
                    type="button"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    className="button-primary min-h-11 gap-2 px-4 py-2"
                    onClick={() => setAvailabilityPeriodIndex((currentValue) => currentValue + 1)}
                    type="button"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#eff7f6] px-3 py-1.5 text-[#356663]">
                  <span className="h-3 w-3 rounded-full bg-[#74c9c1]" />
                  Disponibil
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f3f6f5] px-3 py-1.5 text-slate-500">
                  <span className="h-3 w-3 rounded-full bg-[#cfd9d7]" />
                  Indisponibil
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#dff3f1] px-3 py-1.5 text-[#245c59]">
                  <span className="h-3 w-3 rounded-full bg-[#2f8885]" />
                  Selectat
                </span>
              </div>

              {availabilityTimeLabels.length === 0 ? (
                <div className="flex min-h-[220px] items-center rounded-[28px] border border-[#d6e7e5] bg-[#f7fbfb] px-4 py-3 text-[#5c7572]">
                  <p className="font-semibold">Doctorul nu are intervale active în perioada afișată.</p>
                </div>
              ) : (
                <div className="w-full rounded-[30px] border border-[#d7ebe8] bg-[linear-gradient(180deg,#fdfefe_0%,#f5fbfa_100%)] p-2 lg:p-3">
                  <div className="w-full overflow-x-auto">
                    <div
                      className="grid w-full min-w-[980px] gap-1.5 lg:gap-2"
                      style={{
                        gridTemplateColumns: `132px repeat(${availabilityTimeLabels.length}, minmax(72px, 1fr))`,
                      }}
                    >
                      <div className="sticky left-0 z-20 flex min-h-[56px] items-center rounded-[18px] border border-white/80 bg-white/95 px-3 shadow-sm lg:min-h-[64px] lg:rounded-[22px] lg:px-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Zi</p>
                          <p className="mt-1 text-xs font-semibold text-slate-600 lg:text-sm">Program</p>
                        </div>
                      </div>

                      {availabilityTimeLabels.map((timeLabel) => (
                        <div
                          className="flex min-h-[56px] items-center justify-center rounded-[18px] border border-white/80 bg-white/95 px-1 text-center text-[10px] font-semibold text-slate-700 shadow-sm lg:min-h-[64px] lg:rounded-[22px] lg:px-2 lg:text-sm"
                          key={`referral-header-${timeLabel}`}
                        >
                          {timeLabel}
                        </div>
                      ))}

                      {availabilityDays.map((day) => {
                        const isSelectedDay = activeAvailabilityDay === day.value;
                        const monthLabel = day.display.startsWith(day.dayNumber) ? day.display.slice(day.dayNumber.length).trim() : day.display;

                        return (
                          <div className="contents" key={`referral-day-row-${day.value}`}>
                            <button
                              className={`sticky left-0 z-10 flex min-h-[58px] items-center rounded-[18px] border px-3 text-left transition lg:min-h-[70px] lg:rounded-[22px] lg:px-4 ${isSelectedDay ? "border-[#6cbeb8] bg-[#def2f0] text-[#1f5350] shadow-sm" : day.isToday ? "border-[#bcdedb] bg-[#f0f8f7] text-[#356663]" : "border-white/80 bg-white/95 text-slate-600 shadow-sm hover:border-[#b8dfdb] hover:bg-[#f5fbfa]"}`}
                              onClick={() => setSelectedAvailabilityDay(day.value)}
                              type="button"
                            >
                              <div>
                                <span className="block text-xs font-semibold lg:text-sm">{day.title}</span>
                                <span className="mt-1 block text-[11px] opacity-80 lg:text-sm">{day.dayNumber} {monthLabel}</span>
                              </div>
                            </button>

                            {availabilityTimeLabels.map((timeLabel) => {
                              const daySlots = availabilitySlotsByDay.get(day.value);
                              const availableSlot = daySlots?.available.get(timeLabel) ?? null;
                              const scheduledSlot = daySlots?.all.get(timeLabel) ?? null;
                              const highlightedSlot = availableSlot ?? scheduledSlot;
                              const isSelectedSlot = highlightedSlot !== null && selectedSlot?.start === highlightedSlot.start && selectedSlot.end === highlightedSlot.end;

                              if (availableSlot !== null) {
                                return (
                                  <button
                                    aria-label={`${day.fullLabel} ${availableSlot.label}`}
                                    className={`min-h-[58px] rounded-[18px] border px-1 text-[10px] font-semibold transition lg:min-h-[70px] lg:rounded-[22px] lg:text-sm ${isSelectedSlot ? "border-[#2f8885] bg-[#2f8885] text-white shadow-md shadow-[#2f8885]/25" : "border-[#84cbc4] bg-[#afe3dd] text-[#1f5653] hover:border-[#5db8b1] hover:bg-[#88d4cc]"}`}
                                    key={`referral-slot-${day.value}-${timeLabel}`}
                                    onClick={() => {
                                      setSelectedAvailabilityDay(day.value);
                                      setSelectedSlot({
                                        dayLabel: formatDayLabel(day.value),
                                        dayValue: day.value,
                                        end: availableSlot.end,
                                        start: availableSlot.start,
                                        timeLabel: availableSlot.label,
                                      });
                                    }}
                                    type="button"
                                  >
                                    {availableSlot.label}
                                  </button>
                                );
                              }

                              return (
                                <div
                                  className={`min-h-[58px] rounded-[18px] border lg:min-h-[70px] lg:rounded-[22px] ${scheduledSlot !== null ? "border-[#d2dbda] bg-[#edf2f1]" : "border-[#edf2f1] bg-[#f8fbfa]"}`}
                                  key={`referral-empty-${day.value}-${timeLabel}`}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!hasAvailableSlotsInDisplayedPeriod && availabilityTimeLabels.length > 0 ? (
                <div className="rounded-[24px] border border-[#d8e3e1] bg-[#f6f9f8] px-4 py-3 text-sm font-semibold text-slate-500">
                  În perioada afișată toate sloturile sunt ocupate, în trecut sau în afara programului activ.
                </div>
              ) : null}
            </div>
          )}
        </div>
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

            navigate(`/programari/nou_1?${nextSearchParams.toString()}`);
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