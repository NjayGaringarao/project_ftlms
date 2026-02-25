"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";
import { getCampusesList } from "@/lib/admin/campuses";
import { getCoursesList } from "@/lib/admin/courses";
import { getTermsList } from "@/lib/admin/terms";
import { createCourseOffering } from "@/lib/admin/actions";
import { Campus, Course, Term } from "@/models";

export const CourseOfferingCreate = () => {
  const router = useRouter();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [campusId, setCampusId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [termId, setTermId] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingData(true);
      const [campusList, courseList, termList] = await Promise.all([
        getCampusesList(),
        getCoursesList(),
        getTermsList(),
      ]);
      setCampuses(campusList);
      setCourses(courseList);
      setTerms(termList);
      setIsLoadingData(false);
    };

    load();
  }, []);

  const handleCreate = async () => {
    if (!campusId) return setError("Campus is required");
    if (!courseId) return setError("Course is required");
    if (!termId) return setError("Academic term is required");

    setIsSaving(true);
    setError("");
    setShowSuccess(false);

    const { data, error: createError } = await createCourseOffering({
      campus_id: campusId,
      course_id: courseId,
      academic_term_id: termId,
    });

    setIsSaving(false);

    if (createError) {
      setError(createError);
      return;
    }

    setShowSuccess(true);

    setTimeout(() => {
      if (data?.id) {
        router.push(`/course-offerings/${data.id}`);
      } else {
        router.push("/course-offerings");
      }
    }, 1200);
  };

  return (
    <AdminPanel
      title="Course Offering"
      icon={Plus}
      onClose={() => router.push("/course-offerings")}
    >
      <div className="space-y-4">
        <FormStatusBanner
          success={
            showSuccess
              ? {
                  title: "Course offering created",
                  message: "Record created successfully. Redirecting...",
                }
              : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Course Offering Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="campus-id">
                Campus *
              </Label>
              <select
                id="campus-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={campusId}
                onChange={(event) => {
                  setCampusId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select campus...</option>
                {campuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>
                    {campus.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs" htmlFor="course-id">
                Course *
              </Label>
              <select
                id="course-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={courseId}
                onChange={(event) => {
                  setCourseId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs" htmlFor="term-id">
                Academic Term *
              </Label>
              <select
                id="term-id"
                className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                value={termId}
                onChange={(event) => {
                  setTermId(event.target.value);
                  setError("");
                }}
                disabled={isSaving || isLoadingData}
              >
                <option value="">Select term...</option>
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.academic_year} - {term.term_code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCampusId("");
                setCourseId("");
                setTermId("");
                setError("");
                setShowSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || isLoadingData}>
              {isSaving ? "Creating..." : "Create Course Offering"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
