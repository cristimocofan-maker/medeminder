import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "../router/router";
import { queryClient } from "../api/query-client";
import { AuthProvider } from "../auth/auth-context";
import { ToastProvider } from "../shared/ui/toast-provider";

export const App = (): JSX.Element => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};