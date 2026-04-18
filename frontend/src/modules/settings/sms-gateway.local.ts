import { useEffect, useMemo, useState } from "react";
import type {
  SmsAutomationKey,
  SmsAutomationRule,
  SmsDeliveryStatus,
  SmsGatewayState,
  SmsGatewayTestResult,
  SmsHistoryItem,
  SmsMessageContext,
  SmsTemplateDefinition,
  SmsTemplateKey,
  SmsTemplateVariableDefinition,
} from "./sms-gateway.types";

const STORAGE_KEY = "medreminder:sms-gateway-state";
const CHANGE_EVENT_NAME = "medreminder:sms-gateway-updated";

export const SMS_TEMPLATE_DEFINITIONS: SmsTemplateDefinition[] = [
  {
    key: "confirmation",
    label: "Confirmare programare",
    description: "Mesajul trimis imediat după creare sau pentru confirmare manuală.",
  },
  {
    key: "reminder",
    label: "Reamintire programare",
    description: "Mesajul folosit pentru reminderele programate.",
  },
  {
    key: "reschedule",
    label: "Reprogramare",
    description: "Mesajul folosit când se schimbă data, ora sau medicul.",
  },
  {
    key: "cancel",
    label: "Anulare",
    description: "Mesajul folosit la anularea unei programări.",
  },
  {
    key: "follow-up",
    label: "Follow-up după consultație",
    description: "Mesajul trimis după vizita pacientului.",
  },
];

export const SMS_TEMPLATE_VARIABLES: SmsTemplateVariableDefinition[] = [
  { token: "{patient_name}", label: "Pacient" },
  { token: "{doctor_name}", label: "Medic" },
  { token: "{specialization}", label: "Specializare" },
  { token: "{appointment_date}", label: "Data" },
  { token: "{appointment_time}", label: "Ora" },
  { token: "{clinic_name}", label: "Clinică" },
  { token: "{confirmation_link}", label: "Link confirmare" },
  { token: "{reschedule_link}", label: "Link reprogramare" },
  { token: "{cancel_link}", label: "Link anulare" },
];

export const DEFAULT_SMS_TEMPLATES: Record<SmsTemplateKey, string> = {
  confirmation:
    "Bună {patient_name}, aveți programare la {doctor_name} ({specialization}) în {appointment_date} la ora {appointment_time}. Confirmați: {confirmation_link}",
  reminder:
    "Bună {patient_name}, vă reamintim programarea la {doctor_name} ({specialization}) din {appointment_date}, ora {appointment_time}. Dacă aveți nevoie de modificări: {reschedule_link}",
  reschedule:
    "Bună {patient_name}, programarea la {doctor_name} ({specialization}) a fost reprogramată pentru {appointment_date}, ora {appointment_time}. Detalii: {reschedule_link}",
  cancel:
    "Bună {patient_name}, programarea programată pentru {appointment_date}, ora {appointment_time}, a fost anulată. Dacă doriți o nouă programare: {reschedule_link}",
  "follow-up":
    "Bună {patient_name}, sperăm că consultația cu {doctor_name} a fost utilă. Dacă aveți întrebări sau doriți control, reveniți aici: {reschedule_link}",
};

const DEFAULT_AUTOMATIONS: Record<SmsAutomationKey, SmsAutomationRule> = {
  "appointment-created": {
    key: "appointment-created",
    label: "Trimite confirmare imediat după creare programare",
    description: "Folosește mesajul de confirmare imediat ce programarea este salvată.",
    enabled: true,
    template_key: "confirmation",
    use_primary_gateway: true,
  },
  "reminder-24h": {
    key: "reminder-24h",
    label: "Trimite reminder cu 24h înainte",
    description: "Pregătit pentru scheduler-ul backend ulterior.",
    enabled: true,
    template_key: "reminder",
    use_primary_gateway: true,
  },
  "reminder-2h": {
    key: "reminder-2h",
    label: "Trimite reminder cu 2h înainte",
    description: "Pregătit pentru confirmări de ultim moment.",
    enabled: false,
    template_key: "reminder",
    use_primary_gateway: true,
  },
  reschedule: {
    key: "reschedule",
    label: "Trimite SMS la reprogramare",
    description: "Folosește un template dedicat când slotul se schimbă.",
    enabled: true,
    template_key: "reschedule",
    use_primary_gateway: true,
  },
  cancel: {
    key: "cancel",
    label: "Trimite SMS la anulare",
    description: "Trimite mesajul de anulare cu pașii următori.",
    enabled: true,
    template_key: "cancel",
    use_primary_gateway: true,
  },
  "follow-up": {
    key: "follow-up",
    label: "Trimite follow-up după consultație",
    description: "Folosește mesajul post-consultație după fluxul medical.",
    enabled: false,
    template_key: "follow-up",
    use_primary_gateway: true,
  },
};

