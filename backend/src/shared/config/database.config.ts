import { Pool } from "pg";
import { envConfig } from "./env.config";
import type { DatabaseClient, QueryResult } from "../types/database.types";

class PostgresDatabaseClient implements DatabaseClient {
  constructor(private readonly pool: Pool) {}

  async query<TResult>(text: string, values: readonly unknown[] = []): Promise<QueryResult<TResult>> {
    const result = await this.pool.query(text, values as unknown[]);

    return {
      rows: result.rows as TResult[],
      rowCount: result.rowCount ?? 0,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const createDatabaseClient = (): DatabaseClient => {
  const pool = new Pool({
    host: envConfig.dbHost,
    port: envConfig.dbPort,
    database: envConfig.dbName,
    user: envConfig.dbUser,
    password: envConfig.dbPassword,
  });

  return new PostgresDatabaseClient(pool);
};