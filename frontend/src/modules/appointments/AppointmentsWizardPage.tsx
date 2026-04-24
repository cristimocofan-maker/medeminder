import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiSuccessResponse, PaginatedResponse } from "../../shared/types/api";
import { getDoctorSchedules } from "../doctor-schedules/doctor-schedules.api";
import type { DoctorScheduleDay } from "../doctor-schedules/doctor-schedules.types";
import { listDoctors, listSpecializationOptions } from "../doctors/doctors.api";
import type { DoctorListItem, SpecializationOption } from "../doctors/doctors.types";
import { createPatient } from "../patients/patients.api";
import { calculateAgeLabelFromIsoDate, formatPatientBirthDate, normalizePatientCnpInput, parsePatientDemographicsFromCnp, previewPatientDemographicsFromCnp } from "../patients/patient-demographics";
import type { PatientListItem } from "../patients/patients.types";
import { createAppointment } from "./appointments.api";
import { AppointmentServicesSelector } from "./components/AppointmentServicesSelector";
import type { AppointmentListItem } from "./appointments.types";

const APPOINTMENT_FLOW_FONT_FAMILY = '"Segoe UI Variable Display", "Segoe UI Variable Text", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const APPOINTMENT_FLOW_LETTER_SPACING = "0.016em";

type WizardStep = "doctor" | "schedule" | "patient";
type PatientMode = "existing" | "new";
type AvailabilityViewMode = "week" | "month";

interface WizardPatientDraft {
  cnp: string;
  city: string;
  patient_display_name: string;
  phone_number: string;
}

interface WizardSelectedSlot {
  day_value: string;
  end_date_time: string;
  label: string;
  start_date_time: string;
}

interface AvailabilityDay {
  allSlots: Array<{ end: string; label: string; start: string }>;
  availableSlots: Array<{ end: string; label: string; start: string }>;
  dayNumber: string;
  display: string;
  fullLabel: string;
  isToday: boolean;
  schedule: DoctorScheduleDay | null;
  title: string;
  value: string;
}

const DEFAULT_NEW_PATIENT_DRAFT: WizardPatientDraft = {
  cnp: "",
  city: "",
  patient_display_name: "",
  phone_number: "",
};

const availabilityWeekdayFormatter = new Intl.DateTimeFormat("ro-RO", {
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

const toApiDateTime = (localValue: string): string => {
  return new Date(localValue).toISOString();
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

const capitalizeText = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const toDateValue = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatAvailabilityWeekday = (date: Date): string => {
  return capitalizeText(availabilityWeekdayFormatter.format(date).replace(/\./g, ""));
};

const formatAvailabilityDayMonth = (date: Date): string => {
  return capitalizeText(availabilityDayMonthFormatter.format(date).replace(/\./g, ""));
};

const formatAvailabilityFullLabel = (date: Date): string => {
  return capitalizeText(availabilityFullDateFormatter.format(date));
};

const buildAvailabilityRangeFromStart = (startDate: Date, dayCount: number): Array<{
  dayNumber: string;
  display: string;
  fullLabel: string;
  isToday: boolean;
  title: string;
  value: string;
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
): Array<{ end: string; label: string; start: string }> => {
  const slots: Array<{ end: string; label: string; start: string }> = [];
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
      label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    });
  }

  return slots;
};