const DEFAULT_STATE: SmsGatewayState = {
  connection: {
    provider_name: "",
    sender_name: "",
    is_primary_gateway: true,
    patient_action_base_path: "/pacient/sms",
    last_checked_at: null,
  },
  templates: DEFAULT_SMS_TEMPLATES,
  automations: DEFAULT_AUTOMATIONS,
  history: [],
  last_test_result: null,
};

const normalizeTemplateKey = (value: unknown): SmsTemplateKey => {
  if (value === "confirmation" || value === "reminder" || value === "reschedule" || value === "cancel" || value === "follow-up") {
    return value;
  }

  return "confirmation";
};

const normalizeAutomationKey = (value: unknown): SmsAutomationKey => {
  if (
    value === "appointment-created" ||
    value === "reminder-24h" ||
    value === "reminder-2h" ||
    value === "reschedule" ||
    value === "cancel" ||
    value === "follow-up"
  ) {
    return value;
  }

  return "appointment-created";
};

const normalizeStatus = (value: unknown): SmsDeliveryStatus => {
  if (value === "sent" || value === "failed" || value === "pending") {
    return value;
  }

  return "pending";
};

const buildActionLink = (basePath: string, action: "confirm" | "reschedule" | "cancel", appointmentId: number | null | undefined): string | null => {
  if (appointmentId === null || appointmentId === undefined || appointmentId <= 0) {
    return null;
  }

  return `${basePath}/${action}/${appointmentId}`;
};

const normalizeHistoryItem = (value: Partial<SmsHistoryItem> | undefined): SmsHistoryItem | null => {
  if (value === undefined || typeof value.patient_id !== "number" || value.patient_id <= 0) {
    return null;
  }

  return {
    id: typeof value.id === "string" && value.id.trim() !== "" ? value.id : `${value.patient_id}-${Date.now()}`,
    patient_id: value.patient_id,
    type: normalizeTemplateKey(value.type),
    phone_number: typeof value.phone_number === "string" ? value.phone_number : "",
    message: typeof value.message === "string" ? value.message : "",
    sent_at: typeof value.sent_at === "string" && value.sent_at !== "" ? value.sent_at : new Date().toISOString(),
    status: normalizeStatus(value.status),
    provider_response: typeof value.provider_response === "string" ? value.provider_response : null,
  };
};

const normalizeState = (value: Partial<SmsGatewayState> | null | undefined): SmsGatewayState => {
  const templates = SMS_TEMPLATE_DEFINITIONS.reduce<Record<SmsTemplateKey, string>>((accumulator, template) => {
    accumulator[template.key] = typeof value?.templates?.[template.key] === "string" && value.templates[template.key].trim() !== ""
      ? value.templates[template.key]
      : DEFAULT_SMS_TEMPLATES[template.key];

    return accumulator;
  }, { ...DEFAULT_SMS_TEMPLATES });

  const automations = (Object.keys(DEFAULT_AUTOMATIONS) as SmsAutomationKey[]).reduce<Record<SmsAutomationKey, SmsAutomationRule>>((accumulator, automationKey) => {
    const candidate = value?.automations?.[automationKey];

    accumulator[automationKey] = {
      ...DEFAULT_AUTOMATIONS[automationKey],
      enabled: typeof candidate?.enabled === "boolean" ? candidate.enabled : DEFAULT_AUTOMATIONS[automationKey].enabled,
      template_key: normalizeTemplateKey(candidate?.template_key),
      use_primary_gateway: typeof candidate?.use_primary_gateway === "boolean" ? candidate.use_primary_gateway : DEFAULT_AUTOMATIONS[automationKey].use_primary_gateway,
      key: normalizeAutomationKey(candidate?.key ?? automationKey),
    };

    return accumulator;
  }, { ...DEFAULT_AUTOMATIONS });

  return {
    connection: {
      provider_name: typeof value?.connection?.provider_name === "string" ? value.connection.provider_name : DEFAULT_STATE.connection.provider_name,
      sender_name: typeof value?.connection?.sender_name === "string" ? value.connection.sender_name : DEFAULT_STATE.connection.sender_name,
      is_primary_gateway: typeof value?.connection?.is_primary_gateway === "boolean" ? value.connection.is_primary_gateway : DEFAULT_STATE.connection.is_primary_gateway,
      patient_action_base_path: typeof value?.connection?.patient_action_base_path === "string" && value.connection.patient_action_base_path.trim() !== ""
        ? value.connection.patient_action_base_path
        : DEFAULT_STATE.connection.patient_action_base_path,
      last_checked_at: typeof value?.connection?.last_checked_at === "string" ? value.connection.last_checked_at : null,
    },
    templates,
    automations,
    history: Array.isArray(value?.history)
      ? value.history.map((item) => normalizeHistoryItem(item)).filter((item): item is SmsHistoryItem => item !== null)
      : [],
    last_test_result: value?.last_test_result !== null && value?.last_test_result !== undefined
      ? {
        phone_number: typeof value.last_test_result.phone_number === "string" ? value.last_test_result.phone_number : "",
        template_key: normalizeTemplateKey(value.last_test_result.template_key),
        message: typeof value.last_test_result.message === "string" ? value.last_test_result.message : "",
        status: normalizeStatus(value.last_test_result.status),
        timestamp: typeof value.last_test_result.timestamp === "string" ? value.last_test_result.timestamp : new Date().toISOString(),
        provider_response: typeof value.last_test_result.provider_response === "string" ? value.last_test_result.provider_response : "",
      }
      : null,
  };
};

