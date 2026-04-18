export interface QueryResult<TResult> {
  rows: TResult[];
  rowCount: number;
}

export interface DatabaseClient {
  query<TResult>(text: string, values?: readonly unknown[]): Promise<QueryResult<TResult>>;
  close?(): Promise<void>;
}