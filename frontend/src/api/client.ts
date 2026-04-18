import axios from "axios";
import { APP_ROUTES } from "../shared/constants/routes";
import { authSessionStorage } from "../shared/utils/storage";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const session = authSessionStorage.read();

  if (session?.access_token !== undefined) {
    config.headers.Authorization = `${session.token_type} ${session.access_token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authSessionStorage.clear();

      if (window.location.pathname !== APP_ROUTES.login) {
        const currentPath = `${window.location.pathname}${window.location.search}`;
        const nextLoginUrl = `${APP_ROUTES.login}?reason=session-expired&returnTo=${encodeURIComponent(currentPath)}`;
        window.location.replace(nextLoginUrl);
      }
    }

    return Promise.reject(error);
  },
);