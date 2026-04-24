import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, CalendarPlus, Check, ChevronLeft, ChevronRight, LoaderCircle, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedResponse } from "../../shared/types/api";
import { SmsPatientCard } from "../settings/components/SmsPatientCard";
import { buildSmsContextForAppointment, useSmsGatewayLocalState } from "../settings/sms-gateway.local";
import { AppointmentServicesSelector } from "./components/AppointmentServicesSelector";
import { getDoctorSchedules } from "../doctor-schedules/doctor-schedules.api";
import type { DoctorScheduleDay } from "../doctor-schedules/doctor-schedules.types";
import { listDoctors, listSpecializationOptions } from "../doctors/doctors.api";
import type { DoctorListItem, SpecializationOption } from "../doctors/doctors.types";
import { createPatient } from "../patients/patients.api";
import { calculateAgeLabelFromIsoDate, formatPatientBirthDate, normalizePatientCnpInput, parsePatientDemographicsFromCnp, previewPatientDemographicsFromCnp } from "../patients/patient-demographics";
import { PatientReferralCard } from "../patients/components/PatientReferralCard";
import { PatientVisitResultCard } from "../patients/components/PatientVisitResultCard";
import type { PatientListItem } from "../patients/patients.types";
import {
  createAppointment,
  getAppointmentById,
  updateAppointment,
} from "./appointments.api";
import type { AppointmentListItem } from "./appointments.types";
import { appointmentFormSchema, type AppointmentFormValues } from "./appointments.schema";

interface LocalPatientFormState {
  patient_display_name: string;
  cnp: string;
  sex: "Masculin" | "Feminin" | "";
  birth_date: string;
  city: string;
  phone_number: string;
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

interface SelectedAvailabilitySlot {
  start_date_time: string;
  end_date_time: string;
  label: string;
  day_value: string;
}

const APPOINTMENT_FLOW_FONT_FAMILY = '"Segoe UI Variable Text", "Instrument Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
const APPOINTMENT_FLOW_LETTER_SPACING = "0.016em";

const DEFAULT_LOCAL_PATIENT_FORM_STATE: LocalPatientFormState = {
  patient_display_name: "",
  cnp: "",
  sex: "",
  birth_date: "",
  city: "",
  phone_number: "",
};

const APPOINTMENT_PATIENT_LOCAL_STATE_STORAGE_KEY = "medreminder:appointment-patient-local-state";

const normalizePhone = (value: string): string => value.replace(/\D/g, "");

const sanitizeLocalPatientFormState = (value: Partial<LocalPatientFormState> | null | undefined): LocalPatientFormState => ({
  patient_display_name: value?.patient_display_name ?? "",
  cnp: value?.cnp ?? "",
  sex: value?.sex === "Masculin" || value?.sex === "Feminin" ? value.sex : "",
  birth_date: value?.birth_date ?? "",
  city: value?.city ?? "",
  phone_number: value?.phone_number ?? "",
});

const readPersistedPatientLocalStateRegistry = (): Record<string, LocalPatientFormState> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(APPOINTMENT_PATIENT_LOCAL_STATE_STORAGE_KEY);

    if (rawValue === null) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as Record<string, Partial<LocalPatientFormState>>;

    return Object.fromEntries(
      Object.entries(parsedValue).map(([patientId, patientState]) => [patientId, sanitizeLocalPatientFormState(patientState)]),
    );
  } catch {
    return {};
  }
};

const writePersistedPatientLocalStateRegistry = (value: Record<string, LocalPatientFormState>): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APPOINTMENT_PATIENT_LOCAL_STATE_STORAGE_KEY, JSON.stringify(value));
};

const getPersistedPatientLocalState = (patientId: number): LocalPatientFormState | null => {
  const registry = readPersistedPatientLocalStateRegistry();

  return registry[String(patientId)] ?? null;
};

const persistPatientLocalState = (patientId: number, patientState: LocalPatientFormState): void => {
  const registry = readPersistedPatientLocalStateRegistry();

  registry[String(patientId)] = sanitizeLocalPatientFormState(patientState);
  writePersistedPatientLocalStateRegistry(registry);
};

