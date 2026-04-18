import { InvalidSortByException } from "../exceptions/invalid-sort-by.exception";
import { InvalidSortDirectionException } from "../exceptions/invalid-sort-direction.exception";
import type { SortDirection } from "./sorting.types";

export const resolveSortDirection = (value: string | undefined): SortDirection => {
  if (value === undefined || value === "asc") {
    return "asc";
  }

  if (value === "desc") {
    return "desc";
  }

  throw new InvalidSortDirectionException("sort_direction acceptă doar asc sau desc");
};

export const resolveSortBy = <TSortBy extends string>(value: string | undefined, allowedValues: readonly TSortBy[], fallback: TSortBy): TSortBy => {
  if (value === undefined) {
    return fallback;
  }

  if (allowedValues.includes(value as TSortBy)) {
    return value as TSortBy;
  }

  throw new InvalidSortByException("sort_by nu este permis pentru acest endpoint");
};