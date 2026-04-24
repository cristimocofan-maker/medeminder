import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Database,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { apiClient } from "../api/client";
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedResponse } from "../shared/types/api";
import { useToast } from "../shared/ui/toast-provider";
import { FOLLOW_UP_STATUS_VALUES, type FollowUpStatus } from "../../../backend/src/shared/enums/follow-up-status.enum";
import type { AppointmentListItem } from "../modules/appointments/appointments.types";
import { getDoctorSchedules } from "../modules/doctor-schedules/doctor-schedules.api";
import type { DoctorScheduleDay } from "../modules/doctor-schedules/doctor-schedules.types";
import type { DoctorListItem } from "../modules/doctors/doctors.types";
import type { FollowUpListItem } from "../modules/follow-ups/follow-ups.types";
import { MESSAGE_STATUS_VALUES, type MessageStatus } from "../../../backend/src/shared/enums/message-status.enum";
import type { MessageListItem } from "../modules/messages/messages.types";
import type { PatientListItem } from "../modules/patients/patients.types";
import { getSpecializationTheme } from "../modules/specializations/components/specialization-theme";
import { syncDatabase } from "../modules/admin/admin.api";
import type { SyncDatabaseFailureResponse } from "../modules/admin/admin.types";

interface DashboardActionItem {
  id: string;
  title: string;
  detail: string;
  ctaLabel: string;
  to: string;
  icon: typeof CalendarDays;
}

interface DashboardKpiCard {
  title: string;
  value: string;
  detail: string;
  to: string;
  icon: typeof CalendarDays;
  cardClassName: string;
  iconClassName: string;
  titleClassName: string;
  valueClassName: string;
  detailClassName: string;
}

interface BusyDoctorItem {
  doctor_id: number;
  doctor_display_name: string;
  specialization_display_name: string;
  appointmentsCount: number;
}

interface DoctorDirectoryItem {
  doctor_id: number;
  doctor_display_name: string;
  specialization_display_name: string;
}

interface DashboardData {
  doctorDirectory: DoctorDirectoryItem[];
  appointmentsWindow: AppointmentListItem[];
  appointmentsToday: AppointmentListItem[];
  doctorSchedules: DoctorScheduleDay[];
  newPatientsToday: PatientListItem[];
  queuedMessagesCount: number;
  activeFollowUpsCount: number;
  actionItems: DashboardActionItem[];
  busyDoctors: BusyDoctorItem[];
}

interface AppointmentAgendaItem {
  appointment: AppointmentListItem;
  specialization: string;
  color: {
    background: string;
    border: string;
    text: string;
    chip: string;
  };
}

const ACTIVE_FOLLOW_UP_STATUSES = FOLLOW_UP_STATUS_VALUES.filter(
  (status: FollowUpStatus) => status !== "Închisă",
);

const QUEUED_MESSAGE_STATUS: MessageStatus = MESSAGE_STATUS_VALUES[0];
const HOUR_SLOTS = Array.from({ length: 11 }, (_, index) => index + 8);
const SPECIALTY_HUES = [188, 274, 48, 206, 144, 18, 332, 94, 222, 12, 164, 288];

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

const fetchCount = async (
  path: string,
  params: Record<string, string | number>,
): Promise<number> => {
  const response = await apiClient.get<ApiSuccessResponse<PaginatedResponse<unknown>>>(path, {
    params: {
      ...params,
      page: 1,
      page_size: 1,
    },
  });

  return response.data.data.total_count;
};

const isSameCalendarDay = (leftDate: Date, rightDate: Date): boolean => {
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
};

const addDays = (value: Date, days: number): Date => {
  const result = new Date(value);
  result.setDate(result.getDate() + days);

  return result;
};

const formatTime = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatDateTime = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatWeekdayLabel = (value: Date): string => {
  const rawLabel = new Intl.DateTimeFormat("ro-RO", { weekday: "short" }).format(value).replace(".", "");

  return rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
};

const formatDayNumber = (value: Date): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
};

const toDateKey = (value: Date): string => {
  const normalizedDate = new Date(value);
  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate.toISOString().slice(0, 10);
};

