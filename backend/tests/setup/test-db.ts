import { Pool, type PoolClient, type QueryResultRow } from "pg";
import "./test-env";

if ((process.env.DB_NAME ?? "").toLowerCase() === "medreminder") {
  throw new Error("DB_NAME pentru teste trebuie să fie separată de development.");
}

export const testDbPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export const query = async <TRow extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
): Promise<TRow[]> => {
  const result = await testDbPool.query<TRow>(text, values as unknown[]);

  return result.rows;
};

export const queryOne = async <TRow extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
): Promise<TRow | null> => {
  const rows = await query<TRow>(text, values);

  return rows[0] ?? null;
};

export const connect = async (): Promise<PoolClient> => {
  return testDbPool.connect();
};

export const beginTransaction = async (): Promise<PoolClient> => {
  const client = await connect();
  await client.query("BEGIN");

  return client;
};

export const rollbackTransaction = async (client: PoolClient): Promise<void> => {
  try {
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }
};

export const cleanup = async (
  statements: Array<{ text: string; values?: readonly unknown[] }>,
): Promise<void> => {
  for (const statement of statements) {
    await testDbPool.query(statement.text, statement.values as unknown[] | undefined);
  }
};

export const closeTestDatabase = async (): Promise<void> => {
  await testDbPool.end();
};