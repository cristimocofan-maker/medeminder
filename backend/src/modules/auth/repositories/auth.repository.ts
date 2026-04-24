import type { DatabaseClient } from "../../../shared/types/database.types";
import type { AuthUserRecord } from "../types/auth.types";
import { authGetByEmailQuery } from "./auth.queries";

export class AuthRepository {
  constructor(private readonly databaseClient: DatabaseClient) {}

  async getByEmail(email: string): Promise<AuthUserRecord | null> {
    const result = await this.databaseClient.query<AuthUserRecord>(authGetByEmailQuery, [email]);

    if (result.rowCount === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      user_id: Number(row.user_id),
      clinic_id: Number(row.clinic_id),
      email: row.email,
      password_hash: row.password_hash,
      user_role_label: row.user_role_label,
      is_active: Boolean(row.is_active),
    };
  }
}