const intersectsWithAppointment = (
  slot: { end: string; start: string },
  appointment: Pick<AppointmentListItem, "start_date_time" | "end_date_time">,
): boolean => {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  const appointmentStart = new Date(appointment.start_date_time).getTime();
  const appointmentEnd = new Date(appointment.end_date_time).getTime();

  return slotStart < appointmentEnd && slotEnd > appointmentStart;
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

const parseNumericParam = (value: string | null): number | null => {
  const parsedValue = value === null ? Number.NaN : Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const normalizePhone = (value: string): string => {
  return value.replace(/\D/g, "");
};

const getStepMeta = (
  currentStep: WizardStep,
  selectedDoctorId: number | null,
  selectedSlot: WizardSelectedSlot | null,
): Array<{ description: string; id: WizardStep; title: string }> => {
  const canOpenSchedule = selectedDoctorId !== null;
  const canOpenPatient = selectedSlot !== null;

  return [
    {
      id: "doctor",
      title: "Specializare și medic",
      description: currentStep === "doctor" ? "Alegi medicul potrivit" : selectedDoctorId !== null ? "Completat" : "În așteptare",
    },
    {
      id: "schedule",
      title: "Interval",
      description: currentStep === "schedule" ? "Alegi un slot real" : selectedSlot !== null ? "Completat" : canOpenSchedule ? "Disponibil" : "Blocat",
    },
    {
      id: "patient",
      title: "Pacient",
      description: currentStep === "patient" ? "Confirmi pacientul" : canOpenPatient ? "Disponibil" : "Blocat",
    },
  ];
};

export const AppointmentsWizardPage = (): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast, updateToast, dismissToast } = useToast();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<WizardStep>("doctor");
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(null);
  const [doctorSearchValue, setDoctorSearchValue] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [availabilityViewMode, setAvailabilityViewMode] = useState<AvailabilityViewMode>("week");
  const [availabilityPeriodIndex, setAvailabilityPeriodIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<WizardSelectedSlot | null>(null);
  const [patientMode, setPatientMode] = useState<PatientMode>("existing");
  const [patientSearchValue, setPatientSearchValue] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [resolvedNewPatientId, setResolvedNewPatientId] = useState<number | null>(null);
  const [newPatientDraft, setNewPatientDraft] = useState<WizardPatientDraft>(DEFAULT_NEW_PATIENT_DRAFT);
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [isSuccessStateVisible, setIsSuccessStateVisible] = useState(false);
  const toastIdRef = useRef<string | null>(null);
  const prefillDoctorId = parseNumericParam(searchParams.get("doctor_id"));
  const prefillPatientId = parseNumericParam(searchParams.get("patient_id"));
  const prefillStart = searchParams.get("start")?.trim() ?? "";
  const prefillEnd = searchParams.get("end")?.trim() ?? "";
  const today = getStartOfDay(new Date());

  const specializationsQuery = useQuery({
    queryKey: ["appointment-specializations-options"],
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

  const patientsQuery = useQuery({
    queryKey: ["appointment-patients-options"],
    queryFn: async () =>
      loadAllPages<PatientListItem>("/patients", {
        is_active: true,
        sort_by: "patient_id",
        sort_direction: "asc",
      }),
  });

  const doctorSchedulesQuery = useQuery({
    queryKey: ["doctor-schedules", selectedDoctorId],
    queryFn: async () => getDoctorSchedules(selectedDoctorId as number),
    enabled: selectedDoctorId !== null,
  });

  const appointmentsAvailabilityQuery = useQuery({
    queryKey: ["appointments-availability", selectedDoctorId],
    queryFn: async () =>
      loadAllPages<AppointmentListItem>("/appointments", {
        sort_by: "start_date_time",
        sort_direction: "asc",
      }),
    enabled: selectedDoctorId !== null,
  });

  const specializations = specializationsQuery.data ?? [];
  const allDoctors = useMemo(() => (doctorsQuery.data?.items ?? []).filter((doctor) => doctor.is_active), [doctorsQuery.data?.items]);
  const patients = patientsQuery.data ?? [];
  const selectedDoctor = useMemo(
    () => allDoctors.find((doctor) => doctor.doctor_id === selectedDoctorId) ?? null,
    [allDoctors, selectedDoctorId],
  );

  const visibleSpecializations = useMemo(() => {
    return specializations.filter((specialization) =>
      allDoctors.some((doctor) => doctor.specialization_id === specialization.specialization_id),
    );
  }, [allDoctors, specializations]);

  const normalizedDoctorSearchValue = doctorSearchValue.trim().toLocaleLowerCase();
  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doctor) => {
      const matchesSpecialization = selectedSpecializationId === null || doctor.specialization_id === selectedSpecializationId;
      const matchesSearch =
        normalizedDoctorSearchValue === "" || doctor.doctor_display_name.toLocaleLowerCase().includes(normalizedDoctorSearchValue);

      return matchesSpecialization && matchesSearch;
    });
  }, [allDoctors, normalizedDoctorSearchValue, selectedSpecializationId]);

  const normalizedPatientSearchValue = patientSearchValue.trim().toLocaleLowerCase();
  const filteredPatients = useMemo(() => {
    const baseItems = patients.filter((patient) => {
      if (normalizedPatientSearchValue === "") {
        return true;
      }

      return (
        patient.patient_display_name.toLocaleLowerCase().includes(normalizedPatientSearchValue) ||
        patient.phone_number.includes(patientSearchValue.trim()) ||
        (patient.cnp ?? "").includes(patientSearchValue.trim())
      );
    });

    return baseItems.slice(0, 8);
  }, [normalizedPatientSearchValue, patientSearchValue, patients]);

  const exactPhoneMatch = useMemo(() => {
    const normalizedPhone = normalizePhone(newPatientDraft.phone_number);

    if (normalizedPhone === "") {
      return null;
    }

    return (
      patients.find(
        (patient) =>
          patient.patient_id !== resolvedNewPatientId && normalizePhone(patient.phone_number) === normalizedPhone,
      ) ?? null
    );
  }, [newPatientDraft.phone_number, patients, resolvedNewPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.patient_id === selectedPatientId) ?? null,
    [patients, selectedPatientId],
  );
  const derivedNewPatientDemographics = useMemo(() => previewPatientDemographicsFromCnp(newPatientDraft.cnp), [newPatientDraft.cnp]);
  const hasInvalidNewPatientCnp = useMemo(() => {
    const normalizedCnp = normalizePatientCnpInput(newPatientDraft.cnp);

    return normalizedCnp.length === 13 && parsePatientDemographicsFromCnp(normalizedCnp) === null;
  }, [newPatientDraft.cnp]);
  const selectedPatientAgeLabel = useMemo(
    () => calculateAgeLabelFromIsoDate(selectedPatient?.birth_date ?? null),
    [selectedPatient?.birth_date],
  );

  useEffect(() => {
    if (patients.length === 0) {
      setPatientMode("new");
      return;
    }

    if (prefillPatientId !== null) {
      setPatientMode("existing");
    }
  }, [patients.length, prefillPatientId]);

  useEffect(() => {
    if (prefillPatientId === null || patients.length === 0) {
      return;
    }

    const prefilledPatient = patients.find((patient) => patient.patient_id === prefillPatientId);

    if (prefilledPatient !== undefined) {
      setSelectedPatientId(prefilledPatient.patient_id);
      setPatientMode("existing");
    }
  }, [patients, prefillPatientId]);

  useEffect(() => {
    if (patientMode !== "new" && resolvedNewPatientId !== null) {
      setResolvedNewPatientId(null);
    }
  }, [patientMode, resolvedNewPatientId]);

  useEffect(() => {
    if (resolvedNewPatientId === null) {
      return;
    }

    setResolvedNewPatientId(null);
  }, [newPatientDraft.cnp, newPatientDraft.city, newPatientDraft.patient_display_name, newPatientDraft.phone_number]);

  useEffect(() => {
    if (prefillDoctorId === null || allDoctors.length === 0) {
      return;
    }

    const prefilledDoctor = allDoctors.find((doctor) => doctor.doctor_id === prefillDoctorId);

    if (prefilledDoctor !== undefined) {
      setSelectedSpecializationId(prefilledDoctor.specialization_id);
      setSelectedDoctorId(prefilledDoctor.doctor_id);
    }
  }, [allDoctors, prefillDoctorId]);

  useEffect(() => {
    if (selectedDoctorId === null) {
      return;
    }

    const selectedDoctorStillVisible = allDoctors.some((doctor) => doctor.doctor_id === selectedDoctorId);

    if (!selectedDoctorStillVisible) {
      setSelectedDoctorId(null);
      setSelectedSlot(null);
      setCurrentStep("doctor");
    }
  }, [allDoctors, selectedDoctorId]);

  useEffect(() => {
    if (selectedDoctorId === null) {
      return;
    }

    const selectedDoctorStillMatchesFilter = filteredDoctors.some((doctor) => doctor.doctor_id === selectedDoctorId);

    if (!selectedDoctorStillMatchesFilter) {
      setSelectedDoctorId(null);
      setSelectedSlot(null);
      setCurrentStep("doctor");
    }
  }, [filteredDoctors, selectedDoctorId]);

  const availabilityAnchorDate = useMemo(() => {
    return addDays(today, availabilityPeriodIndex * (availabilityViewMode === "week" ? 7 : 30));
  }, [availabilityPeriodIndex, availabilityViewMode, today]);

  const availabilityRange = useMemo(
    () => buildAvailabilityRangeFromStart(availabilityAnchorDate, availabilityViewMode === "week" ? 7 : 30),
    [availabilityAnchorDate, availabilityViewMode],
  );

  const doctorAppointments = useMemo(() => {
    if (selectedDoctorId === null) {
      return [];
    }

    return (appointmentsAvailabilityQuery.data ?? []).filter((appointment) => appointment.doctor_id === selectedDoctorId);
  }, [appointmentsAvailabilityQuery.data, selectedDoctorId]);

  const availabilityDays = useMemo<AvailabilityDay[]>(() => {
    if (selectedDoctorId === null || doctorSchedulesQuery.data === undefined) {
      return [];
    }

    return availabilityRange.map((day) => {
      const weekday = getScheduleWeekdayFromLocalDate(day.value);
      const schedule = doctorSchedulesQuery.data.schedules.find((item) => item.weekday === weekday && item.is_active) ?? null;

      if (schedule === null) {
        return {
          ...day,
          allSlots: [],
          availableSlots: [],
          schedule: null,
        };
      }

      const allSlots = buildQuickSlots(day.value, schedule);
      const availableSlots = allSlots.filter((slot) => {
        if (new Date(slot.start).getTime() < Date.now()) {
          return false;
        }

        return !doctorAppointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      return {
        ...day,
        allSlots,
        availableSlots,
        schedule,
      };
    });
  }, [availabilityRange, doctorAppointments, doctorSchedulesQuery.data, selectedDoctorId]);

  const visibleAvailabilityDays = useMemo(
    () => availabilityDays.filter((day) => day.schedule !== null),
    [availabilityDays],
  );

  const availabilityTimeLabels = useMemo(() => {
    const seenLabels = new Set<string>();
    const orderedLabels: string[] = [];

    visibleAvailabilityDays.forEach((day) => {
      day.allSlots.forEach((slot) => {
        if (seenLabels.has(slot.label)) {
          return;
        }

        seenLabels.add(slot.label);
        orderedLabels.push(slot.label);
      });
    });

    return orderedLabels;
  }, [visibleAvailabilityDays]);

  const availabilitySlotsByDay = useMemo(() => {
    return new Map(
      visibleAvailabilityDays.map((day) => [
        day.value,
        {
          all: new Map(day.allSlots.map((slot) => [slot.label, slot])),
          available: new Map(day.availableSlots.map((slot) => [slot.label, slot])),
        },
      ]),
    );
  }, [visibleAvailabilityDays]);

  useEffect(() => {
    if (prefillStart === "" || prefillEnd === "") {
      return;
    }

    setSelectedSlot((currentValue) => {
      if (currentValue !== null) {
        return currentValue;
      }

      return {
        start_date_time: prefillStart,
        end_date_time: prefillEnd,
        day_value: prefillStart.slice(0, 10),
        label: prefillStart.length >= 16 ? prefillStart.slice(11, 16) : "",
      };
    });
  }, [prefillEnd, prefillStart]);

  useEffect(() => {
    if (selectedSlot === null) {
      return;
    }

    const slotStillExists = availabilityDays.some((day) =>
      day.availableSlots.some(
        (slot) => slot.start === selectedSlot.start_date_time && slot.end === selectedSlot.end_date_time,
      ),
    );

    if (!slotStillExists && selectedSlot.start_date_time !== prefillStart) {
      setSelectedSlot(null);
    }
  }, [availabilityDays, prefillStart, selectedSlot]);

  const availabilityPeriodLabel = useMemo(() => buildAvailabilityPeriodLabel(availabilityRange), [availabilityRange]);
  const selectedSlotDurationMinutes = useMemo(() => {
    if (selectedSlot === null) {
      return null;
    }

    const startDate = new Date(selectedSlot.start_date_time);
    const endDate = new Date(selectedSlot.end_date_time);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);

    return Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : null;
  }, [selectedSlot]);

  const canContinueFromDoctor = selectedDoctorId !== null;
  const canContinueFromSchedule = selectedSlot !== null;
  const canSubmit =
    selectedDoctorId !== null &&
    selectedSlot !== null &&
    ((patientMode === "existing" && selectedPatientId !== null) ||
      (
        patientMode === "new" &&
        newPatientDraft.patient_display_name.trim() !== "" &&
        newPatientDraft.cnp.trim() !== "" &&
        newPatientDraft.city.trim() !== "" &&
        newPatientDraft.phone_number.trim() !== "" &&
        derivedNewPatientDemographics !== null &&
        exactPhoneMatch === null
      ));

  const mutation = useMutation({
    mutationFn: async () => {
      let resolvedPatientId = selectedPatientId ?? resolvedNewPatientId;

      if (patientMode === "new") {
        if (exactPhoneMatch !== null) {
          throw new Error("Există deja un pacient cu acest număr de telefon. Folosește pacientul existent.");
        }

        if (resolvedPatientId === null) {
          const createdPatient = await createPatient({
            patient_display_name: newPatientDraft.patient_display_name.trim(),
            cnp: newPatientDraft.cnp.trim(),
            city: newPatientDraft.city.trim(),
            phone_number: newPatientDraft.phone_number.trim(),
            is_active: true,
          });

          resolvedPatientId = createdPatient.patient_id;
          setResolvedNewPatientId(createdPatient.patient_id);
        }
      }

      if (selectedDoctorId === null || resolvedPatientId === null || selectedSlot === null) {
        throw new Error("Programarea nu este completă.");
      }

      return createAppointment({
        doctor_id: selectedDoctorId,
        patient_id: resolvedPatientId,
        start_date_time: toApiDateTime(selectedSlot.start_date_time),
        end_date_time: toApiDateTime(selectedSlot.end_date_time),
        appointment_notes: appointmentNotes.trim() === "" ? null : appointmentNotes.trim(),
      });
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: "Adăugăm programarea",
        description: "Trimitem datele către endpointul real al backend-ului.",
      });

      toastIdRef.current = toastId;
      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["appointment-patients-options"] });

      if (context?.toastId !== undefined) {
        dismissToast(context.toastId);
      }

      setIsSuccessStateVisible(true);
      showToast({
        variant: "success",
        title: "Programarea a fost adăugată",
        description: "Lista reală de programări a fost marcată pentru reîmprospătare.",
      });

      window.setTimeout(() => {
        navigate("/programari", {
          state: { successMessage: "Programarea a fost adăugată cu succes." },
        });
      }, 900);
    },
    onError: (error: unknown, _variables, context) => {
      const message =
        error instanceof AxiosError
          ? error.response?.data.message ?? error.message ?? "Nu am putut salva programarea"
          : error instanceof Error
            ? error.message
            : "Nu am putut salva programarea";

      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva programarea",
          description: message,
        });
      }
    },
  });

  const stepMeta = getStepMeta(currentStep, selectedDoctorId, selectedSlot);
  const isCompactWizardChrome = currentStep !== "doctor";

  return (
    <section
      className="min-w-0 space-y-4 text-slate-700"
      style={{ fontFamily: APPOINTMENT_FLOW_FONT_FAMILY, fontKerning: "normal", letterSpacing: APPOINTMENT_FLOW_LETTER_SPACING }}
    >
      <div className={`rounded-[36px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(26,138,131,0.12),_transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fbfb_100%)] ${isCompactWizardChrome ? "p-4 md:p-5" : "p-5 md:p-7"}`}>
        <div className={`flex flex-col ${isCompactWizardChrome ? "gap-3" : "gap-4"} lg:flex-row lg:items-start lg:justify-between`}>
          <div className="max-w-3xl">
            <h1 className={`${isCompactWizardChrome ? "text-[2rem] leading-[1.08] md:text-[2.2rem]" : "text-3xl md:text-[2.6rem] md:leading-[1.08]"} font-semibold tracking-[0.012em] text-ink`}>Creează rapid o programare</h1>
          </div>

          <Link className={`button-secondary gap-2 self-start ${isCompactWizardChrome ? "min-h-10 px-4 py-2.5 text-sm" : "px-4 py-3"}`} to="/programari">
            <ArrowLeft className="h-4 w-4" />
            Renunță
          </Link>
        </div>

        <div className={`${isCompactWizardChrome ? "mt-4" : "mt-6"} grid gap-2.5 md:grid-cols-3`}>
          {stepMeta.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted =
              (step.id === "doctor" && selectedDoctorId !== null && currentStep !== "doctor") ||
              (step.id === "schedule" && selectedSlot !== null && currentStep === "patient");
            const isBlocked =
              (step.id === "schedule" && selectedDoctorId === null) || (step.id === "patient" && selectedSlot === null);

            return (
              <button
                className={`rounded-[24px] border text-left transition ${isCompactWizardChrome ? "px-3.5 py-3" : "px-4 py-4"} ${isActive ? "border-primary/20 bg-primary text-white" : isCompleted ? "border-emerald-200 bg-emerald-50 text-emerald-900" : isBlocked ? "border-slate-200 bg-white text-slate-400" : "border-slate-200 bg-white text-ink hover:border-primary/20 hover:bg-primary/5"}`}
                disabled={isBlocked}
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex ${isCompactWizardChrome ? "h-9 w-9 text-sm" : "h-10 w-10 text-sm"} items-center justify-center rounded-full font-semibold ${isActive ? "bg-white/20 text-white" : isCompleted ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-5 tracking-[0.012em] ${isActive ? "text-white" : isCompleted ? "text-emerald-900" : "text-current"}`}>{step.title}</p>
                    <p className={`mt-0.5 text-sm leading-5 tracking-[0.008em] ${isActive ? "text-white/80" : isCompleted ? "text-emerald-700" : "text-slate-500"}`}>{step.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`rounded-[36px] border border-slate-200 bg-white ${isCompactWizardChrome ? "p-4 md:p-5" : "p-5 md:p-6"}`}>
        {specializationsQuery.isLoading || doctorsQuery.isLoading || patientsQuery.isLoading ? (
          <div className="flex min-h-[480px] items-center justify-center rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-10 text-primary">
            <div className="flex items-center gap-3 text-base font-semibold">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Încărcăm datele reale ale clinicii...
            </div>
          </div>
        ) : specializationsQuery.isError || doctorsQuery.isError || patientsQuery.isError ? (
          <div className="rounded-[28px] border border-danger/20 bg-orange-50 px-5 py-5 text-danger">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Nu am putut încărca datele necesare wizard-ului</p>
                <p className="mt-2 text-sm">Verifică conexiunea cu backend-ul și reîncearcă.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {currentStep === "doctor" ? (
              <div className="space-y-6">
                <div className="rounded-[30px] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Specializare</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {visibleSpecializations.map((specialization: SpecializationOption) => (
                      <button
                        className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${selectedSpecializationId === specialization.specialization_id ? "border-primary/20 bg-primary text-white" : "border-slate-200 bg-white text-slate-700 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"}`}
                        key={specialization.specialization_id}
                        onClick={() => {
                          setSelectedSpecializationId(specialization.specialization_id);
                          setDoctorSearchValue("");
                        }}
                        type="button"
                      >
                        {specialization.specialization_display_name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid min-w-0 gap-4 2xl:grid-cols-[220px_320px_minmax(0,1fr)]">
                  <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafb_100%)] p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Context</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Specializarea selectată</p>
                        <p className="mt-2 text-lg font-semibold text-ink">
                          {visibleSpecializations.find((specialization) => specialization.specialization_id === selectedSpecializationId)?.specialization_display_name ?? "Alege din listă"}
                        </p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Medici disponibili</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{filteredDoctors.length}</p>
                        <p className="mt-1 text-sm text-slate-500">Lista rămâne deschisă și filtrată în timp real.</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[30px] border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600" htmlFor="wizard-doctor-search">
                        Medic activ
                      </label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          className="input-base pl-11"
                          id="wizard-doctor-search"
                          onChange={(event) => setDoctorSearchValue(event.target.value)}
                          placeholder="Caută medic"
                          value={doctorSearchValue}
                        />
                      </div>
                    </div>

                    {filteredDoctors.length === 0 ? (
                      <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                        Nu există medici activi pentru filtrarea curentă.
                      </div>
                    ) : (
                      <div className="mt-4 max-h-[360px] overflow-y-auto rounded-3xl border border-slate-100">
                        {filteredDoctors.map((doctor) => {
                          const isSelected = selectedDoctorId === doctor.doctor_id;

                          return (
                            <button
                              className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition ${isSelected ? "bg-primary/5 text-ink" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`}
                              key={doctor.doctor_id}
                              onClick={() => {
                                setSelectedDoctorId(doctor.doctor_id);
                                setSelectedSpecializationId(doctor.specialization_id);
                              }}
                              type="button"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-base font-semibold">{doctor.doctor_display_name}</p>
                                <p className="mt-1 truncate text-sm text-slate-500">{doctor.specialization_display_name}</p>
                              </div>
                              {isSelected ? (
                                    <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">Selectat</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <AppointmentServicesSelector
                    compact
                    doctor={selectedDoctor}
                    slotDurationMinutes={selectedSlotDurationMinutes}
                    subtitle="Serviciile opționale rămân vizibile direct lângă medic, fără scroll suplimentar pe pagină."
                    title="Servicii medicale"
                  />
                </div>
              </div>
            ) : null}

            {currentStep === "schedule" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 w-fit">Pasul 2</span>
                  <h2 className="text-[1.8rem] font-semibold leading-[1.12] tracking-[0.01em] text-ink">Alege intervalul</h2>
                  <p className="text-sm text-slate-500">Selectezi un slot liber din programul real al medicului ales.</p>
                </div>

                <div className="grid min-w-0 gap-4 2xl:grid-cols-[250px_minmax(0,1fr)]">
                  <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafb_100%)] p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rezumat selecție</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Specializare</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedDoctor?.specialization_display_name ?? "-"}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Medic</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedDoctor?.doctor_display_name ?? "-"}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Slot selectat</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedSlot === null ? "Alege din grilă" : `${selectedSlot.day_value} · ${selectedSlot.label}`}</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[30px] border border-slate-200 bg-[#f7fbfb] p-4">
                    {selectedDoctorId === null ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                        Alege întâi medicul pentru a vedea sloturile reale.
                      </div>
                    ) : doctorSchedulesQuery.isLoading || appointmentsAvailabilityQuery.isLoading ? (
                      <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200 bg-white px-4 py-10 text-primary">
                        <div className="flex items-center gap-3 text-sm font-semibold">
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Încărcăm programul medicului și programările deja existente.
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                          <div className="inline-flex w-full rounded-2xl bg-white p-1 sm:w-auto">
                            <button
                              className={`min-h-11 flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${availabilityViewMode === "week" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"}`}
                              onClick={() => {
                                setAvailabilityViewMode("week");
                                setAvailabilityPeriodIndex(0);
                              }}
                              type="button"
                            >
                              Săptămână
                            </button>
                            <button
                              className={`min-h-11 flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition sm:flex-none ${availabilityViewMode === "month" ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-50"}`}
                              onClick={() => {
                                setAvailabilityViewMode("month");
                                setAvailabilityPeriodIndex(0);
                              }}
                              type="button"
                            >
                              Lună
                            </button>
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between 2xl:justify-end">
                            <span className="rounded-full bg-white px-3 py-1.5 text-center text-sm font-semibold text-slate-700 sm:text-left">{availabilityPeriodLabel}</span>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                              <button className="button-secondary min-h-11 justify-center gap-2 px-4 py-2" onClick={() => setAvailabilityPeriodIndex((currentValue) => currentValue - 1)} type="button">
                              <ChevronLeft className="h-4 w-4" />
                              Anterior
                              </button>
                              <button className="button-primary min-h-11 justify-center gap-2 px-4 py-2" onClick={() => setAvailabilityPeriodIndex((currentValue) => currentValue + 1)} type="button">
                              Următor
                              <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {visibleAvailabilityDays.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                            Medicul nu are program activ în perioada selectată.
                          </div>
                        ) : availabilityTimeLabels.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-10 text-sm text-slate-500">
                            Nu există sloturi reale în perioada selectată.
                          </div>
                        ) : (
                          <div className="min-w-0 rounded-[24px] border border-[#d7ebe8] bg-[linear-gradient(180deg,#ffffff_0%,#f5fbfa_100%)] p-2">
                            <div
                              className="grid w-full gap-1"
                              style={{ gridTemplateColumns: `96px repeat(${availabilityTimeLabels.length}, minmax(48px, 1fr))` }}
                            >
                              <div className="sticky left-0 z-20 flex min-h-[44px] items-center rounded-[16px] border border-white/80 bg-white/95 px-2.5 lg:min-h-[48px]">
                                <div>
                                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Zi</p>
                                  <p className="mt-0.5 text-sm font-semibold text-slate-600">Program</p>
                                </div>
                              </div>

                              {availabilityTimeLabels.map((timeLabel) => (
                                <div
                                  className="flex min-h-[44px] items-center justify-center rounded-[16px] border border-white/80 bg-white/95 px-1 text-center text-sm font-semibold text-slate-700 lg:min-h-[48px]"
                                  key={`wizard-header-${timeLabel}`}
                                >
                                  {timeLabel}
                                </div>
                              ))}

                              {visibleAvailabilityDays.map((day) => {
                                const monthLabel = day.display.startsWith(day.dayNumber) ? day.display.slice(day.dayNumber.length).trim() : day.display;

                                return (
                                  <div className="contents" key={`wizard-row-${day.value}`}>
                                    <div className={`sticky left-0 z-10 flex min-h-[50px] items-center rounded-[16px] border px-2.5 text-left lg:min-h-[58px] ${selectedSlot?.day_value === day.value ? "border-primary/20 bg-primary/10 text-primary" : day.isToday ? "border-[#cfd9d8] bg-[#f2f5f5] text-slate-700" : "border-white/80 bg-white/95 text-slate-600"}`}>
                                      <div>
                                        <span className="block text-sm font-semibold">{day.title}</span>
                                        <span className="mt-0.5 block text-sm opacity-80">{day.dayNumber} {monthLabel}</span>
                                      </div>
                                    </div>

                                    {availabilityTimeLabels.map((timeLabel) => {
                                      const daySlots = availabilitySlotsByDay.get(day.value);
                                      const availableSlot = daySlots?.available.get(timeLabel) ?? null;
                                      const scheduledSlot = daySlots?.all.get(timeLabel) ?? null;
                                      const highlightedSlot = availableSlot ?? scheduledSlot;
                                      const isSelectedSlot = highlightedSlot !== null && selectedSlot?.start_date_time === highlightedSlot.start && selectedSlot.end_date_time === highlightedSlot.end;

                                      if (availableSlot !== null) {
                                        return (
                                          <button
                                            className={`min-h-[50px] rounded-[16px] border px-1 text-sm font-semibold transition lg:min-h-[58px] ${isSelectedSlot ? "border-[#2f8885] bg-[#2f8885] text-white" : "border-[#d6dede] bg-[#eef2f2] text-slate-700 hover:border-[#bcc9c9] hover:bg-[#e4ebeb]"}`}
                                            key={`${day.value}-${timeLabel}`}
                                            onClick={() => {
                                              setSelectedSlot({
                                                start_date_time: availableSlot.start,
                                                end_date_time: availableSlot.end,
                                                label: availableSlot.label,
                                                day_value: day.value,
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
                                          className={`min-h-[50px] rounded-[16px] border lg:min-h-[58px] ${scheduledSlot !== null ? "border-[#d7dfdf] bg-[#edf1f1]" : "border-[#eef2f2] bg-[#f7f9f9]"}`}
                                          key={`${day.value}-${timeLabel}`}
                                        />
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === "patient" ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-600 w-fit">Pasul 3</span>
                  <h2 className="text-2xl font-semibold tracking-[0.01em] text-ink">Alege pacientul</h2>
                  <p className="text-sm text-slate-500">Cauți un pacient existent sau adaugi rapid unul nou, fără să părăsești fluxul de programare.</p>
                </div>

                <div className="grid min-w-0 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
                  <div className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7fafb_100%)] p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Rezumat final</p>
                    <div className="mt-4 space-y-3">
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Medic</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedDoctor?.doctor_display_name ?? "-"}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Interval</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{selectedSlot === null ? "-" : `${selectedSlot.day_value} · ${selectedSlot.label}`}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-50 px-4 py-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Mod pacient</p>
                        <p className="mt-2 text-lg font-semibold text-ink">{patientMode === "existing" ? "Pacient existent" : "Pacient nou"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-4">
                    <div className="inline-flex rounded-[24px] border border-slate-200 bg-white p-1">
                      <button
                        className={`min-h-12 rounded-[18px] px-4 py-2 text-[15px] font-semibold transition ${patientMode === "existing" ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"}`}
                        disabled={patients.length === 0}
                        onClick={() => setPatientMode("existing")}
                        type="button"
                      >
                        Pacient existent
                      </button>
                      <button
                        className={`min-h-12 rounded-[18px] px-4 py-2 text-[15px] font-semibold transition ${patientMode === "new" ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-50"}`}
                        onClick={() => setPatientMode("new")}
                        type="button"
                      >
                        Pacient nou
                      </button>
                    </div>

                    {patientMode === "existing" ? (
                      <div className="rounded-[30px] border border-slate-200 bg-white p-4">
                        {patients.length === 0 ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                            Nu există încă pacienți în DB. Treci pe „Pacient nou” pentru a continua.
                          </div>
                        ) : (
                          <>
                            <label className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-600" htmlFor="wizard-patient-search">
                              Caută pacient
                            </label>
                            <div className="relative mt-2">
                              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                              <input
                                className="input-base pl-11"
                                id="wizard-patient-search"
                                onChange={(event) => setPatientSearchValue(event.target.value)}
                                placeholder="Caută după nume, telefon sau CNP"
                                value={patientSearchValue}
                              />
                            </div>

                            <div className="mt-4 max-h-[320px] overflow-y-auto rounded-3xl border border-slate-100">
                              {filteredPatients.length === 0 ? (
                                <div className="px-4 py-6 text-base text-slate-600">Nu am găsit pacienți pentru filtrarea curentă.</div>
                              ) : (
                                filteredPatients.map((patient) => {
                                  const isSelected = selectedPatientId === patient.patient_id;

                                  return (
                                    <button
                                      className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition ${isSelected ? "bg-primary/5 text-ink" : "text-slate-700 hover:bg-slate-50 hover:text-ink"}`}
                                      key={patient.patient_id}
                                      onClick={() => setSelectedPatientId(patient.patient_id)}
                                      type="button"
                                    >
                                      <div>
                                        <p className="text-lg font-semibold">{patient.patient_display_name}</p>
                                        <p className="mt-1 text-base text-slate-600">{patient.phone_number}</p>
                                        <p className="mt-1 text-sm text-slate-500">{patient.cnp ?? "Fără CNP"}</p>
                                      </div>
                                      {isSelected ? <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white">Selectat</span> : null}
                                    </button>
                                  );
                                })
                              )}
                            </div>

                            {selectedPatient !== null ? (
                              <div className="mt-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
                                <div>
                                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">CNP</p>
                                  <p className="mt-1 text-base font-semibold text-ink">{selectedPatient.cnp ?? "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sex</p>
                                  <p className="mt-1 text-base font-semibold text-ink">{selectedPatient.sex ?? "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Data nașterii</p>
                                  <p className="mt-1 text-base font-semibold text-ink">{formatPatientBirthDate(selectedPatient.birth_date) || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Vârstă</p>
                                  <p className="mt-1 text-base font-semibold text-ink">{selectedPatientAgeLabel || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Oraș</p>
                                  <p className="mt-1 text-base font-semibold text-ink">{selectedPatient.city ?? "-"}</p>
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-[30px] border border-slate-200 bg-white p-4 md:p-5">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,1.2fr)_minmax(220px,0.95fr)_minmax(180px,0.85fr)] xl:items-start">
                          <div>
                            <label className="mb-2 block text-[15px] font-semibold text-ink" htmlFor="wizard-new-patient-name">
                              Nume pacient
                            </label>
                            <input
                              className="input-base text-[1.05rem] text-ink placeholder:text-slate-400"
                              id="wizard-new-patient-name"
                              onChange={(event) => setNewPatientDraft((currentValue) => ({ ...currentValue, patient_display_name: event.target.value }))}
                              placeholder="Ex. Popescu Ion"
                              value={newPatientDraft.patient_display_name}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-[15px] font-semibold text-ink" htmlFor="wizard-new-patient-cnp">
                              CNP
                            </label>
                            <input
                              className="input-base text-[1.05rem] text-ink placeholder:text-slate-400"
                              id="wizard-new-patient-cnp"
                              inputMode="numeric"
                              maxLength={13}
                              onChange={(event) => setNewPatientDraft((currentValue) => ({ ...currentValue, cnp: normalizePatientCnpInput(event.target.value) }))}
                              placeholder="Obligatoriu"
                              value={newPatientDraft.cnp}
                            />
                            {hasInvalidNewPatientCnp ? <p className="mt-2 text-sm font-semibold text-amber-700">Atenție: CNP invalid.</p> : null}
                          </div>

                          <div>
                            <label className="mb-2 block text-[15px] font-semibold text-ink" htmlFor="wizard-new-patient-phone">
                              Telefon
                            </label>
                            <input
                              className="input-base text-[1.05rem] text-ink placeholder:text-slate-400"
                              id="wizard-new-patient-phone"
                              onChange={(event) => setNewPatientDraft((currentValue) => ({ ...currentValue, phone_number: event.target.value }))}
                              placeholder="07xxxxxxxx"
                              value={newPatientDraft.phone_number}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-[15px] font-semibold text-ink" htmlFor="wizard-new-patient-city">
                              Oraș
                            </label>
                            <input
                              className="input-base text-[1.05rem] text-ink placeholder:text-slate-400"
                              id="wizard-new-patient-city"
                              onChange={(event) => setNewPatientDraft((currentValue) => ({ ...currentValue, city: event.target.value }))}
                              placeholder="Obligatoriu"
                              value={newPatientDraft.city}
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4 md:grid-cols-3">
                          <div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sex derivat</p>
                            <p className="mt-1 text-base font-semibold text-ink">{derivedNewPatientDemographics?.sex ?? "-"}</p>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Data nașterii</p>
                            <p className="mt-1 text-base font-semibold text-ink">{derivedNewPatientDemographics?.birthDateDisplay ?? "-"}</p>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-slate-500">Vârstă</p>
                            <p className="mt-1 text-base font-semibold text-ink">{calculateAgeLabelFromIsoDate(derivedNewPatientDemographics?.birthDateIso ?? null) || "-"}</p>
                          </div>
                        </div>

                        {exactPhoneMatch !== null ? (
                          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold">Există deja un pacient cu acest număr de telefon</p>
                                <p className="mt-1 text-sm">{exactPhoneMatch.patient_display_name} · {exactPhoneMatch.phone_number}</p>
                              </div>
                              <button
                                className="button-secondary gap-2"
                                onClick={() => {
                                  setPatientMode("existing");
                                  setSelectedPatientId(exactPhoneMatch.patient_id);
                                  setPatientSearchValue(exactPhoneMatch.patient_display_name);
                                }}
                                type="button"
                              >
                                <ShieldCheck className="h-4 w-4" />
                                Folosește pacientul existent
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="rounded-[30px] border border-slate-200 bg-white p-4">
                      <label className="mb-2 block text-[15px] font-semibold text-ink" htmlFor="wizard-appointment-notes">
                        Notițe programare
                      </label>
                      <textarea
                        className="input-base min-h-[120px] resize-y text-[1.02rem] text-ink placeholder:text-slate-400"
                        id="wizard-appointment-notes"
                        onChange={(event) => setAppointmentNotes(event.target.value)}
                        placeholder="Detalii utile pentru echipă"
                        value={appointmentNotes}
                      />
                    </div>

                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="sticky bottom-4 z-20 min-w-0 rounded-[28px] border border-slate-200 bg-white/96 p-4 backdrop-blur md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Specializare</p>
              <p className="mt-1 text-sm font-semibold text-ink">{selectedDoctor?.specialization_display_name ?? "Nealeasă"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Medic</p>
              <p className="mt-1 text-sm font-semibold text-ink">{selectedDoctor?.doctor_display_name ?? "Neales"}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Interval</p>
              <p className="mt-1 text-sm font-semibold text-ink">{selectedSlot === null ? "Neales" : `${selectedSlot.day_value} · ${selectedSlot.label}`}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Pacient</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {selectedPatient !== null
                  ? selectedPatient.patient_display_name
                  : patientMode === "new" && newPatientDraft.patient_display_name.trim() !== ""
                    ? newPatientDraft.patient_display_name.trim()
                    : "Neales"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {currentStep !== "doctor" ? (
              <button
                className="button-secondary gap-2"
                onClick={() => setCurrentStep(currentStep === "patient" ? "schedule" : "doctor")}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Înapoi
              </button>
            ) : null}

            {currentStep === "doctor" ? (
              <button className="button-primary gap-2" disabled={!canContinueFromDoctor} onClick={() => setCurrentStep("schedule")} type="button">
                Alege data programării
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {currentStep === "schedule" ? (
              <button className="button-primary gap-2" disabled={!canContinueFromSchedule} onClick={() => setCurrentStep("patient")} type="button">
                Continuă la pacient
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            {currentStep === "patient" ? (
              <button className="button-primary gap-2" disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()} type="button">
                {mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Adaugă programarea
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {isSuccessStateVisible ? (
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5" />
            <p className="font-semibold">Programarea a fost creată. Te redirecționăm spre lista reală de programări.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
};