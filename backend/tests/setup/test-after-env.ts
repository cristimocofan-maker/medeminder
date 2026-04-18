import { closeAppResources } from "../../src/app";
import { closeTestDatabase } from "./test-db";

afterAll(async () => {
  await Promise.allSettled([closeAppResources(), closeTestDatabase()]);
});