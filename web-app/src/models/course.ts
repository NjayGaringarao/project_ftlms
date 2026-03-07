export type Course = {
  id: string;
  code: string;
  title: string;
  lecture_unit: number | null;
  laboratory_unit: number | null;
};

export type ExtendedCourse = Course;
