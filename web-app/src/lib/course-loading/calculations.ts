export const toNumber = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateAtl = (
  lectureUnit: number,
  laboratoryUnit: number,
): number => lectureUnit + calculateLaboratoryContactHours(laboratoryUnit) * 0.75;

export const calculateUnit = (
  lectureUnit: number,
  laboratoryUnit: number,
): number => lectureUnit + laboratoryUnit;

export const calculateLaboratoryContactHours = (
  laboratoryUnit: number,
): number => laboratoryUnit * 3;
