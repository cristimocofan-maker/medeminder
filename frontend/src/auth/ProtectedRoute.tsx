import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";
import { APP_ROUTES } from "../shared/constants/routes";

export const ProtectedRoute = (): JSX.Element => {
  const location = useLocation();
  const { isAuthenticated, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="panel w-full max-w-lg p-8 text-center">
          <span className="badge-soft">Se încarcă</span>
          <h1 className="mt-4 text-2xl">Pregătim accesul în cont</h1>
          <p className="mt-3">Verificăm sesiunea salvată și deschidem ecranul potrivit.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={APP_ROUTES.login} />;
  }

  return <Outlet />;
};