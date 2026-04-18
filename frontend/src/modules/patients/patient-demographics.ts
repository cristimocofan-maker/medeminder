export type PatientSex = "Masculin" | "Feminin";

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

export const normalizePatientCnpInput = (value: string): string => value.replace(/\D/g, "").slice(0, 13);

const parsePatientDemographicsBase = (
  value: string,
  options?: { requireValidControlDigit?: boolean },
): { birthDateDisplay: string; birthDateIso: string; sex: PatientSex } | null => {
  const cnp = normalizePatientCnpInput(value);

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

  if ((options?.requireValidControlDigit ?? true) && computeControlDigit(cnp) !== Number(cnp[12])) {
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

  const birthDateIso = `${String(fullYear)}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    sex,
    birthDateIso,
    birthDateDisplay: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${String(fullYear)}`,
  };
};

export const parsePatientDemographicsFromCnp = (
  value: string,
): { birthDateDisplay: string; birthDateIso: string; sex: PatientSex } | null => {
  return parsePatientDemographicsBase(value, { requireValidControlDigit: true });
};

export const previewPatientDemographicsFromCnp = (
  value: string,
): { birthDateDisplay: string; birthDateIso: string; sex: PatientSex } | null => {
  return parsePatientDemographicsBase(value, { requireValidControlDigit: false });
};

export const formatPatientBirthDate = (value: string | null): string => {
  if (value === null || value.trim() === "") {
    return "";
  }

  const [year, month, day] = value.split("-");

  if (year === undefined || month === undefined || day === undefined) {
    return "";
  }

  return `${day}.${month}.${year}`;
};

export const calculateAgeLabelFromIsoDate = (value: string | null): string => {
  if (value === null || value.trim() === "") {
    return "";
  }

  const birthDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age >= 0 ? `${age} ani` : "";
};