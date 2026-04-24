import axios from "axios";
import { APP_ROUTES } from "../shared/constants/routes";

const apiBaseUrl = import.meta.env.DEV ? "" : import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("kidsrap.access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.clear();

      if (window.location.pathname !== APP_ROUTES.login) {
        window.location.replace(APP_ROUTES.login);
      }
    }

    return Promise.reject(error);
  },
);