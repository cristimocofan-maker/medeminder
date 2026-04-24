import { Bell, CalendarDays, Files, HeartPulse, Layers3, LogOut, MessageSquareReply, MessageSquareText, Plus, RotateCcw, Settings2, Stethoscope, Users } from "lucide-react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

const navigationItems = [
  {
    label: "Panou principal",
    to: "/",
    icon: HeartPulse,
  },
  {
    label: "Programări",
    to: "/programari",
    icon: CalendarDays,
  },
  {
    label: "Pacienți",
    to: "/pacienti",
    icon: Users,
  },
  {
    label: "Doctori",
    to: "/doctori",
    icon: Stethoscope,
  },
  {
    label: "Specializări",
    to: "/specializari",
    icon: Layers3,
  },
  {
    label: "Mesaje",
    to: "/mesaje",
    icon: MessageSquareText,
  },
  {
    label: "Template-uri",
    to: "/template-uri",
    icon: Files,
  },
  {
    label: "Reveniri",
    to: "/reveniri",
    icon: RotateCcw,
  },
  {
    label: "Răspunsuri",
    to: "/raspunsuri",
    icon: MessageSquareReply,
  },
  {
    label: "Setări",
    to: "/setari",
    icon: Settings2,
  },
] as const;

const pageMeta: Record<string, { badge: string; title: string; description: string }> = {
  "/": {
    badge: "Dashboard",
    title: "Ai la vedere doar fluxurile utile acum",
    description: "Fluxuri utile",
  },
  "/pacienti": {
    badge: "Pacienți",
    title: "Baza de pacienți este pregătită pentru conectarea la API-ul real",
    description: "Baza clinicii",
  },
  "/programari": {
    badge: "Programări",
    title: "Programări",
    description: "Agenda clinicii",
  },
};

const resolvePageMeta = (pathname: string): { badge: string; title: string; description: string } => {
  if (pathname === "/pacienti" || pathname === "/pacienti/nou" || pathname.startsWith("/pacienti/")) {
    return {
      badge: "Pacienți",
      title: "Gestionezi complet pacienții clinicii",
      description: "",
    };
  }

  if (pathname === "/programari" || pathname.startsWith("/programari/")) {
    return {
      badge: "Programări",
      title:
        pathname === "/programari"
          ? "Programări"
          : pathname === "/programari/nou_1"
            ? "Programare nouă"
            : "Editează programarea",
      description: "Agenda clinicii",
    };
  }

  if (pathname === "/doctori" || pathname === "/doctori/nou" || pathname.startsWith("/doctori/")) {
    if (pathname.endsWith("/program")) {
      return {
        badge: "Program",
        title: "Configurezi disponibilitatea reală a doctorului",
        description: "Program medic",
      };
    }

    return {
      badge: "Doctori",
      title: "Gestionează medici",
      description: "",
    };
  }

  if (
    pathname === "/specializari" ||
    pathname === "/specializari/nou" ||
    pathname.startsWith("/specializari/")
  ) {
    return {
      badge: "Specializări",
      title: "Gestionezi complet specializările clinicii",
      description: "",
    };
  }

  if (pathname === "/mesaje" || pathname.startsWith("/mesaje/")) {
    return {
      badge: "Mesaje",
      title: "Gestionezi mesajele clinicii",
      description: "Mesaje clinică",
    };
  }

  if (pathname === "/template-uri" || pathname === "/template-uri/nou" || pathname.startsWith("/template-uri/")) {
    return {
      badge: "Template-uri",
      title: "Gestionezi template-urile mesajelor",
      description: "Șabloane mesaje",
    };
  }

  if (pathname === "/reveniri" || pathname.startsWith("/reveniri/")) {
    return {
      badge: "Reveniri",
      title: "Gestionezi follow-ups din clinică",
      description: "Urmărire pacienți",
    };
  }

  if (pathname === "/raspunsuri" || pathname.startsWith("/raspunsuri/")) {
    return {
      badge: "Răspunsuri",
      title: "Gestionezi responses din clinică",
      description: "Răspunsuri primite",
    };
  }

  if (pathname === "/setari") {
    return {
      badge: "Setări",
      title: "Configurezi setările reale ale clinicii",
      description: "Configurare clinică",
    };
  }

  return pageMeta[pathname] ?? pageMeta["/"];
};

