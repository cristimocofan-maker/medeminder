import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle, ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDoctorById } from "../doctors/doctors.api";
import { getDoctorSchedules, upsertDoctorSchedule } from "./doctor-schedules.api";
import type { DoctorScheduleDay, UpsertDoctorSchedulePayload } from "./doctor-schedules.types";
import { useToast } from "../../shared/ui/toast-provider";
import type { ApiErrorResponse } from "../../shared/types/api";

interface DayFormState {
  start_time: string;
  end_time: string;
  appointment_duration_minutes: string;
  is_active: boolean;
}

const weekdayLabels = [
  { value: 1, label: "Luni" },
  { value: 2, label: "Marți" },
  { value: 3, label: "Miercuri" },
  { value: 4, label: "Joi" },
  { value: 5, label: "Vineri" },
  { value: 6, label: "Sâmbătă" },
  { value: 7, label: "Duminică" },
] as const;

const buildTimeOptions = (): string[] => {
  const timeOptions: string[] = [];

  for (let totalMinutes = 0; totalMinutes < 24 * 60; totalMinutes += 30) {
    timeOptions.push(formatMinutesAsTime(totalMinutes));
  }

  return timeOptions;
};

const durationOptions = Array.from({ length: 6 }, (_value, index) => String((index + 1) * 10));

const defaultInactiveStartTime = "09:00";
const defaultInactiveEndTime = "10:00";


const buildDayState = (schedule: DoctorScheduleDay | undefined): DayFormState => {
  return {
    start_time: schedule?.start_time ?? "",
    end_time: schedule?.end_time ?? "",
    appointment_duration_minutes:
      schedule === undefined ? "30" : String(schedule.appointment_duration_minutes),
    is_active: schedule?.is_active ?? false,
  };
};

const isDayStateComplete = (dayState: DayFormState | undefined): boolean => {
  if (dayState === undefined) {
    return false;
  }

  if (
    dayState.start_time === "" ||
    dayState.end_time === "" ||
    dayState.appointment_duration_minutes.trim() === ""
  ) {
    return false;
  }

  const duration = Number(dayState.appointment_duration_minutes);

  return Number.isInteger(duration) && duration > 0;
};

const isDayStateBlank = (dayState: DayFormState | undefined): boolean => {
  if (dayState === undefined) {
    return true;
  }

  return dayState.start_time === "" && dayState.end_time === "";
};

const isDayStatePersistable = (dayState: DayFormState | undefined): boolean => {
  if (dayState === undefined) {
    return false;
  }

  if (isDayStateBlank(dayState)) {
    return true;
  }

  if (dayState.start_time === "" || dayState.end_time === "") {
    return false;
  }

  const startMinutes = convertTimeToMinutes(dayState.start_time);
  const endMinutes = convertTimeToMinutes(dayState.end_time);

  return startMinutes !== null && endMinutes !== null && endMinutes > startMinutes;
};

