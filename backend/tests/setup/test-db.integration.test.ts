import { beginTransaction, queryOne, rollbackTransaction } from "./test-db";

describe("test db integration", () => {
  test("rolls back explicit transaction changes", async () => {
    const client = await beginTransaction();
    let clinicId: number | null = null;

    try {
      const result = await client.query<{ clinic_id: number }>(
        "INSERT INTO clinics (display_name) VALUES ($1) RETURNING clinic_id;",
        [`transaction-clinic-${Date.now()}`],
      );
      clinicId = result.rows[0]?.clinic_id ?? null;
    } finally {
      await rollbackTransaction(client);
    }

    expect(clinicId).not.toBeNull();

    const clinic = await queryOne<{ clinic_id: number }>(
      "SELECT clinic_id FROM clinics WHERE clinic_id = $1;",
      [clinicId],
    );

    expect(clinic).toBeNull();
  });
});