const getAgendaDaysUntilFriday = (startDate: Date): Date[] => {
  const normalizedStartDate = new Date(startDate);
  normalizedStartDate.setHours(0, 0, 0, 0);

  const result: Date[] = [];
  let cursor = normalizedStartDate;

  while (true) {
    result.push(new Date(cursor));

    const weekday = getScheduleWeekday(cursor);

    if (weekday === 5) {
      break;
    }

    cursor = addDays(cursor, 1);
  }

  return result;
};

const getHourLabel = (hour: number): string => `${String(hour).padStart(2, "0")}:00`;

const getScheduleWeekday = (value: Date): number => {
  const weekday = value.getDay();

  return weekday === 0 ? 7 : weekday;
};

const parseTimeToMinutes = (value: string): number => {
  const [hoursValue, minutesValue] = value.split(":").map(Number);

  return hoursValue * 60 + minutesValue;
};

const buildClinicHoursForDay = (
  schedules: DoctorScheduleDay[],
  appointmentsForDay: AppointmentListItem[],
  weekday: number,
): number[] => {
  const activeSchedulesToday = schedules.filter((schedule) => schedule.is_active && schedule.weekday === weekday);

  if (activeSchedulesToday.length > 0) {
    const earliestStartMinutes = Math.min(...activeSchedulesToday.map((schedule) => parseTimeToMinutes(schedule.start_time)));
    const latestEndMinutes = Math.max(...activeSchedulesToday.map((schedule) => parseTimeToMinutes(schedule.end_time)));
    const startHour = Math.floor(earliestStartMinutes / 60);
    const endHourExclusive = Math.ceil(latestEndMinutes / 60);

    return Array.from({ length: Math.max(endHourExclusive - startHour, 0) }, (_value, index) => startHour + index);
  }

  const appointmentHours = Array.from(
    new Set(appointmentsForDay.map((appointment) => new Date(appointment.start_date_time).getHours())),
  ).sort((leftHour, rightHour) => leftHour - rightHour);

  return appointmentHours;
};

const hashString = (value: string): number => {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
};

const getSpecialtyColor = (specialtyName: string): { background: string; border: string; text: string; chip: string } => {
  const normalizedValue = specialtyName.trim().toLocaleLowerCase("ro-RO");
  const hue = SPECIALTY_HUES[hashString(normalizedValue) % SPECIALTY_HUES.length];

  return {
    background: `hsl(${hue} 72% 95%)`,
    border: `hsl(${hue} 52% 82%)`,
    text: `hsl(${hue} 38% 30%)`,
    chip: `hsl(${hue} 68% 90%)`,
  };
};

const getDayTone = (value: Date, today: Date): { label: string; chipClassName: string } => {
  if (isSameCalendarDay(value, today)) {
    return {
      label: "Azi",
      chipClassName: "bg-primary/10 text-primary",
    };
  }

  if (isSameCalendarDay(value, addDays(today, 1))) {
    return {
      label: "Mâine",
      chipClassName: "bg-slate-100 text-slate-700",
    };
  }

  return {
    label: formatWeekdayLabel(value),
    chipClassName: "bg-slate-100 text-slate-700",
  };
};

