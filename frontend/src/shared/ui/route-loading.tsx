import { LoaderCircle } from "lucide-react";

export const RouteLoading = (): JSX.Element => {
  return (
    <section className="panel p-6 md:p-8">
      <div className="flex items-center gap-3 text-primary">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        <span className="font-semibold">Încărcăm modulul</span>
      </div>
      <p className="mt-3">Pregătim ecranul fără să schimbăm fluxul sau datele existente.</p>
    </section>
  );
};