const convertTimeToMinutes = (timeValue: string): number | null => {
  const [hours, minutes] = timeValue.split(":").map(Number);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatMinutesAsTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const buildGeneratedSlots = (dayState: DayFormState): string[] => {
  const startMinutes = convertTimeToMinutes(dayState.start_time);
  const endMinutes = convertTimeToMinutes(dayState.end_time);
  const durationMinutes = Number(dayState.appointment_duration_minutes);

  if (
    startMinutes === null ||
    endMinutes === null ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0 ||
    endMinutes <= startMinutes
  ) {
    return [];
  }

  const slots: string[] = [];

  for (
    let currentMinutes = startMinutes;
    currentMinutes + durationMinutes <= endMinutes;
    currentMinutes += durationMinutes
  ) {
    slots.push(formatMinutesAsTime(currentMinutes));
  }

  return slots;
};

const getSlotDensityMessage = (durationMinutes: number, slotsCount: number): string => {
  if (slotsCount === 0) {
    return "Cu setările curente nu rezultă niciun slot valid în această zi.";
  }

  if (durationMinutes <= 20) {
    return "Durata este scurtă, deci ziua va avea multe consultații scurte și rotație rapidă.";
  }

  if (durationMinutes >= 45) {
    return "Durata este mare, deci ziua va avea mai puține consultații, dar intervale mai lungi per pacient.";
  }

  return "Durata selectată păstrează un echilibru bun între numărul de consultații și timpul alocat fiecărui pacient.";
};

const areDayStatesEqual = (leftDayState: DayFormState | undefined, rightDayState: DayFormState | undefined): boolean => {
  if (leftDayState === undefined || rightDayState === undefined) {
    return leftDayState === rightDayState;
  }

  return (
    leftDayState.start_time === rightDayState.start_time &&
    leftDayState.end_time === rightDayState.end_time &&
    leftDayState.appointment_duration_minutes === rightDayState.appointment_duration_minutes &&
    leftDayState.is_active === rightDayState.is_active
  );
};

export const DoctorSchedulePage = (): JSX.Element => {
  const queryClient = useQueryClient();
  const { showToast, updateToast } = useToast();
  const params = useParams();
  const doctorId = params.doctor_id === undefined ? null : Number(params.doctor_id);
  const [formStateByWeekday, setFormStateByWeekday] = useState<Record<number, DayFormState>>({});
  const [initialFormStateByWeekday, setInitialFormStateByWeekday] = useState<Record<number, DayFormState>>({});
  const [dirtyWeekdays, setDirtyWeekdays] = useState<number[]>([]);
  const [globalDurationMinutes, setGlobalDurationMinutes] = useState("30");
  const [initialGlobalDurationMinutes, setInitialGlobalDurationMinutes] = useState("30");
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => getDoctorById(doctorId as number),
    enabled: doctorId !== null && Number.isInteger(doctorId) && doctorId > 0,
  });

  const schedulesQuery = useQuery({
    queryKey: ["doctor-schedules", doctorId],
    queryFn: async () => getDoctorSchedules(doctorId as number),
    enabled: doctorId !== null && Number.isInteger(doctorId) && doctorId > 0,
  });

  useEffect(() => {
    if (schedulesQuery.data === undefined) {
      return;
    }

    const scheduleMap = new Map<number, DoctorScheduleDay>();

    schedulesQuery.data.schedules.forEach((schedule) => {
      scheduleMap.set(schedule.weekday, schedule);
    });

    setFormStateByWeekday(
      Object.fromEntries(weekdayLabels.map((weekday) => [weekday.value, buildDayState(scheduleMap.get(weekday.value))])),
    );
    setInitialFormStateByWeekday(
      Object.fromEntries(weekdayLabels.map((weekday) => [weekday.value, buildDayState(scheduleMap.get(weekday.value))])),
    );
    setDirtyWeekdays([]);

    const firstConfiguredSchedule = weekdayLabels
      .map((weekday) => buildDayState(scheduleMap.get(weekday.value)))
      .find((dayState) => isDayStateComplete(dayState));

    const nextGlobalDurationMinutes = firstConfiguredSchedule?.appointment_duration_minutes ?? "30";
    setGlobalDurationMinutes(nextGlobalDurationMinutes);
    setInitialGlobalDurationMinutes(nextGlobalDurationMinutes);

  }, [schedulesQuery.data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const weekdaysToSave = Array.from(
        new Set([
          ...dirtyWeekdays,
          ...(globalDurationMinutes !== initialGlobalDurationMinutes
            ? weekdayLabels
                .map((weekday) => weekday.value)
                .filter((weekday) => !isDayStateBlank(formStateByWeekday[weekday]))
            : []),
        ]),
      ).filter((weekday) => canSaveWeekday(weekday));

      return Promise.all(
        weekdaysToSave.map(async (weekday) => {
          const dayState = formStateByWeekday[weekday];
          const initialDayState = initialFormStateByWeekday[weekday];
          const fallbackStartTime = initialDayState?.start_time !== "" && initialDayState !== undefined
            ? initialDayState.start_time
            : defaultInactiveStartTime;
          const fallbackEndTime = initialDayState?.end_time !== "" && initialDayState !== undefined
            ? initialDayState.end_time
            : defaultInactiveEndTime;
          const isActive = !isDayStateBlank(dayState) && isDayStatePersistable(dayState);
          const payload: UpsertDoctorSchedulePayload = {
            start_time: isActive ? dayState.start_time : fallbackStartTime,
            end_time: isActive ? dayState.end_time : fallbackEndTime,
            appointment_duration_minutes: Number(globalDurationMinutes),
            is_active: isActive,
          };

          return upsertDoctorSchedule(doctorId as number, weekday, payload);
        }),
      );
    },
    onMutate: () => {
      const toastId = showToast({
        variant: "loading",
        title: "Salvăm toate modificările",
        description: "Trimitem doar zilele modificate local către backend.",
      });

      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      setInitialFormStateByWeekday((currentState) => {
        return Object.fromEntries(
          weekdayLabels.map((weekday) => {
            const dayState = formStateByWeekday[weekday.value] ?? currentState[weekday.value] ?? buildDayState(undefined);

            return [
              weekday.value,
              {
                ...dayState,
                appointment_duration_minutes: globalDurationMinutes,
                is_active: !isDayStateBlank(dayState) && isDayStatePersistable(dayState),
              },
            ];
          }),
        );
      });
      setGlobalDurationMinutes(globalDurationMinutes);
      setInitialGlobalDurationMinutes(globalDurationMinutes);
      setDirtyWeekdays([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctor-schedules", doctorId], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["appointment-doctors-options"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["appointment-specializations-options"], refetchType: "all" }),
      ]);
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "success",
          title: "Programul doctorului a fost salvat",
          description: "Doar zilele modificate au fost reîncărcate din API-ul real.",
        });
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>, _variables, context) => {
      if (context?.toastId !== undefined) {
        updateToast(context.toastId, {
          variant: "error",
          title: "Nu am putut salva programul doctorului",
          description: error.response?.data.message ?? "Verifică valorile introduse și încearcă din nou.",
        });
      }
    },
  });

  const hasValidDoctorId = doctorId !== null && Number.isInteger(doctorId) && doctorId > 0;

  const canSaveWeekday = (weekday: number): boolean => {
    return isDayStatePersistable(formStateByWeekday[weekday]);
  };

  const syncDirtyWeekday = (weekday: number, nextDayState: DayFormState): void => {
    const initialDayState = initialFormStateByWeekday[weekday];
    const isDirty = !areDayStatesEqual(nextDayState, initialDayState);

    setDirtyWeekdays((currentDirtyWeekdays) => {
      if (isDirty) {
        return currentDirtyWeekdays.includes(weekday) ? currentDirtyWeekdays : [...currentDirtyWeekdays, weekday];
      }

      return currentDirtyWeekdays.filter((currentWeekday) => currentWeekday !== weekday);
    });
  };

  const handleFieldChange = (weekday: number, nextPartialState: Partial<DayFormState>): void => {
    setFormStateByWeekday((currentState) => {
      const currentDayState = currentState[weekday] ?? buildDayState(undefined);
      const mergedDayState = {
        ...currentDayState,
        ...nextPartialState,
      };
      const nextState = {
        ...currentState,
        [weekday]: {
          ...mergedDayState,
          appointment_duration_minutes: globalDurationMinutes,
          is_active: !isDayStateBlank(mergedDayState) && isDayStatePersistable(mergedDayState),
        },
      };

      syncDirtyWeekday(weekday, nextState[weekday]);

      return nextState;
    });
  };

  const handleGlobalDurationChange = (nextDurationMinutes: string): void => {
    setGlobalDurationMinutes(nextDurationMinutes);
    setFormStateByWeekday((currentState) => {
      const nextState = Object.fromEntries(
        weekdayLabels.map((weekday) => {
          const currentDayState = currentState[weekday.value] ?? buildDayState(undefined);
          const nextDayState = {
            ...currentDayState,
            appointment_duration_minutes: nextDurationMinutes,
          };

          syncDirtyWeekday(weekday.value, nextDayState);

          return [weekday.value, nextDayState];
        }),
      );

      return nextState;
    });
  };

  const pageTitle = useMemo(() => {
    if (doctorQuery.data !== undefined) {
      return `Program pentru ${doctorQuery.data.doctor_display_name}`;
    }

    return "Program";
  }, [doctorQuery.data]);

  const hasDirtyWeekdays = dirtyWeekdays.length > 0;
  const hasInvalidDirtyWeekday = dirtyWeekdays.some((weekday) => !canSaveWeekday(weekday));

  if (!hasValidDoctorId) {
    return (
      <section className="panel p-6 md:p-8">
        <span className="badge-soft">Program</span>
        <h2 className="mt-4">ID-ul doctorului nu este valid</h2>
        <Link className="button-secondary mt-6 inline-flex gap-2" to="/doctori">
          <ArrowLeft className="h-5 w-5" />
          Înapoi la doctori
        </Link>
      </section>
    );
  }

  if (doctorQuery.isLoading || schedulesQuery.isLoading) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-center gap-3 text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span className="font-semibold">Încărcăm programul real al doctorului</span>
        </div>
        <p className="mt-3">Preluăm exclusiv datele reale din `/doctor-schedules/:doctor_id`.</p>
      </section>
    );
  }

  if (doctorQuery.isError || schedulesQuery.isError) {
    return (
      <section className="panel p-6 md:p-8">
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <span className="badge-soft">Program</span>
            <h2 className="mt-4">Nu am putut încărca programul doctorului</h2>
            <p className="mt-3">Verifică conexiunea cu backend-ul și încearcă din nou.</p>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button className="button-primary" onClick={() => { void doctorQuery.refetch(); void schedulesQuery.refetch(); }} type="button">
            Reîncearcă
          </button>
          <Link className="button-secondary inline-flex gap-2" to="/doctori">
            <ArrowLeft className="h-5 w-5" />
            Înapoi la doctori
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="sticky top-3 z-10 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <span className="badge-soft">Program</span>
            <h2 className="mt-3">{pageTitle}</h2>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="button-primary gap-2"
                disabled={!hasDirtyWeekdays || hasInvalidDirtyWeekday || mutation.isPending}
                onClick={() => mutation.mutate()}
                type="button"
              >
                <Save className="h-5 w-5" />
                {mutation.isPending ? "Salvăm..." : "Salvează toate modificările"}
              </button>
            </div>
            <Link className="button-secondary inline-flex gap-2" to="/doctori">
              <ArrowLeft className="h-5 w-5" />
              Înapoi la doctori
            </Link>
            <p className="text-sm text-slate-500">
              {hasDirtyWeekdays
                ? hasInvalidDirtyWeekday
                  ? "Completează toate zilele modificate înainte de salvare."
                  : `${dirtyWeekdays.length} zile modificate local.`
                : "Nu există modificări locale."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-primary/10 bg-gradient-to-r from-primarySoft via-white to-emerald-50 p-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-ink">Program pe zile</h3>
              <p className="mt-2 text-sm text-slate-600">Configurezi fiecare zi separat, cu interval orar și durată a consultației.</p>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-semibold text-ink" htmlFor="global-duration-minutes">
                Durată consultație
              </label>
              <select
                className="input-base w-auto min-w-[120px] rounded-2xl px-4 py-2"
                id="global-duration-minutes"
                onChange={(event) => handleGlobalDurationChange(event.target.value)}
                value={globalDurationMinutes}
              >
                {durationOptions.map((durationOption) => (
                  <option key={`global-duration-${durationOption}`} value={durationOption}>
                    {durationOption} min
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:grid lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center lg:gap-4">
              <span className="text-sm font-semibold text-slate-500">Zi</span>
              <span className="text-sm font-semibold text-slate-500">Interval</span>
            </div>

            <div className="space-y-3">
              {weekdayLabels.map((weekday) => {
                const dayState = formStateByWeekday[weekday.value] ?? buildDayState(undefined);

                return (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm" key={weekday.value}>
                    <div className="grid gap-3 lg:grid-cols-[140px_minmax(0,1fr)] lg:items-center">
                      <div>
                        <p className="text-sm font-semibold text-ink">{weekday.label}</p>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-semibold text-slate-500 lg:hidden">Interval</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="input-base w-auto min-w-[120px] rounded-2xl px-4 py-2"
                            onChange={(event) => handleFieldChange(weekday.value, { start_time: event.target.value })}
                            value={dayState.start_time}
                          >
                            <option value="">Liber</option>
                            {timeOptions.map((timeOption) => (
                              <option key={`${weekday.value}-start-${timeOption}`} value={timeOption}>
                                {timeOption}
                              </option>
                            ))}
                          </select>

                          <select
                            className="input-base w-auto min-w-[120px] rounded-2xl px-4 py-2"
                            onChange={(event) => handleFieldChange(weekday.value, { end_time: event.target.value })}
                            value={dayState.end_time}
                          >
                            <option value="">Liber</option>
                            {timeOptions.map((timeOption) => (
                              <option key={`${weekday.value}-end-${timeOption}`} value={timeOption}>
                                {timeOption}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};