const buildLocalPatientFormStateFromPatient = (
  patient: Pick<PatientListItem, "patient_id" | "patient_display_name" | "cnp" | "sex" | "birth_date" | "city" | "phone_number">,
): LocalPatientFormState => {
  return {
    ...DEFAULT_LOCAL_PATIENT_FORM_STATE,
    patient_display_name: patient.patient_display_name,
    cnp: patient.cnp ?? "",
    sex: patient.sex ?? "",
    birth_date: formatPatientBirthDate(patient.birth_date),
    city: patient.city ?? "",
    phone_number: patient.phone_number,
  };
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

const appointmentSummaryDateTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const capitalizeText = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
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

const formatAvailabilityWeekday = (date: Date): string => {
  return capitalizeText(availabilityWeekdayFormatter.format(date).replace(/\./g, ""));
};

const formatAvailabilityDayMonth = (date: Date): string => {
  return capitalizeText(availabilityDayMonthFormatter.format(date).replace(/\./g, ""));
};

const formatAvailabilityFullLabel = (date: Date): string => {
  return capitalizeText(availabilityFullDateFormatter.format(date));
};

const formatAppointmentSummaryDateTime = (value: string): string | null => {
  if (value.trim() === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return appointmentSummaryDateTimeFormatter.format(date);
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

const calculateAgeLabel = (birthDateValue: string): string => {
  const isoDate = convertRomanianDateToIso(birthDateValue);

  if (isoDate === null) {
    return "";
  }

  const birthDate = new Date(`${isoDate}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? `${age} ani` : "";
};

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

const toDatetimeLocalValue = (isoValue: string): string => {
  const date = new Date(isoValue);
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60_000);

  return localDate.toISOString().slice(0, 16);
};

const toApiDateTime = (localValue: string): string => {
  return new Date(localValue).toISOString();
};

const formatRomanianDateInput = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 8);

  if (digitsOnly.length <= 2) {
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
  }

  return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 4)}.${digitsOnly.slice(4)}`;
};

const convertRomanianDateToIso = (value: string): string | null => {
  const normalizedValue = value.trim();

  if (normalizedValue === "") {
    return null;
  }

  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(normalizedValue);

  if (match === null) {
    return null;
  }

  const [, day, month, year] = match;
  const isoValue = `${year}-${month}-${day}`;
  const parsedDate = new Date(`${isoValue}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() + 1 !== Number(month) ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null;
  }

  return isoValue;
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
): Array<{ start: string; end: string; label: string }> => {
  const slots: Array<{ start: string; end: string; label: string }> = [];
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
  slot: { start: string; end: string },
  appointment: Pick<AppointmentListItem, "start_date_time" | "end_date_time">,
): boolean => {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  const appointmentStart = new Date(appointment.start_date_time).getTime();
  const appointmentEnd = new Date(appointment.end_date_time).getTime();

  return slotStart < appointmentEnd && slotEnd > appointmentStart;
};

const defaultValues: AppointmentFormValues = {
  doctor_id: 0,
  patient_id: 0,
  start_date_time: "",
  end_date_time: "",
  appointment_notes: null,
};

const mapApiErrorToForm = (
  error: AxiosError<ApiErrorResponse>,
  setError: ReturnType<typeof useForm<AppointmentFormValues>>["setError"],
): void => {
  const fieldErrors = error.response?.data.field_errors ?? [];

  fieldErrors.forEach((fieldError) => {
    if (
      fieldError.field === "doctor_id" ||
      fieldError.field === "patient_id" ||
      fieldError.field === "start_date_time" ||
      fieldError.field === "end_date_time" ||
      fieldError.field === "appointment_notes"
    ) {
      setError(fieldError.field, {
        type: "server",
        message: fieldError.message,
      });
    }
  });
};

const getAppointmentMutationErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    return error.response?.data.message ?? error.message ?? "Programarea nu a putut fi salvată";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Programarea nu a putut fi salvată";
};

export const AppointmentsFormPage = (): JSX.Element => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dismissToast, showToast, updateToast } = useToast();
  const { templates: smsTemplates, connection: smsConnection, logPatientSms } = useSmsGatewayLocalState();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const appointmentId = params.appointment_id === undefined ? null : Number(params.appointment_id);
  const isEditMode = appointmentId !== null;
  const prefillDoctorIdParam = searchParams.get("doctor_id");
  const parsedPrefillDoctorId = prefillDoctorIdParam === null ? Number.NaN : Number(prefillDoctorIdParam);
  const prefillDoctorId = Number.isInteger(parsedPrefillDoctorId) && parsedPrefillDoctorId > 0 ? parsedPrefillDoctorId : null;
  const prefillPatientIdParam = searchParams.get("patient_id");
  const parsedPrefillPatientId = prefillPatientIdParam === null ? Number.NaN : Number(prefillPatientIdParam);
  const prefillPatientId = Number.isInteger(parsedPrefillPatientId) && parsedPrefillPatientId > 0 ? parsedPrefillPatientId : null;
  const prefillStartDateTime = searchParams.get("start")?.trim() ?? "";
  const prefillEndDateTime = searchParams.get("end")?.trim() ?? "";
  const [selectedSpecializationId, setSelectedSpecializationId] = useState<number | null>(null);
  const [doctorSearchValue, setDoctorSearchValue] = useState("");
  const [patientSearchValue, setPatientSearchValue] = useState("");
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [localPatientFormState, setLocalPatientFormState] = useState<LocalPatientFormState>(DEFAULT_LOCAL_PATIENT_FORM_STATE);
  const [localPatientFormOwnerId, setLocalPatientFormOwnerId] = useState<number | null>(null);
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState("");
  const [availabilityViewMode, setAvailabilityViewMode] = useState<AvailabilityViewMode>("week");
  const [availabilityPeriodIndex, setAvailabilityPeriodIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SelectedAvailabilitySlot | null>(null);
  const [previousDoctorId, setPreviousDoctorId] = useState<number | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [hasManualSexOverride, setHasManualSexOverride] = useState(false);
  const [hasManualBirthDateOverride, setHasManualBirthDateOverride] = useState(false);
  const [showConfirmOverlay, setShowConfirmOverlay] = useState(false);
  const [isConfirmOverlayVisible, setIsConfirmOverlayVisible] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isSuccessOverlayVisible, setIsSuccessOverlayVisible] = useState(false);
  const mutationToastIdRef = useRef<string | null>(null);
  const hasAppliedAgendaSlotPrefillRef = useRef(false);
  const patientDropdownRef = useRef<HTMLDivElement | null>(null);
  const overlayRoot = typeof document === "undefined" ? null : document.body;

  const {
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    watch,
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues,
  });

  const selectedDoctorId = watch("doctor_id");
  const selectedPatientId = watch("patient_id");
  const startDateTimeValue = watch("start_date_time");
  const endDateTimeValue = watch("end_date_time");
  const ageLabel = useMemo(() => {
    const derivedDemographics = previewPatientDemographicsFromCnp(localPatientFormState.cnp);

    if (derivedDemographics !== null && !hasManualBirthDateOverride) {
      return calculateAgeLabelFromIsoDate(derivedDemographics.birthDateIso);
    }

    return calculateAgeLabel(localPatientFormState.birth_date);
  }, [hasManualBirthDateOverride, localPatientFormState.birth_date, localPatientFormState.cnp]);
  const hasInvalidPatientCnp = useMemo(() => {
    const normalizedCnp = normalizePatientCnpInput(localPatientFormState.cnp);

    return normalizedCnp.length === 13 && parsePatientDemographicsFromCnp(normalizedCnp) === null;
  }, [localPatientFormState.cnp]);

  const appointmentQuery = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: async () => getAppointmentById(appointmentId as number),
    enabled: isEditMode && Number.isInteger(appointmentId) && (appointmentId as number) > 0,
  });

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
    enabled: typeof selectedDoctorId === "number" && Number.isInteger(selectedDoctorId) && selectedDoctorId > 0,
  });

  const appointmentsAvailabilityQuery = useQuery({
    queryKey: ["appointments-availability", selectedDoctorId],
    queryFn: async () => {
      const doctorAppointments = await loadAllPages<AppointmentListItem>("/appointments", {
        sort_by: "start_date_time",
        sort_direction: "asc",
      });

      return doctorAppointments;
    },
    enabled: typeof selectedDoctorId === "number" && Number.isInteger(selectedDoctorId) && selectedDoctorId > 0,
  });

  useEffect(() => {
    if (appointmentQuery.data !== undefined) {
      reset({
        doctor_id: appointmentQuery.data.doctor_id,
        patient_id: appointmentQuery.data.patient_id,
        start_date_time: toDatetimeLocalValue(appointmentQuery.data.start_date_time),
        end_date_time: toDatetimeLocalValue(appointmentQuery.data.end_date_time),
        appointment_notes: appointmentQuery.data.appointment_notes,
      });
    }
  }, [appointmentQuery.data, reset]);

  const specializations = specializationsQuery.data ?? [];
  const allDoctors = doctorsQuery.data?.items ?? [];
  const patients = patientsQuery.data ?? [];
  const selectedDoctor = useMemo(() => {
    return allDoctors.find((doctor) => doctor.doctor_id === selectedDoctorId) ?? null;
  }, [allDoctors, selectedDoctorId]);
  const selectedSpecializationName = useMemo(() => {
    if (selectedDoctor !== null) {
      return selectedDoctor.specialization_display_name;
    }

    return specializations.find((specialization) => specialization.specialization_id === selectedSpecializationId)?.specialization_display_name ?? null;
  }, [selectedDoctor, selectedSpecializationId, specializations]);
  const selectedPatient = useMemo(() => {
    return patients.find((patient) => patient.patient_id === selectedPatientId) ?? null;
  }, [patients, selectedPatientId]);
  const smsPatientId = selectedPatientId > 0 ? selectedPatientId : isEditMode ? appointmentQuery.data?.patient_id ?? null : null;
  const smsPatientName = selectedPatient?.patient_display_name ?? (localPatientFormState.patient_display_name.trim() === "" ? null : localPatientFormState.patient_display_name.trim());
  const smsPhoneNumber = selectedPatient?.phone_number ?? localPatientFormState.phone_number;
  const smsContext = useMemo(() => buildSmsContextForAppointment({
    appointmentId: isEditMode ? appointmentQuery.data?.appointment_id ?? null : null,
    patientName: smsPatientName,
    doctorName: selectedDoctor?.doctor_display_name ?? null,
    specialization: selectedDoctor?.specialization_display_name ?? selectedSpecializationName,
    appointmentStart: startDateTimeValue === "" ? null : startDateTimeValue,
    clinicName: null,
    actionBasePath: smsConnection.patient_action_base_path,
  }), [appointmentQuery.data?.appointment_id, isEditMode, selectedDoctor?.doctor_display_name, selectedDoctor?.specialization_display_name, selectedSpecializationName, smsConnection.patient_action_base_path, smsPatientName, startDateTimeValue]);
  const exactPhoneMatch = useMemo(() => {
    const normalizedPhone = normalizePhone(localPatientFormState.phone_number);

    if (normalizedPhone === "") {
      return null;
    }

    return patients.find((patient) => patient.patient_id !== selectedPatientId && normalizePhone(patient.phone_number) === normalizedPhone) ?? null;
  }, [localPatientFormState.phone_number, patients, selectedPatientId]);
  const selectableDoctors = useMemo(() => {
    if (isEditMode && appointmentQuery.data !== undefined) {
      return allDoctors.filter((doctor) => doctor.is_active || doctor.doctor_id === appointmentQuery.data.doctor_id);
    }

    return allDoctors.filter((doctor) => doctor.is_active);
  }, [allDoctors, appointmentQuery.data, isEditMode]);
  const visibleSpecializations = useMemo(() => {
    return specializations.filter((specialization) =>
      selectableDoctors.some((doctor) => doctor.specialization_id === specialization.specialization_id),
    );
  }, [selectableDoctors, specializations]);

  const normalizedDoctorSearchValue = doctorSearchValue.trim().toLocaleLowerCase();
  const filteredDoctors = useMemo(() => {
    return selectableDoctors.filter((doctor) => {
      const matchesSpecialization =
        selectedSpecializationId === null || doctor.specialization_id === selectedSpecializationId;
      const matchesSearch =
        normalizedDoctorSearchValue === "" ||
        doctor.doctor_display_name.toLocaleLowerCase().includes(normalizedDoctorSearchValue);

      return matchesSpecialization && matchesSearch;
    });
  }, [normalizedDoctorSearchValue, selectableDoctors, selectedSpecializationId]);
  const normalizedPatientSearchValue = patientSearchValue.trim().toLocaleLowerCase();
  const filteredPatients = useMemo(() => {
    if (normalizedPatientSearchValue === "") {
      return patients.slice(0, 8);
    }

    return patients
      .filter((patient) =>
        patient.patient_display_name.toLocaleLowerCase().includes(normalizedPatientSearchValue) ||
        patient.phone_number.toLocaleLowerCase().includes(normalizedPatientSearchValue) ||
        (patient.cnp ?? "").toLocaleLowerCase().includes(normalizedPatientSearchValue),
      )
      .slice(0, 8);
  }, [normalizedPatientSearchValue, patients]);

  useEffect(() => {
    if (visibleSpecializations.length === 1 && selectedSpecializationId === null) {
      setSelectedSpecializationId(visibleSpecializations[0].specialization_id);
    }
  }, [selectedSpecializationId, visibleSpecializations]);

  useEffect(() => {
    if (selectedPatient === null) {
      if (selectedPatientId > 0) {
        return;
      }

      setLocalPatientFormOwnerId(null);
      return;
    }

    if (!isPatientDropdownOpen) {
      setPatientSearchValue(selectedPatient.patient_display_name);
    }

    setLocalPatientFormState(buildLocalPatientFormStateFromPatient(selectedPatient));
    setLocalPatientFormOwnerId(selectedPatient.patient_id);
    setHasManualSexOverride(false);
    setHasManualBirthDateOverride(false);
  }, [isPatientDropdownOpen, selectedPatient, selectedPatientId]);

  useEffect(() => {
    if (localPatientFormOwnerId === null) {
      return;
    }

    persistPatientLocalState(localPatientFormOwnerId, localPatientFormState);
  }, [localPatientFormOwnerId, localPatientFormState]);

  useEffect(() => {
    const derivedDemographics = previewPatientDemographicsFromCnp(localPatientFormState.cnp);

    if (derivedDemographics !== null && !hasManualSexOverride && localPatientFormState.sex !== derivedDemographics.sex) {
      setLocalPatientFormState((currentState) => ({
        ...currentState,
        sex: derivedDemographics.sex,
      }));
    }

    if (
      derivedDemographics !== null &&
      !hasManualBirthDateOverride &&
      localPatientFormState.birth_date !== derivedDemographics.birthDateDisplay
    ) {
      setLocalPatientFormState((currentState) => ({
        ...currentState,
        birth_date: derivedDemographics.birthDateDisplay,
      }));
      setBirthDateError(null);
    }
  }, [hasManualBirthDateOverride, hasManualSexOverride, localPatientFormState.birth_date, localPatientFormState.cnp, localPatientFormState.sex]);

  useEffect(() => {
    if (!showConfirmOverlay) {
      setIsConfirmOverlayVisible(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsConfirmOverlayVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [showConfirmOverlay]);

  useEffect(() => {
    if (!showSuccessOverlay) {
      setIsSuccessOverlayVisible(false);
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setIsSuccessOverlayVisible(true);
    });

    const timeoutId = window.setTimeout(() => {
      navigate("/programari");
    }, 1350);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.clearTimeout(timeoutId);
    };
  }, [navigate, showSuccessOverlay]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      const targetNode = event.target;

      if (!(targetNode instanceof Node)) {
        return;
      }

      if (patientDropdownRef.current !== null && !patientDropdownRef.current.contains(targetNode)) {
        setIsPatientDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }

      setIsPatientDropdownOpen(false);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || appointmentQuery.data === undefined || allDoctors.length === 0) {
      return;
    }

    const selectedDoctor = allDoctors.find((doctor) => doctor.doctor_id === appointmentQuery.data.doctor_id);

    if (selectedDoctor !== undefined && selectedSpecializationId !== selectedDoctor.specialization_id) {
      setSelectedSpecializationId(selectedDoctor.specialization_id);
    }
  }, [allDoctors, appointmentQuery.data, isEditMode, selectedSpecializationId]);

  useEffect(() => {
    if (isEditMode || prefillDoctorId === null || allDoctors.length === 0) {
      return;
    }

    const prefilledDoctor = allDoctors.find((doctor) => doctor.doctor_id === prefillDoctorId);

    if (prefilledDoctor === undefined) {
      return;
    }

    if (selectedSpecializationId !== prefilledDoctor.specialization_id) {
      setSelectedSpecializationId(prefilledDoctor.specialization_id);
    }

    if (selectedDoctorId !== prefilledDoctor.doctor_id) {
      setValue("doctor_id", prefilledDoctor.doctor_id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

  }, [allDoctors, isEditMode, prefillDoctorId, selectedDoctorId, selectedSpecializationId, setValue]);

  useEffect(() => {
    if (isEditMode || prefillPatientId === null || patients.length === 0) {
      return;
    }

    const prefilledPatient = patients.find((patient) => patient.patient_id === prefillPatientId);

    if (prefilledPatient === undefined) {
      return;
    }

    if (selectedPatientId !== prefilledPatient.patient_id) {
      setValue("patient_id", prefilledPatient.patient_id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (!isPatientDropdownOpen) {
      setPatientSearchValue(prefilledPatient.patient_display_name);
    }
  }, [isEditMode, isPatientDropdownOpen, patients, prefillPatientId, selectedPatientId, setValue]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (specializations.length === 1 && filteredDoctors.length === 1) {
      const onlySpecialization = specializations[0];
      const onlyDoctor = filteredDoctors[0];

      if (selectedSpecializationId !== onlySpecialization.specialization_id) {
        setSelectedSpecializationId(onlySpecialization.specialization_id);
      }

      if (selectedDoctorId !== onlyDoctor.doctor_id) {
        setValue("doctor_id", onlyDoctor.doctor_id, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

    }
  }, [filteredDoctors, isEditMode, selectedDoctorId, selectedSpecializationId, setValue, specializations]);

  useEffect(() => {
    if (typeof selectedDoctorId !== "number" || !Number.isInteger(selectedDoctorId) || selectedDoctorId <= 0) {
      return;
    }

    const selectedDoctorIsVisible = filteredDoctors.some((doctor) => doctor.doctor_id === selectedDoctorId);

    if (!selectedDoctorIsVisible) {
      setValue("doctor_id", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [filteredDoctors, selectedDoctorId, setValue]);

  useEffect(() => {
    if (selectedPatient !== null) {
      return;
    }

    setLocalPatientFormState((currentState) => ({
      ...currentState,
      patient_display_name: patientSearchValue,
    }));
  }, [patientSearchValue, selectedPatient]);

  const mutation = useMutation({
    mutationFn: async (values: AppointmentFormValues) => {
      const patientName = localPatientFormState.patient_display_name.trim();
      const phone = localPatientFormState.phone_number.trim();

      console.log("SUBMIT START", {
        selectedPatientId,
        patientName,
        selectedDoctorId,
        selectedSlot,
        phone,
      });

      let resolvedPatientId =
        typeof selectedPatientId === "number" && Number.isInteger(selectedPatientId) && selectedPatientId > 0
          ? selectedPatientId
          : null;

      const resolvedStartDateTime =
        values.start_date_time.trim() !== "" ? values.start_date_time : selectedSlot?.start_date_time ?? "";
      const resolvedEndDateTime =
        values.end_date_time.trim() !== "" ? values.end_date_time : selectedSlot?.end_date_time ?? "";

      if (values.start_date_time.trim() === "" && selectedSlot !== null) {
        setValue("start_date_time", selectedSlot.start_date_time, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (values.end_date_time.trim() === "" && selectedSlot !== null) {
        setValue("end_date_time", selectedSlot.end_date_time, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (resolvedStartDateTime === "" || resolvedEndDateTime === "") {
        throw new Error("Selectează un slot valid înainte de salvare.");
      }

      if (localPatientFormState.birth_date.trim() !== "") {
        const normalizedBirthDate = convertRomanianDateToIso(localPatientFormState.birth_date);

        if (normalizedBirthDate === null) {
          throw new Error("Introdu data nașterii în format zz.ll.aaaa.");
        }
      }

      if (!resolvedPatientId) {
        const patientDisplayName = patientName;
        const patientCnp = localPatientFormState.cnp.trim();
        const patientCity = localPatientFormState.city.trim();
        const phoneNumber = phone;

        if (patientDisplayName === "") {
          throw new Error("Introdu numele pacientului sau selectează un pacient existent.");
        }

        if (patientCnp === "") {
          throw new Error("Introdu CNP-ul pacientului pentru a-l crea automat.");
        }

        if (patientCity === "") {
          throw new Error("Introdu orașul pacientului pentru a-l crea automat.");
        }

        if (phoneNumber === "") {
          throw new Error("Introdu telefonul pacientului pentru a-l crea automat.");
        }

        if (exactPhoneMatch !== null) {
          throw new Error(`Există deja un pacient cu acest număr de telefon: ${exactPhoneMatch.patient_display_name}. Selectează pacientul existent. Nu s-au salvat nici pacientul, nici programarea.`);
        }

        if (mutationToastIdRef.current !== null) {
          updateToast(mutationToastIdRef.current, {
            variant: "loading",
            title: "Se creează pacientul...",
            description: "Adăugăm pacientul nou în DB înainte de programare.",
          });
        }

        const createdPatient = await createPatient({
          patient_display_name: patientDisplayName,
          cnp: patientCnp,
          city: patientCity,
          phone_number: phoneNumber,
          is_active: true,
        });

        console.log("PATIENT CREATED", createdPatient);

        resolvedPatientId = createdPatient.patient_id;
        const persistedLocalPatientState: LocalPatientFormState = {
          ...localPatientFormState,
          cnp: createdPatient.cnp ?? localPatientFormState.cnp,
          sex: createdPatient.sex ?? localPatientFormState.sex,
          birth_date: formatPatientBirthDate(createdPatient.birth_date),
          city: createdPatient.city ?? localPatientFormState.city,
          patient_display_name: createdPatient.patient_display_name,
          phone_number: createdPatient.phone_number,
        };

        persistPatientLocalState(createdPatient.patient_id, persistedLocalPatientState);
        setLocalPatientFormState(persistedLocalPatientState);
        setLocalPatientFormOwnerId(createdPatient.patient_id);
        setValue("patient_id", createdPatient.patient_id, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setPatientSearchValue(createdPatient.patient_display_name);

        console.log("RESOLVED PATIENT ID", resolvedPatientId);

        if (!resolvedPatientId) {
          throw new Error("Nu am putut crea pacientul înainte de programare");
        }
      }

      if (mutationToastIdRef.current !== null) {
        updateToast(mutationToastIdRef.current, {
          variant: "loading",
          title: isEditMode ? "Se salvează programarea..." : "Se salvează programarea...",
          description: "Trimitem programarea către endpointul real al backend-ului.",
        });
      }

      const payload = {
        doctor_id: values.doctor_id,
        patient_id: resolvedPatientId,
        start_date_time: toApiDateTime(resolvedStartDateTime),
        end_date_time: toApiDateTime(resolvedEndDateTime),
        appointment_notes: values.appointment_notes,
      };

      console.log("CREATE APPOINTMENT PAYLOAD", payload);

      if (isEditMode) {
        return updateAppointment(appointmentId as number, payload);
      }

      try {
        return await createAppointment(payload);
      } catch (error) {
        console.error("CREATE APPOINTMENT ERROR", error);
        throw error;
      }
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: isEditMode ? "Salvăm modificările programării" : "Adăugăm programarea",
        description: "Trimitem datele către endpointul real al backend-ului.",
      });

      mutationToastIdRef.current = toastId;

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (context?.toastId !== undefined) {
        dismissToast(context.toastId);
      }
      mutationToastIdRef.current = null;

      if (isEditMode) {
        showToast({
          variant: "success",
          title: "Programarea a fost actualizată cu succes",
          description: "Lista se va reîmprospăta din API-ul real.",
        });
        navigate("/programari");
        return;
      }

      setShowSuccessOverlay(true);
    },
    onError: (error: unknown, _variables, context) => {
      const message = getAppointmentMutationErrorMessage(error);

      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva programarea",
          description: message,
        });
      }

      if (error instanceof AxiosError) {
        mapApiErrorToForm(error, setError);
      }

      mutationToastIdRef.current = null;
    },
  });

  const hasDoctors = selectableDoctors.length > 0;
  const hasFilteredDoctors = filteredDoctors.length > 0;
  const hasPatients = patients.length > 0;
  const hasSelectedDoctor = typeof selectedDoctorId === "number" && Number.isInteger(selectedDoctorId) && selectedDoctorId > 0;
  const patientName = localPatientFormState.patient_display_name.trim();
  const phone = localPatientFormState.phone_number.trim();
  const doctorAppointments = useMemo(() => {
    if (!hasSelectedDoctor) {
      return [];
    }

    return (appointmentsAvailabilityQuery.data ?? []).filter((appointment) => {
      if (appointment.doctor_id !== selectedDoctorId) {
        return false;
      }

      if (isEditMode && appointment.appointment_id === appointmentId) {
        return false;
      }

      return true;
    });
  }, [appointmentId, appointmentsAvailabilityQuery.data, hasSelectedDoctor, isEditMode, selectedDoctorId]);
  const availabilityAnchorDate = useMemo(() => {
    const today = getStartOfDay(new Date());

    if (!hasSelectedDoctor || doctorSchedulesQuery.data === undefined) {
      return today;
    }

    const searchCandidates = buildAvailabilityRangeFromStart(today, 90);

    for (const dayOption of searchCandidates) {
      const weekday = getScheduleWeekdayFromLocalDate(dayOption.value);
      const schedule = doctorSchedulesQuery.data.schedules.find((item) => item.weekday === weekday) ?? null;

      if (schedule === null || !schedule.is_active) {
        continue;
      }

      const availableSlots = buildQuickSlots(dayOption.value, schedule).filter((slot) => {
        const isSelectedCurrentSlot = slot.start === startDateTimeValue && slot.end === endDateTimeValue;

        if (!isSelectedCurrentSlot && new Date(slot.start).getTime() < Date.now()) {
          return false;
        }

        return !doctorAppointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      if (availableSlots.length > 0) {
        return new Date(`${dayOption.value}T00:00:00`);
      }
    }

    return today;
  }, [doctorAppointments, doctorSchedulesQuery.data, endDateTimeValue, hasSelectedDoctor, startDateTimeValue]);
  const availabilityRange = useMemo(() => {
    const periodLength = availabilityViewMode === "week" ? 7 : 30;
    const periodStart = addDays(availabilityAnchorDate, availabilityPeriodIndex * periodLength);

    return buildAvailabilityRangeFromStart(periodStart, periodLength);
  }, [availabilityAnchorDate, availabilityPeriodIndex, availabilityViewMode]);
  const availabilityDays = useMemo<AvailabilityDay[]>(() => {
    if (!hasSelectedDoctor || doctorSchedulesQuery.data === undefined) {
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
      const availableSlots = scheduleSlots.filter((slot) => {
        const isSelectedCurrentSlot = slot.start === startDateTimeValue && slot.end === endDateTimeValue;

        if (!isSelectedCurrentSlot && new Date(slot.start).getTime() < Date.now()) {
          return false;
        }

        return !doctorAppointments.some((appointment) => intersectsWithAppointment(slot, appointment));
      });

      return {
        ...dayOption,
        schedule,
        allSlots: scheduleSlots,
        availableSlots,
      };
    });
  }, [availabilityRange, doctorAppointments, doctorSchedulesQuery.data, endDateTimeValue, hasSelectedDoctor, startDateTimeValue]);
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
  const activeAvailabilityDay = startDateTimeValue.trim().length >= 10 ? startDateTimeValue.slice(0, 10) : selectedAvailabilityDay;
  const selectedAvailabilitySummary = useMemo(() => {
    if (selectedSlot === null) {
      return null;
    }

    const day = availabilityDays.find((availabilityDay) => availabilityDay.value === selectedSlot.day_value);

    if (day !== undefined) {
      return `${day.fullLabel}, ${selectedSlot.label}`;
    }

    const selectedDate = new Date(`${selectedSlot.day_value}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return selectedSlot.label;
    }

    return `${formatAvailabilityFullLabel(selectedDate)}, ${selectedSlot.label}`;
  }, [availabilityDays, selectedSlot]);
  const canSubmit = isEditMode
    ? hasSelectedDoctor && selectedPatientId > 0 && startDateTimeValue.trim() !== "" && endDateTimeValue.trim() !== ""
    : Boolean(
        (selectedPatientId > 0 || (patientName !== "" && localPatientFormState.cnp.trim() !== "" && localPatientFormState.city.trim() !== "" && phone !== "" && exactPhoneMatch === null)) &&
        selectedDoctorId > 0 &&
        startDateTimeValue.trim() !== "" &&
        endDateTimeValue.trim() !== "",
      );
  const selectedSlotDurationMinutes = useMemo(() => {
    if (startDateTimeValue.trim() === "" || endDateTimeValue.trim() === "") {
      return null;
    }

    const startDate = new Date(startDateTimeValue);
    const endDate = new Date(endDateTimeValue);
    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000);

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return null;
    }

    return durationMinutes;
  }, [endDateTimeValue, startDateTimeValue]);
  const appointmentSummaryDateLabel = useMemo(() => {
    return selectedAvailabilitySummary ?? formatAppointmentSummaryDateTime(startDateTimeValue) ?? "Intervalul nu este setat încă.";
  }, [selectedAvailabilitySummary, startDateTimeValue]);

  const handleReferralTargetSelect = ({
    doctorId,
    end,
    specializationId,
    start,
  }: {
    doctorId: number;
    end: string;
    patientId: number | null;
    specializationId: number | null;
    start: string;
  }): void => {
    const targetDoctor = allDoctors.find((doctor) => doctor.doctor_id === doctorId) ?? null;
    const nextDayValue = start.slice(0, 10);
    const nextLabel = start.length >= 16 ? start.slice(11, 16) : "";

    if (specializationId !== null) {
      setSelectedSpecializationId(specializationId);
    } else if (targetDoctor !== null) {
      setSelectedSpecializationId(targetDoctor.specialization_id);
    }

    setPreviousDoctorId(doctorId);
    setValue("doctor_id", doctorId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("start_date_time", start, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("end_date_time", end, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setSelectedAvailabilityDay(nextDayValue);
    setSelectedSlot({
      day_value: nextDayValue,
      end_date_time: end,
      label: nextLabel,
      start_date_time: start,
    });

  };

  const submitAppointmentValues = (values: AppointmentFormValues): void => {
    mutation.mutate(values);
  };

  const submitAfterConfirmation = (): void => {
    const hasExistingPatientId =
      typeof selectedPatientId === "number" && Number.isInteger(selectedPatientId) && selectedPatientId > 0;
    const isCreateWithNewPatient = !isEditMode && !hasExistingPatientId && localPatientFormState.patient_display_name.trim() !== "";

    if (isCreateWithNewPatient) {
      const currentValues = getValues();
      const resolvedStartDateTime =
        currentValues.start_date_time.trim() !== "" ? currentValues.start_date_time : selectedSlot?.start_date_time ?? "";
      const resolvedEndDateTime =
        currentValues.end_date_time.trim() !== "" ? currentValues.end_date_time : selectedSlot?.end_date_time ?? "";

      mutation.mutate({
        doctor_id: typeof selectedDoctorId === "number" ? selectedDoctorId : 0,
        patient_id: 0,
        start_date_time: resolvedStartDateTime,
        end_date_time: resolvedEndDateTime,
        appointment_notes: currentValues.appointment_notes,
      });

      return;
    }

    void handleSubmit(submitAppointmentValues)();
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setShowConfirmOverlay(true);
  };

  useEffect(() => {
    if (typeof selectedDoctorId !== "number" || !Number.isInteger(selectedDoctorId) || selectedDoctorId <= 0) {
      return;
    }

    if (previousDoctorId === null) {
      setPreviousDoctorId(selectedDoctorId);
      return;
    }

    if (previousDoctorId !== selectedDoctorId) {
      setValue("start_date_time", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("end_date_time", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
      setSelectedSlot(null);
      setSelectedAvailabilityDay("");
      setAvailabilityPeriodIndex(0);
      setAvailabilityViewMode("week");
      setPreviousDoctorId(selectedDoctorId);
    }
  }, [previousDoctorId, selectedDoctorId, setValue]);

  useEffect(() => {
    if (localPatientFormState.birth_date.trim() === "") {
      setBirthDateError(null);
      return;
    }

    if (convertRomanianDateToIso(localPatientFormState.birth_date) !== null) {
      setBirthDateError(null);
    }
  }, [localPatientFormState.birth_date]);

  useEffect(() => {
    if (typeof startDateTimeValue !== "string" || startDateTimeValue.length < 10) {
      return;
    }

    const nextSelectedDay = startDateTimeValue.slice(0, 10);

    if (nextSelectedDay !== selectedAvailabilityDay) {
      setSelectedAvailabilityDay(nextSelectedDay);
    }
  }, [selectedAvailabilityDay, startDateTimeValue]);

  useEffect(() => {
    if (typeof startDateTimeValue !== "string" || startDateTimeValue.length < 10) {
      return;
    }

    const selectedDateValue = startDateTimeValue.slice(0, 10);
    const isDateVisible = availabilityRange.some((day) => day.value === selectedDateValue);

    if (isDateVisible) {
      return;
    }

    const baseDate = availabilityAnchorDate;
    const selectedDate = new Date(`${selectedDateValue}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime())) {
      return;
    }

    const daysDifference = Math.floor((selectedDate.getTime() - baseDate.getTime()) / 86_400_000);
    const periodLength = availabilityViewMode === "week" ? 7 : 30;
    const nextPeriodIndex = Math.floor(daysDifference / periodLength);

    if (nextPeriodIndex !== availabilityPeriodIndex) {
      setAvailabilityPeriodIndex(nextPeriodIndex);
    }
  }, [availabilityAnchorDate, availabilityPeriodIndex, availabilityRange, availabilityViewMode, startDateTimeValue]);

  useEffect(() => {
    if (selectedSlot === null) {
      return;
    }

    const slotStillExists = availabilityDays.some((day) =>
      day.availableSlots.some(
        (slot) =>
          slot.start === selectedSlot.start_date_time &&
          slot.end === selectedSlot.end_date_time,
      ),
    );

    if (!slotStillExists) {
      setSelectedSlot(null);
    }
  }, [availabilityDays, selectedSlot]);

  useEffect(() => {
    if (
      isEditMode ||
      hasAppliedAgendaSlotPrefillRef.current ||
      prefillDoctorId === null ||
      prefillStartDateTime === "" ||
      prefillEndDateTime === "" ||
      selectedDoctorId !== prefillDoctorId
    ) {
      return;
    }

    const matchingDay = availabilityDays.find((day) => day.value === prefillStartDateTime.slice(0, 10));
    const matchingSlot = matchingDay?.availableSlots.find(
      (slot) => slot.start === prefillStartDateTime && slot.end === prefillEndDateTime,
    ) ?? null;

    if (matchingDay === undefined || matchingSlot === null) {
      return;
    }

    setSelectedAvailabilityDay(matchingDay.value);
    setSelectedSlot({
      start_date_time: matchingSlot.start,
      end_date_time: matchingSlot.end,
      label: matchingSlot.label,
      day_value: matchingDay.value,
    });

    if (startDateTimeValue !== matchingSlot.start) {
      setValue("start_date_time", matchingSlot.start, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (endDateTimeValue !== matchingSlot.end) {
      setValue("end_date_time", matchingSlot.end, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    hasAppliedAgendaSlotPrefillRef.current = true;
  }, [
    availabilityDays,
    endDateTimeValue,
    isEditMode,
    prefillDoctorId,
    prefillEndDateTime,
    prefillStartDateTime,
    selectedDoctorId,
    setValue,
    startDateTimeValue,
  ]);

  if (isEditMode && (!Number.isInteger(appointmentId) || (appointmentId as number) <= 0)) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Programări</span>
        <h2 className="mt-4">ID-ul programării nu este valid</h2>
        <p className="mt-3">Deschide din nou lista de programări și selectează o programare cu `appointment_id` numeric valid.</p>
        <Link className="button-secondary mt-6 w-full whitespace-nowrap md:w-auto" to="/programari">
          Înapoi la listă
        </Link>
      </section>
    );
  }

  if (isEditMode && appointmentQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm datele programării</span>
        </div>
        <p className="mt-3">Pregătim formularul cu datele reale din API.</p>
      </section>
    );
  }

  if (isEditMode && appointmentQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <h2>Nu am putut încărca programarea</h2>
            <p className="mt-3">Verifică dacă `appointment_id` există în clinică și încearcă din nou.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => void appointmentQuery.refetch()} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary whitespace-nowrap" to="/programari">
            Înapoi la listă
          </Link>
        </div>
      </section>
    );
  }

  if (doctorsQuery.isLoading || patientsQuery.isLoading || specializationsQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm doctorii, specializările și pacienții disponibili</span>
        </div>
        <p className="mt-3">Câmpurile sunt populate exclusiv din endpointurile reale `/specializations`, `/doctors` și `/patients`.</p>
      </section>
    );
  }

  if (doctorsQuery.isError || patientsQuery.isError || specializationsQuery.isError || doctorSchedulesQuery.isError || appointmentsAvailabilityQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Programări</span>
            <h2 className="mt-4">Nu am putut încărca datele necesare formularului</h2>
              <p className="mt-3">Fără specializări, doctori, programe de doctor, programări existente și pacienți încărcați din API, formularul nu poate fi folosit în siguranță.</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => { void doctorsQuery.refetch(); void specializationsQuery.refetch(); void patientsQuery.refetch(); void doctorSchedulesQuery.refetch(); void appointmentsAvailabilityQuery.refetch(); }} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary" to="/pacienti">
            Deschide modulul Pacienți
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="panel p-4 md:p-5" style={{ fontFamily: APPOINTMENT_FLOW_FONT_FAMILY, letterSpacing: APPOINTMENT_FLOW_LETTER_SPACING }}>
      {showConfirmOverlay && overlayRoot !== null ? createPortal(
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/48 px-4 backdrop-blur-[8px]">
          <div className={`w-full max-w-md rounded-[32px] border border-emerald-200 bg-white/96 px-7 py-8 text-center shadow-2xl shadow-slate-900/30 ring-1 ring-slate-200/90 transition-all duration-300 ${isConfirmOverlayVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"}`}>
            <div className="mx-auto flex h-24 w-24 items-center justify-center">
              <div className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100/90 transition-all duration-500 ${isConfirmOverlayVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
                <div className={`absolute inset-0 rounded-full border-8 border-emerald-300/40 ${isConfirmOverlayVisible ? "animate-ping" : ""}`} />
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all duration-700 ${isConfirmOverlayVisible ? "scale-100 rotate-0" : "scale-75 -rotate-12"}`}>
                  <Check className={`h-9 w-9 transition-all duration-700 ${isConfirmOverlayVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
                </div>
              </div>
            </div>

            <h3 className="mt-5 text-2xl font-semibold text-ink">Confirmi salvarea?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {isEditMode ? "Modificările vor fi salvate în programarea existentă." : "Programarea va fi salvată în sistemul clinicii."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                className="button-primary min-w-[150px] gap-2"
                onClick={() => {
                  setShowConfirmOverlay(false);
                  submitAfterConfirmation();
                }}
                type="button"
              >
                <Check className="h-5 w-5" />
                Confirmă
              </button>
              <button
                className="button-secondary min-w-[150px]"
                onClick={() => setShowConfirmOverlay(false)}
                type="button"
              >
                Renunță
              </button>
            </div>
          </div>
        </div>,
        overlayRoot,
      ) : null}

      {showSuccessOverlay && overlayRoot !== null ? createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/42 px-4 backdrop-blur-[8px]">
          <div className={`w-full max-w-md rounded-[32px] border border-emerald-200 bg-white/98 px-8 py-9 text-center shadow-2xl shadow-slate-900/30 ring-1 ring-slate-200/90 transition-all duration-300 ${isSuccessOverlayVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"}`}>
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-success shadow-inner transition-all duration-300 ${isSuccessOverlayVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
              <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white transition-all duration-500 ${isSuccessOverlayVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
                <Check className={`h-8 w-8 transition-all duration-700 ${isSuccessOverlayVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`} />
              </div>
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-ink">Programarea a fost adăugată cu succes</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">Datele au fost salvate în sistemul clinicii.</p>
          </div>
        </div>,
        overlayRoot,
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2>{isEditMode ? "Actualizează programarea" : "Adaugă o programare nouă"}</h2>
        </div>

        <Link className="button-secondary shrink-0 whitespace-nowrap gap-2" to="/programari">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la listă
        </Link>
      </div>

      {(!hasDoctors || !hasPatients) ? (
        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-amber-900">
          <p className="font-semibold">Formularul nu poate fi salvat încă</p>
          <p className="mt-2 text-sm leading-6">
            {hasDoctors && !hasPatients
              ? "Nu există pacienți activi în DB. Adaugă mai întâi un pacient real."
              : !hasDoctors && hasPatients
                ? "Nu există doctori activi în DB. Adaugă sau activează un doctor real pentru a continua."
                : "Nu există doctori sau pacienți activi în DB. Programarea nu poate fi creată fără ambele relații reale."}
          </p>
          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            {!hasPatients ? (
              <Link className="button-secondary" to="/pacienti">
                Deschide modulul Pacienți
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <form className="mt-5 flex flex-col gap-4" noValidate onSubmit={handleFormSubmit}>
        <input type="hidden" {...register("doctor_id", { valueAsNumber: true })} />
        <input type="hidden" {...register("patient_id", { valueAsNumber: true })} />
        <input type="hidden" {...register("start_date_time")} />
        <input type="hidden" {...register("end_date_time")} />

        {isEditMode ? (
          <section className="order-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:p-5">
            <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Programarea curentă</p>
                <p className="mt-2 text-base font-semibold text-ink">{appointmentSummaryDateLabel}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Medic</p>
                <p className="mt-2 text-base font-semibold text-ink">{selectedDoctor?.doctor_display_name ?? "-"}</p>
                <p className="mt-1 text-sm text-slate-500">{selectedDoctor?.specialization_display_name ?? selectedSpecializationName ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Pacient</p>
                <p className="mt-2 text-base font-semibold text-ink">{localPatientFormState.patient_display_name.trim() === "" ? "-" : localPatientFormState.patient_display_name}</p>
                <p className="mt-1 text-sm text-slate-500">{localPatientFormState.phone_number.trim() === "" ? "Telefon necompletat" : localPatientFormState.phone_number}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className={`${isEditMode ? "order-1" : "order-4"} rounded-3xl border border-slate-200 bg-white p-4 md:p-5`}>
          <div>
            <h3 className="text-lg font-semibold text-ink">{isEditMode ? "1. Date pacient" : "4. Date pacient"}</h3>
            <p className="mt-1 text-sm text-slate-500">{isEditMode ? "Datele pacientului rămân primele la editarea unei programări existente." : "După ce alegi intervalul, completezi sau selectezi pacientul real din DB."}</p>
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-5">
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-search">
                Nume pacient
              </label>
              <div className="relative" ref={patientDropdownRef}>
                <input
                  aria-invalid={errors.patient_id !== undefined}
                  className="input-base"
                  id="patient-search"
                  onChange={(event) => {
                    if (selectedPatientId > 0) {
                      setValue("patient_id", 0, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                    setPatientSearchValue(event.target.value);
                    setIsPatientDropdownOpen(true);
                  }}
                  onFocus={() => setIsPatientDropdownOpen(true)}
                  placeholder="Caută pacient după nume, telefon sau CNP"
                  value={patientSearchValue}
                />

                {isPatientDropdownOpen && filteredPatients.length > 0 ? (
                  <div className="absolute z-20 mt-2 w-full rounded-3xl border border-slate-200 bg-white p-3 shadow-xl">
                    <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100">
                      {filteredPatients.map((patient) => (
                        <button
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm ${selectedPatientId === patient.patient_id ? "bg-slate-50 text-ink" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`}
                          key={patient.patient_id}
                          onClick={() => {
                            setValue("patient_id", patient.patient_id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setPatientSearchValue(patient.patient_display_name);
                            setLocalPatientFormState(buildLocalPatientFormStateFromPatient(patient));
                            setLocalPatientFormOwnerId(patient.patient_id);
                            setHasManualSexOverride(false);
                            setHasManualBirthDateOverride(false);
                            setIsPatientDropdownOpen(false);
                          }}
                          type="button"
                        >
                          <div>
                            <span className="block font-semibold">{patient.patient_display_name}</span>
                            <span className="mt-1 block text-xs text-slate-400">{patient.phone_number}{patient.cnp ? ` · ${patient.cnp}` : ""}</span>
                          </div>
                          <span className="text-xs text-slate-400">ID {patient.patient_id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {errors.patient_id !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.patient_id.message}</p> : null}
              </div>

              <div className="lg:col-span-3">
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-cnp-local">
                CNP
              </label>
              <input
                className="input-base"
                id="patient-cnp-local"
                inputMode="numeric"
                maxLength={13}
                onChange={(event) => {
                  const normalizedValue = normalizePatientCnpInput(event.target.value);

                  setHasManualSexOverride(false);
                  setHasManualBirthDateOverride(false);
                  setBirthDateError(null);
                  setLocalPatientFormState((currentState) => ({
                    ...currentState,
                    cnp: normalizedValue,
                  }));
                }}
                placeholder="CNP"
                type="text"
                value={localPatientFormState.cnp}
              />
              {hasInvalidPatientCnp ? <p className="mt-2 text-sm font-semibold text-amber-700">Atenție: CNP invalid.</p> : null}
              </div>

              <div className="lg:col-span-4">
                <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-sex-local">
                  Sex
                </label>
                <div className="inline-flex min-h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-1" id="patient-sex-local">
                {(["Masculin", "Feminin"] as const).map((sexOption) => {
                  const isSelected = localPatientFormState.sex === sexOption;

                  return (
                    <button
                      className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition ${isSelected ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-ink"}`}
                      key={sexOption}
                      onClick={() => {
                        setHasManualSexOverride(true);
                        setLocalPatientFormState((currentState) => ({
                          ...currentState,
                          sex: sexOption,
                        }));
                      }}
                      type="button"
                    >
                      {sexOption}
                    </button>
                  );
                })}
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-birth-date-local">
                Data nașterii
              </label>
              <input
                className="input-base"
                id="patient-birth-date-local"
                onChange={(event) => {
                  setHasManualBirthDateOverride(true);
                  setLocalPatientFormState((currentState) => ({
                    ...currentState,
                    birth_date: formatRomanianDateInput(event.target.value),
                  }));
                }}
                onBlur={() => {
                  if (
                    localPatientFormState.birth_date.trim() !== "" &&
                    convertRomanianDateToIso(localPatientFormState.birth_date) === null
                  ) {
                    setBirthDateError("Introdu data în format zz.ll.aaaa.");
                    return;
                  }

                  setBirthDateError(null);
                }}
                inputMode="numeric"
                placeholder="zz.ll.aaaa"
                type="text"
                value={localPatientFormState.birth_date}
              />
              {birthDateError !== null ? <p className="mt-2 text-sm font-medium text-danger">{birthDateError}</p> : null}
              </div>

              <div className="lg:col-span-2">
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-age-local">
                Vârstă
              </label>
              <input
                className="input-base bg-slate-50 text-slate-500"
                id="patient-age-local"
                readOnly
                type="text"
                value={ageLabel}
              />
              </div>

              <div className="lg:col-span-3">
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-city-local">
                Oraș
              </label>
              <input
                className="input-base"
                id="patient-city-local"
                onChange={(event) => {
                  setLocalPatientFormState((currentState) => ({
                    ...currentState,
                    city: event.target.value,
                  }));
                }}
                placeholder="Oraș"
                value={localPatientFormState.city}
              />
              </div>

              <div className="lg:col-span-4">
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="patient-phone-local">
                Telefon
              </label>
              <input
                className="input-base"
                id="patient-phone-local"
                onChange={(event) => {
                  setLocalPatientFormState((currentState) => ({
                    ...currentState,
                    phone_number: event.target.value,
                  }));
                }}
                placeholder="Telefon"
                value={localPatientFormState.phone_number}
              />
              {exactPhoneMatch !== null && selectedPatientId <= 0 ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
                  <p className="font-semibold">Există deja un pacient cu acest număr de telefon</p>
                  <p className="mt-1 text-sm leading-6">
                    {exactPhoneMatch.patient_display_name} · {exactPhoneMatch.phone_number}. Dacă vrei să continui programarea, selectează pacientul existent.
                  </p>
                  <button
                    className="mt-3 inline-flex min-h-10 items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                    onClick={() => {
                      setValue("patient_id", exactPhoneMatch.patient_id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setPatientSearchValue(exactPhoneMatch.patient_display_name);
                      setLocalPatientFormState(buildLocalPatientFormStateFromPatient(exactPhoneMatch));
                      setLocalPatientFormOwnerId(exactPhoneMatch.patient_id);
                      setHasManualSexOverride(false);
                      setHasManualBirthDateOverride(false);
                      setIsPatientDropdownOpen(false);
                    }}
                    type="button"
                  >
                    Folosește pacientul existent
                  </button>
                </div>
              ) : null}
              </div>
            </div>
          </div>
        </section>

        {!isEditMode ? (
          <>
            <section className="order-1 rounded-3xl border border-slate-200 bg-white p-4 md:p-5">
              <div>
                <h3 className="text-lg font-semibold text-ink">1. Alege specializarea și medicul</h3>
                <p className="mt-1 text-sm text-slate-500">Specializarea filtrează în timp real doar medicii activi disponibili în clinică.</p>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-3 block text-base font-semibold text-ink">Specializare</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedSpecializationId === null ? "border-primary/30 bg-primarySoft text-primary shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"}`}
                      onClick={() => {
                        setSelectedSpecializationId(null);
                        setDoctorSearchValue("");
                      }}
                      type="button"
                    >
                      Toate specializările
                    </button>
                    {visibleSpecializations.map((specialization) => (
                      <button
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectedSpecializationId === specialization.specialization_id ? "border-primary/30 bg-primarySoft text-primary shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-primary/20 hover:bg-primary/5 hover:text-primary"}`}
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

                <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-500">Specializarea selectată</p>
                    <p className="mt-2 text-base font-semibold text-ink">
                      {selectedSpecializationId === null
                        ? "Toate specializările"
                        : visibleSpecializations.find((specialization) => specialization.specialization_id === selectedSpecializationId)?.specialization_display_name ?? "Toate specializările"}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {hasFilteredDoctors
                        ? `${filteredDoctors.length} ${filteredDoctors.length === 1 ? "medic disponibil" : "medici disponibili"}`
                        : "Nu există doctori disponibili pentru filtrarea curentă."}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-base font-semibold text-ink" htmlFor="doctor_id">
                      Medic activ
                    </label>
                    <div className="rounded-3xl border border-slate-200 bg-white p-3" id="doctor_id">
                      <input
                        className="input-base"
                        onChange={(event) => setDoctorSearchValue(event.target.value)}
                        placeholder="Caută doctor"
                        value={doctorSearchValue}
                      />

                      {filteredDoctors.length === 0 ? (
                        <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                          Nu există doctori activi pentru filtrarea curentă.
                        </div>
                      ) : (
                        <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-slate-100">
                          {filteredDoctors.map((doctor: DoctorListItem) => (
                            <button
                              className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition ${selectedDoctorId === doctor.doctor_id ? "bg-primary/5 text-ink" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`}
                              key={doctor.doctor_id}
                              onClick={() => {
                                setValue("doctor_id", doctor.doctor_id, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }}
                              type="button"
                            >
                              <div>
                                <span className="block font-semibold">{doctor.doctor_display_name}</span>
                                <span className="mt-1 block text-xs text-slate-400">{doctor.specialization_display_name}</span>
                              </div>
                              {selectedDoctorId === doctor.doctor_id ? (
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Selectat</span>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.doctor_id !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.doctor_id.message}</p> : null}
                  </div>
                </div>
              </div>

              {hasDoctors && !hasFilteredDoctors ? (
                <div className="mt-3 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
                  <p className="font-semibold">Nu există doctori pentru filtrarea curentă</p>
                  <p className="mt-1 text-sm leading-6">
                    {selectedSpecializationId === null
                      ? "Alege o specializare sau selectează un medic din lista activă."
                      : normalizedDoctorSearchValue === ""
                        ? "Nu există doctori activi pentru specializarea aleasă."
                        : "Nu există doctori activi pentru căutarea curentă."}
                  </p>
                </div>
              ) : null}
            </section>

            <div className="order-2">
              <AppointmentServicesSelector
                doctor={selectedDoctor}
                slotDurationMinutes={selectedSlotDurationMinutes}
                subtitle="Serviciile disponibile se schimbă automat odată cu specializarea aleasă."
                title="2. Servicii medicale"
              />
            </div>

            <section className="order-3 rounded-3xl border border-slate-200 bg-white p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-ink">3. Alege intervalul</h3>
                {hasSelectedDoctor ? <span className="text-sm text-slate-500">Săptămână / lună</span> : null}
              </div>

              <div className="min-h-[320px]">
                {!hasSelectedDoctor ? (
                  <div className="flex min-h-[320px] items-center rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sky-900">
                    <p className="font-semibold">Alege mai întâi specializarea și doctorul</p>
                  </div>
                ) : doctorSchedulesQuery.isLoading || appointmentsAvailabilityQuery.isLoading ? (
                  <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-primary">
                    <div className="flex items-center gap-3">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      <span className="font-semibold">Încărcăm programul doctorului și programările deja existente</span>
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

                <p className="text-sm text-slate-500">
                  Orele sunt generate exclusiv din durata reală de consultație configurată pentru medic în programul lui activ.
                </p>

                {selectedAvailabilitySummary !== null ? (
                  <div className="flex flex-col gap-3 rounded-[26px] border border-[#b8dfdb] bg-[#eaf6f4] px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3d6f6b]">Slot selectat</p>
                      <p className="mt-1 text-base font-semibold text-[#1f5250]">{selectedAvailabilitySummary}</p>
                    </div>
                    <button
                      className="button-secondary min-h-11 px-4 py-2"
                      onClick={() => {
                        setSelectedSlot(null);
                        setValue("start_date_time", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setValue("end_date_time", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
                      type="button"
                    >
                      Elimină selecția
                    </button>
                  </div>
                ) : null}

                {availabilityTimeLabels.length === 0 ? (
                  <div className="flex min-h-[220px] items-center rounded-[28px] border border-[#d6e7e5] bg-[#f7fbfb] px-4 py-3 text-[#5c7572]">
                    <p className="font-semibold">Doctorul nu are intervale active în perioada afișată.</p>
                  </div>
                ) : (
                  <div className="w-full rounded-[30px] border border-[#d7ebe8] bg-[linear-gradient(180deg,#fdfefe_0%,#f5fbfa_100%)] p-2 lg:p-3">
                    <div className="w-full">
                      <div
                        className="grid w-full gap-1.5 lg:gap-2"
                        style={{
                          gridTemplateColumns: `148px repeat(${availabilityTimeLabels.length}, minmax(0, 1fr))`,
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
                            key={`header-${timeLabel}`}
                          >
                            {timeLabel}
                          </div>
                        ))}

                        {availabilityDays.map((day) => {
                          const isSelectedDay = activeAvailabilityDay === day.value;
                          const monthLabel = day.display.startsWith(day.dayNumber) ? day.display.slice(day.dayNumber.length).trim() : day.display;

                          return (
                            <div className="contents" key={`day-row-${day.value}`}>
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
                                const isSelectedSlot =
                                  highlightedSlot !== null &&
                                  startDateTimeValue === highlightedSlot.start &&
                                  endDateTimeValue === highlightedSlot.end;

                                if (availableSlot !== null) {
                                  return (
                                    <button
                                      aria-label={`${day.fullLabel} ${availableSlot.label}`}
                                      className={`min-h-[58px] rounded-[18px] border px-1 text-[10px] font-semibold transition lg:min-h-[70px] lg:rounded-[22px] lg:text-sm ${isSelectedSlot ? "border-[#2f8885] bg-[#2f8885] text-white shadow-md shadow-[#2f8885]/25" : "border-[#84cbc4] bg-[#afe3dd] text-[#1f5653] hover:border-[#5db8b1] hover:bg-[#88d4cc]"}`}
                                      key={`${day.value}-${timeLabel}`}
                                      onClick={() => {
                                        setSelectedAvailabilityDay(day.value);
                                        setSelectedSlot({
                                          start_date_time: availableSlot.start,
                                          end_date_time: availableSlot.end,
                                          label: availableSlot.label,
                                          day_value: day.value,
                                        });
                                        setValue("start_date_time", availableSlot.start, {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        });
                                        setValue("end_date_time", availableSlot.end, {
                                          shouldDirty: true,
                                          shouldValidate: true,
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
                                    key={`${day.value}-${timeLabel}`}
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
        </section>

          </>
        ) : null}

        <div className={isEditMode ? "order-2" : "order-5"}>
          <PatientVisitResultCard
            subtitle="Rezultatele, recomandările și follow-up-ul rămân locale până la etapa de persistare backend dedicată."
            title={isEditMode ? "2. Rezultatele consultației" : "4. Rezultatele consultației"}
          />
        </div>

        <div className={isEditMode ? "order-3" : "order-6"}>
          <PatientReferralCard
            initialDoctorId={selectedDoctorId > 0 ? selectedDoctorId : null}
            initialSpecializationId={selectedDoctor?.specialization_id ?? selectedSpecializationId}
            onSelectReferralTarget={handleReferralTargetSelect}
            prefillPatientId={selectedPatientId > 0 ? selectedPatientId : prefillPatientId}
            subtitle="Poți porni imediat o reprogramare reală către același medic sau către o altă specializare."
            title={isEditMode ? "3. Reprogramare / trimitere" : "5. Reprogramare / trimitere"}
          />
        </div>

        {(errors.start_date_time !== undefined || errors.end_date_time !== undefined) ? (
          <div className="order-7 rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
            {errors.start_date_time !== undefined ? <p className="text-sm font-medium">{errors.start_date_time.message}</p> : null}
            {errors.end_date_time !== undefined ? <p className="text-sm font-medium">{errors.end_date_time.message}</p> : null}
          </div>
        ) : null}

        <div className="order-8 rounded-3xl border border-slate-200 bg-white p-4 md:p-5">
          <label className="mb-2 block text-base font-semibold text-ink" htmlFor="appointment_notes">
            Notițe programare
          </label>
          <textarea
            aria-invalid={errors.appointment_notes !== undefined}
            className="input-base min-h-[84px] resize-y"
            id="appointment_notes"
            placeholder="Detalii utile pentru echipă"
            {...register("appointment_notes", {
              setValueAs: (value: string) => (typeof value === "string" ? value : ""),
            })}
          />
          {errors.appointment_notes !== undefined ? (
            <p className="mt-2 text-sm font-medium text-danger">{errors.appointment_notes.message}</p>
          ) : null}
        </div>

        {mutation.isError ? (
          <div className="order-6 rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
              <div>
                <p className="font-semibold">Nu am putut salva programarea</p>
                <p className="mt-1 text-sm text-danger/90">{getAppointmentMutationErrorMessage(mutation.error)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="order-7">
          <SmsPatientCard
            defaultTemplateKey="confirmation"
            onSend={(payload) => {
              const historyItem = logPatientSms(payload);

              showToast({
                variant: historyItem.status === "sent" ? "success" : historyItem.status === "failed" ? "error" : "loading",
                title: historyItem.status === "sent" ? "SMS pacient pregătit și trimis" : historyItem.status === "failed" ? "SMS pacient eșuat" : "SMS pacient în așteptare",
                description: historyItem.provider_response ?? "Mesajul a fost înregistrat local.",
              });

              return historyItem;
            }}
            patientId={smsPatientId}
            phoneNumber={smsPhoneNumber}
            previewContext={smsContext}
            subtitle="Cardul folosește datele reale deja încărcate din programare și păstrează istoricul local pentru integrarea gateway-ului SMS."
            templates={smsTemplates}
            title="SMS pacient"
          />
        </div>

        <div className="order-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CalendarPlus className="h-4 w-4 text-primary" />
            După salvare revii automat la lista reală de programări.
          </div>

          <button className="button-primary gap-2" disabled={!canSubmit || mutation.isPending || isSubmitting} type="submit">
            {mutation.isPending ? "Salvăm..." : isEditMode ? "Salvează modificările" : "Adaugă programarea"}
            <Save className="h-5 w-5" />
          </button>
        </div>
      </form>
    </section>
  );
};