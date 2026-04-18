import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../../auth/auth-context";
import { APP_ROUTES } from "../../shared/constants/routes";
import type { ApiErrorResponse } from "../../shared/types/api";
import { loginSchema, type LoginFormValues } from "./login.schema";

export const LoginPage = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isHydrated, login } = useAuth();
  const authReason = searchParams.get("reason")?.trim() ?? "";
  const returnTo = searchParams.get("returnTo")?.trim() ?? "";
  const {
    formState: { errors },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      clinic_id: undefined,
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      await login(values);
    },
    onSuccess: () => {
      const nextPath =
        returnTo !== ""
          ? returnTo
          : (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? APP_ROUTES.home;
      navigate(nextPath, { replace: true });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const fieldErrors = error.response?.data.field_errors ?? [];

      if (fieldErrors.length > 0) {
        fieldErrors.forEach((fieldError) => {
          if (fieldError.field === "clinic_id" || fieldError.field === "email" || fieldError.field === "password") {
            setError(fieldError.field, {
              type: "server",
              message: fieldError.message,
            });
          }
        });
      }
    },
  });

  if (isHydrated && isAuthenticated) {
    return <Navigate replace to={APP_ROUTES.home} />;
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]">
        <section className="panel page-enter flex flex-col justify-between overflow-hidden p-8 md:p-10">
          <div>
            <span className="badge-soft">Autentificare reală</span>
            <h1 className="mt-5">Intră rapid în contul clinicii</h1>
            <p className="mt-4 max-w-xl">
              Completează doar cele trei date necesare. După autentificare, accesul este limitat automat la clinica reală din sesiunea ta.
            </p>
          </div>

          <form className="mt-10 space-y-5" noValidate onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="clinic_id">
                ID clinică
              </label>
              <input
                aria-invalid={errors.clinic_id !== undefined}
                className="input-base"
                id="clinic_id"
                inputMode="numeric"
                placeholder="Exemplu: 12"
                {...register("clinic_id")}
              />
              <p className="mt-2 text-sm text-slate-500">Folosește ID-ul intern numeric al clinicii, nu numele clinicii.</p>
              {errors.clinic_id !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.clinic_id.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="email">
                Email utilizator
              </label>
              <input
                aria-invalid={errors.email !== undefined}
                className="input-base"
                id="email"
                placeholder="nume@clinica.ro"
                type="email"
                {...register("email")}
              />
              <p className="mt-2 text-sm text-slate-500">Introdu adresa folosită pentru accesul în aplicație.</p>
              {errors.email !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.email.message}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-base font-semibold text-ink" htmlFor="password">
                Parolă
              </label>
              <input
                aria-invalid={errors.password !== undefined}
                className="input-base"
                id="password"
                placeholder="Introdu parola"
                type="password"
                {...register("password")}
              />
              <p className="mt-2 text-sm text-slate-500">Parola este trimisă exclusiv către endpointul real `/auth/login`.</p>
              {errors.password !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.password.message}</p> : null}
            </div>

            {loginMutation.isError ? (
              <div className="rounded-3xl border border-danger/20 bg-orange-50 px-4 py-4 text-danger">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">Nu am putut deschide contul</p>
                    <p className="mt-1 text-sm text-danger/90">
                      {loginMutation.error instanceof AxiosError
                        ? (loginMutation.error.response?.data.message ?? "Verifică datele introduse și încearcă din nou.")
                        : "A apărut o problemă temporară. Încearcă din nou."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {authReason === "session-expired" ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                  <div>
                    <p className="font-semibold">Sesiunea a expirat</p>
                    <p className="mt-1 text-sm text-amber-900/90">Autentifică-te din nou. După login te trimitem înapoi la pagina din care ai încercat să salvezi.</p>
                  </div>
                </div>
              </div>
            ) : null}

            <button className="button-primary w-full gap-2" disabled={loginMutation.isPending} type="submit">
              {loginMutation.isPending ? "Verificăm datele..." : "Intră în aplicație"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </section>

        <aside className="page-enter grid gap-4">
          <article className="panel p-8 md:p-10">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-primarySoft p-4 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2>Ce se întâmplă după login</h2>
                <p className="mt-3">
                  JWT-ul este salvat local și injectat automat în toate cererile următoare, iar clinica activă este luată exclusiv din sesiunea reală.
                </p>
              </div>
            </div>
          </article>

          <article className="panel-subtle p-8 md:p-10">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-slate-100 p-4 text-ink">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl">De ce cerem ID clinică</h2>
                <p className="mt-3">
                  Pentru a respecta contractul backend, autentificarea se face cu ID numeric intern. Nu folosim lookup după nume, email clinică sau alte etichete descriptive.
                </p>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </div>
  );
};