const readState = (): SmsGatewayState => {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (rawValue === null) {
      return DEFAULT_STATE;
    }

    return normalizeState(JSON.parse(rawValue) as Partial<SmsGatewayState>);
  } catch {
    return DEFAULT_STATE;
  }
};

const writeState = (value: SmsGatewayState): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(CHANGE_EVENT_NAME));
};

const buildProviderResponse = (status: SmsDeliveryStatus, providerName: string): string => {
  if (status === "sent") {
    return providerName.trim() === ""
      ? "Mesajul a fost simulat local și marcat ca trimis cu gateway-ul principal."
      : `Mesajul a fost simulat local și acceptat de gateway-ul ${providerName}.`;
  }

  if (status === "failed") {
    return "Mesajul nu poate fi trimis local deoarece numărul de telefon sau conținutul sunt incomplete.";
  }

  return "Gateway-ul nu este configurat complet; payload-ul a fost păstrat local pentru integrarea ulterioară.";
};

const resolveDeliveryStatus = (phoneNumber: string, message: string, providerName: string): SmsDeliveryStatus => {
  const normalizedDigits = phoneNumber.replace(/\D/g, "");

  if (normalizedDigits.length < 10 || message.trim() === "") {
    return "failed";
  }

  if (providerName.trim() === "") {
    return "pending";
  }

  return "sent";
};

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.round(Math.random() * 100000)}`;
};

export const renderSmsMessage = (template: string, context: SmsMessageContext): string => {
  return template.replace(/\{[a-z_]+\}/g, (token) => {
    const tokenName = token.slice(1, -1) as keyof SmsMessageContext;
    const replacement = context[tokenName];

    return replacement === undefined || replacement === null || replacement.trim() === "" ? token : replacement;
  });
};

export const formatSmsTimestamp = (value: string): string => {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const buildSmsContextForAppointment = (input: {
  appointmentId?: number | null;
  patientName?: string | null;
  doctorName?: string | null;
  specialization?: string | null;
  appointmentStart?: string | null;
  clinicName?: string | null;
  actionBasePath?: string | null;
}): SmsMessageContext => {
  const startDate = input.appointmentStart === undefined || input.appointmentStart === null || input.appointmentStart === ""
    ? null
    : new Date(input.appointmentStart);
  const actionBasePath = input.actionBasePath ?? DEFAULT_STATE.connection.patient_action_base_path;

  return {
    patient_name: input.patientName ?? null,
    doctor_name: input.doctorName ?? null,
    specialization: input.specialization ?? null,
    appointment_date: startDate === null ? null : new Intl.DateTimeFormat("ro-RO", { dateStyle: "medium" }).format(startDate),
    appointment_time: startDate === null ? null : new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(startDate),
    clinic_name: input.clinicName ?? null,
    confirmation_link: buildActionLink(actionBasePath, "confirm", input.appointmentId),
    reschedule_link: buildActionLink(actionBasePath, "reschedule", input.appointmentId),
    cancel_link: buildActionLink(actionBasePath, "cancel", input.appointmentId),
  };
};

export const useSmsGatewayLocalState = () => {
  const [state, setState] = useState<SmsGatewayState>(() => readState());

  useEffect(() => {
    const refresh = (): void => {
      setState(readState());
    };

    window.addEventListener(CHANGE_EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(CHANGE_EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const persist = (updater: (currentState: SmsGatewayState) => SmsGatewayState): SmsGatewayState => {
    const nextState = updater(readState());
    writeState(nextState);
    setState(nextState);

    return nextState;
  };

  const saveConnection = (connection: SmsGatewayState["connection"]): void => {
    persist((currentState) => ({
      ...currentState,
      connection,
    }));
  };

  const markConnectionChecked = (): string => {
    const checkedAt = new Date().toISOString();

    persist((currentState) => ({
      ...currentState,
      connection: {
        ...currentState.connection,
        last_checked_at: checkedAt,
      },
    }));

    return checkedAt;
  };

  const saveTemplate = (templateKey: SmsTemplateKey, content: string): void => {
    persist((currentState) => ({
      ...currentState,
      templates: {
        ...currentState.templates,
        [templateKey]: content,
      },
    }));
  };

  const resetTemplate = (templateKey: SmsTemplateKey): void => {
    persist((currentState) => ({
      ...currentState,
      templates: {
        ...currentState.templates,
        [templateKey]: DEFAULT_SMS_TEMPLATES[templateKey],
      },
    }));
  };

  const saveAutomationRule = (automationKey: SmsAutomationKey, rule: SmsAutomationRule): void => {
    persist((currentState) => ({
      ...currentState,
      automations: {
        ...currentState.automations,
        [automationKey]: rule,
      },
    }));
  };

  const sendTestSms = (payload: {
    phone_number: string;
    template_key: SmsTemplateKey;
    message: string;
  }): SmsGatewayTestResult => {
    const providerName = state.connection.provider_name;
    const status = resolveDeliveryStatus(payload.phone_number, payload.message, providerName);
    const result: SmsGatewayTestResult = {
      phone_number: payload.phone_number,
      template_key: payload.template_key,
      message: payload.message,
      status,
      timestamp: new Date().toISOString(),
      provider_response: buildProviderResponse(status, providerName),
    };

    persist((currentState) => ({
      ...currentState,
      last_test_result: result,
    }));

    return result;
  };

  const logPatientSms = (payload: {
    patient_id: number;
    phone_number: string;
    type: SmsTemplateKey;
    message: string;
  }): SmsHistoryItem => {
    const providerName = state.connection.provider_name;
    const status = resolveDeliveryStatus(payload.phone_number, payload.message, providerName);
    const item: SmsHistoryItem = {
      id: createId(),
      patient_id: payload.patient_id,
      type: payload.type,
      phone_number: payload.phone_number,
      message: payload.message,
      sent_at: new Date().toISOString(),
      status,
      provider_response: buildProviderResponse(status, providerName),
    };

    persist((currentState) => ({
      ...currentState,
      history: [item, ...currentState.history],
    }));

    return item;
  };

  const retryHistoryItem = (historyId: string): SmsHistoryItem | null => {
    let retriedItem: SmsHistoryItem | null = null;

    persist((currentState) => {
      const nextHistory = currentState.history.map((item) => {
        if (item.id !== historyId) {
          return item;
        }

        const status = resolveDeliveryStatus(item.phone_number, item.message, currentState.connection.provider_name);
        retriedItem = {
          ...item,
          sent_at: new Date().toISOString(),
          status,
          provider_response: buildProviderResponse(status, currentState.connection.provider_name),
        };

        return retriedItem;
      });

      return {
        ...currentState,
        history: nextHistory,
      };
    });

    return retriedItem;
  };

  const patientHistoryMap = useMemo(() => {
    return state.history.reduce<Record<number, SmsHistoryItem[]>>((accumulator, item) => {
      if (accumulator[item.patient_id] === undefined) {
        accumulator[item.patient_id] = [];
      }

      accumulator[item.patient_id].push(item);

      return accumulator;
    }, {});
  }, [state.history]);

  return {
    state,
    templates: state.templates,
    automations: state.automations,
    connection: state.connection,
    history: state.history,
    lastTestResult: state.last_test_result,
    patientHistoryMap,
    saveConnection,
    markConnectionChecked,
    saveTemplate,
    resetTemplate,
    saveAutomationRule,
    sendTestSms,
    logPatientSms,
    retryHistoryItem,
  };
};
