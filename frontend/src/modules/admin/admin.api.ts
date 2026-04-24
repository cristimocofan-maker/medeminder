import { apiClient } from "../../api/client";
import type { SyncDatabaseResponse } from "./admin.types";

export const syncDatabase = async (): Promise<SyncDatabaseResponse> => {
  const response = await apiClient.post<SyncDatabaseResponse>("/admin/sync/full");

  return response.data;
};