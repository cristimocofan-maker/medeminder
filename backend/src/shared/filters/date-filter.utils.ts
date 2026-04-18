import { ValidationException } from "../exceptions/validation.exception";

export const parseIsoDateTime = (value: string | undefined, fieldName: string): string | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ValidationException(`${fieldName} trebuie să fie datetime ISO valid`, fieldName);
  }

  return date.toISOString();
};