export const MainLayout = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, session } = useAuth();
  const currentPage = resolvePageMeta(location.pathname);
  const isDashboardRoute = location.pathname === "/";
  const useExpandedShell = true;
  const isDoctorsRoute = location.pathname === "/doctori" || location.pathname === "/doctori/nou" || location.pathname.startsWith("/doctori/");
  const isDoctorsListRoute = location.pathname === "/doctori";
  const isPatientsListRoute = location.pathname === "/pacienti";
  const isSpecializationsListRoute = location.pathname === "/specializari";
  const hideLayoutHeader =
    location.pathname === "/pacienti" ||
    location.pathname === "/programari" ||
    location.pathname === "/programari/nou_1" ||
    location.pathname.startsWith("/programari/");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`min-h-screen ${useExpandedShell ? "px-2 py-2 md:px-3 md:py-3" : "px-4 py-4 md:px-6 md:py-6"}`}>
      {isMobileSidebarOpen ? <button aria-label="Închide navigarea" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} type="button" /> : null}
      <div className={`grid min-h-[calc(100vh-1rem)] grid-cols-1 gap-3 ${useExpandedShell ? "w-full max-w-none lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]" : "mx-auto max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]"}`}>
        <aside className={`panel page-enter fixed inset-y-4 left-4 z-50 flex w-[min(19rem,calc(100vw-2rem))] flex-col justify-between overflow-y-auto p-5 transition-transform duration-200 lg:static lg:w-auto lg:translate-x-0 lg:p-6 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"}`}>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-primary text-white">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">MedReminder</p>
                <h2 className="text-lg">Flux clinic clar</h2>
              </div>
              <button aria-label="Închide meniul" className="button-secondary ml-auto h-12 w-12 px-0 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="panel-subtle mt-6 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Clinica activă</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{session?.clinic.display_name}</h3>
            </div>

            <nav aria-label="Navigare principală" className="mt-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.label}
                    className={({ isActive }) =>
                      `block rounded-[22px] border px-4 py-3 transition ${
                        isActive
                          ? "border-primary/20 bg-primary text-white"
                          : "border-slate-200/80 bg-white/80 text-ink hover:border-primary/20 hover:bg-primary/5"
                      }`
                    }
                    to={item.to}
                  >
                    {({ isActive }) => (
                      <div className="flex items-center gap-3">
                        <div className={`rounded-2xl p-2 [&_svg]:text-current ${isActive ? "bg-white/18 text-white" : "bg-white/80 text-current"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={`text-sm font-semibold ${isActive ? "text-white" : "text-slate-700"}`}>{item.label}</span>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <button className="button-secondary mt-8 w-full gap-2" onClick={handleLogout} type="button">
            <LogOut className="h-5 w-5" />
            Ieșire din cont
          </button>
        </aside>

        <div className="page-enter flex min-h-full min-w-0 flex-col gap-4">
          {isDashboardRoute ? (
            <div className="flex items-center justify-between gap-3 px-1 pt-1 lg:hidden">
              <button className="button-secondary gap-2" onClick={() => setIsMobileSidebarOpen(true)} type="button">
                <Menu className="h-5 w-5" />
                Meniu
              </button>
              <div className="panel-subtle flex items-center gap-3 px-4 py-3">
                <div className="rounded-2xl bg-primarySoft p-3 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-ink">{session?.clinic.display_name}</p>
              </div>
            </div>
          ) : hideLayoutHeader ? (
            <div className="flex justify-start px-1 pt-1 lg:hidden">
              <button className="button-secondary gap-2" onClick={() => setIsMobileSidebarOpen(true)} type="button">
                <Menu className="h-5 w-5" />
                Meniu
              </button>
            </div>
          ) : (
            <header className="panel flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <button className="button-secondary mb-4 gap-2 lg:hidden" onClick={() => setIsMobileSidebarOpen(true)} type="button">
                  <Menu className="h-5 w-5" />
                  Meniu
                </button>
                {isDoctorsRoute ? null : <span className="badge-soft">{currentPage.badge}</span>}
                <h1 className={isDoctorsRoute ? "" : "mt-4"}>{currentPage.title}</h1>
                {isDoctorsRoute || currentPage.description === "" ? null : <p className="mt-3 max-w-3xl">{currentPage.description}</p>}
              </div>

              {isDoctorsListRoute ? (
                <Link className="button-primary shrink-0 whitespace-nowrap gap-2" to="/doctori/nou">
                  <Stethoscope className="h-5 w-5" />
                  Adaugă medic
                </Link>
              ) : isPatientsListRoute ? (
                <Link className="button-primary shrink-0 whitespace-nowrap gap-2 px-4 py-2.5 text-sm" to="/pacienti/nou">
                  <Plus className="h-4 w-4" />
                  Pacient nou
                </Link>
              ) : isSpecializationsListRoute ? (
                <Link className="button-primary shrink-0 gap-2 self-start whitespace-nowrap px-5 py-3" to="/specializari/nou">
                  <Plus className="h-5 w-5" />
                  Specializare nouă
                </Link>
              ) : isDoctorsRoute ? null : (
                <div className="panel-subtle flex items-center gap-3 px-4 py-3">
                  <div className="rounded-2xl bg-primarySoft p-3 text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Utilizator conectat</p>
                    <p className="text-base font-semibold text-ink">{session?.user.email}</p>
                  </div>
                </div>
              )}
            </header>
          )}

          <main className="min-w-0 flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};