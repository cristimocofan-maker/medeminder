export type SortDirection = "asc" | "desc";

export interface SortingInput<TSortBy extends string> {
  sort_by?: TSortBy;
  sort_direction?: SortDirection;
}