const getAppointmentStatusPresentation = (
  appointment: AppointmentListItem,
): { label: string; className: string } => {
  const now = new Date();
  const startTime = new Date(appointment.start_date_time);

  if (appointment.appointment_status === "Finalizată") {
    return {
      label: "Finalizată",
      className: "bg-emerald-50 text-success border-emerald-200",
    };
  }

  if (appointment.appointment_status === "Anulată") {
    return {
      label: "Anulată",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }

  if (startTime.getTime() < now.getTime() && appointment.confirmation_status !== "Răspuns NU") {
    return {
      label: "Întârzie",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (appointment.appointment_status === "Confirmată" || appointment.confirmation_status === "Răspuns DA") {
    return {
      label: "Confirmată",
      className: "bg-emerald-50 text-success border-emerald-200",
    };
  }

  if (appointment.confirmation_status === "Fără răspuns") {
    return {
      label: "Neconfirmată",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  return {
    label: "În așteptare",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  };
};

async function loadDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const agendaDays = getAgendaDaysUntilFriday(now);
  const endOfAgendaWindow = new Date(agendaDays[agendaDays.length - 1]);
  endOfAgendaWindow.setHours(23, 59, 59, 999);
  const weekday = getScheduleWeekday(now);

  const [appointments, patients, doctors, queuedMessagesCount, queuedMessages, sentFollowUpsCount, postponedFollowUpsCount, sentFollowUps, postponedFollowUps] =
    await Promise.all([
      loadAllPages<AppointmentListItem>("/appointments", {
        start_date_time_from: startOfDay.toISOString(),
        sort_by: "start_date_time",
        sort_direction: "asc",
      }),
      loadAllPages<PatientListItem>("/patients", {
        sort_by: "created_at",
        sort_direction: "desc",
      }),
      loadAllPages<DoctorListItem>("/doctors", {
        sort_by: "doctor_display_name",
        sort_direction: "asc",
      }),
      fetchCount("/messages", {
        message_status: QUEUED_MESSAGE_STATUS,
        sort_by: "created_at",
        sort_direction: "desc",
      }),
      loadAllPages<MessageListItem>("/messages", {
        message_status: QUEUED_MESSAGE_STATUS,
        sort_by: "created_at",
        sort_direction: "desc",
      }),
      fetchCount("/follow-ups", {
        follow_up_status: ACTIVE_FOLLOW_UP_STATUSES[0],
        sort_by: "scheduled_for",
        sort_direction: "asc",
      }),
      fetchCount("/follow-ups", {
        follow_up_status: ACTIVE_FOLLOW_UP_STATUSES[1],
        sort_by: "scheduled_for",
        sort_direction: "asc",
      }),
      loadAllPages<FollowUpListItem>("/follow-ups", {
        follow_up_status: ACTIVE_FOLLOW_UP_STATUSES[0],
        sort_by: "scheduled_for",
        sort_direction: "asc",
      }),
      loadAllPages<FollowUpListItem>("/follow-ups", {
        follow_up_status: ACTIVE_FOLLOW_UP_STATUSES[1],
        sort_by: "scheduled_for",
        sort_direction: "asc",
      }),
    ]);

  const doctorSchedulesResponses = await Promise.all(
    doctors
      .filter((doctor) => doctor.is_active)
      .map(async (doctor) => getDoctorSchedules(doctor.doctor_id)),
  );
  const allDoctorSchedules = doctorSchedulesResponses.flatMap((response) => response.schedules);

  const appointmentsToday = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start_date_time);

    return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
  });
  const appointmentsWindow = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.start_date_time);

    return appointmentDate >= startOfDay && appointmentDate <= endOfAgendaWindow;
  });

  const newPatientsToday = patients.filter((patient) => isSameCalendarDay(new Date(patient.created_at), now));
  const busyDoctorMap = new Map<number, BusyDoctorItem>();

  appointmentsWindow.forEach((appointment) => {
    const doctor = doctors.find((doctorItem) => doctorItem.doctor_id === appointment.doctor_id);

    if (doctor === undefined) {
      return;
    }

    const existingItem = busyDoctorMap.get(doctor.doctor_id);

    if (existingItem === undefined) {
      busyDoctorMap.set(doctor.doctor_id, {
        doctor_id: doctor.doctor_id,
        doctor_display_name: doctor.doctor_display_name,
        specialization_display_name: doctor.specialization_display_name,
        appointmentsCount: 1,
      });

      return;
    }

    existingItem.appointmentsCount += 1;
  });

  const actionItems: DashboardActionItem[] = [
    ...appointmentsToday
      .filter((appointment) => appointment.confirmation_status === "Fără răspuns")
      .slice(0, 2)
      .map((appointment) => ({
        id: `appointment-${appointment.appointment_id}`,
        title: `Confirmă programarea lui ${appointment.patient_display_name}`,
        detail: `${formatTime(appointment.start_date_time)} • ${appointment.doctor_display_name}`,
        ctaLabel: "Confirmă",
        to: `/programari/${appointment.appointment_id}`,
        icon: CalendarDays,
      })),
    ...queuedMessages.slice(0, 1).map((message) => ({
      id: `message-${message.message_id}`,
      title: `Verifică mesajul ${message.channel_type}`,
      detail: `${message.message_subject} • ${formatDateTime(message.created_at)}`,
      ctaLabel: "Vezi",
      to: `/mesaje/${message.message_id}`,
      icon: MessageSquareText,
    })),
    ...sentFollowUps.concat(postponedFollowUps).slice(0, 1).map((followUp) => ({
      id: `follow-up-${followUp.follow_up_id}`,
      title: "Actualizează revenirea programată",
      detail: `${followUp.follow_up_status} • ${formatDateTime(followUp.scheduled_for)}`,
      ctaLabel: "Sună",
      to: `/reveniri/${followUp.follow_up_id}`,
      icon: RotateCcw,
    })),
  ].slice(0, 3);

  return {
    doctorDirectory: doctors.map((doctor) => ({
      doctor_id: doctor.doctor_id,
      doctor_display_name: doctor.doctor_display_name,
      specialization_display_name: doctor.specialization_display_name,
    })),
    appointmentsWindow,
    appointmentsToday,
    doctorSchedules: allDoctorSchedules,
    newPatientsToday,
    queuedMessagesCount,
    activeFollowUpsCount: sentFollowUpsCount + postponedFollowUpsCount,
    actionItems,
    busyDoctors: Array.from(busyDoctorMap.values())
      .sort((leftItem, rightItem) => rightItem.appointmentsCount - leftItem.appointmentsCount)
      .slice(0, 3),
  };
}

