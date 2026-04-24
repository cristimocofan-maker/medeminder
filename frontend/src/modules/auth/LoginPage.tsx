import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
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
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

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
          if (fieldError.field === "email" || fieldError.field === "password") {
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
    <div className="flex min-h-screen items-center justify-center px-4 py-6 md:px-6 md:py-8">
      <section className="panel page-enter w-full max-w-xl overflow-hidden p-8 md:p-10">
        <div>
          <h1>Logare clinică</h1>
        </div>

        <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="email">
              Email
            </label>
            <input
              aria-invalid={errors.email !== undefined}
              className="input-base"
              id="email"
              placeholder="nume@clinica.ro"
              type="email"
              {...register("email")}
            />
            {errors.email !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.email.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-ink" htmlFor="password">
              Parolă
            </label>
            <div className="relative">
              <input
                aria-invalid={errors.password !== undefined}
                className="input-base pr-10"
                id="password"
                placeholder="Introdu parola"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-ink/70" /> : <Eye className="h-5 w-5 text-ink/70" />}
              </button>
            </div>
            {errors.password !== undefined ? <p className="mt-2 text-sm font-medium text-danger">{errors.password.message}</p> : null}
          </div>

          <div>
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
          </div>
        </form>
      </section>
    </div>
  );
};