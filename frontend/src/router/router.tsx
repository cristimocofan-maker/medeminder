import { Suspense, lazy, type ReactElement } from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "../auth/ProtectedRoute";
import { DashboardPage } from "../app/DashboardPage";
import { MainLayout } from "../layouts/MainLayout";
import { ClinicSettingsPage } from "../modules/clinic-settings/ClinicSettingsPage";
import { FollowUpDetailsPage } from "../modules/follow-ups/FollowUpDetailsPage";
import { FollowUpsPage } from "../modules/follow-ups/FollowUpsPage";
import { LoginPage } from "../modules/auth/LoginPage";
import { DoctorSchedulePage } from "../modules/doctor-schedules/DoctorSchedulePage";
import { MessageTemplatesFormPage } from "../modules/message-templates/MessageTemplatesFormPage";
import { MessageTemplatesPage } from "../modules/message-templates/MessageTemplatesPage";
import { ResponseDetailsPage } from "../modules/responses/ResponseDetailsPage";
import { ResponsesPage } from "../modules/responses/ResponsesPage";
import { SpecializationsFormPage } from "../modules/specializations/SpecializationsFormPage";
import { SpecializationsPage } from "../modules/specializations/SpecializationsPage";
import { RouteLoading } from "../shared/ui/route-loading";

const PatientsPage = lazy(async () => ({ default: (await import("../modules/patients/PatientsPage")).PatientsPage }));
const PatientsFormPage = lazy(async () => ({ default: (await import("../modules/patients/PatientsFormPage")).PatientsFormPage }));
const AppointmentsPage = lazy(async () => ({ default: (await import("../modules/appointments/AppointmentsPage")).AppointmentsPage }));
const AppointmentsFormPage = lazy(async () => ({ default: (await import("../modules/appointments/AppointmentsFormPage")).AppointmentsFormPage }));
const AppointmentsWizardPage = lazy(async () => ({ default: (await import("../modules/appointments/AppointmentsWizardPage")).AppointmentsWizardPage }));
const DoctorsPage = lazy(async () => ({ default: (await import("../modules/doctors/DoctorsPage")).DoctorsPage }));
const DoctorsFormPage = lazy(async () => ({ default: (await import("../modules/doctors/DoctorsFormPage")).DoctorsFormPage }));
const MessagesPage = lazy(async () => ({ default: (await import("../modules/messages/MessagesPage")).MessagesPage }));
const MessageDetailsPage = lazy(async () => ({ default: (await import("../modules/messages/MessageDetailsPage")).MessageDetailsPage }));

const withSuspense = (element: ReactElement): JSX.Element => {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
};

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "pacienti",
            element: withSuspense(<PatientsPage />),
          },
          {
            path: "pacienti/nou",
            element: withSuspense(<PatientsFormPage />),
          },
          {
            path: "pacienti/:patient_id",
            element: withSuspense(<PatientsFormPage />),
          },
          {
            path: "programari",
            element: withSuspense(<AppointmentsPage />),
          },
          {
            path: "programari/nou",
            element: withSuspense(<AppointmentsFormPage />),
          },
          {
            path: "programari/nou_1",
            element: withSuspense(<AppointmentsWizardPage />),
          },
          {
            path: "programari/:appointment_id",
            element: withSuspense(<AppointmentsFormPage />),
          },
          {
            path: "doctori",
            element: withSuspense(<DoctorsPage />),
          },
          {
            path: "doctori/nou",
            element: withSuspense(<DoctorsFormPage />),
          },
          {
            path: "doctori/:doctor_id",
            element: withSuspense(<DoctorsFormPage />),
          },
          {
            path: "doctori/:doctor_id/program",
            element: <DoctorSchedulePage />,
          },
          {
            path: "specializari",
            element: <SpecializationsPage />,
          },
          {
            path: "specializari/nou",
            element: <SpecializationsFormPage />,
          },
          {
            path: "specializari/:specialization_id",
            element: <SpecializationsFormPage />,
          },
          {
            path: "mesaje",
            element: withSuspense(<MessagesPage />),
          },
          {
            path: "mesaje/:message_id",
            element: withSuspense(<MessageDetailsPage />),
          },
          {
            path: "template-uri",
            element: <MessageTemplatesPage />,
          },
          {
            path: "template-uri/nou",
            element: <MessageTemplatesFormPage />,
          },
          {
            path: "template-uri/:template_id",
            element: <MessageTemplatesFormPage />,
          },
          {
            path: "reveniri",
            element: <FollowUpsPage />,
          },
          {
            path: "reveniri/:follow_up_id",
            element: <FollowUpDetailsPage />,
          },
          {
            path: "raspunsuri",
            element: <ResponsesPage />,
          },
          {
            path: "raspunsuri/:response_id",
            element: <ResponseDetailsPage />,
          },
          {
            path: "setari",
            element: <ClinicSettingsPage />,
          },
        ],
      },
    ],
  },
]);