export const DashboardPage = (): JSX.Element => {
  const { session } = useAuth();
  const { showToast, updateToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const now = new Date();
  const agendaDays = getAgendaDaysUntilFriday(now);
  const [selectedBoardDayKey, setSelectedBoardDayKey] = useState(() => toDateKey(agendaDays[0]));
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: loadDashboardData,
  });
  const isAdministrator = session?.user.user_role_label === "Administrator";
  const syncMutation = useMutation({
    mutationFn: async () => syncDatabase(),
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: "Sincronizăm baza de date",
        description: "Exportăm datele locale și rulăm pașii de upload și restore pe serverul remote.",
      });

      return { toastId };
    },
    onSuccess: (result, _variables, context) => {
      if (result.success) {
        if (context?.toastId !== undefined) {
          updateToast(context.toastId, {
            variant: "success",
            title: "Sincronizarea s-a încheiat",
            description: `Dump, upload și restore au fost finalizate în ${result.duration_ms} ms.`,
          });
        }

        return;
      }

      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Sincronizarea a eșuat",
          description: `Pasul ${result.failed_step} a eșuat: ${result.message}`,
        });
      }
    },
    onError: (error: AxiosError<ApiErrorResponse | SyncDatabaseFailureResponse>, _variables, context) => {
      const responsePayload = error.response?.data;
      const description = responsePayload !== undefined && "failed_step" in responsePayload
        ? `Pasul ${responsePayload.failed_step} a eșuat: ${responsePayload.message}`
        : (responsePayload as ApiErrorResponse | undefined)?.message ?? "Verifică permisiunile și configurarea endpointului de sync.";

      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut porni sincronizarea",
          description,
        });
      }
    },
  });

  useEffect(() => {
    const dayExists = agendaDays.some((day) => toDateKey(day) === selectedBoardDayKey);

    if (!dayExists) {
      setSelectedBoardDayKey(toDateKey(agendaDays[0]));
    }
  }, [agendaDays, selectedBoardDayKey]);

  if (dashboardQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Dashboard</span>
        <h2 className="mt-4">Încărcăm agenda clinicii</h2>
        <p className="mt-3 text-slate-500">Pregătim programările reale din următoarele zile.</p>
      </section>
    );
  }

  if (dashboardQuery.isError || dashboardQuery.data === undefined) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Dashboard</span>
            <h2 className="mt-4">Nu am putut încărca agenda</h2>
            <p className="mt-3 text-slate-500">Reîncearcă pentru a încărca programările și prioritățile reale ale clinicii.</p>
          </div>
        </div>

        <button className="button-primary mt-6 gap-2" onClick={() => void dashboardQuery.refetch()} type="button">
          <RefreshCw className="h-5 w-5" />
          Reîncearcă
        </button>
      </section>
    );
  }

  const dashboard = dashboardQuery.data;
  const greeting = `Bun venit, ${session?.clinic.display_name ?? "clinică"}`;
  const subtitle = `Ai ${dashboard.appointmentsToday.length} programări azi și ${dashboard.newPatientsToday.length} pacienți noi.`;
  const specialtyFilter = searchParams.get("specialty")?.trim() ?? "";
  const doctorFilter = searchParams.get("doctor")?.trim() ?? "";
  const doctorDirectoryMap = new Map(dashboard.doctorDirectory.map((doctor) => [doctor.doctor_id, doctor]));
  const appointmentsWithMeta: AppointmentAgendaItem[] = dashboard.appointmentsWindow.map((appointment) => {
    const doctorMeta = doctorDirectoryMap.get(appointment.doctor_id);
    const specialization = doctorMeta?.specialization_display_name ?? "Fără specialitate";

    return {
      appointment,
      specialization,
      color: getSpecialtyColor(specialization),
    };
  });
  const specialtyOptions = Array.from(new Set(appointmentsWithMeta.map((item) => item.specialization))).sort((left, right) =>
    left.localeCompare(right, "ro-RO"),
  );
  const doctorOptions = Array.from(
    new Map(appointmentsWithMeta.map((item) => [item.appointment.doctor_display_name, item.appointment.doctor_display_name])).values(),
  )
    .sort((left, right) => left.localeCompare(right, "ro-RO"))
    .slice(0, 5);
  const filteredAppointments = appointmentsWithMeta
    .filter((item) => {
      const matchesSpecialty = specialtyFilter === "" || item.specialization === specialtyFilter;
      const matchesDoctor = doctorFilter === "" || item.appointment.doctor_display_name === doctorFilter;

      return matchesSpecialty && matchesDoctor;
    })
    .sort(
      (leftItem, rightItem) =>
        new Date(leftItem.appointment.start_date_time).getTime() - new Date(rightItem.appointment.start_date_time).getTime(),
    );
  const filteredTodayAppointments = filteredAppointments.filter((item) =>
    isSameCalendarDay(new Date(item.appointment.start_date_time), now),
  );
  const selectedBoardDay = agendaDays.find((day) => toDateKey(day) === selectedBoardDayKey) ?? agendaDays[0];
  const selectedBoardAppointments = filteredAppointments.filter((item) =>
    isSameCalendarDay(new Date(item.appointment.start_date_time), selectedBoardDay),
  );
  const selectedBoardSpecializations = Array.from(new Set(selectedBoardAppointments.map((item) => item.specialization))).sort((left, right) =>
    left.localeCompare(right, "ro-RO"),
  );
  const selectedBoardHours = buildClinicHoursForDay(
    dashboard.doctorSchedules,
    selectedBoardAppointments.map((item) => item.appointment),
    getScheduleWeekday(selectedBoardDay),
  );
  const filteredNextAppointment =
    filteredTodayAppointments.find((item) => new Date(item.appointment.start_date_time).getTime() >= now.getTime()) ?? null;
  const nextAppointmentRoute = filteredNextAppointment === null
    ? "/programari/nou_1"
    : `/programari/${filteredNextAppointment.appointment.appointment_id}`;
  const kpiCards: DashboardKpiCard[] = [
    {
      title: "Programări azi",
      value: String(filteredTodayAppointments.length),
      detail:
        filteredTodayAppointments.length === 0
          ? "Nu există programări în filtrele active pentru astăzi."
          : "Deschide agenda de azi și vezi rapid toate sloturile reale.",
      to: "/programari",
      icon: CalendarDays,
      cardClassName:
        "border border-primary/30 bg-gradient-to-br from-primary/85 via-teal-600/85 to-cyan-600/85 text-white shadow-lg shadow-primary/18 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/22",
      iconClassName: "bg-white/18 text-slate-50 ring-1 ring-white/20",
      titleClassName: "text-slate-50/88",
      valueClassName: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.10)]",
      detailClassName: "text-slate-50/90",
    },
    {
      title: "Următoarea programare",
      value: filteredNextAppointment === null ? "Liber" : formatTime(filteredNextAppointment.appointment.start_date_time),
      detail:
        filteredNextAppointment === null
          ? "Nu există o altă programare astăzi. Poți adăuga una nouă."
          : `${filteredNextAppointment.appointment.patient_display_name} • ${filteredNextAppointment.appointment.doctor_display_name}`,
      to: nextAppointmentRoute,
      icon: Clock3,
      cardClassName:
        "border border-primary/30 bg-gradient-to-br from-primary via-teal-600 to-cyan-600 text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25",
      iconClassName: "bg-white/20 text-slate-50 ring-1 ring-white/20",
      titleClassName: "text-slate-50/90",
      valueClassName: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]",
      detailClassName: "text-slate-50/95",
    },
    {
      title: "Pacienți noi",
      value: String(dashboard.newPatientsToday.length),
      detail:
        dashboard.newPatientsToday.length === 0
          ? "Nu au fost înregistrați pacienți noi în intervalul de azi."
          : "Vezi rapid pacienții adăugați azi și deschide fișele lor.",
      to: "/pacienti",
      icon: Users,
      cardClassName:
        "border border-primary/30 bg-gradient-to-br from-primary/80 via-teal-600/82 to-cyan-600/80 text-white shadow-lg shadow-primary/16 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20",
      iconClassName: "bg-white/18 text-slate-50 ring-1 ring-white/20",
      titleClassName: "text-slate-50/88",
      valueClassName: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.10)]",
      detailClassName: "text-slate-50/90",
    },
    {
      title: "Urgente",
      value: String(dashboard.queuedMessagesCount + dashboard.activeFollowUpsCount),
      detail:
        dashboard.queuedMessagesCount + dashboard.activeFollowUpsCount === 0
          ? "Nu există alerte active în mesaje sau follow-up-uri."
          : "Deschide mesajele și reveni­rile care cer atenție imediată.",
      to: dashboard.queuedMessagesCount > 0 ? "/mesaje" : "/reveniri",
      icon: MessageSquareText,
      cardClassName:
        "border border-primary/30 bg-gradient-to-br from-primary/80 via-teal-600/80 to-cyan-600/80 text-white shadow-lg shadow-primary/16 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20",
      iconClassName: "bg-white/18 text-slate-50 ring-1 ring-white/20",
      titleClassName: "text-slate-50/88",
      valueClassName: "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.10)]",
      detailClassName: "text-slate-50/90",
    },
  ];
  const busiestDoctorMax = Math.max(...dashboard.busyDoctors.map((doctor) => doctor.appointmentsCount), 1);

  const updateFilters = (nextValues: { specialty?: string; doctor?: string }): void => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextValues.specialty !== undefined) {
      if (nextValues.specialty === "") {
        nextParams.delete("specialty");
      } else {
        nextParams.set("specialty", nextValues.specialty);
        nextParams.delete("doctor");
      }
    }

    if (nextValues.doctor !== undefined) {
      if (nextValues.doctor === "") {
        nextParams.delete("doctor");
      } else {
        nextParams.set("doctor", nextValues.doctor);
        nextParams.delete("specialty");
      }
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <section className="space-y-4">
      <div className="panel overflow-hidden p-4 md:p-5 xl:p-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_auto] xl:items-start">
          <div className="min-w-0 max-w-4xl">
            <span className="badge-soft">Agendă săptămânală</span>
            <h2 className="mt-2 text-3xl md:text-[2.35rem] md:leading-tight">{greeting}</h2>
            <p className="mt-1 text-sm text-slate-500 md:text-base">{subtitle}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/15" to="/programari/nou_1">
                + Programare nouă
              </Link>
              <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" to="/pacienti/nou">
                + Pacient nou
              </Link>
              <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" to="/programari">
                Vezi programările
              </Link>
              <Link className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200" to="/pacienti">
                Vezi pacienții noi
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            {isAdministrator ? (
              <button
                className="button-secondary gap-2 px-4 py-2.5"
                disabled={syncMutation.isPending}
                onClick={() => void syncMutation.mutateAsync()}
                type="button"
              >
                {syncMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                Sync Database
              </button>
            ) : null}
            <Link className="button-primary gap-2 px-4 py-2.5" to="/programari/nou_1">
              <Plus className="h-4 w-4" />
              Adaugă programare
            </Link>
            <Link className="button-secondary gap-2 px-4 py-2.5" to="/pacienti/nou">
              <Users className="h-4 w-4" />
              Pacient nou
            </Link>
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden p-2 md:p-2.5">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                className={`group flex min-h-[124px] flex-col justify-between rounded-[22px] p-4 transition ${card.cardClassName}`}
                key={card.title}
                to={card.to}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${card.titleClassName}`}>{card.title}</p>
                    <p className={`mt-2 text-2xl font-semibold md:text-[2rem] ${card.valueClassName}`}>{card.value}</p>
                  </div>
                  <div className={`rounded-2xl p-2.5 transition group-hover:scale-105 ${card.iconClassName}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <p className={`mt-3 line-clamp-2 text-sm leading-5 ${card.detailClassName}`}>{card.detail}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="panel p-3.5 md:p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
                specialtyFilter === "" && doctorFilter === ""
                  ? "bg-primary text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              onClick={() => updateFilters({ specialty: "", doctor: "" })}
              type="button"
            >
              Toate
            </button>

            {specialtyOptions.map((specialty) => {
              const color = getSpecialtyColor(specialty);
              const isActive = specialtyFilter === specialty;

              return (
                <button
                  className="rounded-full border px-3 py-2 text-sm font-semibold transition"
                  key={specialty}
                  onClick={() => updateFilters({ specialty: isActive ? "" : specialty })}
                  style={{
                    backgroundColor: isActive ? color.chip : "rgb(248 250 252)",
                    borderColor: isActive ? color.border : "rgb(226 232 240)",
                    color: isActive ? color.text : "rgb(51 65 85)",
                  }}
                  type="button"
                >
                  {specialty}
                </button>
              );
            })}
          </div>

          {doctorOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {doctorOptions.map((doctor) => {
                const isActive = doctorFilter === doctor;

                return (
                  <button
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    key={doctor}
                    onClick={() => updateFilters({ doctor: isActive ? "" : doctor })}
                    type="button"
                  >
                    {doctor}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <article className="panel overflow-hidden p-4 md:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_auto] xl:items-end">
          <div className="max-w-4xl">
            <span className="badge-soft">Programările pe zile</span>
            <h3 className="mt-2 text-xl font-semibold text-ink">Tablou pe specializări și orele clinicii</h3>
            <p className="mt-1 text-sm text-slate-500">Poți schimba rapid ziua din cookie-urile de mai jos, iar tabelul se reface exclusiv din programările reale și din programul real al clinicii.</p>
          </div>

          <Link className="button-secondary px-4 py-2 text-sm xl:justify-self-end" to="/programari">
            Vezi lista completă
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {agendaDays.map((day) => {
            const dayKey = toDateKey(day);
            const tone = getDayTone(day, now);
            const isActive = dayKey === selectedBoardDayKey;
            const appointmentsCount = filteredAppointments.filter((item) =>
              isSameCalendarDay(new Date(item.appointment.start_date_time), day),
            ).length;

            return (
              <button
                className={`rounded-[26px] border px-4 py-2 text-left transition ${isActive ? "border-primary/20 bg-primary text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                key={dayKey}
                onClick={() => setSelectedBoardDayKey(dayKey)}
                type="button"
              >
                <span className={`block text-[11px] font-semibold uppercase tracking-[0.16em] ${isActive ? "text-white/75" : tone.chipClassName.replace("bg-", "text-").split(" ")[1] ?? "text-slate-500"}`}>
                  {tone.label}
                </span>
                <span className="mt-1 block text-sm font-semibold">{formatDayNumber(day)}</span>
                <span className={`mt-0.5 block text-xs font-medium ${isActive ? "text-white/80" : "text-slate-500"}`}>
                  {appointmentsCount} programări
                </span>
              </button>
            );
          })}
        </div>

        {selectedBoardAppointments.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            Nu există programări reale pentru ziua selectată în filtrele curente.
          </div>
        ) : (
          <>
            <div className="mt-5 hidden xl:block">
              <div
                className="grid gap-px overflow-hidden rounded-[28px] border border-slate-200 bg-slate-200"
                style={{ gridTemplateColumns: `88px repeat(${selectedBoardSpecializations.length}, minmax(0, 1fr))` }}
              >
                <div className="bg-slate-50 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Orar
                </div>

                {selectedBoardSpecializations.map((specialization) => {
                  const theme = getSpecializationTheme(specialization);

                  return (
                    <div className="bg-white px-4 py-4" key={specialization}>
                      <div className="flex flex-col gap-2">
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${theme.badgeClassName}`}>
                          Specializare
                        </span>
                        <p className="text-sm font-semibold text-ink">{specialization}</p>
                      </div>
                    </div>
                  );
                })}

                {selectedBoardHours.map((hour) => (
                  <div className="contents" key={`today-board-${hour}`}>
                    <div className="bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                      {getHourLabel(hour)}
                    </div>

                    {selectedBoardSpecializations.map((specialization) => {
                      const theme = getSpecializationTheme(specialization);
                      const cellAppointments = selectedBoardAppointments.filter((item) => {
                        const appointmentStartDate = new Date(item.appointment.start_date_time);

                        return item.specialization === specialization && appointmentStartDate.getHours() === hour;
                      });

                      return (
                        <div className={`min-h-[112px] bg-white px-3 py-3 ${cellAppointments.length === 0 ? "" : theme.surfaceClassName}`} key={`${specialization}-${hour}`}>
                          {cellAppointments.length === 0 ? (
                            <div className="flex h-full min-h-[88px] items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-white/80 text-xs font-medium text-slate-300">
                              -
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {cellAppointments.map((item) => {
                                const statusPresentation = getAppointmentStatusPresentation(item.appointment);

                                return (
                                  <Link
                                    className={`block rounded-[20px] border bg-white/88 px-3 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.borderClassName}`}
                                    key={item.appointment.appointment_id}
                                    to={`/programari/${item.appointment.appointment_id}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-ink">{item.appointment.patient_display_name}</p>
                                        <p className={`mt-1 text-xs font-semibold ${theme.accentTextClassName}`}>{formatTime(item.appointment.start_date_time)}</p>
                                        <p className="mt-1 truncate text-[11px] text-slate-500">{item.appointment.doctor_display_name}</p>
                                      </div>
                                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusPresentation.className}`}>
                                        {statusPresentation.label}
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4 xl:hidden">
              {selectedBoardSpecializations.map((specialization) => {
                const theme = getSpecializationTheme(specialization);
                const specializationAppointments = selectedBoardAppointments
                  .filter((item) => item.specialization === specialization)
                  .sort(
                    (leftItem, rightItem) =>
                      new Date(leftItem.appointment.start_date_time).getTime() - new Date(rightItem.appointment.start_date_time).getTime(),
                  );

                return (
                  <div className={`rounded-[26px] border p-4 ${theme.borderClassName} ${theme.surfaceClassName}`} key={specialization}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${theme.badgeClassName}`}>
                          Specializare
                        </span>
                        <h4 className="mt-3 text-lg font-semibold text-ink">{specialization}</h4>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.subtleBadgeClassName}`}>
                        {specializationAppointments.length} programări
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {specializationAppointments.map((item) => {
                        const statusPresentation = getAppointmentStatusPresentation(item.appointment);

                        return (
                          <Link
                            className={`block rounded-[20px] border bg-white/90 px-3 py-3 shadow-sm ${theme.borderClassName}`}
                            key={item.appointment.appointment_id}
                            to={`/programari/${item.appointment.appointment_id}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-ink">{item.appointment.patient_display_name}</p>
                                <p className={`mt-1 text-xs font-semibold ${theme.accentTextClassName}`}>{formatTime(item.appointment.start_date_time)}</p>
                              </div>
                              <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusPresentation.className}`}>
                                {statusPresentation.label}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </article>

      <div className="space-y-4">
        <aside className="panel p-4 md:p-5">
            <span className="badge-soft">Priorități</span>
            <h3 className="mt-2 text-lg font-semibold text-ink">De făcut acum</h3>

            {dashboard.actionItems.length === 0 ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Nu există nimic urgent acum.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {dashboard.actionItems.map((actionItem) => {
                  const Icon = actionItem.icon;

                  return (
                    <Link className="flex items-center gap-3 rounded-[20px] bg-slate-50 px-3 py-3 transition hover:bg-slate-100" key={actionItem.id} to={actionItem.to}>
                      <div className="rounded-2xl bg-white p-2 text-slate-700 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{actionItem.title}</p>
                        <p className="truncate text-xs text-slate-500">{actionItem.detail}</p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {actionItem.ctaLabel}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
        </aside>

        <aside className="panel p-4 md:p-5">
            <span className="badge-soft">Încărcare</span>
            <h3 className="mt-2 text-lg font-semibold text-ink">Medicii cei mai ocupați</h3>

            {dashboard.busyDoctors.length === 0 ? (
              <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                Nu există programări în intervalul afișat.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {dashboard.busyDoctors.map((doctor) => (
                  <div className="rounded-[20px] bg-slate-50 px-3 py-3" key={doctor.doctor_id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{doctor.doctor_display_name}</p>
                        <p className="truncate text-xs text-slate-500">{doctor.specialization_display_name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Stethoscope className="h-3.5 w-3.5" />
                        {doctor.appointmentsCount}
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(doctor.appointmentsCount / busiestDoctorMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </aside>
      </div>
    </section>
  );
};