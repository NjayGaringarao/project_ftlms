"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Course } from "@/models";
import { updateCourse } from "@/lib/admin/actions";
import AdminPanel from "./admin-panel";
import FormStatusBanner from "./form-status-banner";

type CourseEditProps = {
  course: Course;
};

export const CourseEdit = ({ course }: CourseEditProps) => {
  const router = useRouter();
  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [lectureHour, setLectureHour] = useState(
    (course.lecture_hour ?? 0).toString(),
  );
  const [laboratoryHour, setLaboratoryHour] = useState(
    (course.laboratory_hour ?? 0).toString(),
  );
  const [savedState, setSavedState] = useState({
    code: course.code,
    title: course.title,
    lectureHour: (course.lecture_hour ?? 0).toString(),
    laboratoryHour: (course.laboratory_hour ?? 0).toString(),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    const parsedLecture = Number(lectureHour);
    const parsedLaboratory = Number(laboratoryHour);

    if (!code.trim()) return setError("Course code is required");
    if (!title.trim()) return setError("Course title is required");
    if (!Number.isFinite(parsedLecture) || parsedLecture < 0) {
      return setError("Lecture hour must be zero or greater");
    }
    if (!Number.isFinite(parsedLaboratory) || parsedLaboratory < 0) {
      return setError("Laboratory hour must be zero or greater");
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    const { error: updateError } = await updateCourse({
      id: course.id,
      code,
      title,
      lecture_hour: parsedLecture,
      laboratory_hour: parsedLaboratory,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setSavedState({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      lectureHour: parsedLecture.toString(),
      laboratoryHour: parsedLaboratory.toString(),
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <AdminPanel
      title="Edit Course"
      icon={Save}
      onClose={() => router.push(`/courses/${course.id}`)}
    >
      <div className="space-y-4">
        <FormStatusBanner
          variant="compact"
          success={
            success ? { title: "Course updated successfully" } : undefined
          }
          error={error}
        />

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <h3 className="font-semibold">Course Profile</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="code">
                Course Code *
              </Label>
              <Input
                id="code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError("");
                }}
                onBlur={(event) =>
                  setCode(event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="title">
                Course Title *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setError("");
                }}
                onBlur={(event) => setTitle(event.target.value.trim())}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="lecture-hour">
                Lecture Hour
              </Label>
              <Input
                id="lecture-hour"
                type="number"
                min="0"
                step="0.25"
                value={lectureHour}
                onChange={(event) => {
                  setLectureHour(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="laboratory-hour">
                Laboratory Hour
              </Label>
              <Input
                id="laboratory-hour"
                type="number"
                min="0"
                step="0.25"
                value={laboratoryHour}
                onChange={(event) => {
                  setLaboratoryHour(event.target.value);
                  setError("");
                }}
                className="mt-1"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setCode(savedState.code);
                setTitle(savedState.title);
                setLectureHour(savedState.lectureHour);
                setLaboratoryHour(savedState.laboratoryHour);
                setError("");
                setSuccess(false);
              }}
              disabled={isSaving}
            >
              Reset
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
};
