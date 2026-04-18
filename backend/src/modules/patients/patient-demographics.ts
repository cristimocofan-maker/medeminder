export const PATIENT_SEX_VALUES = ["Masculin", "Feminin"] as const;

export type PatientSex = (typeof PATIENT_SEX_VALUES)[number];

interface PatientDemographics {
  birth_date: string;
  cnp: string;
  sex: PatientSex;
}

const CNP_CONTROL_KEY = "279146358279";

const getFullYearFromCnp = (firstDigit: string, yearSuffix: number): number | null => {
  if (["1", "2", "7", "8"].includes(firstDigit)) {
    return 1900 + yearSuffix;
  }

  if (["3", "4"].includes(firstDigit)) {
    return 1800 + yearSuffix;
  }

  if (["5", "6"].includes(firstDigit)) {
    return 2000 + yearSuffix;
  }

  return null;
};

const computeControlDigit = (cnp: string): number => {
  const checksum = cnp
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * Number(CNP_CONTROL_KEY[index]), 0);
  const remainder = checksum % 11;

  return remainder === 10 ? 1 : remainder;
};

export const normalizePatientCnp = (value: string): string => value.trim().replace(/\D/g, "");

export const derivePatientDemographicsFromCnp = (value: string): PatientDemographics | null => {
  const cnp = normalizePatientCnp(value);

  if (!/^\d{13}$/.test(cnp)) {
    return null;
  }

  const firstDigit = cnp[0];
  const yearSuffix = Number(cnp.slice(1, 3));
  const month = Number(cnp.slice(3, 5));
  const day = Number(cnp.slice(5, 7));
  const fullYear = getFullYearFromCnp(firstDigit, yearSuffix);

  if (fullYear === null) {
    return null;
  }

  const birthDate = new Date(Date.UTC(fullYear, month - 1, day));

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getUTCFullYear() !== fullYear ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return null;
  }

  if (computeControlDigit(cnp) !== Number(cnp[12])) {
    return null;
  }

  const sex: PatientSex | null = ["1", "3", "5", "7"].includes(firstDigit)
    ? "Masculin"
    : ["2", "4", "6", "8"].includes(firstDigit)
      ? "Feminin"
      : null;

  if (sex === null) {
    return null;
  }

  return {
    cnp,
    sex,
    birth_date: `${String(fullYear)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
};