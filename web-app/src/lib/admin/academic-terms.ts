import { AcademicTerm, AcademicTermOrder, AcademicTermType } from "@/models";

export const ACADEMIC_TERM_TYPES: AcademicTermType[] = [
  "SEMESTER",
  "TRIMESTER",
  "QUARTER",
];

export const ACADEMIC_TERM_ORDERS: AcademicTermOrder[] = [
  "FIRST",
  "SECOND",
  "THIRD",
  "FOURTH",
];

export const TERM_ORDERS_BY_TYPE: Record<
  AcademicTermType,
  AcademicTermOrder[]
> = {
  SEMESTER: ["FIRST", "SECOND"],
  TRIMESTER: ["FIRST", "SECOND", "THIRD"],
  QUARTER: ["FIRST", "SECOND", "THIRD", "FOURTH"],
};

const TERM_TYPE_LABELS: Record<AcademicTermType, string> = {
  SEMESTER: "Semester",
  TRIMESTER: "Trimester",
  QUARTER: "Quarter",
};

const TERM_ORDER_LABELS: Record<AcademicTermOrder, string> = {
  FIRST: "1st",
  SECOND: "2nd",
  THIRD: "3rd",
  FOURTH: "4th",
};

export const isTermOrderAllowedForType = (
  type: AcademicTermType,
  termOrder: AcademicTermOrder,
) => TERM_ORDERS_BY_TYPE[type].includes(termOrder);

export const getAcademicYearLabel = (
  academicYearStart: number,
  academicYearEnd: number,
) => `${academicYearStart}-${academicYearEnd}`;

export const getTermTypeLabel = (type: AcademicTermType) =>
  TERM_TYPE_LABELS[type];

export const getTermOrderLabel = (termOrder: AcademicTermOrder) =>
  TERM_ORDER_LABELS[termOrder];

export const getAcademicTermDisplayLabel = (term: {
  academic_year_start: number;
  academic_year_end: number;
  type: AcademicTermType;
  term_order: AcademicTermOrder;
}) =>
  `${getTermOrderLabel(term.term_order)} ${getTermTypeLabel(term.type)}, A.Y. ${getAcademicYearLabel(term.academic_year_start, term.academic_year_end)}`;

export const generateAcademicTermCode = (term: {
  academic_year_start: number;
  academic_year_end: number;
  type: AcademicTermType;
  term_order: AcademicTermOrder;
}) =>
  `${getTermOrderLabel(term.term_order).toUpperCase()} ${getTermTypeLabel(term.type).toUpperCase()} AY ${getAcademicYearLabel(term.academic_year_start, term.academic_year_end)}`;

export const sortAcademicTermsDesc = (terms: AcademicTerm[]) =>
  [...terms].sort((left, right) => {
    if (left.academic_year_start !== right.academic_year_start) {
      return right.academic_year_start - left.academic_year_start;
    }

    if (left.academic_year_end !== right.academic_year_end) {
      return right.academic_year_end - left.academic_year_end;
    }

    if (left.type !== right.type) {
      return (
        ACADEMIC_TERM_TYPES.indexOf(left.type) -
        ACADEMIC_TERM_TYPES.indexOf(right.type)
      );
    }

    return (
      ACADEMIC_TERM_ORDERS.indexOf(left.term_order) -
      ACADEMIC_TERM_ORDERS.indexOf(right.term_order)
    );
  });
