import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, X } from "lucide-react";

type ToastVariant = "success" | "error" | "loading";

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => string;
  updateToast: (id: string, input: Partial<ToastInput>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const SUCCESS_AUTO_DISMISS_DELAY_MS = 4000;
const ERROR_AUTO_DISMISS_DELAY_MS = 9000;

const toastStyles: Record<ToastVariant, { container: string; icon: JSX.Element }> = {
  success: {
    container: "border-emerald-200 bg-emerald-50 text-success",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  error: {
    container: "border-danger/20 bg-orange-50 text-danger",
    icon: <AlertCircle className="h-5 w-5" />,
  },
  loading: {
    container: "border-primary/20 bg-white text-primary",
    icon: <LoaderCircle className="h-5 w-5 animate-spin" />,
  },
};

export const ToastProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id);

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }

    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const scheduleDismiss = useCallback(
    (id: string, variant: ToastVariant) => {
      const existingTimeoutId = timeoutIdsRef.current.get(id);

      if (existingTimeoutId !== undefined) {
        window.clearTimeout(existingTimeoutId);
        timeoutIdsRef.current.delete(id);
      }

      if (variant === "loading") {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        dismissToast(id);
      }, variant === "error" ? ERROR_AUTO_DISMISS_DELAY_MS : SUCCESS_AUTO_DISMISS_DELAY_MS);

      timeoutIdsRef.current.set(id, timeoutId);
    },
    [dismissToast],
  );

  const showToast = useCallback(
    (input: ToastInput): string => {
      const id = crypto.randomUUID();
      const nextToast: ToastItem = {
        id,
        variant: input.variant,
        title: input.title,
        description: input.description,
      };

      setToasts((currentToasts) => [...currentToasts, nextToast]);
      scheduleDismiss(id, input.variant);

      return id;
    },
    [scheduleDismiss],
  );

  const updateToast = useCallback(
    (id: string, input: Partial<ToastInput>) => {
      setToasts((currentToasts) =>
        currentToasts.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                ...input,
              }
            : toast,
        ),
      );

      scheduleDismiss(id, input.variant ?? "loading");
    },
    [scheduleDismiss],
  );

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      timeoutIdsRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      updateToast,
      dismissToast,
    }),
    [dismissToast, showToast, updateToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-full sm:max-w-md">
        {toasts.map((toast) => {
          const style = toastStyles[toast.variant];

          return (
            <div className={`pointer-events-auto rounded-3xl border px-4 py-4 shadow-panel ${style.container}`} key={toast.id} role="status">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-none">{style.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-6 text-current">{toast.title}</p>
                  {toast.description !== undefined ? <p className="mt-1 text-sm leading-6 text-current/90">{toast.description}</p> : null}
                </div>
                <button className="rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current" onClick={() => dismissToast(toast.id)} type="button">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);

  if (context === null) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
};