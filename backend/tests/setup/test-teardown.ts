import { closeAppResources } from "../../src/app";
import { closeTestDatabase } from "./test-db";

export default async function globalTeardown(): Promise<void> {
  await Promise.allSettled([closeAppResources(), closeTestDatabase()]);
}