export type Course = {
  id: string;
  title: string;
  lecture_hour: number | null;
  laboratory_hour: number | null;
};

export type ExtendedCourse = Course;
